import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.8 Method', () => {
  describe('name', () => {
    it('creates a method', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [ir.method({ name: ir.stringLiteral('ListWidgets') })],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(): Promise<void>;
        }
      `);
    });

    it('emits interfaces in alphabetical order', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({ name: ir.stringLiteral('MethodB') }),
              ir.method({ name: ir.stringLiteral('MethodA') }),
              ir.method({ name: ir.stringLiteral('MethodC') }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          methodA(): Promise<void>;
          methodB(): Promise<void>;
          methodC(): Promise<void>;
        }
      `);

      const aIndex = result[0].contents.indexOf('methodA(): Promise<void>;');
      const bIndex = result[0].contents.indexOf('methodB(): Promise<void>;');
      const cIndex = result[0].contents.indexOf('methodC(): Promise<void>;');

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });

    it('always uses camelCase for method names', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [ir.method({ name: ir.stringLiteral('LIST_WIDGETS') })],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(): Promise<void>;
        }
      `);
    });
  });

  describe('description', () => {
    it('creates an method with a single-line description', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('listWidgets'),
                description: [ir.stringLiteral('List all widgets')],
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          /** List all widgets */
          listWidgets(): Promise<void>;
        }
      `);
    });

    it('creates an interface with a multi-line description', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('listWidgets'),
                description: [
                  ir.stringLiteral('List all widgets'),
                  ir.stringLiteral('Line two of the description.'),
                ],
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          /**
           * List all widgets
           *
           * Line two of the description.
           */
          listWidgets(): Promise<void>;
        }
      `);
    });
  });

  describe('parameters', () => {
    it('create a required param for a method with at least one required param', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('ListWidgets'),
                parameters: [
                  ir.parameter({
                    name: ir.stringLiteral('a'),
                    value: ir.primitiveValue({
                      typeName: ir.primitiveLiteral('string'),
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);
    });

    it('create an optional param for a method with at all optional params', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('ListWidgets'),
                parameters: [
                  ir.parameter({
                    name: ir.stringLiteral('a'),
                    value: ir.primitiveValue({
                      typeName: ir.primitiveLiteral('string'),
                      isOptional: ir.trueLiteral(),
                    }),
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params?: ListWidgetsParams): Promise<void>;
        }
      `);
    });
  });

  describe('deprecated', () => {
    it('creates a method marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('ListWidgets'),
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
        export interface WidgetsService {
          /** @deprecated */
          listWidgets(): Promise<void>;
        }
      `);
    });

    it('creates a method with a description marked as deprecated', async () => {
      // ARRANGE
      const service = ir.service({
        interfaces: [
          ir.interface({
            name: ir.stringLiteral('Widgets'),
            methods: [
              ir.method({
                name: ir.stringLiteral('ListWidgets'),
                description: [ir.stringLiteral('List all widgets')],
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
        export interface WidgetsService {
          /**
           * List all widgets
           *
           * @deprecated
           */
          listWidgets(): Promise<void>;
        }
      `);
    });
  });
});
