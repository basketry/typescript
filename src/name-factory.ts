import { pascal, camel } from 'case';

import {
  Enum,
  HttpParameter,
  Interface,
  Method,
  Parameter,
  Property,
  ReturnType,
  Service,
  Type,
  TypedValue,
  Union,
} from 'basketry';
import { NamespacedTypescriptOptions } from './types';

function prefix(typeModule: string | undefined, name: string) {
  return typeModule ? `${typeModule}.${name}` : name;
}

export function buildFilePath(
  path: string[],
  service: Service,
  options: NamespacedTypescriptOptions | undefined,
): string[] {
  if (options?.typescript?.includeVersion === false) {
    return path;
  } else {
    return [`v${service.majorVersion.value}`, ...path];
  }
}

export function buildInterfaceName(
  int: Interface,
  typeModule?: string,
): string {
  return prefix(typeModule, `${pascal(`${int.name.value}_service`)}`);
}

export function buildMethodName(method: Method, typeModule?: string): string {
  return prefix(typeModule, camel(method.name.value));
}

export function buildParameterName(
  parameter: Parameter | HttpParameter,
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

export function buildMethodParamsTypeName(
  method: Method,
  typeModule?: string,
): string {
  return prefix(typeModule, `${pascal(method.name.value)}Params`);
}

/**
 * Builds name of the type in idiomatic TypeScript casing.
 * @param type The intermediate representation of a type.
 * @param typeModule The named used if the type is imported from another module. (eg. the `otherTypes` of `import * as otherTypes from './types';`)
 * @returns The name of the type in idiomatic TypeScript casing
 */
export function buildTypeName(
  type: Type | TypedValue | Enum | Union,
  typeModule?: string,
): string {
  if (isUnion(type) || isType(type) || isEnum(type)) {
    if (typeModule) {
      return `${typeModule}.${pascal(type.name.value)}`;
    } else {
      return pascal(type.name.value);
    }
  }

  const arrayify = (n: string) => (type.isArray ? `${n}[]` : n);

  if (type.isPrimitive) {
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
      case 'null':
        return arrayify('null');
      case 'untyped':
        return arrayify('any');
      default:
        return arrayify('unknown');
    }
  } else {
    if (typeModule) {
      return `${typeModule}.${arrayify(pascal(type.typeName.value))}`;
    } else {
      return arrayify(pascal(type.typeName.value));
    }
  }
}

/**
 * Builds name of the root type in idiomatic TypeScript casing. If the type is an array, the root type is the type of the array item. If the type is not an array, this function returns the same value as `buildTypeName`.
 * @param type The intermediate representation of a type.
 * @param typeModule The named used if the type is imported from another module. (eg. the `otherTypes` of `import * as otherTypes from './types';`)
 * @returns The name of the root type in idiomatic TypeScript casing.
 */
export function buildRootTypeName(
  type: Type | TypedValue | Enum | Union,
  typeModule?: string,
): string {
  if (isUnion(type) || isType(type) || isEnum(type)) {
    if (typeModule) {
      return `${typeModule}.${pascal(type.name.value)}`;
    } else {
      return pascal(type.name.value);
    }
  }

  if (type.isPrimitive) {
    switch (type.typeName.value) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
      case 'long': // TODO: BigInt
      case 'float':
      case 'double':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
      case 'date-time':
        return 'Date';
      case 'null':
        return 'null';
      case 'untyped':
        return 'any';
      default:
        return 'unknown';
    }
  } else {
    if (typeModule) {
      return `${typeModule}.${pascal(type.typeName.value)}`;
    } else {
      return pascal(type.typeName.value);
    }
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

function isUnion(type: Type | TypedValue | Enum | Union): type is Union {
  return type['members'] !== undefined;
}

function isType(type: Type | TypedValue | Enum): type is Type {
  return type['isPrimitive'] === undefined;
}

function isEnum(type: Type | TypedValue | Enum): type is Enum {
  return type['values'] !== undefined;
}

export function buildEnumName(e: Enum): string {
  return pascal(e.name.value);
}

export function buildUnionName(union: Union): string {
  return pascal(union.name.value);
}
