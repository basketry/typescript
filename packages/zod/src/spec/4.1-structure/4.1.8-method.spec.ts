import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.8 Method', () => {
  it('does not emit a params type for a method with no parameters', async () => {
    // ARRANGE
    const service = factory.service({
      interfaces: [
        factory.interface({
          methods: [
            factory.method({ name: factory.stringLiteral('myMethod') }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).not.toContain('MyMethodParamsSchema');
  });

  it('emits a params type for a method with parameters', async () => {
    // ARRANGE
    const service = factory.service({
      interfaces: [
        factory.interface({
          methods: [
            factory.method({
              name: factory.stringLiteral('myMethod'),
              parameters: [
                factory.parameter({
                  name: factory.stringLiteral('param1'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral('string'),
                  }),
                }),
                factory.parameter({
                  name: factory.stringLiteral('param2'),
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral('integer'),
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
      export const MyMethodParamsSchema = z.object({
        param1: z.string(),
        param2: z.number().int(),
      });
    `);
  });
});
