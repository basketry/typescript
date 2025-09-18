import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.2.8 NumberLtRule', () => {
  it('applies the rule to a required property', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('number'),
                rules: [factory.numberLtRule(1337)],
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
      `export const MyTypeSchema = z.object({propA: z.number().lt(1337)});`,
    );
  });

  it('applies the `negative` rule if a "less than" value of 0 is specified', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('number'),
                rules: [factory.numberLtRule(0)],
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
      `export const MyTypeSchema = z.object({propA: z.number().negative()});`,
    );
  });

  it('applies the rule to an optional property', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('number'),
                isOptional: factory.trueLiteral(),
                rules: [factory.numberLtRule(1337)],
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
      `export const MyTypeSchema = z.object({propA: z.number().lt(1337).optional()});`,
    );
  });
});
