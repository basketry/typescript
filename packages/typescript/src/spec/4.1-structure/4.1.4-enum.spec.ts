import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.4 Enum', () => {
  describe('name', () => {
    it('creates an enum with multiple members', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });

    it('emits enums in alphabetical order', async () => {
      // ARRANGE
      const members = [ir.enumMember({ content: ir.stringLiteral('VALUE') })];

      const service = ir.service({
        enums: [
          ir.enum({ name: ir.stringLiteral('EnumB'), members }),
          ir.enum({ name: ir.stringLiteral('EnumA'), members }),
          ir.enum({ name: ir.stringLiteral('EnumC'), members }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type EnumA = 'VALUE';
      `);

      expect(result[0].contents).toContainAst(`
        export type EnumB = 'VALUE';
      `);

      expect(result[0].contents).toContainAst(`
        export type EnumC = 'VALUE';
      `);

      const alphaIndex = result[0].contents.indexOf(
        `export type EnumA = 'VALUE';`,
      );
      const betaIndex = result[0].contents.indexOf(
        `export type EnumB = 'VALUE';`,
      );
      const gammaIndex = result[0].contents.indexOf(
        `export type EnumC = 'VALUE';`,
      );

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(gammaIndex);
    });

    it('always uses PascalCase for enum names', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('SOME_ENUM_NAME'),
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type SomeEnumName = 'small' | 'medium' | 'large';
      `);
    });
  });

  describe('description', () => {
    it('creates an enum with a single-line description', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            description: [ir.stringLiteral('A product size enum')],
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** A product size enum */
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });

    it('creates an enum with a multi-line description', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            description: [
              ir.stringLiteral('A product size enum'),
              ir.stringLiteral('Line two of the description.'),
            ],
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A product size enum
         *
         * Line two of the description.
         */
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });

    it('break long descriptions into multiple lines', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            description: [
              ir.stringLiteral(
                'A product size enum with a very long description that exceeds the typical maximum line length of eighty characters to ensure that the generator correctly breaks the description into multiple lines.',
              ),
            ],
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A product size enum with a very long description that exceeds the typical maximum
         * line length of eighty characters to ensure that the generator correctly breaks
         * the description into multiple lines.
         */
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });
  });

  describe('deprecated', () => {
    it('creates an enum marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** @deprecated */
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });

    it('creates an enum with a description marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        enums: [
          ir.enum({
            name: ir.stringLiteral('ProductSize'),
            description: [ir.stringLiteral('A product enum')],
            members: [
              ir.enumMember({ content: ir.stringLiteral('small') }),
              ir.enumMember({ content: ir.stringLiteral('medium') }),
              ir.enumMember({ content: ir.stringLiteral('large') }),
            ],
            deprecated: ir.trueLiteral(),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A product enum
         *
         * @deprecated
         */
        export type ProductSize = 'small' | 'medium' | 'large';
      `);
    });
  });
});
