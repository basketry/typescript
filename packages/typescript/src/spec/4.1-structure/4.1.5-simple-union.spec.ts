import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.5 SimpleUnion', () => {
  const typeA = ir.type({ name: ir.stringLiteral('PartA') });
  const typeB = ir.type({ name: ir.stringLiteral('PartB') });

  describe('name', () => {
    it('creates a simple union of two types', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('TopLevelUnion'),
            members: [
              ir.complexValue({ typeName: typeA.name }),
              ir.complexValue({ typeName: typeB.name }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type TopLevelUnion = PartA | PartB;
      `);
    });

    it('emits simple unions in alphabetical order', async () => {
      // ARRANGE
      const members = [
        ir.complexValue({ typeName: typeA.name }),
        ir.complexValue({ typeName: typeB.name }),
      ];

      const service = ir.service({
        types: [typeA],
        unions: [
          ir.simpleUnion({ name: ir.stringLiteral('UnionB'), members }),
          ir.simpleUnion({ name: ir.stringLiteral('UnionA'), members }),
          ir.simpleUnion({ name: ir.stringLiteral('UnionC'), members }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
      export type UnionA = PartA | PartB;
    `);

      expect(result[0].contents).toContainAst(`
      export type UnionB = PartA | PartB;
    `);

      expect(result[0].contents).toContainAst(`
      export type UnionC = PartA | PartB;
    `);

      const alphaIndex = result[0].contents.indexOf(
        'export type UnionA = PartA | PartB;',
      );
      const betaIndex = result[0].contents.indexOf(
        'export type UnionB = PartA | PartB;',
      );
      const gammaIndex = result[0].contents.indexOf(
        'export type UnionC = PartA | PartB;',
      );

      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(gammaIndex);
    });

    it('always uses PascalCase for union names', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('SOME_UNION_NAME'),
            members: [ir.complexValue({ typeName: typeA.name })],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
      export type SomeUnionName = PartA;
    `);
    });
  });

  describe('description', () => {
    it('creates a simple union with a single-line description', async () => {
      // ARRANGE
      const union = ir.simpleUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [ir.stringLiteral('A union')],
        members: [ir.complexValue({ typeName: typeA.name })],
      });

      const service = ir.service({ types: [typeA], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** A union */
        export type DescribedUnion = PartA;
      `);
    });

    it('creates a simple union with a multi-line description', async () => {
      // ARRANGE
      const union = ir.simpleUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [
          ir.stringLiteral('A union'),
          ir.stringLiteral('Line two of the description.'),
        ],
        members: [ir.complexValue({ typeName: typeA.name })],
      });

      const service = ir.service({ types: [typeA], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A union
         *
         * Line two of the description.
         */
        export type DescribedUnion = PartA;
      `);
    });

    it('breaks long descriptions into multiple lines', async () => {
      // ARRANGE
      const union = ir.simpleUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [
          ir.stringLiteral(
            'A union with a very long description that exceeds the typical maximum line length of eighty characters to ensure that the generator correctly breaks the description into multiple lines.',
          ),
        ],
        members: [ir.complexValue({ typeName: typeA.name })],
      });

      const service = ir.service({ types: [typeA], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A union with a very long description that exceeds the typical maximum line length
         * of eighty characters to ensure that the generator correctly breaks the
         * description into multiple lines.
         */
        export type DescribedUnion = PartA;
      `);
    });
  });

  describe('members', () => {
    it('creates a simple union with complex members', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('ComplexUnion'),
            members: [
              ir.complexValue({ typeName: typeA.name }),
              ir.complexValue({ typeName: typeB.name }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type ComplexUnion = PartA | PartB;
      `);
    });

    it('creates a simple union with primitive members', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('PrimitiveUnion'),
            members: [
              ir.primitiveValue({ typeName: ir.primitiveLiteral('string') }),
              ir.primitiveValue({ typeName: ir.primitiveLiteral('number') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type PrimitiveUnion = string | number;
      `);
    });

    it('creates a simple union with mixed members', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('PrimitiveUnion'),
            members: [
              ir.primitiveValue({ typeName: ir.primitiveLiteral('string') }),
              ir.complexValue({ typeName: typeA.name }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type PrimitiveUnion = string | PartA;
      `);
    });

    // TODO: fix and enable these tests
    // https://github.com/basketry/typescript/issues/137
    it.skip('creates a union without any members', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.simpleUnion({
            name: ir.stringLiteral('TopLevelUnion'),
            members: [],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export type TopLevelUnion = never;
      `);
    });
  });

  describe('deprecated', () => {
    it('creates a simple union marked as deprecated', async () => {
      // ARRANGE
      const union = ir.simpleUnion({
        name: ir.stringLiteral('SomeUnion'),
        deprecated: ir.trueLiteral(),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
      });

      const service = ir.service({ types: [typeA, typeB], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /** @deprecated */
        export type SomeUnion = PartA | PartB;
      `);
    });

    it('creates a simple union with a description marked as deprecated', async () => {
      // ARRANGE
      const union = ir.simpleUnion({
        name: ir.stringLiteral('SomeUnion'),
        description: [ir.stringLiteral('A lovely union')],
        deprecated: ir.trueLiteral(),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
      });

      const service = ir.service({ types: [typeA, typeB], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        /**
         * A lovely union
         *
         * @deprecated
         */
        export type SomeUnion = PartA | PartB;
      `);
    });
  });
});
