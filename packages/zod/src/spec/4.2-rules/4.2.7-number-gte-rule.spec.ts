import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.2.7 NumberGteRule', () => {
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
                rules: [factory.numberGteRule(42)],
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
      `export const MyTypeSchema = z.object({propA: z.number().gte(42)});`,
    );
  });

  it('applies the `nonnegative` rule if a "greater than or equal" value of 0 is specified', async () => {
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
                rules: [factory.numberGteRule(0)],
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
      `export const MyTypeSchema = z.object({propA: z.number().nonnegative()});`,
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
                rules: [factory.numberGteRule(42)],
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
      `export const MyTypeSchema = z.object({propA: z.number().gte(42).optional()});`,
    );
  });
});
