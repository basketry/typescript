import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.2.11 ArrayMinItemsRule', () => {
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
                typeName: factory.primitiveLiteral('string'),
                isArray: factory.trueLiteral(),
                rules: [factory.arrayMinItemsRule(5)],
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
      `export const MyTypeSchema = z.object({propA: z.string().array().min(5)});`,
    );
  });

  it('applies the `nonempty` rule if a value of 1 is specified', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
                isArray: factory.trueLiteral(),
                rules: [factory.arrayMinItemsRule(1)],
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
      `export const MyTypeSchema = z.object({propA: z.string().array().nonempty()});`,
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
                typeName: factory.primitiveLiteral('string'),
                isOptional: factory.trueLiteral(),
                isArray: factory.trueLiteral(),
                rules: [factory.arrayMinItemsRule(5)],
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
      `export const MyTypeSchema = z.object({propA: z.string().array().min(5).optional()});`,
    );
  });
});
