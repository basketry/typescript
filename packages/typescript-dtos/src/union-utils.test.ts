import {
  ComplexValue,
  IntegerLiteral,
  Primitive,
  PrimitiveLiteral,
  PrimitiveValue,
  Property,
  Service,
  StringLiteral,
  Type,
} from '@basketry/ir';
import {
  and,
  dedup,
  expr,
  flatten,
  or,
  render,
  UnionUtils,
} from './union-utils';

describe(flatten, () => {
  describe('Expression', () => {
    it('no-ops', () => {
      // ARRANGE
      const sut = expr('a');

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(sut);
    });
  });

  describe('AndClause', () => {
    it('no-ops on single level ', () => {
      // ARRANGE
      const sut = and(expr('a'), expr('b'), expr('c'));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(sut);
    });

    it('flattens mixed nested levels ', () => {
      // ARRANGE
      const sut = and(
        expr('a'),
        or(expr('b'), expr('c')),
        and(expr('d'), expr('e')),
      );

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(
        and(expr('a'), or(expr('b'), expr('c')), expr('d'), expr('e')),
      );
    });

    it('flattens single nested level', () => {
      // ARRANGE
      const sut = and(expr('a'), and(expr('b'), expr('c')));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(and(expr('a'), expr('b'), expr('c')));
    });

    it('flattens multiple nested levels', () => {
      // ARRANGE
      const sut = and(expr('a'), and(expr('b'), and(expr('c'), expr('d'))));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(and(expr('a'), expr('b'), expr('c'), expr('d')));
    });
  });

  describe('OrClause', () => {
    it('no-ops on single level ', () => {
      // ARRANGE
      const sut = or(expr('a'), expr('b'), expr('c'));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(sut);
    });

    it('flattens mixed nested levels ', () => {
      // ARRANGE
      const sut = or(
        expr('a'),
        and(expr('b'), expr('c')),
        or(expr('d'), expr('e')),
      );

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(
        or(expr('a'), and(expr('b'), expr('c')), expr('d'), expr('e')),
      );
    });

    it('flattens single nested level', () => {
      // ARRANGE
      const sut = or(expr('a'), or(expr('b'), expr('c')));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(or(expr('a'), expr('b'), expr('c')));
    });

    it('flattens multiple nested levels', () => {
      // ARRANGE
      const sut = or(expr('a'), or(expr('b'), or(expr('c'), expr('d'))));

      // ACT
      const result = flatten(sut);

      // ASSERT
      expect(result).toEqual(or(expr('a'), expr('b'), expr('c'), expr('d')));
    });
  });
});

describe(dedup, () => {
  it('removes duplicate expressions', () => {
    // ARRANGE
    const sut = [expr('a'), expr('b'), expr('a')];

    // ACT
    const result = dedup(sut);

    // ASSERT
    expect(result).toEqual([expr('a'), expr('b')]);
  });

  it('removes duplicate nested clauses', () => {
    // ARRANGE
    const sut = [
      and(expr('a'), expr('b')),
      or(expr('c'), expr('d')),
      and(expr('a'), expr('b')),
      or(expr('c'), expr('d')),
    ];

    // ACT
    const result = dedup(sut);

    // ASSERT
    expect(result).toEqual([
      and(expr('a'), expr('b')),
      or(expr('c'), expr('d')),
    ]);
  });
});

describe(render, () => {
  it('works', () => {
    // ARRANGE
    const sut = and(
      expr('a'),
      or(expr('b'), expr('c'), expr('b')),
      and(expr('d'), expr('e'), expr('d')),
      expr('a'),
    );

    // ACT
    const result = render(sut);

    // ASSERT
    expect(result).toEqual('(a && (b || c) && d && e)');
  });
});

describe(UnionUtils, () => {
  describe('getRequiredPropertyHeuristics', () => {
    it('finds a uniquely discriminating property', () => {
      // ARRANGE
      const value = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [property({ name: stringLiteral('a'), value })],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [property({ name: stringLiteral('b'), value })],
      });

      const svc = service({
        types: [type1, type2],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getRequiredPropertyHeuristics(
        complexValue({ typeName: type1.name }),
        [complexValue({ typeName: type2.name })],
      );

      // ASSERT
      expect(result).toEqual([{ kind: 'RequiredProperty', property: 'a' }]);
    });

    it('returns an empty array when no unique required property is found', () => {
      // ARRANGE
      const value = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('b'), value }),
        ],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [
          property({ name: stringLiteral('b'), value }),
          property({ name: stringLiteral('c'), value }),
        ],
      });

      const type3 = type({
        name: stringLiteral('type3'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('c'), value }),
        ],
      });

      const svc = service({
        types: [type1, type2, type3],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getRequiredPropertyHeuristics(
        complexValue({ typeName: type1.name }),
        [
          complexValue({ typeName: type2.name }),
          complexValue({ typeName: type3.name }),
        ],
      );

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('getConstantValueHeuristics', () => {
    it('finds a uniquely discriminating property', () => {
      // ARRANGE
      const string = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [
          property({
            name: stringLiteral('a'),
            value: primitiveValue({
              typeName: primitiveLiteral('string'),
              constant: stringLiteral('CONST_A'),
            }),
          }),
          property({ name: stringLiteral('b'), value: string }),
        ],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [
          property({
            name: stringLiteral('a'),
            value: primitiveValue({
              typeName: primitiveLiteral('string'),
              constant: stringLiteral('CONST_B'),
            }),
          }),
          property({ name: stringLiteral('b'), value: string }),
        ],
      });

      const svc = service({
        types: [type1, type2],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getConstantValueHeuristics(
        complexValue({ typeName: type1.name }),
        [complexValue({ typeName: type2.name })],
      );

      // ASSERT
      expect(result).toEqual([
        {
          kind: 'ConstantValue',
          property: 'a',
          value: 'CONST_A',
        },
      ]);
    });

    it('returns an empty array when no unique required property is found', () => {
      // ARRANGE
      const string = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [
          property({
            name: stringLiteral('a'),
            value: primitiveValue({
              typeName: primitiveLiteral('string'),
              constant: stringLiteral('CONST'),
            }),
          }),
          property({ name: stringLiteral('b'), value: string }),
        ],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [
          property({
            name: stringLiteral('a'),
            value: primitiveValue({
              typeName: primitiveLiteral('string'),
              constant: stringLiteral('CONST'),
            }),
          }),
          property({ name: stringLiteral('b'), value: string }),
        ],
      });

      const svc = service({
        types: [type1, type2],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getConstantValueHeuristics(
        complexValue({ typeName: type1.name }),
        [complexValue({ typeName: type2.name })],
      );

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('getRequiredPropertiesHeuristics', () => {
    it('finds a uniquely distinguishing set of properties', () => {
      // ARRANGE
      const value = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('b'), value }),
          property({ name: stringLiteral('d'), value }),
        ],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [
          property({ name: stringLiteral('b'), value }),
          property({ name: stringLiteral('c'), value }),
          property({ name: stringLiteral('d'), value }),
        ],
      });

      const type3 = type({
        name: stringLiteral('type3'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('c'), value }),
          property({ name: stringLiteral('d'), value }),
        ],
      });

      const svc = service({
        types: [type1, type2, type3],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getRequiredPropertiesHeuristics(
        complexValue({ typeName: type1.name }),
        [
          complexValue({ typeName: type2.name }),
          complexValue({ typeName: type3.name }),
        ],
      );

      // ASSERT
      expect(result).toEqual([
        { kind: 'RequiredProperties', properties: ['a', 'b'] },
      ]);
    });

    it('returns an empty array when no uniquely distinguishing required property set is found', () => {
      // ARRANGE
      const value = primitiveValue({ typeName: primitiveLiteral('string') });

      const type1 = type({
        name: stringLiteral('type1'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('b'), value }),
          property({ name: stringLiteral('c'), value }),
          property({ name: stringLiteral('d'), value }),
        ],
      });

      const type2 = type({
        name: stringLiteral('type2'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('b'), value }),
          property({ name: stringLiteral('c'), value }),
          property({ name: stringLiteral('d'), value }),
        ],
      });

      const type3 = type({
        name: stringLiteral('type3'),
        properties: [
          property({ name: stringLiteral('a'), value }),
          property({ name: stringLiteral('c'), value }),
        ],
      });

      const svc = service({
        types: [type1, type2, type3],
      });

      const sut = new UnionUtils(svc);

      // ACT
      const result = sut.getRequiredPropertiesHeuristics(
        complexValue({ typeName: type1.name }),
        [
          complexValue({ typeName: type2.name }),
          complexValue({ typeName: type3.name }),
        ],
      );

      // ASSERT
      expect(result).toEqual([]);
    });
  });
});

function service(s: Partial<Service>): Service {
  const {
    interfaces,
    types,
    unions,
    enums,
    sourcePaths,
    title,
    majorVersion,
    ...rest
  } = s;

  return {
    kind: 'Service',
    basketry: '0.2',
    title: title ?? stringLiteral('Test Service'),
    majorVersion: majorVersion ?? integerLiteral(1),
    sourcePaths: sourcePaths ?? [],
    interfaces: interfaces ?? [],
    types: types ?? [],
    unions: unions ?? [],
    enums: enums ?? [],
    ...rest,
  };
}

function complexValue(v: Partial<ComplexValue> = {}): ComplexValue {
  const { rules, typeName, ...rest } = v;

  return {
    kind: 'ComplexValue',
    typeName: typeName ?? stringLiteral('Test'),
    rules: rules ?? [],
    ...rest,
  };
}

function primitiveValue(v: Partial<PrimitiveValue> = {}): PrimitiveValue {
  const { rules, typeName, ...rest } = v;

  return {
    kind: 'PrimitiveValue',
    typeName: typeName ?? primitiveLiteral('string'),
    rules: rules ?? [],
    ...rest,
  };
}

function type(t: Partial<Type> = {}): Type {
  const { rules, properties, ...rest } = t;

  return {
    kind: 'Type',
    name: stringLiteral('Test'),
    properties: properties ?? [],
    rules: rules ?? [],
    ...rest,
  };
}

function property(p: Partial<Property> = {}): Property {
  const { name, value, ...rest } = p;

  return {
    kind: 'Property',
    name: name ?? stringLiteral('prop'),
    value: value ?? primitiveValue(),
    ...rest,
  };
}

function integerLiteral(n: number): IntegerLiteral {
  return {
    kind: 'IntegerLiteral',
    value: n,
  };
}

function stringLiteral(s: string): StringLiteral {
  return {
    kind: 'StringLiteral',
    value: s,
  };
}

function primitiveLiteral(p: Primitive): PrimitiveLiteral {
  return {
    kind: 'PrimitiveLiteral',
    value: p,
  };
}
