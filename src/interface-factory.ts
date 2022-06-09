import {
  Generator,
  Interface,
  isRequired,
  Literal,
  Method,
  Type,
} from 'basketry';
import { format } from 'prettier';
import {
  buildEnumName,
  buildInterfaceName,
  buildMethodName,
  buildMethodReturnType,
  buildParameterName,
  buildPropertyName,
  buildTypeName,
  buildUnionName,
} from './name-factory';

import { warning } from './warning';

export const generateTypes: Generator = (service) => {
  const interfaces = service.interfaces
    .map((int) => Array.from(buildInterface(int)).join('\n'))
    .join('\n\n');

  const types = service.types
    .map((type) => Array.from(buildType(type)).join('\n'))
    .join('\n\n');

  const enums = service.enums
    .map(
      (e) =>
        `export type ${buildEnumName(e)} = ${e.values
          .map((v) => `'${v.value}'`)
          .join(' | ')}`,
    )
    .join('\n\n');

  const unions = service.unions
    .map(
      (union) =>
        `export type ${buildUnionName(union)} = ${union.members
          .map((member) => buildTypeName(member))
          .join(' | ')}`,
    )
    .join('\n\n');

  const contents = [warning, interfaces, enums, types, unions].join('\n\n');
  const formatted = format(contents, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });

  return [
    {
      path: [`v${service.majorVersion.value}`, 'types.ts'],
      contents: formatted,
    },
  ];
};

function* buildInterface(int: Interface): Iterable<string> {
  yield* buildDescription(int.description);
  yield `export interface ${buildInterfaceName(int)} {`;
  for (const method of int.methods) {
    yield* buildMethod(method);
    yield '';
  }
  yield `}`;
}

function* buildMethod(method: Method): Iterable<string> {
  yield* buildDescription(method.description);
  yield `async ${buildMethodName(method)}(`;
  yield* buildMethodParams(method);
  yield `): ${buildMethodReturnType(method)};`;
}

function* buildType(type: Type): Iterable<string> {
  yield* buildDescription(type.description);
  if (type.properties.length) {
    yield `export type ${buildTypeName(type)} = {`;
    for (const prop of type.properties) {
      yield* buildDescription(prop.description);
      yield `  ${buildPropertyName(prop)}${
        isRequired(prop) ? '' : '?'
      }: ${buildTypeName(prop)};`;
    }
    yield `}`;
  } else {
    yield `export type ${buildTypeName(type)} = Record<string, unknown>;`;
  }
}

export function* buildDescription(
  description: string | Literal<string> | Literal<string>[] | undefined,
): Iterable<string> {
  if (description) {
    yield ``;
    yield `/**`;

    if (Array.isArray(description)) {
      for (const line of description) {
        yield ` * ${line.value}`;
      }
    } else if (typeof description === 'string') {
      yield ` * ${description}`;
    } else {
      yield ` * ${description.value}`;
    }

    yield ` */`;
  }
}

export function* buildMethodParams(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  if (!method.parameters.length) return;

  const paramName = 'params';
  const hasRequiredParams = method.parameters.some((p) => isRequired(p));

  if (hasRequiredParams) {
    yield `${paramName}:`;
  } else {
    yield `${paramName}?:`;
  }

  yield* buildParamsType(method, typeModule);
}

export function* buildParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  const requiredParams = method.parameters.filter((p) => isRequired(p));
  const optionalParams = method.parameters.filter((p) => !isRequired(p));
  const sortedParams = [...requiredParams, ...optionalParams];

  yield '{';

  for (const param of sortedParams) {
    if (param.description) {
      yield* buildDescription(param.description);
    }

    yield `    ${buildParameterName(param)}${
      isRequired(param) ? '' : '?'
    }: ${buildTypeName(param, typeModule)},`;
  }

  yield '}';
}
