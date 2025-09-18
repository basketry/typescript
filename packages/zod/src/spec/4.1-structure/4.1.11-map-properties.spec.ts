import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.11 MapProperties', () => {
  it('works with basic map properties', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          mapProperties: factory.mapProperties({
            key: factory.mapKey({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
            value: factory.mapValue({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
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

  it('works with required map keys', async () => {
    // ARRANGE
    const service = factory.service({
      types: [
        factory.type({
          name: factory.stringLiteral('MyType'),
          mapProperties: factory.mapProperties({
            key: factory.mapKey({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
            requiredKeys: [factory.stringLiteral('propA')],
            value: factory.mapValue({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
          }),
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(
      `export const MyTypeSchema = z.object({ propA: z.string() }).catchall(z.string());`,
    );
  });

  it('works with mixed properties', async () => {
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
              }),
            }),
          ],
          mapProperties: factory.mapProperties({
            key: factory.mapKey({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
            requiredKeys: [factory.stringLiteral('propB')],
            value: factory.mapValue({
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
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
        propB: z.string(),
      }).catchall(z.string());`);
  });
});
