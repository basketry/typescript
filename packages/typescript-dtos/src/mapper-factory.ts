import {
  ComplexValue,
  File,
  MapProperties,
  MemberValue,
  Primitive,
  Property,
  Service,
  SimpleUnion,
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
import {
  and,
  AndClause,
  Condition,
  ConditionalBlock,
  expr,
  Expression,
  Heuristic,
  or,
  OrClause,
  render,
  UnionUtils,
} from './union-utils';

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

    // Must be after all mappers are built
    const isoDateHelper = Array.from(this.buildIsIsoDate()).join('\n');
    const isoDateTimeHelper = Array.from(this.buildIsIsoDateTime()).join('\n');

    files.push({
      path: buildFilePath(['dtos', 'mappers.ts'], this.service, this.options),
      contents: await format(
        [preamble, isoDateHelper, isoDateTimeHelper, compact, mappers].join(
          '\n\n',
        ),
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
      yield* this.buildSimpleUnionMapper(union, mode);
    }
    yield '}';
    yield '';
  }

  private *buildSimpleUnionMapper(
    union: SimpleUnion,
    mode: Mode,
  ): Iterable<string> {
    const paramName =
      mode === 'server-inbound' || mode === 'client-outbound' ? 'dto' : 'obj';

    const topBlocks: ConditionalBlock[] = [];

    const arrayMembers = union.members.filter((m) => m.isArray);

    if (arrayMembers.length) {
      const arrayBlocks = this.buildConditionalBlocks(
        arrayMembers,
        union,
        mode,
      );

      topBlocks.push({
        condition: expr(`Array.isArray(${paramName})`),
        statements: this.renderBlocks(arrayBlocks),
      });
    }

    const nonArrayMembers = union.members.filter((m) => !m.isArray);

    if (nonArrayMembers.length) {
      const nonArrayBlocks = this.buildConditionalBlocks(
        nonArrayMembers,
        union,
        mode,
      );

      topBlocks.push({
        condition: expr(`!Array.isArray(${paramName})`),
        statements: this.renderBlocks(nonArrayBlocks),
      });
    }

    // Render blocks
    yield* this.renderBlocks(topBlocks);
  }

  private _needsIsIsoDate = false;
  private isIsoDate(): string {
    this._needsIsIsoDate = true;
    return 'isIsoDate';
  }
  private *buildIsIsoDate(): Iterable<string> {
    if (this._needsIsIsoDate) {
      yield 'const isoDateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;';
      yield 'function isIsoDate(s: string): boolean {';
      yield '  if (!isoDateRegex.test(s)) return false;';
      yield '  const d = new Date(s + "T00:00:00Z"); // interpret as UTC midnight';
      yield '  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;';
      yield '}';
    }
  }

  private _needsIsIsoDateTime = false;
  private isIsoDateTime(): string {
    this._needsIsIsoDateTime = true;
    return 'isIsoDateTime';
  }
  private *buildIsIsoDateTime(): Iterable<string> {
    if (this._needsIsIsoDateTime) {
      yield 'const isoDateTimeRegex = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$/;';
      yield 'function isIsoDateTime(s: string): boolean {';
      yield '  if (!isoDateTimeRegex.test(s)) return false;';
      yield '  return !Number.isNaN(new Date(s).valueOf()); // relies on strict precheck above';
      yield '}';
    }
  }

  private buildConditionalBlocks(
    members: MemberValue[],
    union: SimpleUnion,
    mode: Mode,
  ): ConditionalBlock[] {
    const paramName =
      mode === 'server-inbound' || mode === 'client-outbound' ? 'dto' : 'obj';

    const isArray = members.some((m) => m.isArray);

    const blocks: ConditionalBlock[] = [];

    if (isArray && members.length > 1) {
      blocks.push({
        condition: expr(`${paramName}.length === 0`),
        statements: [`return [];`],
      });
    }

    const hasDate = members.some(
      (m) => m.kind === 'PrimitiveValue' && m.typeName.value === 'date',
    );
    const hasDateTime = members.some(
      (m) => m.kind === 'PrimitiveValue' && m.typeName.value === 'date-time',
    );

    const nonDatePrimitives = members.filter(
      (m) =>
        m.kind === 'PrimitiveValue' &&
        m.typeName.value !== 'date' &&
        m.typeName.value !== 'date-time',
    );

    const complexMembers = members.filter((m) => m.kind === 'ComplexValue');

    /** Checks if the non-date primitive list includes any of the provided types */
    function check(...p: Primitive[]): boolean {
      return nonDatePrimitives.some(
        (m) => m.kind === 'PrimitiveValue' && p.includes(m.typeName.value),
      );
    }

    // Handle date and date-time
    if (hasDate || hasDateTime) {
      if (mode === 'server-inbound' || mode === 'client-outbound') {
        const condition: AndClause = and(
          expr(`typeof ${paramName}${isArray ? '[0]' : ''} === 'string'`),
        );

        if (check('string')) {
          const dateOrClause: OrClause = or();

          if (hasDate) {
            dateOrClause.clauses.push(
              expr(`${this.isIsoDate()}(${paramName}${isArray ? '[0]' : ''})`),
            );
          }

          if (hasDateTime) {
            dateOrClause.clauses.push(
              expr(
                `${this.isIsoDateTime()}(${paramName}${isArray ? '[0]' : ''})`,
              ),
            );
          }

          condition.clauses.push(dateOrClause);
        }
        blocks.push({
          condition,
          statements: isArray
            ? [`return ${paramName}.map((item) => new Date(item));`]
            : [`return new Date(${paramName});`],
        });
      } else {
        const condition: Condition = expr(
          `${paramName}${isArray ? '[0]' : ''} instanceof Date`,
        );

        if (hasDateTime) {
          blocks.push({
            condition,
            statements: isArray
              ? [`return ${paramName}.map((item) => item.toISOString());`]
              : [`return ${paramName}.toISOString();`],
          });
        } else {
          blocks.push({
            condition,
            statements: isArray
              ? [
                  `return ${paramName}.map((item) => item.toISOString().split('T')[0]);`,
                ]
              : [`return ${paramName}.toISOString().split('T')[0];`],
          });
        }
      }
    }

    // Handle non-date primitives
    if (nonDatePrimitives.length) {
      // Find primitives
      const primitiveCases: string[] = [];
      if (check('boolean')) {
        primitiveCases.push(
          `typeof ${paramName}${isArray ? '[0]' : ''} === 'boolean'`,
        );
      }
      if (check('string')) {
        primitiveCases.push(
          `typeof ${paramName}${isArray ? '[0]' : ''} === 'string'`,
        );
      }
      if (check('number', 'integer', 'float', 'double', 'long')) {
        primitiveCases.push(
          `typeof ${paramName}${isArray ? '[0]' : ''} === 'number'`,
        );
      }
      if (check('null')) {
        primitiveCases.push(`${paramName}${isArray ? '[0]' : ''} === null`);
      }

      if (primitiveCases.length) {
        blocks.push({
          condition: or(...primitiveCases.map(expr)),
          statements: [`return ${paramName};`],
        });
      }
    }

    // Handle complex types
    if (complexMembers.length === 1) {
      const mapperName = this.builder.buildMapperName(
        complexMembers[0].typeName.value,
        mode,
      );
      blocks.push({
        condition: expr(
          `typeof ${paramName}${isArray ? '[0]' : ''} === 'object' && ${paramName}${isArray ? '[0]' : ''} !== null`,
        ),
        statements: isArray
          ? [`return ${paramName}.map(${mapperName});`]
          : [`return ${mapperName}(${paramName});`],
      });
    } else if (complexMembers.length > 1) {
      // Handle multiple complex members

      const heuristicsByMember: Map<ComplexValue, Heuristic[]> = new Map();
      const unionUtils = new UnionUtils(this.service);
      for (const member of complexMembers) {
        const otherMembers = complexMembers.filter((m) => m !== member);
        heuristicsByMember.set(
          member,
          unionUtils.getHeuristics(member, otherMembers),
        );
      }

      const noHeuristics: ComplexValue[] = [];

      for (const [member, heuristics] of heuristicsByMember) {
        if (!heuristics.length) {
          noHeuristics.push(member);
          continue;
        }
        const mapperName = this.builder.buildMapperName(
          member.typeName.value,
          mode,
        );
        blocks.push({
          condition: {
            kind: 'AndClause',
            clauses: heuristics
              .map((h) => {
                switch (h.kind) {
                  case 'ConstantValue': {
                    const condition: Condition = and(
                      expr(
                        `"${h.property}" in ${paramName}${isArray ? '[0]' : ''}`,
                      ),
                      expr(
                        `${paramName}${accessor(h.property)} === ${typeof h.value === 'string' ? `'${h.value}'` : h.value}`,
                      ),
                    );

                    return condition;
                  }
                  case 'RequiredProperty': {
                    const condition: Condition = expr(
                      `"${h.property}" in ${paramName}${isArray ? '[0]' : ''}`,
                    );

                    return condition;
                  }
                  case 'RequiredProperties': {
                    if (!h.properties.length) return undefined;
                    const condition: Condition = and(
                      ...h.properties.map((p) =>
                        expr(`"${p}" in ${paramName}${isArray ? '[0]' : ''}`),
                      ),
                    );
                    return condition;
                  }
                  default:
                    return undefined;
                }
              })
              .filter((c): c is Expression | AndClause => !!c)
              .slice(0, 1), // Use only the first heuristic to avoid overly complex conditions,
          },
          statements: isArray
            ? [`return ${paramName}.map(${mapperName});`]
            : [`return ${mapperName}(${paramName});`],
        });
      }

      if (noHeuristics.length === 1) {
        const mapperName = this.builder.buildMapperName(
          noHeuristics[0].typeName.value,
          mode,
        );
        blocks.push({
          condition: and(
            expr(`typeof ${paramName} === 'object'`),
            expr(`${paramName} !== null`),
          ),
          statements: isArray
            ? [`return ${paramName}.map(${mapperName});`]
            : [`return ${mapperName}(${paramName});`],
        });
      } else if (noHeuristics.length > 1) {
        const statements: string[] = [];

        const hasMapProperties = noHeuristics.some((type) => {
          const t = getTypeByName(this.service, type.typeName.value);
          return !!t?.mapProperties;
        });

        if (hasMapProperties) {
          statements.push(`return ${paramName} as any;`);
        } else {
          statements.push(`const union = ${paramName} as any;`);
          this.touchCompact();
          statements.push(`return compact({`);
          const properties = new Map<string, Property>();

          // TODO: make this work for map properties too
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
            statements.push(
              ...this.buildPropertyAssignment(notRequired, 'union', mode),
            );
          }
          statements.push('}) as any;');
        }

        blocks.push({
          condition: and(
            expr(`typeof ${paramName} === 'object'`),
            expr(`${paramName} !== null`),
          ),
          statements,
        });
      }
    }

    return blocks;
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

  private *renderBlocks(blocks: ConditionalBlock[]): Iterable<string> {
    if (blocks.length === 1) {
      yield* blocks[0].statements;
    } else {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        if (i === blocks.length - 1) {
          yield `else {`;
        } else {
          const prefix = i === 0 ? 'if' : 'else if';
          yield `${prefix} (${render(block.condition)}) {`;
        }
        yield* block.statements;
        yield `}`;
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

function accessor(string: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(string)
    ? `.${string}`
    : `['${string}']`;
}

function makeItRequired(memberValue: MemberValue): MemberValue {
  if (isRequired(memberValue)) return memberValue;
  const { isOptional, ...rest } = memberValue;
  return { ...rest };
}
