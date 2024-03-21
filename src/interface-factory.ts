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
  buildInterfaceName,
  buildMethodName,
  buildMethodReturnType,
  buildParameterName,
  buildPropertyName,
  buildTypeName,
  buildUnionName,
} from './name-factory';

import { eslintDisable, format, from } from './utils';

import { header as warning } from './warning';

export const generateTypes: Generator = (service, options) => {
  const interfaces = service.interfaces
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((int) => Array.from(buildInterface(int)).join('\n'))
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

  const contents = [header, ignore, interfaces, enums, types, unions].join(
    '\n\n',
  );

  return [
    {
      path: [`v${service.majorVersion.value}`, 'types.ts'],
      contents: format(contents, options),
    },
  ];
};

function* buildInterface(int: Interface): Iterable<string> {
  yield* buildDescription(
    int.description,
    `Interface for the ${title(int.name.value)} Service`,
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

function* buildEnum(e: Enum): Iterable<string> {
  yield* buildDescription(e.description);
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
  defaultValue?: string,
): Iterable<string> {
  const desc = description || defaultValue;
  if (desc) {
    yield ``;
    yield `/**`;

    if (Array.isArray(desc)) {
      for (const line of desc) {
        yield ` * ${line.value}`;
      }
    } else if (typeof desc === 'string') {
      yield ` * ${desc}`;
    } else {
      yield ` * ${desc.value}`;
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
