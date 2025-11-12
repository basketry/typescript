import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import { Primitive } from '@basketry/ir';

const ir = new Factory();

describe('4.1.11 Map Properties', () => {
  describe('key', () => {
    const typeMap: [Primitive, string][] = [
      ['double', 'number'],
      ['float', 'number'],
      ['integer', 'number'],
      ['long', 'number'],
      ['number', 'number'],
      ['string', 'string'],
    ];

    it.each(typeMap)(
      'A type of `%s` is emitted as a `%s` key',
      async (keyType, expectedKey) => {
        // ARRANGE
        const service = ir.service({
          types: [
            ir.type({
              name: ir.stringLiteral('SomeType'),
              mapProperties: ir.mapProperties({
                key: ir.mapKey({
                  value: ir.primitiveValue({
                    typeName: ir.primitiveLiteral(keyType),
                  }),
                }),
                value: ir.mapValue({
                  value: ir.primitiveValue({
                    typeName: ir.primitiveLiteral('string'),
                  }),
                }),
              }),
            }),
          ],
        });

        // ACT
        const result = await generator(service);

        // ASSERT
        expect(result[0].contents).toContainAst(`
          export type SomeType = Record<${expectedKey}, string>;
        `);
      },
    );

    it('emits a partial record when an enum is used as the key type', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            mapProperties: ir.mapProperties({
              key: ir.mapKey({
                value: ir.complexValue({
                  typeName: ir.stringLiteral('SomeEnum'),
                }),
              }),
              value: ir.mapValue({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            }),
          }),
        ],
        enums: [
          ir.enum({
            name: ir.stringLiteral('SomeEnum'),
            members: [
              ir.enumMember({ content: ir.stringLiteral('A') }),
              ir.enumMember({ content: ir.stringLiteral('B') }),
              ir.enumMember({ content: ir.stringLiteral('C') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeType = Partial<Record<SomeEnum, string>>;
      `);
    });
  });

  describe('requiredKeys', () => {
    it('emits a defined property for each required key', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            mapProperties: ir.mapProperties({
              key: ir.mapKey({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
              requiredKeys: [
                ir.stringLiteral('requiredKey1'),
                ir.stringLiteral('requiredKey2'),
              ],
              value: ir.mapValue({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            }),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
          export type SomeType = {
            requiredKey1: string;
            requiredKey2: string;
          } & Record<string, string>;
        `);
    });

    it('emits only defined properties if the number of required keys is equal to the max property rule', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            mapProperties: ir.mapProperties({
              key: ir.mapKey({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
              requiredKeys: [
                ir.stringLiteral('requiredKey1'),
                ir.stringLiteral('requiredKey2'),
              ],
              value: ir.mapValue({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            }),
            rules: [ir.objectMaxPropertiesRule(2)],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
          export type SomeType = {
            requiredKey1: string;
            requiredKey2: string;
          };
        `);
    });

    it('emits only defined properties if the combined number of required keys and defined properties is equal to the max property rule', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('definedProp'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
            mapProperties: ir.mapProperties({
              key: ir.mapKey({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
              requiredKeys: [
                ir.stringLiteral('requiredKey1'),
                ir.stringLiteral('requiredKey2'),
              ],
              value: ir.mapValue({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            }),
            rules: [ir.objectMaxPropertiesRule(3)],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
          export type SomeType = {
            definedProp: string;
            requiredKey1: string;
            requiredKey2: string;
          };
        `);
    });

    it('emits only defined properties if the number of defined properties is equal to the max property rule', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('definedProp1'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
              ir.property({
                name: ir.stringLiteral('definedProp2'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
            mapProperties: ir.mapProperties({
              key: ir.mapKey({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
              value: ir.mapValue({
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            }),
            rules: [ir.objectMaxPropertiesRule(2)],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
          export type SomeType = {
            definedProp1: string;
            definedProp2: string;
          };
        `);
    });
  });
});
