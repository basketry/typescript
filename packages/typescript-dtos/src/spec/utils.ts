import { File, Interface } from '@basketry/ir';
import { Factory } from '@basketry/jest-utils';

import { TypescriptDTOOptions } from '../types';

export const roles: TypescriptDTOOptions['role'][] = ['client', 'server'];

export function types(files: File[]): string {
  return (
    files.find((file) => file.path[file.path.length - 1] === 'types.ts')
      ?.contents || ''
  );
}

export function mappers(files: File[]): string {
  return (
    files.find((file) => file.path[file.path.length - 1] === 'mappers.ts')
      ?.contents || ''
  );
}

/**
 * Creates a minimal interface whose single method returns a value of the specified type.
 * @param factory The factory instance used to create the interface.
 * @param typeName The name of the type to use as the return type.
 * @returns The created interface.
 */
export function withReturnType(factory: Factory, typeName: string): Interface {
  return factory.interface({
    name: factory.stringLiteral('MyInterface'),
    methods: [
      factory.method({
        name: factory.stringLiteral('myMethod'),
        returns: factory.returnValue({
          value: factory.complexValue({
            typeName: factory.stringLiteral(typeName),
          }),
        }),
      }),
    ],
  });
}

/**
 * Creates a minimal interface whose single method takes a value of the specified type.
 * @param factory The factory instance used to create the interface.
 * @param typeName The name of the type to use as the parameter type.
 * @returns The created interface.
 */
export function withParamType(factory: Factory, typeName: string): Interface {
  return factory.interface({
    name: factory.stringLiteral('MyInterface'),
    methods: [
      factory.method({
        name: factory.stringLiteral('myMethod'),
        parameters: [
          factory.parameter({
            name: factory.stringLiteral('myParam'),
            value: factory.complexValue({
              typeName: factory.stringLiteral(typeName),
            }),
          }),
        ],
      }),
    ],
  });
}
