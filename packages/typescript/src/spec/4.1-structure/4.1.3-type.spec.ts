import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.3 Type', () => {
  describe('name', () => {
    it('creates a type without properties', async () => {
      // ARRANGE
      const service = ir.service({
        types: [ir.type({ name: ir.stringLiteral('Widget') })],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type Widget = Record<string, unknown>;
      `);
    });

    it('emits types in alphabetical order', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({ name: ir.stringLiteral('TypeB') }),
          ir.type({ name: ir.stringLiteral('TypeA') }),
          ir.type({ name: ir.stringLiteral('TypeC') }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type TypeA = Record<string, unknown>;
      `);

      expect(result[0].contents).toContainAst(`
        export type TypeB = Record<string, unknown>;
      `);

      expect(result[0].contents).toContainAst(`
        export type TypeC = Record<string, unknown>;
      `);

      const alphaIndex = result[0].contents.indexOf(
        'export type TypeA = Record<string, unknown>;',
      );
      const betaIndex = result[0].contents.indexOf(
        'export type TypeB = Record<string, unknown>;',
      );
      const gammaIndex = result[0].contents.indexOf(
        'export type TypeC = Record<string, unknown>;',
      );

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(gammaIndex);
    });

    it('always uses PascalCase for type names', async () => {
      // ARRANGE
      const service = ir.service({
        types: [ir.type({ name: ir.stringLiteral('SOME_TYPE_NAME') })],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeTypeName = Record<string, unknown>;
      `);
    });
  });

  describe('description', () => {
    it('creates an type with a single-line description', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('Widget'),
            description: [ir.stringLiteral('A widget type')],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** A widget type */
        export type Widget = Record<string, unknown>;
      `);
    });

    it('creates an type with a multi-line description', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('Widget'),
            description: [
              ir.stringLiteral('A widget type'),
              ir.stringLiteral('Line two of the description.'),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A widget type
         *
         * Line two of the description.
         */
        export type Widget = Record<string, unknown>;
      `);
    });

    it('breaks long descriptions into multiple lines', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('Widget'),
            description: [
              ir.stringLiteral(
                'A widget type with a very long description that exceeds the typical maximum line length of eighty characters to ensure that the generator correctly breaks the description into multiple lines.',
              ),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A widget type with a very long description that exceeds the typical maximum line
         * length of eighty characters to ensure that the generator correctly breaks the
         * description into multiple lines.
         */
        export type Widget = Record<string, unknown>;
      `);
    });
  });

  describe('deprecated', () => {
    it('creates an type marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('widget'),
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** @deprecated */
        export type Widget = Record<string, unknown>;
      `);
    });

    it('creates an type with a description marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        types: [
          ir.type({
            name: ir.stringLiteral('widget'),
            description: [ir.stringLiteral('A widget type')],
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A widget type
         *
         * @deprecated
         */
        export type Widget = Record<string, unknown>;
      `);
    });
  });
});
