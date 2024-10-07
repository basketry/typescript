import {
  Enum,
  Generator,
  getTypeByName,
  Interface,
  isRequired,
  Method,
  Service,
  StringLiteral,
  Type,
  Union,
} from 'basketry';
import { camel, title } from 'case';
import {
  buildEnumName,
  buildFilePath,
  buildInterfaceName,
  buildMethodName,
  buildMethodParamsTypeName,
  buildMethodReturnValue,
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

  const unions = from(buildUnions(service));

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

function* buildUnions(service: Service): Iterable<string> {
  for (const union of [...service.unions].sort((a, b) =>
    a.name.value.localeCompare(b.name.value),
  )) {
    yield '';
    yield* buildUnion(service, union);
  }
}

function* buildUnion(service: Service, union: Union): Iterable<string> {
  const name = buildUnionName(union);

  if (union.kind === 'DiscriminatedUnion') {
    yield `export type ${name} = ${union.members
      .map((customValue) => buildTypeName(customValue))
      .join(' | ')}`;

    for (const customValue of union.members) {
      const type = getTypeByName(service, customValue.typeName.value);
      if (!type) continue;

      const typeName = buildTypeName(customValue);
      const methodName = camel(`is_${typeName}`);
      const property = type.properties.find(
        (prop) => camel(prop.name.value) === camel(union.discriminator.value),
      );

      if (property?.value.kind !== 'PrimitiveValue') continue;

      const propertyName = buildPropertyName(property);

      const constant = property.value.constant?.value;
      if (!constant) continue;

      yield '';
      yield `export function ${methodName}(obj: ${name}): obj is ${typeName} {`;
      if (typeof constant === 'string') {
        yield `  return obj.${propertyName} === '${constant}';`;
      } else {
        yield `  return obj.${propertyName} === ${constant};`;
      }
      yield '}';
    }
  } else {
    yield `export type ${name} = ${union.members
      .map((typedValue) => buildTypeName(typedValue))
      .join(' | ')}`;
  }
}

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
  yield `): ${buildMethodReturnValue(method)};`;
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
        isRequired(prop.value) ? '' : '?'
      }: ${buildTypeName(prop.value)};`;
    }
    yield `}`;
  } else {
    yield `export type ${buildTypeName(type)} = Record<string, unknown>;`;
  }
}

function* buildEnum(e: Enum): Iterable<string> {
  yield* buildDescription(e.description, undefined, e.deprecated?.value);
  if (e.members.length) {
    yield `export type ${buildEnumName(e)} = ${e.members
      .map((v) => `'${v.content.value}'`)
      .join(' | ')}`;
  } else {
    yield `export type ${buildTypeName(e)} = never`;
  }
}

export function* buildDescription(
  description: StringLiteral[] | undefined,
  defaultValue: string | undefined,
  isDeprecated: boolean | undefined,
): Iterable<string> {
  const desc: StringLiteral[] | undefined =
    description ??
    (defaultValue
      ? [
          {
            kind: 'StringLiteral',
            value: defaultValue,
          },
        ]
      : undefined);

  if (desc || isDeprecated) {
    yield ``;
    yield `/**`;

    if (Array.isArray(desc)) {
      for (const line of desc) {
        yield ` * ${line.value}`;
      }
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
  const hasRequiredParams = method.parameters.some((p) => isRequired(p.value));

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
  const requiredParams = method.parameters.filter((p) => isRequired(p.value));
  const optionalParams = method.parameters.filter((p) => !isRequired(p.value));
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
      isRequired(param.value) ? '' : '?'
    }: ${buildTypeName(param.value, typeModule)},`;
  }

  yield '}';
}

export function* buildParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  yield buildMethodParamsTypeName(method, typeModule);
}
