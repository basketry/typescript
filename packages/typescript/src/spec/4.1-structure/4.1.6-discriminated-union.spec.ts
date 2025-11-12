import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.6 DiscriminatedUnion', () => {
  const typeA = ir.type({
    name: ir.stringLiteral('PartA'),
    properties: [
      ir.property({
        name: ir.stringLiteral('discriminator'),
        value: ir.primitiveValue({
          typeName: ir.primitiveLiteral('string'),
          constant: ir.stringLiteral('A'),
        }),
      }),
    ],
  });
  const typeB = ir.type({
    name: ir.stringLiteral('PartB'),
    properties: [
      ir.property({
        name: ir.stringLiteral('discriminator'),
        value: ir.primitiveValue({
          typeName: ir.primitiveLiteral('string'),
          constant: ir.stringLiteral('B'),
        }),
      }),
    ],
  });
  const typeC = ir.type({
    name: ir.stringLiteral('PartC'),
    properties: [
      ir.property({
        name: ir.stringLiteral('discriminator'),
        value: ir.primitiveValue({
          typeName: ir.primitiveLiteral('string'),
          constant: ir.stringLiteral('C'),
        }),
      }),
    ],
  });

  describe('name', () => {
    it('creates a discriminated union of two types', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.discriminatedUnion({
            name: ir.stringLiteral('TopLevelUnion'),
            members: [
              ir.complexValue({ typeName: typeA.name }),
              ir.complexValue({ typeName: typeB.name }),
            ],
            discriminator: ir.stringLiteral('discriminator'),
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

    it('emits discriminated unions in alphabetical order', async () => {
      // ARRANGE
      const members = [
        ir.complexValue({ typeName: typeA.name }),
        ir.complexValue({ typeName: typeB.name }),
      ];

      const discriminator = ir.stringLiteral('discriminator');

      const service = ir.service({
        types: [typeA],
        unions: [
          ir.discriminatedUnion({
            name: ir.stringLiteral('UnionB'),
            members,
            discriminator,
          }),
          ir.discriminatedUnion({
            name: ir.stringLiteral('UnionA'),
            members,
            discriminator,
          }),
          ir.discriminatedUnion({
            name: ir.stringLiteral('UnionC'),
            members,
            discriminator,
          }),
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
          ir.discriminatedUnion({
            name: ir.stringLiteral('SOME_UNION_NAME'),
            members: [ir.complexValue({ typeName: typeA.name })],
            discriminator: ir.stringLiteral('discriminator'),
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
    it('creates a discriminated union with a single-line description', async () => {
      // ARRANGE
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [ir.stringLiteral('A union')],
        members: [ir.complexValue({ typeName: typeA.name })],
        discriminator: ir.stringLiteral('discriminator'),
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

    it('creates a discriminated union with a multi-line description', async () => {
      // ARRANGE
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [
          ir.stringLiteral('A union'),
          ir.stringLiteral('Line two of the description.'),
        ],
        members: [ir.complexValue({ typeName: typeA.name })],
        discriminator: ir.stringLiteral('discriminator'),
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
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('DescribedUnion'),
        description: [
          ir.stringLiteral(
            'A union with a very long description that exceeds the typical maximum line length of eighty characters to ensure that the generator correctly breaks the description into multiple lines.',
          ),
        ],
        members: [ir.complexValue({ typeName: typeA.name })],
        discriminator: ir.stringLiteral('discriminator'),
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
    // TODO: fix and enable these tests
    // https://github.com/basketry/typescript/issues/137
    it.skip('creates a union without any members', async () => {
      // ARRANGE
      const service = ir.service({
        types: [typeA, typeB],
        unions: [
          ir.discriminatedUnion({
            name: ir.stringLiteral('TopLevelUnion'),
            discriminator: ir.stringLiteral('discriminator'),
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
    it('creates a discriminated union marked as deprecated', async () => {
      // ARRANGE
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('SomeUnion'),
        deprecated: ir.trueLiteral(),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
        discriminator: ir.stringLiteral('discriminator'),
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

    it('creates a discriminated union with a description marked as deprecated', async () => {
      // ARRANGE
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('SomeUnion'),
        description: [ir.stringLiteral('A lovely union')],
        deprecated: ir.trueLiteral(),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
        discriminator: ir.stringLiteral('discriminator'),
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

  describe('type guard functions', () => {
    it('creates a type guard function for each member of the discriminated union', async () => {
      // ARRANGE
      const union = ir.discriminatedUnion({
        name: ir.stringLiteral('SomeUnion'),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
        discriminator: ir.stringLiteral('discriminator'),
      });

      const service = ir.service({ types: [typeA, typeB], unions: [union] });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export function isPartA(obj: SomeUnion): obj is PartA {
          return obj.discriminator === 'A';
        }
      `);

      expect(result[0].contents).toContainAst(`
        export function isPartB(obj: SomeUnion): obj is PartB {
          return obj.discriminator === 'B';
        }
      `);
    });

    // TODO: fix and enable these tests
    // https://github.com/basketry/typescript/issues/135
    it.skip('create only one type guard function per member even if used in multiple unions', async () => {
      // ARRANGE
      const unionA = ir.discriminatedUnion({
        name: ir.stringLiteral('UnionA'),
        members: [
          ir.complexValue({ typeName: typeA.name }),
          ir.complexValue({ typeName: typeB.name }),
        ],
        discriminator: ir.stringLiteral('discriminator'),
      });

      const unionB = ir.discriminatedUnion({
        name: ir.stringLiteral('UnionB'),
        members: [
          ir.complexValue({ typeName: typeB.name }),
          ir.complexValue({ typeName: typeC.name }),
        ],
        discriminator: ir.stringLiteral('discriminator'),
      });

      const service = ir.service({
        types: [typeA, typeB, typeC],
        unions: [unionA, unionB],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export function isPartA(obj: UnionA): obj is PartA {
          return obj.discriminator === 'A';
        }
      `);

      expect(result[0].contents).toContainAst(`
        export function isPartB(obj: UnionA | UnionB): obj is PartB {
          return obj.discriminator === 'B';
        }
      `);

      expect(result[0].contents).toContainAst(`
        export function isPartC(obj: UnionB): obj is PartC {
          return obj.discriminator === 'C';
        }
      `);
    });
  });
});
