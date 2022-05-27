import { pascal, camel } from 'case';

import {
  Enum,
  Interface,
  Method,
  Parameter,
  ParameterSpec,
  Property,
  ReturnType,
  Type,
} from 'basketry';

function prefix(typeModule: string | undefined, name: string) {
  return typeModule ? `${typeModule}.${name}` : name;
}

export function buildInterfaceName(
  int: Interface,
  typeModule?: string,
): string {
  return prefix(typeModule, `${pascal(`${int.name}_service`)}`);
}

export function buildMethodName(method: Method, typeModule?: string): string {
  return prefix(typeModule, camel(method.name.value));
}

export function buildParameterName(
  parameter: Parameter | ParameterSpec,
  typeModule?: string,
): string {
  return prefix(typeModule, camel(parameter.name.value));
}

export function buildPropertyName(
  property: Property,
  typeModule?: string,
): string {
  return prefix(typeModule, camel(property.name.value));
}

/**
 * Builds name of the type in idiomatic TypeScript casing.
 * @param type The intermediate representation of a type.
 * @param typeModule The named used if the type is imported from another module. (eg. the `otherTypes` of `import * as otherTypes from './types';`)
 * @returns The name of the type in idiomatic TypeScript casing
 */
export function buildTypeName(
  type: Type | Parameter | Property | ReturnType | Enum,
  typeModule?: string,
): string {
  if (isType(type) || isEnum(type)) {
    if (typeModule) {
      return `${typeModule}.${pascal(type.name.value)}`;
    } else {
      return pascal(type.name.value);
    }
  }

  const arrayify = (n: string) => (type.isArray ? `${n}[]` : n);

  if (type.isUnknown) {
    return arrayify('any');
  } else if (type.isLocal) {
    if (typeModule) {
      return `${typeModule}.${arrayify(pascal(type.typeName.value))}`;
    } else {
      return arrayify(pascal(type.typeName.value));
    }
  }

  switch (type.typeName.value) {
    case 'string':
      return arrayify('string');
    case 'number':
    case 'integer':
    case 'long':
    case 'float':
    case 'double':
      return arrayify('number');
    case 'boolean':
      return arrayify('boolean');
    case 'date':
    case 'date-time':
      return arrayify('Date');
    default:
      return arrayify('any');
  }
}

/**
 * Builds name of the root type in idiomatic TypeScript casing. If the type is an array, the root type is the type of the array item. If the type is not an array, this function returns the same value as `buildTypeName`.
 * @param type The intermediate representation of a type.
 * @param typeModule The named used if the type is imported from another module. (eg. the `otherTypes` of `import * as otherTypes from './types';`)
 * @returns The name of the root type in idiomatic TypeScript casing.
 */
export function buildRootTypeName(
  type: Type | Parameter | Property | ReturnType,
  typeModule?: string,
): string {
  if (isType(type) || isEnum(type)) {
    if (typeModule) {
      return `${typeModule}.${pascal(type.name.value)}`;
    } else {
      return pascal(type.name.value);
    }
  }

  if (type.isUnknown) {
    return 'any';
  } else if (type.isLocal) {
    if (typeModule) {
      return `${typeModule}.${pascal(type.typeName.value)}`;
    } else {
      return pascal(type.typeName.value);
    }
  }

  switch (type.typeName.value) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'any';
  }
}

export function buildMethodReturnType(
  method: Method,
  typeModule?: string,
): string {
  return `Promise<${
    method.returnType ? buildTypeName(method.returnType, typeModule) : 'void'
  }>`;
}

function isType(
  type: Type | Parameter | Property | ReturnType | Enum,
): type is Type {
  return type['isLocal'] === undefined;
}

function isEnum(
  type: Type | Parameter | Property | ReturnType | Enum,
): type is Enum {
  return type['values'] !== undefined;
}

export function buildEnumName(e: Enum): string {
  return pascal(e.name.value);
}
