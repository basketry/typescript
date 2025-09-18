import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.2.3 StringPatternRule', () => {
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
                rules: [factory.stringPatternRule('^[a-z]+$')],
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
      `export const MyTypeSchema = z.object({propA: z.string().regex(/^[a-z]+$/)});`,
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
                rules: [factory.stringPatternRule('^[a-z]+$')],
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
      `export const MyTypeSchema = z.object({propA: z.string().regex(/^[a-z]+$/).optional()});`,
    );
  });
});
