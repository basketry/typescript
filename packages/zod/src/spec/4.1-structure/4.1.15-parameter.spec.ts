import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';
import * as IR from '@basketry/ir';

// type Primitive = "string" | "number" | "boolean" | "integer" | "long" | "float" | "double" | "date" | "date-time" | "null" | "binary" | "untyped"

const factory = new Factory();

describe('4.1.15 Parameter', () => {
  const coercedLocations: IR.HttpLocation[] = ['query', 'path', 'header'];
  const testCases: [IR.Primitive, string][] = [
    ['string', 'z.string()'],
    ['number', 'z.coerce.number()'],
    ['boolean', 'booleanFromString'],
    ['integer', 'z.coerce.number().int()'],
    ['long', 'z.coerce.number().int()'],
    ['float', 'z.coerce.number()'],
    ['double', 'z.coerce.number()'],
    ['date', 'z.coerce.date()'],
    ['date-time', 'z.coerce.date()'],
    ['null', 'z.literal(null)'],
  ];

  describe.each(coercedLocations)(
    'properly coerces parameters in %s',
    (location) => {
      it.each(testCases)(
        'properly coerces %s to %s',
        async (primitive, expected) => {
          // ARRANGE
          const methodName = factory.stringLiteral('myMethod');
          const paramName = factory.stringLiteral('myParam');

          const service = factory.service({
            interfaces: [
              factory.interface({
                protocols: factory.protocols({
                  http: [
                    factory.httpRoute({
                      methods: [
                        factory.httpMethod({
                          name: methodName,
                          parameters: [
                            factory.httpParameter({
                              name: paramName,
                              location: factory.httpLocationLiteral(location),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                methods: [
                  factory.method({
                    name: methodName,
                    parameters: [
                      factory.parameter({
                        name: paramName,
                        value: factory.primitiveValue({
                          typeName: factory.primitiveLiteral(primitive),
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });

          // ACT
          const result = await schemaGenerator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(
            `export const MyMethodParamsSchema = z.object({ myParam: ${expected} });`,
          );
        },
      );
    },
  );
});
