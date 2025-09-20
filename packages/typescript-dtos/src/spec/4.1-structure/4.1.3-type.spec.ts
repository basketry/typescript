import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import { roles, types, withReturnType } from '../utils';

const factory = new Factory();

describe('4.1.3 Type', () => {
  describe.each(roles)('when role includes %s', (role) => {
    it('creates a DTO type for a type without properties', async () => {
      // ARRANGE
      const service = factory.service({
        interfaces: [withReturnType(factory, 'MyType')],
        types: [factory.type({ name: factory.stringLiteral('MyType') })],
      });

      // ACT
      const result = await generator(service, { dtos: { role } });

      // ASSERT
      expect(types(result)).toContainAst(`
      /** The over-the-wire representation of the {@link types.MyType|MyType} type. */
      export type MyTypeDto = Record<string, unknown>;
    `);
    });

    it('creates a DTO type for a type with properties', async () => {
      // ARRANGE
      const string = factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      });
      const integer = factory.primitiveValue({
        typeName: factory.primitiveLiteral('integer'),
      });

      const service = factory.service({
        interfaces: [withReturnType(factory, 'MyType')],
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: string,
              }),
              factory.property({
                name: factory.stringLiteral('propB'),
                value: integer,
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service, { dtos: { role } });

      // ASSERT
      expect(types(result)).toContainAst(`
      /** The over-the-wire representation of the {@link types.MyType|MyType} type. */
      export type MyTypeDto = {
        propA: string;
        propB: number;
      };
    `);
    });

    it('creates a DTO type for a type with map properties', async () => {
      // ARRANGE
      const string = factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      });

      const service = factory.service({
        interfaces: [withReturnType(factory, 'MyType')],
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            mapProperties: factory.mapProperties({
              key: factory.mapKey({ value: string }),
              value: factory.mapValue({ value: string }),
            }),
          }),
        ],
      });

      // ACT
      const result = await generator(service, { dtos: { role } });

      // ASSERT
      expect(result[0].contents).toContainAst(`
      /** The over-the-wire representation of the {@link types.MyType|MyType} type. */
      export type MyTypeDto = Record<string, string>;
    `);
    });

    it('creates a DTO type for a type with properties and map properties', async () => {
      // ARRANGE
      const string = factory.primitiveValue({
        typeName: factory.primitiveLiteral('string'),
      });
      const integer = factory.primitiveValue({
        typeName: factory.primitiveLiteral('integer'),
      });

      const service = factory.service({
        interfaces: [withReturnType(factory, 'MyType')],
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: string,
              }),
              factory.property({
                name: factory.stringLiteral('propB'),
                value: integer,
              }),
            ],
            mapProperties: factory.mapProperties({
              key: factory.mapKey({ value: string }),
              value: factory.mapValue({ value: string }),
            }),
          }),
        ],
      });

      // ACT
      const result = await generator(service, { dtos: { role } });

      // ASSERT
      expect(result[0].contents).toContainAst(`
      /** The over-the-wire representation of the {@link types.MyType|MyType} type. */
      export type MyTypeDto = {
        propA: string;
        propB: number;
      } & Record<string, number | string>;
    `);
    });

    it('emits a TypeScript-idiomatic name when the type name is not in PascalCase', async () => {
      // ARRANGE
      const service = factory.service({
        interfaces: [withReturnType(factory, 'my type')],
        types: [factory.type({ name: factory.stringLiteral('my type') })],
      });

      // ACT
      const result = await generator(service, { dtos: { role } });

      // ASSERT
      expect(result[0].contents).toContainAst(`
      /** The over-the-wire representation of the {@link types.MyType|MyType} type. */
      export type MyTypeDto = Record<string, unknown>;
    `);
    });
  });
});
