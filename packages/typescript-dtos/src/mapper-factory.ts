import {
  File,
  MapProperties,
  MemberValue,
  Parameter,
  Property,
  Service,
  Type,
  Union,
  getTypeByName,
  getUnionByName,
  isRequired,
} from 'basketry';
import { NamespacedTypescriptDTOOptions } from './types';
import { buildFilePath, buildPropertyName } from '@basketry/typescript';
import { format } from '@basketry/typescript/lib/utils';
import { BaseFactory } from './base-factory';
import { camel, pascal } from 'case';

type Mode =
  | 'server-inbound'
  | 'server-outbound'
  | 'client-inbound'
  | 'client-outbound';

export class ExpressMapperFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedTypescriptDTOOptions) {
    super(service, options);
  }

  async build(): Promise<File[]> {
    const files: File[] = [];

    const mappers = Array.from(this.buildMappers()).join('\n');
    const compact = Array.from(this.buildCompact()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['dtos', 'mappers.ts'], this.service, this.options),
      contents: await format(
        [preamble, compact, mappers].join('\n\n'),
        this.options,
      ),
    });

    return files;
  }

  private buildTypeNames(
    typeName: string,
    mode: Mode,
  ): { input: string; output: string } {
    const dtoType = `${this.dtosModule}.${this.builder.buildDtoName(typeName)}`;
    const type = `${this.typesModule}.${pascal(typeName)}`;

    return mode === 'server-inbound' || mode === 'client-outbound'
      ? { input: dtoType, output: type }
      : { input: type, output: dtoType };
  }

  private buildSignature(
    typeName: string,
    paramName: string,
    mode: Mode,
  ): string {
    const { input, output } = this.buildTypeNames(typeName, mode);

    return `export function ${this.builder.buildMapperName(
      typeName,
      mode,
    )}(${paramName}: ${input}): ${output}`;
  }

  private *buildMappers(): Iterable<string> {
    for (const type of this.options?.dtos?.role === 'client'
      ? this.serviceInfo.outputTypes
      : this.serviceInfo.inputTypes) {
      yield* this.buildTypeMapper(
        type,
        this.options?.dtos?.role === 'client'
          ? 'client-outbound'
          : 'server-inbound',
      );
    }

    for (const union of this.options?.dtos?.role === 'client'
      ? this.serviceInfo.outputUnions
      : this.serviceInfo.inputUnions) {
      yield* this.buildUnionMapper(
        union,
        this.options?.dtos?.role === 'client'
          ? 'client-outbound'
          : 'server-inbound',
      );
    }

    for (const type of this.options?.dtos?.role === 'client'
      ? this.serviceInfo.inputTypes
      : this.serviceInfo.outputTypes) {
      yield* this.buildTypeMapper(
        type,
        this.options?.dtos?.role === 'client'
          ? 'client-inbound'
          : 'server-outbound',
      );
    }

    for (const union of this.options?.dtos?.role === 'client'
      ? this.serviceInfo.inputUnions
      : this.serviceInfo.outputUnions) {
      yield* this.buildUnionMapper(
        union,
        this.options?.dtos?.role === 'client'
          ? 'client-inbound'
          : 'server-outbound',
      );
    }
  }

  /** Builds types with no map properties */
  private *buildPureTypeMapper(
    type: Type,
    paramName: string,
    mode: Mode,
  ): Iterable<string> {
    this.touchCompact();
    yield `return compact({`;
    for (const prop of type.properties) {
      yield* this.buildPropertyAssignment(prop, paramName, mode);
    }
    yield `});`;
  }

  /** Builds types with both defined and map properties */
  private *buildMixedTypeMapper(
    type: Type,
    mapProperties: MapProperties,
    paramName: string,
    mode: Mode,
  ) {
    const maxProperties =
      type.rules.find((r) => r.id === 'ObjectMaxProperties')?.max.value ??
      Number.MAX_SAFE_INTEGER;
    const definedProperties =
      type.properties.length + mapProperties.requiredKeys.length;

    const reduceMap = maxProperties !== definedProperties;

    yield `const {`;
    for (const prop of type.properties) {
      const propName = buildPropertyName(prop);
      const leftName =
        mode === 'server-inbound' || mode === 'client-outbound'
          ? `'${prop.name.value}'`
          : propName;

      if (leftName === propName) {
        yield `${propName},`;
      } else {
        yield `${leftName}: ${propName},`;
      }
    }

    for (const key of mapProperties.requiredKeys) {
      const keyName = camel(key.value);
      const leftName =
        mode === 'server-inbound' || mode === 'client-outbound'
          ? `'${key.value}'`
          : keyName;

      if (leftName === keyName) {
        yield `${keyName},`;
      } else {
        yield `${leftName}: ${keyName},`;
      }
    }

    if (reduceMap) {
      yield `...__rest__,`;
    }

    yield `} = ${paramName};`;
    yield ``;

    if (reduceMap) {
      this.touchCompact();
      yield `const __defined__ = compact({`;
    } else {
      this.touchCompact();
      yield `return compact({`;
    }
    for (const prop of type.properties) {
      const { propertyName } = this.buildKey(prop, mode);
      const propertyValue = this.builder.buildValue(
        prop.value,
        mode,
        buildPropertyName(prop),
      );

      if (propertyName === propertyValue) {
        yield `${propertyName},`;
      } else {
        yield `${propertyName}: ${propertyValue},`;
      }
    }

    for (const key of mapProperties.requiredKeys) {
      const value = this.builder.buildValue(
        makeItRequired(mapProperties.value.value),
        mode,
        camel(key.value),
      );

      const keyName =
        mode === 'server-inbound' || mode === 'client-outbound'
          ? camel(key.value)
          : `'${key.value}'`;

      if (keyName === value) {
        yield `${keyName},`;
      } else {
        yield `${keyName}: ${value},`;
      }
    }
    yield `});`;

    if (reduceMap) {
      const asType = this.buildTypeNames(
        mapProperties.value.value.typeName.value,
        mode,
      ).input;

      yield ``;
      yield `return Object.keys(__rest__).reduce((acc, key) => {`;
      yield `const value = ${this.builder.buildValue(mapProperties.value.value, mode, `${paramName}[key]`, asType)};`;
      yield `return value === undefined ? acc : { ...acc, [key]: value };`;
      yield `}, __defined__ as ${this.buildTypeNames(type.name.value, mode).output});`;
    }
  }

  /** Builds types with ONLY map properties */
  private *buildPureMapMapper(
    type: Type,
    mapProperties: MapProperties,
    paramName: string,
    mode: Mode,
  ): Iterable<string> {
    const maxProperties =
      type.rules.find((r) => r.id === 'ObjectMaxProperties')?.max.value ??
      Number.MAX_SAFE_INTEGER;
    const definedProperties = mapProperties.requiredKeys.length;

    const destructure = !!definedProperties;
    const reduceMap = maxProperties !== definedProperties;

    if (destructure) {
      yield `const {`;
      for (const prop of type.properties) {
        const propName = buildPropertyName(prop);
        const leftName =
          mode === 'server-inbound' || mode === 'client-outbound'
            ? `'${prop.name.value}'`
            : propName;

        if (leftName === propName) {
          yield `${propName},`;
        } else {
          yield `${leftName}: ${propName},`;
        }
      }

      for (const key of mapProperties.requiredKeys) {
        const keyName = camel(key.value);
        const leftName =
          mode === 'server-inbound' || mode === 'client-outbound'
            ? `'${key.value}'`
            : keyName;

        if (leftName === keyName) {
          yield `${keyName},`;
        } else {
          yield `${leftName}: ${keyName},`;
        }
      }

      if (reduceMap) {
        yield `...__rest__,`;
      }

      yield `} = ${paramName};`;
      yield ``;
    }

    let needToCloseCompact = false;
    if (reduceMap) {
      if (destructure) {
        this.touchCompact();
        yield `const __defined__ = compact({`;
        needToCloseCompact = true;
      }
    } else {
      this.touchCompact();
      yield `return compact({`;
      needToCloseCompact = true;
    }

    for (const key of mapProperties.requiredKeys) {
      const value = this.builder.buildValue(
        makeItRequired(mapProperties.value.value),
        mode,
        camel(key.value),
      );

      const keyName =
        mode === 'server-inbound' || mode === 'client-outbound'
          ? camel(key.value)
          : `'${key.value}'`;

      if (keyName === value) {
        yield `${keyName},`;
      } else {
        yield `${keyName}: ${value},`;
      }
    }

    if (needToCloseCompact) {
      yield `});`;
    }

    if (reduceMap) {
      const asType = this.buildTypeNames(
        mapProperties.value.value.typeName.value,
        mode,
      ).input;

      const sourceName = destructure ? '__rest__' : paramName;
      const initialObj = destructure ? '__defined__' : '{}';

      yield ``;
      yield `return Object.keys(${sourceName}).reduce((acc, key) => {`;
      yield `const value = ${this.builder.buildValue(mapProperties.value.value, mode, `${paramName}[key]`, asType)};`;
      yield `return value === undefined ? acc : { ...acc, [key]: value };`;
      yield `}, ${initialObj} as ${this.buildTypeNames(type.name.value, mode).output});`;
    }
  }

  private *buildTypeMapper(type: Type, mode: Mode): Iterable<string> {
    const paramName =
      mode === 'server-inbound' || mode === 'client-outbound' ? 'dto' : 'obj';
    yield `${this.buildSignature(type.name.value, paramName, mode)} {`;

    if (type.properties.length && type.mapProperties) {
      yield* this.buildMixedTypeMapper(
        type,
        type.mapProperties,
        paramName,
        mode,
      );
    } else if (type.properties.length) {
      yield* this.buildPureTypeMapper(type, paramName, mode);
    } else if (type.mapProperties) {
      yield* this.buildPureMapMapper(type, type.mapProperties, paramName, mode);
    } else {
      yield `return {};`;
    }

    yield `}`;
    yield '';
  }

  private *buildUnionMapper(union: Union, mode: Mode): Iterable<string> {
    const paramName =
      mode === 'server-inbound' || mode === 'client-outbound' ? 'dto' : 'obj';
    yield `${this.buildSignature(union.name.value, paramName, mode)} {`;
    if (union.kind === 'DiscriminatedUnion') {
      yield `switch(${paramName}.${union.discriminator.value}) {`;
      let hasMissableKeys = false;
      for (const member of union.members) {
        const type = getTypeByName(this.service, member.typeName.value);
        if (!type) continue;

        const prop = type.properties.find(
          (p) => p.name.value === union.discriminator.value,
        );
        if (prop?.value.kind === 'ComplexValue' || !prop?.value.constant) {
          hasMissableKeys = true;
          continue;
        }

        const value =
          typeof prop.value.constant.value === 'string'
            ? `'${prop.value.constant.value}'`
            : prop.value.constant.value;

        yield `case ${value}: return ${this.builder.buildMapperName(
          member.typeName.value,
          mode,
        )}(${paramName});`;
      }
      if (hasMissableKeys) {
        yield `default: throw new Error('Invalid discriminator');`;
      }

      yield `}`;
    } else {
      if (union.members.every((m) => m.kind === 'PrimitiveValue')) {
        const hasDate = union.members.some((m) => m.typeName.value === 'date');
        const hasDateTime = union.members.some(
          (m) => m.typeName.value === 'date-time',
        );

        if (hasDate || hasDateTime) {
          if (mode === 'server-inbound' || mode === 'client-outbound') {
            yield `if (typeof ${paramName} === 'string') {`;
            yield `return new Date(${paramName});`;
          } else {
            yield `if (${paramName} instanceof Date) {`;
            if (hasDateTime) {
              yield `return ${paramName}.toISOString();`;
            } else {
              yield `return ${paramName}.toISOString().split('T')[0];`;
            }
          }
          yield `} else {`;
          yield `return ${paramName};`;
          yield `}`;
        } else {
          yield `return ${paramName};`;
        }
      } else {
        // TODO: attempt to discriminate based on the presence of required properties
        yield `const union = ${paramName} as any;`;
        this.touchCompact();
        yield `return compact({`;

        const properties = new Map<string, Property>();

        for (const prop of this.traverseProperties(union)) {
          properties.set(prop.name.value, prop);
        }
        for (const prop of properties.values()) {
          // In this context, only one of the union members will be present;
          // therefore, let's assume that any property could be optional.
          const notRequired: Property = {
            ...prop,
            value: {
              ...prop.value,
              isOptional: { kind: 'TrueLiteral', value: true },
            },
          };
          yield* this.buildPropertyAssignment(notRequired, 'union', mode);
        }
        yield '}) as any;';
      }
    }
    yield '}';
    yield '';
  }

  private *traverseProperties(union: Union): Iterable<Property> {
    const types: Type[] = [];
    const unions: Union[] = [union];

    while (types.length || unions.length) {
      while (types.length) {
        const type = types.pop();
        if (!type) continue;
        yield* type.properties;
      }

      const u = unions.pop();
      if (!u) continue;
      for (const member of u.members) {
        const type = getTypeByName(this.service, member.typeName.value);
        if (type) {
          types.push(type);
        } else {
          const uu = getUnionByName(this.service, member.typeName.value);
          if (uu) {
            unions.push(uu);
          }
        }
      }
    }
  }

  private buildKey(
    prop: Property,
    mode: Mode,
  ): { propertyName: string; optional: '' | '?' } {
    const optional = isRequired(prop.value) ? '' : '?';

    const propertyName =
      mode === 'server-inbound' || mode === 'client-outbound'
        ? buildPropertyName(prop)
        : `'${prop.name.value}'`;

    return { propertyName, optional };
  }

  private *buildPropertyDefinition(
    prop: Property,
    name: string,
    mode: Mode,
  ): Iterable<string> {
    const { propertyName, optional } = this.buildKey(prop, mode);
    const key = `${propertyName}${optional}`;

    const value = this.builder.buildPropertyValue(prop, name, mode);

    yield `${key}: ${value},`;
  }

  private *buildPropertyAssignment(
    prop: Property,
    name: string,
    mode: Mode,
  ): Iterable<string> {
    const { propertyName } = this.buildKey(prop, mode);
    const key = `${propertyName}`;

    const value = this.builder.buildPropertyValue(prop, name, mode);

    yield `${key}: ${value},`;
  }

  private _needsCompact = false;
  private touchCompact(): void {
    this._needsCompact = true;
  }
  private *buildCompact(): Iterable<string> {
    if (this._needsCompact) {
      yield `function compact<T extends object>(obj: T): T {
        return Object.keys(obj).reduce((acc, key) => {
          const value = obj[key as keyof T];
          if (value !== undefined) {
            acc[key as keyof T] = value;
          }
          return acc;
        }, {} as T);
      }`;
    }
  }
}

function makeItRequired(memberValue: MemberValue): MemberValue {
  if (isRequired(memberValue)) return memberValue;
  const { isOptional, ...rest } = memberValue;
  return { ...rest };
}
