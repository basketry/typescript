import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.3 Type', () => {
  it('creates a schema for a type without properties', async () => {
    // ARRANGE
    const service = factory.service({
      types: [factory.type({ name: factory.stringLiteral('MyType') })],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyTypeSchema = z.record(z.any());
    `);
  });

  it('creates a schema for a type with properties', async () => {
    // ARRANGE
    const string = factory.primitiveValue({
      typeName: factory.primitiveLiteral('string'),
    });
    const integer = factory.primitiveValue({
      typeName: factory.primitiveLiteral('integer'),
    });

    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('propB'),
              value: integer,
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyTypeSchema = z.object({
        propA: z.string(),
        propB: z.number().int(),
      });
    `);
  });

  it('creates a schema for a type with map properties', async () => {
    // ARRANGE
    const string = factory.primitiveValue({
      typeName: factory.primitiveLiteral('string'),
    });

    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          mapProperties: factory.mapProperties({
            key: factory.mapKey({ value: string }),
            value: factory.mapValue({ value: string }),
          }),
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(
      `export const MyTypeSchema = z.record(z.string());`,
    );
  });

  it('creates a schema for a type with properties and map properties', async () => {
    // ARRANGE
    const string = factory.primitiveValue({
      typeName: factory.primitiveLiteral('string'),
    });
    const integer = factory.primitiveValue({
      typeName: factory.primitiveLiteral('integer'),
    });

    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('propB'),
              value: integer,
            }),
          ],
          mapProperties: factory.mapProperties({
            key: factory.mapKey({ value: string }),
            value: factory.mapValue({ value: string }),
          }),
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyTypeSchema = z.object({
        propA: z.string(),
        propB: z.number().int(),
      }).catchall(z.string());
    `);
  });

  it('emits a TypeScript-idiomatic name when the type name is not in PascalCase', async () => {
    // ARRANGE
    const service = factory.service({
      types: [factory.type({ name: factory.stringLiteral('my type') })],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyTypeSchema = z.record(z.any());
    `);
  });
});
