import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import {
  MemberValue,
  Parameter,
  Primitive,
  PrimitiveValueConstant,
  Property,
} from 'basketry';

const ir = new Factory();

describe('4.1.12 Primitive Value', () => {
  const typeMap: [Primitive, string][] = [
    ['binary', 'Blob'],
    ['boolean', 'boolean'],
    ['date', 'Date'],
    ['date-time', 'Date'],
    ['double', 'number'],
    ['float', 'number'],
    ['integer', 'number'],
    ['long', 'number'],
    ['number', 'number'],
    ['string', 'string'],
    ['untyped', 'any'],
  ];

  describe('typeName', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` as `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType};
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits `%s` as `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({ typeName: ir.primitiveLiteral(primitive) }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}>;
          `);
        },
      );
    });
  });

  describe('isArray', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as a `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType}[];
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` as a `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType}[];
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits `%s` as a `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isArray: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}[]>;
          `);
        },
      );
    });
  });

  describe('isNullable', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits nullable `%s` as a union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE

          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits nullable `%s` as a union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE

          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits nullable `%s` as a union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isNullable: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType} | null>;
          `);
        },
      );
    });
  });

  describe('isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits optional `%s` as an optional property of type `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp?: ${expectedType};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits optional `%s` as an optional parameter of type `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam?: ${expectedType};
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits optional `%s` as type `%s`',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isOptional: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}>;
          `);
        },
      );
    });
  });

  describe('isArray and isNullable', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as a union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType}[] | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` param type as a union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType}[] | null;
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits `%s` as a union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isArray: ir.trueLiteral(),
              isNullable: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}[] | null>;
          `);
        },
      );
    });
  });

  describe('isArray and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as an optional `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp?: ${expectedType}[];
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` as an optional `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam?: ${expectedType}[];
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits `%s` as a `%s` array',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isArray: ir.trueLiteral(),
              isOptional: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}[]>;
          `);
        },
      );
    });
  });

  describe('isNullable and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as an optional union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp?: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` as an optional union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam?: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits nullable `%s` as a union of `%s` and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isNullable: ir.trueLiteral(),
              isOptional: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType} | null>;
          `);
        },
      );
    });
  });

  describe('isArray and isNullable and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits `%s` as an optional union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp?: ${expectedType}[] | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits `%s` as an optional union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam?: ${expectedType}[] | null;
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(typeMap)(
        'emits `%s` as a union of `%s` array and null',
        async (primitive, expectedType) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              isArray: ir.trueLiteral(),
              isNullable: ir.trueLiteral(),
              isOptional: ir.trueLiteral(),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedType}[] | null>;
          `);
        },
      );
    });
  });

  describe('constant', () => {
    const constantTypeMap: [Primitive, PrimitiveValueConstant, string][] = [
      ['boolean', ir.booleanLiteral(true), 'true'],
      ['double', ir.numberLiteral(3.14), '3.14'],
      ['float', ir.numberLiteral(2.71), '2.71'],
      ['integer', ir.numberLiteral(42), '42'],
      ['long', ir.numberLiteral(999), '999'],
      ['number', ir.numberLiteral(123), '123'],
      ['string', ir.stringLiteral('test'), "'test'"],
    ];

    describe('property', () => {
      it.each(constantTypeMap)(
        'emits `%s` with constant value %p as `%s`',
        async (primitive, constant, expectedValue) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                constant,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedValue};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(constantTypeMap)(
        'emits `%s` with constant value %p as `%s`',
        async (primitive, constant, expectedValue) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                constant,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedValue};
            }
          `);
        },
      );
    });

    describe('map property value', () => {
      it.each(constantTypeMap)(
        'emits `%s` with constant value %p as `%s`',
        async (primitive, constant, expectedValue) => {
          // ARRANGE
          const service = mapSut(
            ir.primitiveValue({
              typeName: ir.primitiveLiteral(primitive),
              constant,
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = Record<string, ${expectedValue}>;
          `);
        },
      );
    });
  });

  describe('default', () => {
    const defaultTypeMap: [Primitive, string, PrimitiveValueConstant][] = [
      ['boolean', 'boolean', ir.booleanLiteral(true)],
      ['double', 'number', ir.numberLiteral(3.14)],
      ['float', 'number', ir.numberLiteral(2.71)],
      ['integer', 'number', ir.numberLiteral(42)],
      ['long', 'number', ir.numberLiteral(999)],
      ['number', 'number', ir.numberLiteral(123)],
      ['string', 'string', ir.stringLiteral('test')],
    ];

    describe('property', () => {
      it.each(defaultTypeMap)(
        'emits `%s` as a required `%s`',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(defaultTypeMap)(
        'emits `%s` as a required `%s`',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType};
            }
          `);
        },
      );
    });
  });

  describe('default and isNullable', () => {
    const defaultTypeMap: [Primitive, string, PrimitiveValueConstant][] = [
      ['boolean', 'boolean', ir.booleanLiteral(true)],
      ['double', 'number', ir.numberLiteral(3.14)],
      ['float', 'number', ir.numberLiteral(2.71)],
      ['integer', 'number', ir.numberLiteral(42)],
      ['long', 'number', ir.numberLiteral(999)],
      ['number', 'number', ir.numberLiteral(123)],
      ['string', 'string', ir.stringLiteral('test')],
    ];

    describe('property', () => {
      it.each(defaultTypeMap)(
        'emits `%s` prop type as a required union of `%s` and null',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(defaultTypeMap)(
        'emits `%s` param type as a required union of `%s` and null',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType} | null;
            }
          `);
        },
      );
    });
  });

  // TODO: fix and enable these tests
  // https://github.com/basketry/typescript/issues/44
  describe.skip('default and isOptional', () => {
    const defaultTypeMap: [Primitive, string, PrimitiveValueConstant][] = [
      ['boolean', 'boolean', ir.booleanLiteral(true)],
      ['double', 'number', ir.numberLiteral(3.14)],
      ['float', 'number', ir.numberLiteral(2.71)],
      ['integer', 'number', ir.numberLiteral(42)],
      ['long', 'number', ir.numberLiteral(999)],
      ['number', 'number', ir.numberLiteral(123)],
      ['string', 'string', ir.stringLiteral('test')],
    ];

    describe('property', () => {
      it.each(defaultTypeMap)(
        'emits `%s` as a required `%s`',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isOptional: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(defaultTypeMap)(
        'emits `%s` param type as a required `%s`',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isOptional: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType};
            }
          `);
        },
      );
    });
  });

  // TODO: fix and enable these tests
  // https://github.com/basketry/typescript/issues/44
  describe.skip('default and isNullable as isOptional', () => {
    const defaultTypeMap: [Primitive, string, PrimitiveValueConstant][] = [
      ['boolean', 'boolean', ir.booleanLiteral(true)],
      ['double', 'number', ir.numberLiteral(3.14)],
      ['float', 'number', ir.numberLiteral(2.71)],
      ['integer', 'number', ir.numberLiteral(42)],
      ['long', 'number', ir.numberLiteral(999)],
      ['number', 'number', ir.numberLiteral(123)],
      ['string', 'string', ir.stringLiteral('test')],
    ];

    describe('property', () => {
      it.each(defaultTypeMap)(
        'emits `%s` prop type as a required union of `%s` and null',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType {
              myProp: ${expectedType} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(defaultTypeMap)(
        'emits `%s` param type as a required union of `%s` and null',
        async (primitive, expectedType, value) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.primitiveValue({
                typeName: ir.primitiveLiteral(primitive),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
                default: value,
              }),
            }),
          );

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams {
              myParam: ${expectedType} | null;
            }
          `);
        },
      );
    });
  });
});

function propSut(...properties: Property[]) {
  return ir.service({
    types: [
      ir.type({
        name: ir.stringLiteral('PrimitiveType'),
        properties,
      }),
    ],
  });
}

function mapSut(value: MemberValue) {
  return ir.service({
    types: [
      ir.type({
        name: ir.stringLiteral('PrimitiveType'),
        mapProperties: ir.mapProperties({
          key: ir.mapKey({
            value: ir.primitiveValue({
              typeName: ir.primitiveLiteral('string'),
            }),
          }),
          value: ir.mapValue({ value }),
        }),
      }),
    ],
  });
}

function paramSut(...parameters: Parameter[]) {
  return ir.service({
    interfaces: [
      ir.interface({
        name: ir.stringLiteral('Widgets'),
        methods: [
          ir.method({
            name: ir.stringLiteral('listWidgets'),
            parameters,
          }),
        ],
      }),
    ],
  });
}
