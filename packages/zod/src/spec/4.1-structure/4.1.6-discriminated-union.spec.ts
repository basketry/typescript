import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.5 Simple Union', () => {
  it('creates a schema for a discriminated union type', async () => {
    // ARRANGE
    const key = factory.property({
      name: factory.stringLiteral('type'),
      value: factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      }),
    });

    const typeA = factory.type({
      name: factory.stringLiteral('TypeA'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('a') }),
        factory.property({ name: factory.stringLiteral('b') }),
      ],
    });
    const typeB = factory.type({
      name: factory.stringLiteral('TypeB'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('c') }),
        factory.property({ name: factory.stringLiteral('d') }),
      ],
    });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.discriminatedUnion({
          name: factory.stringLiteral('MyUnion'),
          discriminator: key.name,
          members: [
            factory.complexValue({ typeName: typeA.name }),
            factory.complexValue({ typeName: typeB.name }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = z.discriminatedUnion('type', [
        TypeASchema,
        TypeBSchema
      ]);
    `);
  });

  it('creates an "alias" when a union only has one member', async () => {
    // ARRANGE
    const key = factory.property({
      name: factory.stringLiteral('type'),
      value: factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      }),
    });

    const typeA = factory.type({
      name: factory.stringLiteral('TypeA'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('a') }),
        factory.property({ name: factory.stringLiteral('b') }),
      ],
    });
    const typeB = factory.type({
      name: factory.stringLiteral('TypeB'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('c') }),
        factory.property({ name: factory.stringLiteral('d') }),
      ],
    });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.discriminatedUnion({
          name: factory.stringLiteral('MyUnion'),
          discriminator: key.name,
          members: [factory.complexValue({ typeName: typeA.name })],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(
      `export const MyUnionSchema = TypeASchema;`,
    );
  });

  it('emits a TypeScript-idiomatic name when the union name is not in PascalCase', async () => {
    // ARRANGE
    const key = factory.property({
      name: factory.stringLiteral('type'),
      value: factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      }),
    });

    const typeA = factory.type({
      name: factory.stringLiteral('TypeA'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('a') }),
        factory.property({ name: factory.stringLiteral('b') }),
      ],
    });
    const typeB = factory.type({
      name: factory.stringLiteral('TypeB'),
      properties: [
        key,
        factory.property({ name: factory.stringLiteral('c') }),
        factory.property({ name: factory.stringLiteral('d') }),
      ],
    });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.discriminatedUnion({
          name: factory.stringLiteral('my union'),
          discriminator: key.name,
          members: [
            factory.complexValue({ typeName: typeA.name }),
            factory.complexValue({ typeName: typeB.name }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = z.discriminatedUnion('type', [
        TypeASchema,
        TypeBSchema
      ]);
    `);
  });
});
