import * as IR from '@basketry/ir';
import { Factory } from '@basketry/jest-utils';
import { NamespacedTypescriptDTOOptions } from '../..';

import { ExpressMapperFactory } from '../../mapper-factory';
import { mappers, withParamType, withReturnType } from '../utils';

const factory = new Factory(1);

// ARRANGE
const service = (int: IR.Interface, value: IR.MemberValue) =>
  factory.service({
    interfaces: [int],
    types: [
      factory.type({
        name: factory.stringLiteral('TypeA'),
        properties: [
          factory.property({
            name: factory.stringLiteral('propA'),
            value,
          }),
        ],
      }),
      factory.type({
        name: factory.stringLiteral('TypeB'),
        properties: [
          factory.property({
            name: factory.stringLiteral('primitiveProp'),
            value: factory.primitiveValue({
              typeName: factory.primitiveLiteral('string'),
            }),
          }),
        ],
      }),
    ],
    enums: [
      factory.enum({
        name: factory.stringLiteral('EnumC'),
        members: [
          factory.enumMember({ content: factory.stringLiteral('ValueA') }),
          factory.enumMember({ content: factory.stringLiteral('ValueB') }),
        ],
      }),
    ],
    unions: [
      factory.simpleUnion({
        name: factory.stringLiteral('UnionD'),
        members: [
          factory.primitiveValue({
            typeName: factory.primitiveLiteral('string'),
          }),
          factory.primitiveValue({
            typeName: factory.primitiveLiteral('number'),
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

describe('4.1.14 Complex Value', () => {
  describe('general', () => {
    describe(ExpressMapperFactory, () => {
      describe('Role: client', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'client' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: mapToUnionDDto(obj.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };
        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: mapToUnionDDto(obj.propA) });
              }
            `);
          });
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
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToUnionDDto) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromUnionDDto) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromUnionDDto) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToUnionDDto) });
              }
            `);
          });
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
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToUnionDDto) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromUnionDDto) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA?.map(mapFromUnionDDto) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToTypeBDto) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isArray: factory.trueLiteral(),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA?.map(mapToUnionDDto) });
              }
            `);
          });
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
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' ? obj.propA : mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' ? obj.propA : mapToUnionDDto(obj.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' ? dto.propA : mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' ? dto.propA : mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' ? dto.propA : mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' ? dto.propA : mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' ? obj.propA : mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps a enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' ? obj.propA : mapToUnionDDto(obj.propA) });
              }
            `);
          });
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
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA === null ? obj.propA : mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA === null ? obj.propA : mapToUnionDDto(obj.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA === null ? dto.propA : mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA === null ? dto.propA : mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA === null ? dto.propA : mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE`
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA === null ? dto.propA : mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA === null ? obj.propA : mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps a enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA === null ? obj.propA : mapToUnionDDto(obj.propA) });
              }
            `);
          });
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
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : mapToTypeBDto(obj.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : mapToUnionDDto(obj.propA) });
              }
            `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : mapFromTypeBDto(dto.propA) });
              }
            `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : mapFromUnionDDto(dto.propA) });
              }
            `);
          });
        });
      });

      describe('Role: server', () => {
        const options: NamespacedTypescriptDTOOptions = {
          dtos: { role: 'server' },
        };

        describe('when the DTO is passed as a parameter', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
            export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
              return compact({ propA: typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : mapFromTypeBDto(dto.propA) });
            }
          `);
          });

          it('maps an enum property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
                return compact({ propA: dto.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withParamType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
            export function mapFromTypeADto(dto: dtos.TypeADto): types.TypeA {
              return compact({ propA: typeof dto.propA === 'undefined' || dto.propA === null ? dto.propA : mapFromUnionDDto(dto.propA) });
            }
          `);
          });
        });

        describe('when the DTO is returned', () => {
          it('maps a type property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('TypeB'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
            export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
              return compact({ propA: typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : mapToTypeBDto(obj.propA) });
            }
          `);
          });

          it('maps a enum property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('EnumC'),
                isOptional: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
              export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
                return compact({ propA: obj.propA });
              }
            `);
          });

          it('maps a union property', async () => {
            // ARRANGE
            const svc = service(
              withReturnType(factory, 'TypeA'),
              factory.complexValue({
                typeName: factory.stringLiteral('UnionD'),
                isOptional: factory.trueLiteral(),
                isNullable: factory.trueLiteral(),
              }),
            );

            // ACT
            const result = await sut(svc, options);

            // ASSERT
            expect(result).toContainAst(`
            export function mapToTypeADto(obj: types.TypeA): dtos.TypeADto {
              return compact({ propA: typeof obj.propA === 'undefined' || obj.propA === null ? obj.propA : mapToUnionDDto(obj.propA) });
            }
          `);
          });
        });
      });
    });
  });
});
