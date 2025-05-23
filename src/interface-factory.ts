import {
  Enum,
  Generator,
  getTypeByName,
  Interface,
  isRequired,
  Method,
  Scalar,
  Service,
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

  if (union.discriminator) {
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

      if (!property) continue;
      if (!property.isPrimitive) continue;

      const propertyName = buildPropertyName(property);

      const constant = property.constant?.value;
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
  yield `): ${buildMethodReturnType(method)};`;
}

function* buildType(type: Type): Iterable<string> {
  yield* buildDescription(type.description, undefined, type.deprecated?.value);

  yield `export type ${buildTypeName(type)} =`;

  const typeNames = new Set<string>();

  const mapValue = type.mapProperties?.value;
  const hasProps = !!type.properties.length;
  const hasMapProps = !!type.mapProperties;

  const hasRequiredKeys =
    type.mapProperties && type.mapProperties.requiredKeys.length > 0;

  const maxPropCount = type.rules.find(
    (rule) => rule.id === 'object-max-properties',
  )?.max.value;

  let emittedProps = 0;

  if (!hasProps && !hasMapProps) {
    yield `Record<string, unknown>;`;
  } else {
    if (hasProps || hasRequiredKeys) {
      yield `{`;
      for (const prop of type.properties) {
        if (!isRequired(prop)) typeNames.add('undefined');
        const typeName = buildTypeName(prop);
        typeNames.add(typeName);
        yield* buildDescription(
          prop.description,
          undefined,
          prop.deprecated?.value,
        );
        yield `  ${buildPropertyName(prop)}${
          isRequired(prop) ? '' : '?'
        }: ${typeName};`;
        emittedProps++;
      }

      if (type.mapProperties && type.mapProperties.requiredKeys.length > 0) {
        const valueTypeName = buildTypeName(type.mapProperties.value);
        for (const key of type.mapProperties.requiredKeys) {
          yield `  ${camel(key.value)}: ${valueTypeName};`;
          emittedProps++;
        }
      }

      yield `}`;
    }

    if (typeof maxPropCount !== 'number' || maxPropCount > emittedProps) {
      if ((hasProps || hasRequiredKeys) && hasMapProps && mapValue) {
        yield ` & `;
      }

      if (hasMapProps && mapValue) {
        const mapValueType = buildTypeName(mapValue);
        typeNames.add(mapValueType);

        // TODO: prevent this from making each of the enum keys required

        const keyTypeName = type.mapProperties
          ? buildTypeName(type.mapProperties.key)
          : 'string';

        yield `Record<${keyTypeName}, ${Array.from(typeNames)
          .sort()
          .join(' | ')}>`;
      }
    }
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
