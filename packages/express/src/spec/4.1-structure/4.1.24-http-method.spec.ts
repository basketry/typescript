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
            protocols: factory.protocols({
              http: [
                factory.httpRoute({
                  pattern: factory.stringLiteral('/widgets'),
                  methods: [
                    factory.httpMethod({
                      name: factory.stringLiteral('listWidgets'),
                      verb: factory.httpVerbLiteral('get'),
                      responseMediaTypes: [
                        factory.stringLiteral('application/json'),
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

      const handlers = result.find((file) => file.path.includes('handlers.ts'));

      // ASSERT
      expect(handlers?.contents).toContainAst(`
        /** GET /widgets */
        export const handleListWidgets =
          (
            getService: (req: Request, res: Response) => types.WidgetsService,
          ): expressTypes.ListWidgetsRequestHandler =>
          async (req, res, next) => {
            try {
              // Parse parameters from request
              const params: types.ListWidgetsParams =
                schemas.ListWidgetsParamsSchema.parse({
                  a: req.query.a,
                });
        
              // Execute service method
              const service = getService(req, res);
               await service.listWidgets(params);
                const status = 200;
                // Respond
                res.sendStatus(status);
            } catch (err) {
              if (err instanceof ZodError) {
                const statusCode = res.headersSent ? 500 : 400;
                return next(errors.validationErrors(statusCode, err.errors));
              } else {
                next(errors.unhandledException(err));
              }
            }
          };
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
                  pattern: factory.stringLiteral('/widgets/stream'),
                  methods: [
                    factory.httpMethod({
                      name: factory.stringLiteral('streamWidgets'),
                      verb: factory.httpVerbLiteral('get'),
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

      const handlers = result.find((file) => file.path.includes('handlers.ts'));

      console.log(handlers?.contents);

      // ASSERT
      expect(handlers?.contents).toContainAst(`
        /** GET /widgets/stream */
        export const handleStreamWidgets =
          (
            getService: (req: Request, res: Response) => types.WidgetsService,
          ): expressTypes.StreamWidgetsRequestHandler =>
          async (req, res, next) => {
            // Set response headers for streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const closeHandler = () => {
              res.end();
            };
            
            req.on('close', closeHandler);
            req.on('finish', closeHandler);

            try {
              // Parse parameters from request
              const params: types.StreamWidgetsParams =
                schemas.StreamWidgetsParamsSchema.parse({
                  a: req.query.a,
                });
        
              // Execute service method
              const service = getService(req, res);

              const stream = await service.streamWidgets(params);
              for await (const event of stream) {
                res.write(\`data: \${JSON.stringify(event)}\\n\\n\`);
              }
              closeHandler();
            } catch (err) {
              closeHandler();
              if (err instanceof ZodError) {
                const statusCode = res.headersSent ? 500 : 400;
                return next(errors.validationErrors(statusCode, err.errors));
              } else {
                next(errors.unhandledException(err));
              }
            } finally {
              // Ensure handlers are removed
              req.off('close', closeHandler);
              req.off('finish', closeHandler);
            }
          };
      `);
    });
  });
});
