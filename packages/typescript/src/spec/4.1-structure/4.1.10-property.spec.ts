import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.10 Property', () => {
  describe('name', () => {
    it('creates a property', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeType {
          myProp: string;
        }
      `);
    });

    it('always uses camelCase for property names', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('SOME_PROP_NAME'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeType {
          somePropName: string;
        }
      `);
    });
  });

  describe('description', () => {
    it('creates a single-line description', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                description: [ir.stringLiteral('A property description')],
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeType {
          /** A property description */
          myProp: string;
        }
      `);
    });

    it('creates a multi-line description', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                description: [
                  ir.stringLiteral('A property description'),
                  ir.stringLiteral('Line two of the description.'),
                ],
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT

      expect(result[0].contents).toContainAst(`
        export type SomeType {
          /**
           * A property description
           * 
           * Line two of the description.
           */
          myProp: string;
        }
      `);
    });

    it('breaks long descriptions into multiple lines', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                description: [
                  ir.stringLiteral(
                    'A widget type with a very long description that exceeds the typical maximum line length of eighty characters to ensure that the generator correctly breaks the description into multiple lines.',
                  ),
                ],
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeType = {
          /**
           * A widget type with a very long description that exceeds the typical maximum line
           * length of eighty characters to ensure that the generator correctly breaks the
           * description into multiple lines.
           */
          myProp: string;
        };
      `);
    });
  });

  describe('deprecated', () => {
    it('creates a property marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
                deprecated: ir.trueLiteral(),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT

      expect(result[0].contents).toContainAst(`
        export type SomeType {
          /** @deprecated */
          myProp: string;
        }
      `);
    });

    it('creates a property with a description marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('SomeType'),
            properties: [
              ir.property({
                name: ir.stringLiteral('myProp'),
                description: [ir.stringLiteral('A property description')],
                value: ir.primitiveValue({
                  typeName: ir.primitiveLiteral('string'),
                }),
                deprecated: ir.trueLiteral(),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT

      expect(result[0].contents).toContainAst(`
        export type SomeType {
          /**
           * A property description
           * 
           * @deprecated
           */
          myProp: string;
        }
      `);
    });
  });
});
