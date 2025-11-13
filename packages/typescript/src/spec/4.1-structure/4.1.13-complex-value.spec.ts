import { Factory } from '@basketry/jest-utils';
import generator from '../..';
import { Enum, Parameter, Property, Service, Type, Union } from 'basketry';

const ir = new Factory();

const typeMap: ['type' | 'enum' | 'union', Type | Enum | Union, string][] = [
  ['type', ir.type({ name: ir.stringLiteral('OtherType') }), 'OtherType'],
  ['enum', ir.enum({ name: ir.stringLiteral('OtherEnum') }), 'OtherEnum'],
  [
    'union',
    ir.simpleUnion({
      name: ir.stringLiteral('OtherUnion'),
      members: [],
    }),
    'OtherUnion',
  ],
];

describe('4.1.13 Complex Value', () => {
  describe('typeName', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits a reference to a %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp: ${expectedName};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits a reference to a %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam: ${expectedName};
            }
          `);
        },
      );
    });
  });

  describe('isArray', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits an array of a %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp: ${expectedName}[];
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits an array of a %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam: ${expectedName}[];
            }
          `);
        },
      );
    });
  });

  describe('isNullable', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits a union of a %s and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp: ${expectedName} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits a union of a %s and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam: ${expectedName} | null;
            }
          `);
        },
      );
    });
  });

  describe('isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits an optional %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp?: ${expectedName};
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits an optional %s',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam?: ${expectedName};
            }
          `);
        },
      );
    });
  });

  describe('isArray and isNullable', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits a union of %s array and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp: ${expectedName}[] | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits a union of %s array and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam: ${expectedName}[] | null;
            }
          `);
        },
      );
    });
  });

  describe('isArray and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits an optional %s array',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp?: ${expectedName}[];
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits an optional %s array',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam?: ${expectedName}[];
            }
          `);
        },
      );
    });
  });

  describe('isNullable and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits an optional union of %s and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp?: ${expectedName} | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits an optional union of %s and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam?: ${expectedName} | null;
            }
          `);
        },
      );
    });
  });

  describe('isArray and isNullable and isOptional', () => {
    describe('property', () => {
      it.each(typeMap)(
        'emits an optional union of %s array and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = propSut(
            ir.property({
              name: ir.stringLiteral('myProp'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type PrimitiveType = {
              myProp?: ${expectedName}[] | null;
            }
          `);
        },
      );
    });

    describe('parameter', () => {
      it.each(typeMap)(
        'emits an optional union of %s array and null',
        async (_, complexMember, expectedName) => {
          // ARRANGE
          const service = paramSut(
            ir.parameter({
              name: ir.stringLiteral('myParam'),
              value: ir.complexValue({
                typeName: complexMember.name,
                isArray: ir.trueLiteral(),
                isNullable: ir.trueLiteral(),
                isOptional: ir.trueLiteral(),
              }),
            }),
          );

          addMember(service, complexMember);

          // ACT
          const result = await generator(service);

          // ASSERT
          expect(result[0].contents).toContainAst(`
            export type ListWidgetsParams = {
              myParam?: ${expectedName}[] | null;
            }
          `);
        },
      );
    });
  });
});

function addMember(service: Service, member: Type | Enum | Union) {
  switch (member.kind) {
    case 'Type':
      service.types.push(member);
      break;
    case 'Enum':
      service.enums.push(member);
      break;
    case 'SimpleUnion':
    case 'DiscriminatedUnion':
      service.unions.push(member);
      break;
  }

  return service;
}

function propSut(...properties: Property[]) {
  return ir.service({
    types: [
      ir.type({
        name: ir.stringLiteral('PrimitiveType'),
        properties,
      }),
    ],
  });
}

function paramSut(...parameters: Parameter[]) {
  return ir.service({
    interfaces: [
      ir.interface({
        name: ir.stringLiteral('Widgets'),
        methods: [
          ir.method({
            name: ir.stringLiteral('listWidgets'),
            parameters,
          }),
        ],
      }),
    ],
  });
}
