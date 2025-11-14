import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const factory = new Factory();

describe('4.1.24 HttpMethod', () => {
  describe('responseMediaTypes', () => {
    it('creates a method for a single response', async () => {
      // ARRANGE
      const service = factory.service({
        interfaces: [
          factory.interface({
            name: factory.stringLiteral('Widgets'),
            methods: [
              factory.method({
                name: factory.stringLiteral('listWidgets'),
                parameters: [
                  factory.parameter({
                    name: factory.stringLiteral('a'),
                    value: factory.primitiveValue({
                      typeName: factory.primitiveLiteral('string'),
                    }),
                  }),
                ],
                returns: factory.returnValue({
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral('number'),
                  }),
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
        export interface WidgetsService {
          listWidgets(params: ListWidgetsParams): Promise<number>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type ListWidgetsParams { a: string; }
      `);
    });

    it('creates a method for a streamed response', async () => {
      // ARRANGE
      const service = factory.service({
        interfaces: [
          factory.interface({
            name: factory.stringLiteral('Widgets'),
            methods: [
              factory.method({
                name: factory.stringLiteral('streamWidgets'),
                parameters: [
                  factory.parameter({
                    name: factory.stringLiteral('a'),
                    value: factory.primitiveValue({
                      typeName: factory.primitiveLiteral('string'),
                    }),
                  }),
                ],
                returns: factory.returnValue({
                  value: factory.primitiveValue({
                    typeName: factory.primitiveLiteral('number'),
                  }),
                }),
              }),
            ],
            protocols: factory.protocols({
              http: [
                factory.httpRoute({
                  methods: [
                    factory.httpMethod({
                      name: factory.stringLiteral('streamWidgets'),
                      responseMediaTypes: [
                        factory.stringLiteral('text/event-stream'),
                      ],
                      parameters: [
                        factory.httpParameter({
                          name: factory.stringLiteral('a'),
                          location: factory.httpLocationLiteral('query'),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      });

      // ACT
      const result = await generator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(`
        export interface WidgetsService {
          streamWidgets(params: StreamWidgetsParams): AsyncIterable<number>;
        }
      `);

      expect(result[0].contents).toContainAst(`
        export type StreamWidgetsParams { a: string; }
      `);
    });
  });
});
