import * as IR from '@basketry/ir';
import { Factory } from '@basketry/jest-utils';
import { NamespacedTypescriptDTOOptions } from '../..';

import { ExpressMapperFactory } from '../../mapper-factory';
import { mappers, withParamType, withReturnType } from '../utils';

const factory = new Factory(1);

// ARRANGE
const typeName = 'MyType';

const service = (int: IR.Interface, value: IR.PrimitiveValue) =>
  factory.service({
    interfaces: [int],
    types: [
      factory.type({
        name: factory.stringLiteral(typeName),
        properties: [
          factory.property({
            name: factory.stringLiteral('propA'),
            value,
          }),
        ],
      }),
    ],
  });

async function sut(
  svc: IR.Service,
  options: NamespacedTypescriptDTOOptions,
): Promise<string> {
  const files = await new ExpressMapperFactory(svc, options).build();
  return mappers(files);
}

describe('4.1.13 Primitive Value', () => {
  describe('general', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            ['date', "obj.propA.toISOString().split('T')[0]"],
            ['date-time', 'obj.propA.toISOString()'],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'new Date(dto.propA)'],
            ['date-time', 'new Date(dto.propA)'],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'new Date(dto.propA)'],
            ['date-time', 'new Date(dto.propA)'],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            ['date', "obj.propA.toISOString().split('T')[0]"],
            ['date-time', 'obj.propA.toISOString()'],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });
      });
    });
  });

  describe('isArray', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            ['date', "obj.propA.map((v) => v.toISOString().split('T')[0])"],
            ['date-time', 'obj.propA.map((v) => v.toISOString())'],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'dto.propA.map((v) => new Date(v))'],
            ['date-time', 'dto.propA.map((v) => new Date(v))'],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'dto.propA.map((v) => new Date(v))'],
            ['date-time', 'dto.propA.map((v) => new Date(v))'],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            ['date', "obj.propA.map((v) => v.toISOString().split('T')[0])"],
            ['date-time', 'obj.propA.map((v) => v.toISOString())'],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
      });
    });
  });

  describe('isArray AND isOptional', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.map((v) => v.toISOString().split('T')[0])",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.map((v) => v.toISOString())",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' ? dto.propA : dto.propA.map((v) => new Date(v))",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' ? dto.propA : dto.propA.map((v) => new Date(v))",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' ? dto.propA : dto.propA.map((v) => new Date(v))",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' ? dto.propA : dto.propA.map((v) => new Date(v))",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.map((v) => v.toISOString().split('T')[0])",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.map((v) => v.toISOString())",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isArray: factory.trueLiteral(),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
      });
    });
  });

  describe('isOptional', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.toISOString()",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' ? dto.propA : new Date(dto.propA)",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' ? dto.propA : new Date(dto.propA)",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' ? dto.propA : new Date(dto.propA)",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' ? dto.propA : new Date(dto.propA)",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' ? obj.propA : obj.propA.toISOString()",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
      });
    });
  });

  describe('isNullable', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "obj.propA === null ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              'obj.propA === null ? obj.propA : obj.propA.toISOString()',
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'dto.propA === null ? dto.propA : new Date(dto.propA)'],
            [
              'date-time',
              'dto.propA === null ? dto.propA : new Date(dto.propA)',
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            ['date', 'dto.propA === null ? dto.propA : new Date(dto.propA)'],
            [
              'date-time',
              'dto.propA === null ? dto.propA : new Date(dto.propA)',
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "obj.propA === null ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              'obj.propA === null ? obj.propA : obj.propA.toISOString()',
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
      });
    });
  });

  describe('isOptional AND isNullable', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : obj.propA.toISOString()",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
            export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
              return compact({ propA: ${expected} });
            }
          `);
            },
          );
        });

        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : new Date(dto.propA)",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : new Date(dto.propA)",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
              export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                return compact({ propA: ${expected} });
              }
            `);
            },
          );
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withParamType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'dto.propA'],
            ['number', 'dto.propA'],
            ['boolean', 'dto.propA'],
            ['integer', 'dto.propA'],
            ['long', 'dto.propA'],
            ['float', 'dto.propA'],
            ['double', 'dto.propA'],
            [
              'date',
              "typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : new Date(dto.propA)",
            ],
            [
              'date-time',
              "typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : new Date(dto.propA)",
            ],
            ['null', 'dto.propA'],
            ['binary', 'dto.propA'],
            ['untyped', 'dto.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapFromMyTypeDto(dto: dtos.MyTypeDto): types.MyType {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
        describe('when the DTO is returned', () => {
          function withValue(value: IR.PrimitiveValue) {
            return service(withReturnType(factory, 'MyType'), value);
          }

          const testCases: [IR.Primitive, string][] = [
            ['string', 'obj.propA'],
            ['number', 'obj.propA'],
            ['boolean', 'obj.propA'],
            ['integer', 'obj.propA'],
            ['long', 'obj.propA'],
            ['float', 'obj.propA'],
            ['double', 'obj.propA'],
            [
              'date',
              "typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : obj.propA.toISOString().split('T')[0]",
            ],
            [
              'date-time',
              "typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : obj.propA.toISOString()",
            ],
            ['null', 'obj.propA'],
            ['binary', 'obj.propA'],
            ['untyped', 'obj.propA'],
          ];

          it.each(testCases)(
            'maps a %s property',
            async (primitive, expected) => {
              // ARRANGE
              const svc = withValue(
                factory.primitiveValue({
                  typeName: factory.primitiveLiteral(primitive),
                  isOptional: factory.trueLiteral(),
                  isNullable: factory.trueLiteral(),
                }),
              );

              // ACT
              const result = await sut(svc, options);

              // ASSERT
              expect(result).toContainAst(`
                export function mapToMyTypeDto(obj: types.MyType): dtos.MyTypeDto {
                  return compact({ propA: ${expected} });
                }
              `);
            },
          );
        });
      });
    });
  });
});
