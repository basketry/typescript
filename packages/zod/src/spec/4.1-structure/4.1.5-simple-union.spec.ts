import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.5 Simple Union', () => {
  it('allows for complex types to be members of a union', async () => {
    // ARRANGE
    const typeA = factory.type({ name: factory.stringLiteral('TypeA') });
    const typeB = factory.type({ name: factory.stringLiteral('TypeB') });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
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
    expect(result[0].contents).toContainAst(
      `export const MyUnionSchema = z.union([TypeASchema, TypeBSchema]);`,
    );
  });

  it('allows for complex type arrays to be members of a union', async () => {
    // ARRANGE
    const typeA = factory.type({ name: factory.stringLiteral('TypeA') });
    const typeB = factory.type({ name: factory.stringLiteral('TypeB') });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.complexValue({
              typeName: typeA.name,
              isArray: factory.trueLiteral(),
            }),
            factory.complexValue({ typeName: typeB.name }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(
      `export const MyUnionSchema = z.union([TypeASchema.array(), TypeBSchema]);`,
    );
  });

  it('allows for primitive types to be members of a union', async () => {
    // ARRANGE
    const service = factory.service({
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('boolean'),
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = z.union([
        z.string(),
        z.number(),
        z.boolean(),
      ]);
    `);
  });

  it('allows for primitive type arrays to be members of a union', async () => {
    // ARRANGE
    const service = factory.service({
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
              isArray: factory.trueLiteral(),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('boolean'),
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = z.union([
        z.string().array(),
        z.number(),
        z.boolean(),
      ]);
    `);
  });

  it('allows for mixed types to be members of a union', async () => {
    // ARRANGE
    const typeA = factory.type({ name: factory.stringLiteral('TypeA') });
    const typeB = factory.type({ name: factory.stringLiteral('TypeB') });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.complexValue({ typeName: typeA.name }),
            factory.complexValue({ typeName: typeB.name }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('boolean'),
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = z.union([
        TypeASchema,
        TypeBSchema,
        z.string(),
        z.number(),
        z.boolean(),
      ]);
    `);
  });

  it('creates an "alias" when a union only has one member', async () => {
    // ARRANGE
    const typeA = factory.type({ name: factory.stringLiteral('TypeA') });
    const typeB = factory.type({ name: factory.stringLiteral('TypeB') });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [factory.complexValue({ typeName: typeA.name })],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyUnionSchema = TypeASchema;
    `);
  });

  it('emits a TypeScript-idiomatic name when the union name is not in PascalCase', async () => {
    // ARRANGE
    const typeA = factory.type({ name: factory.stringLiteral('TypeA') });
    const typeB = factory.type({ name: factory.stringLiteral('TypeB') });

    const service = factory.service({
      types: [typeA, typeB],
      unions: [
        factory.simpleUnion({
          name: factory.stringLiteral('my union'),
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
    expect(result[0].contents).toContainAst(
      `export const MyUnionSchema = z.union([TypeASchema, TypeBSchema]);`,
    );
  });
});
