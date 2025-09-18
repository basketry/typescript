import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.10 Property', () => {
  it('emits TypeScript-idiomatic property names for off-brand casing', async () => {
    // ARRANGE
    const string = factory.primitiveValue({
      typeName: factory.primitiveLiteral('string'),
    });

    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('snake_case_name'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('kebab-case-name'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('PascalCaseName'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('camelCaseName'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('CONSTANT_CASE_NAME'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('lower case name'),
              value: string,
            }),
            factory.property({
              name: factory.stringLiteral('UPPER CASE NAME'),
              value: string,
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
        snakeCaseName: z.string(),
        kebabCaseName: z.string(),
        pascalCaseName: z.string(),
        camelCaseName: z.string(),
        constantCaseName: z.string(),
        lowerCaseName: z.string(),
        upperCaseName: z.string(),
      });
    `);
  });

  it('creates a schema for a primitive property', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('myString'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
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
      `export const MyTypeSchema = z.object({ myString: z.string() });`,
    );
  });

  it('creates a schema for a type property', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('Type1'),
          properties: [
            factory.property({
              name: factory.stringLiteral('a'),
              value: factory.complexValue({
                typeName: factory.stringLiteral('Type2'),
              }),
            }),
          ],
        }),
        factory.type({
          name: factory.stringLiteral('Type2'),
          properties: [
            factory.property({
              name: factory.stringLiteral('b'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
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
      export const Type1Schema = z.object({ a: Type2Schema });
      export const Type2Schema = z.object({ b: z.string() });
    `);
  });

  it('creates a schema for an enum property', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('Type1'),
          properties: [
            factory.property({
              name: factory.stringLiteral('a'),
              value: factory.complexValue({
                typeName: factory.stringLiteral('Enum1'),
              }),
            }),
          ],
        }),
      ],
      enums: [
        factory.enum({
          name: factory.stringLiteral('Enum1'),
          members: [
            factory.enumMember({ content: factory.stringLiteral('MemberA') }),
            factory.enumMember({ content: factory.stringLiteral('MemberB') }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const Type1Schema = z.object({ a: Enum1Schema });
      export const Enum1Schema = z.enum(['MemberA', 'MemberB']);
    `);
  });

  it('creates a schema for a union property', async () => {
    // ARRANGE

    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('Type1'),
          properties: [
            factory.property({
              name: factory.stringLiteral('a'),
              value: factory.complexValue({
                typeName: factory.stringLiteral('Union1'),
              }),
            }),
          ],
        }),
      ],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('Union1'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const Type1Schema = z.object({ a: Union1Schema });
      export const Union1Schema = z.union([ z.string(), z.number() ]);
    `);
  });

  it('creates a lazy schema for a circular reference', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('Type1'),
          properties: [
            factory.property({
              name: factory.stringLiteral('a'),
              value: factory.complexValue({
                typeName: factory.stringLiteral('Type2'),
              }),
            }),
          ],
        }),
        factory.type({
          name: factory.stringLiteral('Type2'),
          properties: [
            factory.property({
              name: factory.stringLiteral('b'),
              value: factory.complexValue({
                typeName: factory.stringLiteral('Type1'),
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
    expect(result[0].contents).toContainAst(`
      export const Type1Schema = z.object({ a: z.lazy(() => Type2Schema) });
      export const Type2Schema = z.object({ b: z.lazy(() => Type1Schema).optional() });
    `);
  });
});
