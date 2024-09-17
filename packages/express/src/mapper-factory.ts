import {
  File,
  Property,
  Service,
  Type,
  Union,
  getTypeByName,
  getUnionByName,
  isRequired,
} from 'basketry';
import { NamespacedExpressOptions } from './types';
import { buildFilePath, buildPropertyName } from '@basketry/typescript';
import { format } from '@basketry/typescript/lib/utils';
import { BaseFactory } from './base-factory';
import { pascal } from 'case';

export class ExpressMapperFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    const mappers = Array.from(this.buildMappers()).join('\n');
    const compact = Array.from(this.buildCompact()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(
        ['express', 'mappers.ts'],
        this.service,
        this.options,
      ),
      contents: format([preamble, compact, mappers].join('\n\n'), this.options),
    });

    return files;
  }

  private buildSignature(
    typeName: string,
    name: string,
    mode: 'input' | 'output',
  ): string {
    const dtoType = `${this.dtosModule}.${this.builder.buildDtoName(typeName)}`;
    const type = `${this.typesModule}.${pascal(typeName)}`;

    return `export function ${this.builder.buildMapperName(
      typeName,
      mode,
    )}(${name}: ${mode === 'input' ? dtoType : type}): ${
      mode === 'input' ? type : dtoType
    }`;
  }

  private *buildMappers(): Iterable<string> {
    for (const inputType of this.serviceInfo.inputTypes) {
      yield* this.buildTypeMapper(inputType, 'input');
    }

    for (const inputUnion of this.serviceInfo.inputUnions) {
      yield* this.buildUnionMapper(inputUnion, 'input');
    }

    for (const outputType of this.serviceInfo.outputTypes) {
      yield* this.buildTypeMapper(outputType, 'output');
    }

    for (const outputUnion of this.serviceInfo.outputUnions) {
      yield* this.buildUnionMapper(outputUnion, 'output');
    }
  }

  private *buildTypeMapper(
    type: Type,
    mode: 'input' | 'output',
  ): Iterable<string> {
    const paramName = mode === 'input' ? 'dto' : 'obj';
    yield `${this.buildSignature(type.name.value, paramName, mode)} {`;
    yield `return {`;
    for (const prop of type.properties) {
      yield* this.buildProperty(prop, paramName, mode);
    }
    yield `};`;
    yield `}`;
    yield '';
  }

  private *buildUnionMapper(
    union: Union,
    mode: 'input' | 'output',
  ): Iterable<string> {
    const paramName = mode === 'input' ? 'dto' : 'obj';
    yield `${this.buildSignature(union.name.value, paramName, mode)} {`;
    if (union.discriminator) {
      yield `switch(${paramName}.${union.discriminator.value}) {`;
      let hasMissableKeys = false;
      for (const member of union.members) {
        const type = getTypeByName(this.service, member.typeName.value);
        if (!type) continue;

        const prop = type.properties.find(
          (p) => p.name.value === union.discriminator.value,
        );
        if (!prop?.isPrimitive || !prop?.constant) {
          hasMissableKeys = true;
          continue;
        }

        const value =
          typeof prop.constant.value === 'string'
            ? `'${prop.constant.value}'`
            : prop.constant.value;

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
      yield `const union = ${paramName} as any;`;
      this.touchCompact();
      yield `return compact({`;

      const properties = new Map<string, Property>();

      for (const prop of this.traverseProperties(union)) {
        properties.set(prop.name.value, prop);
      }
      for (const prop of properties.values()) {
        yield* this.buildProperty(prop, 'union', mode);
      }
      yield '}) as any;';
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

  private *buildProperty(
    prop: Property,
    name: string,
    mode: 'input' | 'output',
  ): Iterable<string> {
    const optional = isRequired(prop) ? '' : '?';

    const propertyName =
      mode === 'input' ? buildPropertyName(prop) : `'${prop.name.value}'`;

    const key = `${propertyName}${optional}`;

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
