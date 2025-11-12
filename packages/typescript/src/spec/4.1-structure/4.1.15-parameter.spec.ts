import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import { Parameter, Service } from 'basketry';

const ir = new Factory();

describe('4.1.15 Parameter', () => {
  describe('name', () => {
    it('creates a named parameter', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('a'),
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          a: string;
        }
      `);
    });

    it('always uses camelCase', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('SOME_PARAM_NAME'),
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          someParamName: string;
        }
      `);
    });
  });

  describe('description', () => {
    it('creates a single-line description', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('myParam'),
          description: [ir.stringLiteral('A parameter description')],
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          /** A parameter description */
          myParam: string;
        }
      `);
    });

    it('creates a multi-line description', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('myParam'),
          description: [
            ir.stringLiteral('A parameter description'),
            ir.stringLiteral('Line two of the description.'),
          ],
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          /**
           * A parameter description
           * 
           * Line two of the description.
           */
          myParam: string;
        }
      `);
    });
  });

  // TODO: fix and enable these tests
  // https://github.com/basketry/typescript/issues/136
  describe.skip('deprecated', () => {
    it('creates a parameter marked as deprecated', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('myParam'),
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
          deprecated: ir.trueLiteral(),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          /** @deprecated */
          myParam: string;
        }
      `);
    });

    it('creates a parameter with a description marked as deprecated', async () => {
      // ARRANGE
      const service = sut(
        ir.parameter({
          name: ir.stringLiteral('myParam'),
          description: [ir.stringLiteral('A parameter description')],
          value: ir.primitiveValue({
            typeName: ir.primitiveLiteral('string'),
          }),
        }),
      );

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<void>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams {
          /**
           * A parameter description
           * 
           * @deprecated
           */
          myParam: string;
        }
      `);
    });
  });
});

function sut(...parameters: Parameter[]): Service {
  return ir.service({
    interfaces: [
      ir.interface({
        name: ir.stringLiteral('Widgets'),
        methods: [
          ir.method({
            name: ir.stringLiteral('ListWidgets'),
            parameters: [...parameters],
          }),
        ],
      }),
    ],
  });
}
