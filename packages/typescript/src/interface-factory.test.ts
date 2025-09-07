import { readFileSync } from 'fs';
import { join } from 'path';
import { generateFiles } from './snapshot/test-utils';
import {
  Enum,
  EnumMember,
  IntegerLiteral,
  Interface,
  Service,
  StringLiteral,
  Type,
} from 'basketry';
import { generateTypes } from './interface-factory';

describe('InterfaceFactory', () => {
  describe('snapshots', () => {
    it('recreates a valid snapshot using the Engine', async () => {
      for await (const file of generateFiles()) {
        const snapshot = readFileSync(join(...file.path)).toString();
        expect(file.contents).toStrictEqual(snapshot);
      }
    });
  });

  describe('interfaces', () => {
    it('works', async () => {
      // ARRANGE
      const svc = service({
        interfaces: [int()],
      });

      // ACT
      const [{ contents }] = await generateTypes(svc);

      // ASSERT
      expect(contents).toContain(
        `
/** This is a test interface */
export interface TestInterfaceService {}`,
      );
    });
  });

  describe('types', () => {
    it('works', async () => {
      // ARRANGE
      const svc = service({
        types: [
          type({
            name: stringLiteral('my type'),
            description: [stringLiteral('My test type')],
          }),
        ],
      });

      // ACT
      const [{ contents }] = await generateTypes(svc);

      // ASSERT
      expect(contents).toContain(
        `
/** My test type */
export type MyType = Record<string, unknown>;`,
      );
    });

    it('works', async () => {
      // ARRANGE
      const svc = service({
        types: [
          type({
            name: stringLiteral('my type'),
            description: [
              stringLiteral('First line of my test type'),
              stringLiteral('Second line of my test type'),
            ],
          }),
        ],
      });

      // ACT
      const [{ contents }] = await generateTypes(svc);

      // ASSERT
      expect(contents).toContain(
        `
/**
 * First line of my test type
 *
 * Second line of my test type
 */
export type MyType = Record<string, unknown>;`,
      );
    });
  });

  describe('enums', () => {
    it('works', async () => {
      // ARRANGE
      const svc = service({
        enums: [enumeration()],
      });

      // ACT
      const [{ contents }] = await generateTypes(svc);

      // ASSERT
      expect(contents).toContain(
        `
/** This is a test enum */
export type TestEnum = 'TestMember';`,
      );
    });
  });

  it('uses custom interfaceNomenclature option', async () => {
    const testService = service({
      interfaces: [
        int({ name: stringLiteral('gizmo') }),
        int({ name: stringLiteral('authPermutation') }),
        int({ name: stringLiteral('mapDemo') }),
      ],
    });

    const options = {
      typescript: {
        interfaceNomenclature: 'client',
      },
    };

    const files = await generateTypes(testService, options);

    expect(files).toBeDefined();
    expect(files.length).toBeGreaterThan(0);

    const file = files[0];
    expect(file.contents).toContain('GizmoClient');
    expect(file.contents).toContain('AuthPermutationClient');
    expect(file.contents).toContain('MapDemoClient');
    expect(file.contents).toContain('This is a test interface');
    expect(file.contents).not.toContain('GizmoService');
    expect(file.contents).not.toContain('AuthPermutationService');
    expect(file.contents).not.toContain('MapDemoService');
  });
});

function service(obj?: Partial<Service>): Service {
  return {
    kind: 'Service',
    basketry: '0.2',
    title: stringLiteral('Test Service'),
    sourcePaths: ['#'],
    majorVersion: integerLiteral(1),
    interfaces: [],
    types: [],
    enums: [],
    unions: [],
    ...obj,
  };
}

function type(obj?: Partial<Type>): Type {
  return {
    kind: 'Type',
    name: stringLiteral('TestType'),
    description: [stringLiteral('This is a test type')],
    properties: [],
    rules: [],
    ...obj,
  };
}

function int(obj?: Partial<Interface>): Interface {
  return {
    kind: 'Interface',
    name: stringLiteral('TestInterface'),
    description: [stringLiteral('This is a test interface')],
    methods: [],
    ...obj,
  };
}

function enumeration(obj?: Partial<Enum>): Enum {
  return {
    kind: 'Enum',
    name: stringLiteral('TestEnum'),
    description: [stringLiteral('This is a test enum')],
    members: [enumMember()],
    ...obj,
  };
}

function enumMember(obj?: Partial<EnumMember>): EnumMember {
  return {
    kind: 'EnumMember',
    content: stringLiteral('TestMember'),
    ...obj,
  };
}

function stringLiteral(value: string): StringLiteral {
  return { kind: 'StringLiteral', value };
}

function integerLiteral(value: number): IntegerLiteral {
  return { kind: 'IntegerLiteral', value };
}
