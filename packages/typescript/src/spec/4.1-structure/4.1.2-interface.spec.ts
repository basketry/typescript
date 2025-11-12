import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import { NamespacedTypescriptOptions } from '../../types';

const ir = new Factory();

describe('4.1.2 Interface', () => {
  describe('name', () => {
    it('creates a name with the format NameService', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {}
      `);
    });

    it('preserves plurality', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widget'),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetService {}
      `);
    });

    it('supports optional nomenclature', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widget'),
          }),
        ],
      });

      const options: NamespacedTypescriptOptions = {
        typescript: {
          interfaceNomenclature: 'Interface',
        },
      };

      // ACT
      const result = await generator(service, options);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetInterface {}
      `);
    });

    it('emits interfaces in alphabetical order', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({ name: ir.stringLiteral('Beta') }),
          ir.interface({ name: ir.stringLiteral('Alpha') }),
          ir.interface({ name: ir.stringLiteral('Gamma') }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface AlphaService {}
      `);

      expect(result[0].contents).toContainAst(`
        export interface BetaService {}
      `);

      expect(result[0].contents).toContainAst(`
        export interface GammaService {}
      `);

      const alphaIndex = result[0].contents.indexOf(
        'export interface AlphaService {}',
      );
      const betaIndex = result[0].contents.indexOf(
        'export interface BetaService {}',
      );
      const gammaIndex = result[0].contents.indexOf(
        'export interface GammaService {}',
      );

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(gammaIndex);
    });
  });

  describe('description', () => {
    it('creates an interface with a single-line description', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widget'),
            description: [ir.stringLiteral('A widget interface')],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** A widget interface */
        export interface WidgetService {}
      `);
    });

    it('creates an interface with a multi-line description', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widget'),
            description: [
              ir.stringLiteral('A widget interface'),
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
         * A widget interface
         *
         * Line two of the description.
         */
        export interface WidgetService {}
      `);
    });
  });

  describe('deprecated', () => {
    it('creates an interface marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** @deprecated */
        export interface WidgetsService {}
      `);
    });

    it('creates an interface with a description marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            description: [ir.stringLiteral('A widgets interface')],
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A widgets interface
         *
         * @deprecated
         */
        export interface WidgetsService {}
      `);
    });
  });
});
