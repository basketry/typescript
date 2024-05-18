import {
  Enum,
  Generator,
  Interface,
  isRequired,
  Method,
  Scalar,
  Type,
} from 'basketry';
import { title } from 'case';
import {
  buildEnumName,
  buildFilePath,
  buildInterfaceName,
  buildMethodName,
  buildMethodParamsTypeName,
  buildMethodReturnType,
  buildParameterName,
  buildPropertyName,
  buildTypeName,
  buildUnionName,
} from './name-factory';

import { eslintDisable, format, from } from './utils';

import { header as warning } from './warning';
import { NamespacedTypescriptOptions } from './types';

export const generateTypes: Generator = (
  service,
  options?: NamespacedTypescriptOptions,
) => {
  const interfaces = service.interfaces
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((int) => Array.from(buildInterface(int)).join('\n'))
    .join('\n\n');

  const params = service.interfaces
    .flatMap((int) => int.methods)
    .filter((method) => method.parameters.length > 0)
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((method) => Array.from(buildMethodParamsType(method)).join('\n'))
    .join('\n\n');

  const types = service.types
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((type) => Array.from(buildType(type)).join('\n'))
    .join('\n\n');

  const enums = service.enums
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((e) => Array.from(buildEnum(e)).join('\n'))
    .join('\n\n');

  const unions = service.unions
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map(
      (union) =>
        `export type ${buildUnionName(union)} = ${union.members
          .map((member) => buildTypeName(member))
          .join(' | ')}`,
    )
    .join('\n\n');

  const header = warning(service, require('../package.json'), options);

  const ignore = from(eslintDisable(options));

  const contents = [
    header,
    ignore,
    interfaces,
    params,
    enums,
    types,
    unions,
  ].join('\n\n');

  return [
    {
      path: buildFilePath(['types.ts'], service, options),
      contents: format(contents, options),
    },
  ];
};

function* buildInterface(int: Interface): Iterable<string> {
  yield* buildDescription(
    int.description,
    `Interface for the ${title(int.name.value)} Service`,
    int.deprecated?.value,
  );
  yield `export interface ${buildInterfaceName(int)} {`;
  for (const method of int.methods.sort((a, b) =>
    a.name.value.localeCompare(b.name.value),
  )) {
    yield* buildMethod(method);
    yield '';
  }
  yield `}`;
}

function* buildMethod(method: Method): Iterable<string> {
  yield* buildDescription(
    method.description,
    undefined,
    method.deprecated?.value,
  );
  yield `async ${buildMethodName(method)}(`;
  yield* buildMethodParams(method);
  yield `): ${buildMethodReturnType(method)};`;
}

function* buildType(type: Type): Iterable<string> {
  yield* buildDescription(type.description, undefined, type.deprecated?.value);
  if (type.properties.length) {
    yield `export type ${buildTypeName(type)} = {`;
    for (const prop of type.properties) {
      yield* buildDescription(
        prop.description,
        undefined,
        prop.deprecated?.value,
      );
      yield `  ${buildPropertyName(prop)}${
        isRequired(prop) ? '' : '?'
      }: ${buildTypeName(prop)};`;
    }
    yield `}`;
  } else {
    yield `export type ${buildTypeName(type)} = Record<string, unknown>;`;
  }
}

function* buildEnum(e: Enum): Iterable<string> {
  yield* buildDescription(e.description, undefined, e.deprecated?.value);
  if (e.values.length) {
    yield `export type ${buildEnumName(e)} = ${e.values
      .map((v) => `'${v.content.value}'`)
      .join(' | ')}`;
  } else {
    yield `export type ${buildTypeName(e)} = never`;
  }
}

export function* buildDescription(
  description: string | Scalar<string> | Scalar<string>[] | undefined,
  defaultValue: string | undefined,
  isDeprecated: boolean | undefined,
): Iterable<string> {
  const desc = description || defaultValue;
  if (desc || isDeprecated) {
    yield ``;
    yield `/**`;

    if (Array.isArray(desc)) {
      for (const line of desc) {
        yield ` * ${line.value}`;
      }
    } else if (typeof desc === 'string') {
      yield ` * ${desc}`;
    } else if (desc) {
      yield ` * ${desc.value}`;
    }

    if (isDeprecated) {
      yield ` * @deprecated`;
    }

    yield ` */`;
  }
}

export function* buildMethodParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  yield `export type ${buildMethodParamsTypeName(method, typeModule)} =`;
  yield* internalBuildParamsType(method, typeModule);
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

  yield buildMethodParamsTypeName(method, typeModule);
}

function* internalBuildParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  const requiredParams = method.parameters.filter((p) => isRequired(p));
  const optionalParams = method.parameters.filter((p) => !isRequired(p));
  const sortedParams = [...requiredParams, ...optionalParams];

  yield '{';

  for (const param of sortedParams) {
    if (param.description) {
      yield* buildDescription(
        param.description,
        undefined,
        param.deprecated?.value,
      );
    }

    yield `    ${buildParameterName(param)}${
      isRequired(param) ? '' : '?'
    }: ${buildTypeName(param, typeModule)},`;
  }

  yield '}';
}

export function* buildParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  yield buildMethodParamsTypeName(method, typeModule);
}
