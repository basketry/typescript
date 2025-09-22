import * as IR from '@basketry/ir';
import { Factory } from '@basketry/jest-utils';
import { ExpressMapperFactory } from '../../mapper-factory';
import { NamespacedTypescriptDTOOptions } from '../..';
import { mappers, withParamType, withReturnType } from '../utils';

const factory = new Factory(1);

async function sut(
  svc: IR.Service,
  options: NamespacedTypescriptDTOOptions,
): Promise<string> {
  const files = await new ExpressMapperFactory(svc, options).build();
  return mappers(files);
}

describe('4.1.5 Simple Union', () => {
  describe('members', () => {
    describe(ExpressMapperFactory, () => {
      describe('when the union has only primitive, non-date members', () => {
        // ARRANGE
        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                return obj;
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                return dto;
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                return dto;
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                return obj;
              }
            `);
          });
        });
      });

      describe('when the union has only primitive string and date members', () => {
        // ARRANGE
        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('date'),
            }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString().split('T')[0];
                } else {
                  return obj;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' && !isNaN(Date.parse(dto))) {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' && !isNaN(Date.parse(dto))) {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString().split('T')[0];
                } else {
                  return obj;
                }
              }
            `);
          });
        });
      });

      describe('when the union has only primitive non-string and date members', () => {
        // ARRANGE
        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('date'),
            }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString().split('T')[0];
                } else {
                  return obj;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string') {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string') {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString().split('T')[0];
                } else {
                  return obj;
                }
              }
            `);
          });
        });
      });

      describe('when the union mixes primitive date and date-time members', () => {
        // ARRANGE
        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('date'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('date-time'),
            }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString();
                } else {
                  return obj;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string') {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string') {
                  return new Date(dto);
                } else {
                  return dto;
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (obj instanceof Date) {
                  return obj.toISOString();
                } else {
                  return obj;
                }
              }
            `);
          });
        });
      });

      describe('when the union mixes primitive members with a single complex member', () => {
        // ARRANGE
        const type = factory.type({
          name: factory.stringLiteral('MyType'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
          ],
        });

        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.complexValue({ typeName: type.name }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
              types: [type],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (typeof obj === 'string' || typeof obj === 'number') {
                  return obj;
                } else {
                  return mapToMyTypeDto(obj);
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' || typeof dto === 'number') {
                  return dto;
                } else {
                  return mapFromMyTypeDto(dto);
                }
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' || typeof dto === 'number') {
                  return dto;
                } else {
                  return mapFromMyTypeDto(dto);
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (typeof obj === 'string' || typeof obj === 'number') {
                  return obj;
                } else {
                  return mapToMyTypeDto(obj);
                }
              }
            `);
          });
        });
      });

      describe('when the union mixes primitive members with multiple, distinct complex members', () => {
        // ARRANGE
        const typeA = factory.type({
          name: factory.stringLiteral('TypeA'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propA'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
          ],
        });

        const typeB = factory.type({
          name: factory.stringLiteral('TypeB'),
          properties: [
            factory.property({
              name: factory.stringLiteral('propB'),
              value: factory.primitiveValue({
                typeName: factory.primitiveLiteral('string'),
              }),
            }),
          ],
        });

        const union = factory.simpleUnion({
          name: factory.stringLiteral('MyUnion'),
          members: [
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
            factory.primitiveValue({
              typeName: factory.primitiveLiteral('number'),
            }),
            factory.complexValue({ typeName: typeA.name }),
            factory.complexValue({ typeName: typeB.name }),
          ],
        });

        describe('Role: client', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'client' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
              types: [typeA, typeB],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (typeof obj === 'string' || typeof obj === 'number') {
                  return obj;
                } else if ('propA' in obj) {
                  return mapToTypeADto(obj);
                } else {
                  return mapToTypeBDto(obj);
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
              types: [typeA, typeB],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' || typeof dto === 'number') {
                  return dto;
                } else if ('propA' in dto) {
                  return mapFromTypeADto(dto);
                } else {
                  return mapFromTypeBDto(dto);
                }
              }
            `);
          });
        });

        describe('Role: server', () => {
          const options: NamespacedTypescriptDTOOptions = {
            dtos: { role: 'server' },
          };

          it('creates a mapper for a DTO passed as a parameter', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withParamType(factory, 'MyUnion')],
              unions: [union],
              types: [typeA, typeB],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromMyUnionDto(dto: dtos.MyUnionDto): types.MyUnion {
                if (typeof dto === 'string' || typeof dto === 'number') {
                  return dto;
                } else if ('propA' in dto) {
                  return mapFromTypeADto(dto);
                } else {
                  return mapFromTypeBDto(dto);
                }
              }
            `);
          });

          it('creates a mapper for a returned DTO', async () => {
            // ARRANGE
            const service = factory.service({
              interfaces: [withReturnType(factory, 'MyUnion')],
              unions: [union],
              types: [typeA, typeB],
            });

            // ACT
            const result = await sut(service, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToMyUnionDto(obj: types.MyUnion): dtos.MyUnionDto {
                if (typeof obj === 'string' || typeof obj === 'number') {
                  return obj;
                } else if ('propA' in obj) {
                  return mapToTypeADto(obj);
                } else {
                  return mapToTypeBDto(obj);
                }
              }
            `);
          });
        });
      });
    });
  });
});
