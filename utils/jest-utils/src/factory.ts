import * as IR from '@basketry/ir';

type Override<T, K extends keyof T | undefined = undefined> = K extends keyof T
  ? Partial<Omit<T, 'kind' | K>>
  : Partial<Omit<T, 'kind'>>;

export class Factory {
  constructor(private readonly seed?: number) {
    if (this.seed !== undefined) {
      // Simple seeded random number generator using a linear congruential generator
      const a = 1664525;
      const c = 1013904223;
      const m = 0x100000000; // 2^32
      this._random = (a * this.seed + c) % m;
    } else {
      // Generate a random number between 0 and 16^8-1
      this._random = Math.floor(Math.random() * 0x100000000);
    }
  }

  private _random: number;

  private rnd(name: string): string {
    // Convert to hex string and pad with zeros if necessary
    return `${name}${this._random.toString(16).padStart(8, '0')}`;
  }

  // 4.1 Structure

  // 4.1.1 Service
  service(obj?: Override<IR.Service, 'basketry'>): IR.Service {
    const {
      title,
      sourcePaths,
      majorVersion,
      interfaces,
      types,
      enums,
      unions,
      ...rest
    } = obj || {};

    return {
      kind: 'Service',
      basketry: '0.2',
      title: title ?? this.stringLiteral(this.rnd('Service')),
      sourcePaths: sourcePaths ?? ['#'],
      majorVersion: majorVersion ?? this.integerLiteral(1),
      interfaces: interfaces ?? [],
      types: types ?? [],
      enums: enums ?? [],
      unions: unions ?? [],
      ...rest,
    };
  }

  // 4.1.2 Interface
  interface(obj?: Override<IR.Interface>): IR.Interface {
    const { name, description, methods, ...rest } = obj || {};

    return {
      kind: 'Interface',
      name: name ?? this.stringLiteral(this.rnd('Interface')),
      description: description ?? [],
      methods: methods ?? [],
      ...rest,
    };
  }

  // 4.1.3 Type
  type(obj?: Override<IR.Type>): IR.Type {
    const {
      name,
      description,
      deprecated,
      properties,
      mapProperties,
      rules,
      ...rest
    } = obj || {};
    return {
      kind: 'Type',
      name: name ?? this.stringLiteral(this.rnd('Type')),
      description,
      deprecated,
      properties: properties ?? [],
      mapProperties,
      rules: rules ?? [],
      ...rest,
    };
  }

  // 4.1.4 Enum
  enum(obj?: Override<IR.Enum>): IR.Enum {
    const { name, description, members, ...rest } = obj || {};

    return {
      kind: 'Enum',
      name: name ?? this.stringLiteral(this.rnd('Enum')),
      description,
      members: members ?? [this.enumMember()],
      ...rest,
    };
  }

  // 4.1.5 SimpleUnion
  simpleUnion(obj?: Override<IR.SimpleUnion>): IR.SimpleUnion {
    const { name, description, members, ...rest } = obj || {};

    return {
      kind: 'SimpleUnion',
      name: name ?? this.stringLiteral(this.rnd('SimpleUnion')),
      description,
      members: members ?? [],
      ...rest,
    };
  }

  // 4.1.6 Discriminated Union
  discriminatedUnion(
    obj?: Override<IR.DiscriminatedUnion>,
  ): IR.DiscriminatedUnion {
    const { name, description, discriminator, members, ...rest } = obj || {};

    return {
      kind: 'DiscriminatedUnion',
      name: name ?? this.stringLiteral(this.rnd('DiscriminatedUnion')),
      description,
      discriminator: discriminator ?? this.stringLiteral('type'),
      members: members ?? [],
      ...rest,
    };
  }

  // 4.1.8 Method
  method(obj?: Override<IR.Method>): IR.Method {
    const {
      name,
      description,
      deprecated,
      parameters,
      security,
      returns,
      ...rest
    } = obj || {};

    return {
      kind: 'Method',
      name: name ?? this.stringLiteral(this.rnd('method')),
      description,
      deprecated,
      parameters: parameters ?? [],
      security: security ?? [],
      returns,
      ...rest,
    };
  }

  // 4.1.9 Protocols
  protocols(obj?: Override<IR.Protocols>): IR.Protocols {
    const { http, ...rest } = obj || {};

    return {
      kind: 'InterfaceProtocols',
      http,
      ...rest,
    };
  }

  // 4.1.10 Property
  property(obj?: Override<IR.Property>): IR.Property {
    const { name, value, description, deprecated, ...rest } = obj || {};

    return {
      kind: 'Property',
      name: name ?? this.stringLiteral(this.rnd('property')),
      description,
      deprecated,
      value:
        value ??
        this.primitiveValue({ typeName: this.primitiveLiteral('string') }),
      ...rest,
    };
  }

  // 4.1.11 MapProperties
  mapProperties(obj?: Override<IR.MapProperties>): IR.MapProperties {
    const { key, requiredKeys, value, ...rest } = obj || {};

    return {
      kind: 'MapProperties',
      key: key ?? this.mapKey(),
      requiredKeys: requiredKeys ?? [],
      value: value ?? this.mapValue(),
      ...rest,
    };
  }

  // 4.1.12 EnumMember
  enumMember(obj?: Override<IR.EnumMember>): IR.EnumMember {
    const { content, ...rest } = obj || {};

    return {
      kind: 'EnumMember',
      content: content ?? this.stringLiteral(this.rnd('EnumMember')),
      ...rest,
    };
  }

  // 4.1.13 PrimitiveValue
  primitiveValue(obj?: Override<IR.PrimitiveValue>): IR.PrimitiveValue {
    const { typeName, rules, ...rest } = obj || {};

    return {
      kind: 'PrimitiveValue',
      typeName: typeName ?? this.primitiveLiteral('string'),
      rules: rules ?? [],
      ...rest,
    };
  }

  // 4.1.14 ComplexValue
  complexValue(obj?: Override<IR.ComplexValue>): IR.ComplexValue {
    const { typeName, rules, ...rest } = obj || {};

    return {
      kind: 'ComplexValue',
      typeName: typeName ?? this.stringLiteral(this.rnd('Type')),
      rules: rules ?? [],
      ...rest,
    };
  }

  // 4.1.15 Parameter
  parameter(obj?: Override<IR.Parameter>): IR.Parameter {
    const { name, value, description, deprecated, ...rest } = obj || {};

    return {
      kind: 'Parameter',
      name: name ?? this.stringLiteral(this.rnd('parameter')),
      description,
      deprecated,
      value:
        value ??
        this.primitiveValue({ typeName: this.primitiveLiteral('string') }),
      ...rest,
    };
  }

  // 4.1.17 ReturnValue
  returnValue(obj?: Override<IR.ReturnValue>): IR.ReturnValue {
    const { value, ...rest } = obj || {};

    return {
      kind: 'ReturnValue',
      value:
        value ??
        this.primitiveValue({ typeName: this.primitiveLiteral('string') }),
      ...rest,
    };
  }

  // 4.1.18 HttpRoute
  httpRoute(obj?: Override<IR.HttpRoute>): IR.HttpRoute {
    const { pattern, methods, ...rest } = obj || {};

    return {
      kind: 'HttpRoute',
      pattern: pattern ?? this.stringLiteral('/' + this.rnd('route')),
      methods: methods ?? [],
      ...rest,
    };
  }

  // 4.1.19 MapKey
  mapKey(obj?: Override<IR.MapKey>): IR.MapKey {
    const { value, ...rest } = obj || {};

    return {
      kind: 'MapKey',
      value:
        value ??
        this.primitiveValue({ typeName: this.primitiveLiteral('string') }),
      ...rest,
    };
  }

  // 4.1.20 MapValue
  mapValue(obj?: Override<IR.MapValue>): IR.MapValue {
    const { value, ...rest } = obj || {};

    return {
      kind: 'MapValue',
      value:
        value ??
        this.primitiveValue({ typeName: this.primitiveLiteral('string') }),
      ...rest,
    };
  }

  // 4.1.24 HttpMethod
  httpMethod(obj?: Override<IR.HttpMethod>): IR.HttpMethod {
    const {
      name,
      verb,
      parameters,
      successCode,
      requestMediaTypes,
      responseMediaTypes,
      ...rest
    } = obj || {};

    return {
      kind: 'HttpMethod',
      name: name ?? this.stringLiteral(this.rnd('httpMethod')),
      verb: verb ?? this.httpVerbLiteral('post'),
      parameters: parameters ?? [],
      successCode: successCode ?? this.httpStatusCodeLiteral(200),
      requestMediaTypes: requestMediaTypes ?? [
        this.stringLiteral('application/json'),
      ],
      responseMediaTypes: responseMediaTypes ?? [
        this.stringLiteral('application/json'),
      ],
      ...rest,
    };
  }

  // 4.1.33 HttpParameter
  httpParameter(obj?: Override<IR.HttpParameter>): IR.HttpParameter {
    const { name, location, arrayFormat, ...rest } = obj || {};

    return {
      kind: 'HttpParameter',
      name: name ?? this.stringLiteral(this.rnd('param')),
      location: location ?? this.httpLocationLiteral('query'),
      arrayFormat: arrayFormat,
      ...rest,
    };
  }

  // 4.2 Validation Rules

  stringMaxLengthRule(length: number): IR.StringMaxLengthRule {
    return {
      kind: 'ValidationRule',
      id: 'StringMaxLength',
      length: this.nonNegativeIntegerLiteral(length),
    };
  }

  stringMinLengthRule(length: number): IR.StringMinLengthRule {
    return {
      kind: 'ValidationRule',
      id: 'StringMinLength',
      length: this.nonNegativeIntegerLiteral(length),
    };
  }

  stringPatternRule(pattern: string): IR.StringPatternRule {
    return {
      kind: 'ValidationRule',
      id: 'StringPattern',
      pattern: this.nonEmptyStringLiteral(pattern),
    };
  }

  stringFormatRule(pattern: string): IR.StringFormatRule {
    return {
      kind: 'ValidationRule',
      id: 'StringFormat',
      format: this.nonEmptyStringLiteral(pattern),
    };
  }

  numberMultipleOfRule(value: number): IR.NumberMultipleOfRule {
    return {
      kind: 'ValidationRule',
      id: 'NumberMultipleOf',
      value: this.nonNegativeNumberLiteral(value),
    };
  }

  numberGtRule(value: number): IR.NumberGtRule {
    return {
      kind: 'ValidationRule',
      id: 'NumberGT',
      value: this.numberLiteral(value),
    };
  }

  numberGteRule(value: number): IR.NumberGteRule {
    return {
      kind: 'ValidationRule',
      id: 'NumberGTE',
      value: this.numberLiteral(value),
    };
  }

  numberLtRule(value: number): IR.NumberLtRule {
    return {
      kind: 'ValidationRule',
      id: 'NumberLT',
      value: this.numberLiteral(value),
    };
  }

  numberLteRule(value: number): IR.NumberLteRule {
    return {
      kind: 'ValidationRule',
      id: 'NumberLTE',
      value: this.numberLiteral(value),
    };
  }

  arrayMaxItemsRule(count: number): IR.ArrayMaxItemsRule {
    return {
      kind: 'ValidationRule',
      id: 'ArrayMaxItems',
      max: this.nonNegativeIntegerLiteral(count),
    };
  }

  arrayMinItemsRule(count: number): IR.ArrayMinItemsRule {
    return {
      kind: 'ValidationRule',
      id: 'ArrayMinItems',
      min: this.nonNegativeIntegerLiteral(count),
    };
  }

  arrayUniqueItemsRule(): IR.ArrayUniqueItemsRule {
    return {
      kind: 'ValidationRule',
      id: 'ArrayUniqueItems',
      required: true,
    };
  }

  // 4.3 Object Rules

  // 4.3.1 ObjectMinPropertiesRule
  objectMinPropertiesRule(count: number): IR.ObjectMinPropertiesRule {
    return {
      kind: 'ObjectValidationRule',
      id: 'ObjectMinProperties',
      min: this.nonNegativeIntegerLiteral(count),
    };
  }

  // 4.3.2 ObjectMaxPropertiesRule
  objectMaxPropertiesRule(count: number): IR.ObjectMaxPropertiesRule {
    return {
      kind: 'ObjectValidationRule',
      id: 'ObjectMaxProperties',
      max: this.nonNegativeIntegerLiteral(count),
    };
  }

  // 4.3.3 ObjectNoAdditionalPropertiesRule
  objectAdditionalPropertiesRule(): IR.ObjectAdditionalPropertiesRule {
    return {
      kind: 'ObjectValidationRule',
      id: 'ObjectAdditionalProperties',
      forbidden: this.trueLiteral(),
    };
  }

  // 4.4 Literals

  // 4.4.1 StringLiteral
  stringLiteral(value: string): IR.StringLiteral {
    return { kind: 'StringLiteral', value };
  }

  // 4.4.2 IntegerLiteral
  integerLiteral(value: number): IR.IntegerLiteral {
    return { kind: 'IntegerLiteral', value };
  }

  // 4.4.3 TrueLiteral
  trueLiteral(): IR.TrueLiteral {
    return { kind: 'TrueLiteral', value: true };
  }

  // 4.4.4 DisjunctionKindLiteral
  disjunctionKindLiteral(value: IR.DisjunctionKind): IR.DisjunctionKindLiteral {
    return { kind: 'DisjunctionKindLiteral', value };
  }

  // 4.4.5 UntypedLiteral
  untypedLiteral(value: any): IR.UntypedLiteral {
    return { kind: 'UntypedLiteral', value };
  }

  // 4.4.6 NonNegativeIntegerLiteral
  nonNegativeIntegerLiteral(value: number): IR.NonNegativeIntegerLiteral {
    return { kind: 'NonNegativeIntegerLiteral', value };
  }

  // 4.4.7 PrimitiveLiteral
  primitiveLiteral(value: IR.Primitive): IR.PrimitiveLiteral {
    return { kind: 'PrimitiveLiteral', value };
  }

  // 4.4.8 NumberLiteral
  numberLiteral(value: number): IR.NumberLiteral {
    return { kind: 'NumberLiteral', value };
  }

  // 4.4.9 BooleanLiteral
  booleanLiteral(value: boolean): IR.BooleanLiteral {
    return { kind: 'BooleanLiteral', value };
  }

  // 4.4.10 NullLiteral
  nullLiteral(): IR.NullLiteral {
    return { kind: 'NullLiteral', value: null };
  }

  // 4.4.11 NonEmptyStringLiterals
  nonEmptyStringLiteral(value: string): IR.NonEmptyStringLiteral {
    return { kind: 'NonEmptyStringLiteral', value };
  }

  // 4.4.12 NonNegativeNumberLiteral
  nonNegativeNumberLiteral(value: number): IR.NonNegativeNumberLiteral {
    return { kind: 'NonNegativeNumberLiteral', value };
  }

  // 4.4.13 HttpVerbLiteral
  httpVerbLiteral(value: IR.HttpVerb): IR.HttpVerbLiteral {
    return { kind: 'HttpVerbLiteral', value };
  }

  // 4.4.14 HttpStatusCodeLiteral
  httpStatusCodeLiteral(value: number): IR.HttpStatusCodeLiteral {
    return { kind: 'HttpStatusCodeLiteral', value };
  }

  // 4.4.15 HttpLocationLiteral
  httpLocationLiteral(value: IR.HttpLocation): IR.HttpLocationLiteral {
    return { kind: 'HttpLocationLiteral', value };
  }

  // 4.4.16 HttpArrayFormatLiteral
  httpArrayFormatLiteral(value: IR.HttpArrayFormat): IR.HttpArrayFormatLiteral {
    return { kind: 'HttpArrayFormatLiteral', value };
  }
}
