import * as IR from '@basketry/ir';
import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.13 Primitive Value', () => {
  describe('typeName', () => {
    const schemaByPrimitive: [IR.Primitive, string][] = [
      ['string', 'z.string()'],
      ['number', 'z.number()'],
      ['boolean', 'z.boolean()'],
      ['integer', 'z.number().int()'],
      ['long', 'z.number().int()'],
      ['float', 'z.number()'],
      ['double', 'z.number()'],
      ['date', 'z.coerce.date()'],
      ['date-time', 'z.coerce.date()'],
      ['null', 'z.literal(null)'],
      ['binary', 'z.any()'],
      ['untyped', 'z.any()'],
    ];

    it.each(schemaByPrimitive)(
      'creates a schema for a %s primitive value',
      async (primitive, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('isArray', () => {
    const schemaByPrimitive: [IR.Primitive, string][] = [
      ['string', 'z.string().array()'],
      ['number', 'z.number().array()'],
      ['boolean', 'z.boolean().array()'],
      ['integer', 'z.number().int().array()'],
      ['long', 'z.number().int().array()'],
      ['float', 'z.number().array()'],
      ['double', 'z.number().array()'],
      ['date', 'z.coerce.date().array()'],
      ['date-time', 'z.coerce.date().array()'],
      ['null', 'z.literal(null).array()'],
      ['binary', 'z.any().array()'],
      ['untyped', 'z.any().array()'],
    ];

    it.each(schemaByPrimitive)(
      'creates a schema for a %s primitive array',
      async (primitive, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                    isArray: factory.trueLiteral(),
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('isNullable', () => {
    const schemaByPrimitive: [IR.Primitive, string][] = [
      ['string', 'z.string().nullable()'],
      ['number', 'z.number().nullable()'],
      ['boolean', 'z.boolean().nullable()'],
      ['integer', 'z.number().int().nullable()'],
      ['long', 'z.number().int().nullable()'],
      ['float', 'z.number().nullable()'],
      ['double', 'z.number().nullable()'],
      ['date', 'z.coerce.date().nullable()'],
      ['date-time', 'z.coerce.date().nullable()'],
      ['null', 'z.literal(null).nullable()'],
      ['binary', 'z.any().nullable()'],
      ['untyped', 'z.any().nullable()'],
    ];

    it.each(schemaByPrimitive)(
      'creates a schema for a nullable %s primitive value',
      async (primitive, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                    isNullable: factory.trueLiteral(),
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('isOptional', () => {
    const schemaByPrimitive: [IR.Primitive, string][] = [
      ['string', 'z.string().optional()'],
      ['number', 'z.number().optional()'],
      ['boolean', 'z.boolean().optional()'],
      ['integer', 'z.number().int().optional()'],
      ['long', 'z.number().int().optional()'],
      ['float', 'z.number().optional()'],
      ['double', 'z.number().optional()'],
      ['date', 'z.coerce.date().optional()'],
      ['date-time', 'z.coerce.date().optional()'],
      ['null', 'z.literal(null).optional()'],
      ['binary', 'z.any().optional()'],
      ['untyped', 'z.any().optional()'],
    ];

    it.each(schemaByPrimitive)(
      'creates a schema for an optional %s primitive value',
      async (primitive, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                    isOptional: factory.trueLiteral(),
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('constant', () => {
    const constantAndSchemaByPrimitive: [
      IR.Primitive,
      IR.PrimitiveValueDefault,
      string,
    ][] = [
      ['string', factory.stringLiteral('my str'), 'z.literal("my str")'],
      ['number', factory.numberLiteral(123.45), 'z.literal(123.45)'],
      ['boolean', factory.booleanLiteral(true), 'z.literal(true)'],
      ['integer', factory.numberLiteral(67), 'z.literal(67)'],
      [
        'long',
        factory.numberLiteral(38467534867534),
        'z.literal(38467534867534)',
      ],
      [
        'float',
        factory.numberLiteral(8742254.23434),
        'z.literal(8742254.23434)',
      ],
      ['double', factory.numberLiteral(123.456789), 'z.literal(123.456789)'],
      ['null', factory.nullLiteral(), 'z.literal(null)'],
    ];

    it.each(constantAndSchemaByPrimitive)(
      'creates a schema for a %s primitive with a constant value',
      async (primitive, constant, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                    constant,
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('default', () => {
    const defaultAndSchemaByPrimitive: [
      IR.Primitive,
      IR.PrimitiveValueDefault,
      string,
    ][] = [
      [
        'string',
        factory.stringLiteral('my str'),
        'z.string().default("my str")',
      ],
      ['number', factory.numberLiteral(123.45), 'z.number().default(123.45)'],
      ['boolean', factory.booleanLiteral(true), 'z.boolean().default(true)'],
      ['integer', factory.numberLiteral(67), 'z.number().int().default(67)'],
      [
        'long',
        factory.numberLiteral(38467534867534),
        'z.number().int().default(38467534867534)',
      ],
      [
        'float',
        factory.numberLiteral(8742254.23434),
        'z.number().default(8742254.23434)',
      ],
      [
        'double',
        factory.numberLiteral(123.456789),
        'z.number().default(123.456789)',
      ],
      ['null', factory.nullLiteral(), 'z.literal(null)'],
    ];

    it.each(defaultAndSchemaByPrimitive)(
      'creates a schema for a %s primitive with a default value',
      async (primitive, value, expected) => {
        // ARRANGE
        const service = factory.service({
          types: [
            factory.type({
              name: factory.stringLiteral('MyType'),
              properties: [
                factory.property({
                  name: factory.stringLiteral('propA'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral(primitive),
                    default: value,
                  }),
                }),
              ],
            }),
          ],
        });

        // ACT
        const result = await schemaGenerator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(
          `export const MyTypeSchema = z.object({ propA: ${expected} });`,
        );
      },
    );
  });

  describe('misc', () => {
    it('build schema with correct order of operations', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('integer'),
                  isArray: factory.trueLiteral(),
                  isOptional: factory.trueLiteral(),
                  isNullable: factory.trueLiteral(),
                  rules: [
                    factory.numberGteRule(43),
                    factory.numberLtRule(100),
                    factory.arrayMaxItemsRule(10),
                  ],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export const MyTypeSchema = z.object({ propA:
        z.number()
          .int()
          .gte(43)
          .lt(100)
          .array()
          .max(10)
          .nullable()
          .optional()
        });
      `);
    });
  });
});
