import {
  DiscriminatedUnion,
  Enum,
  Generator,
  getTypeByName,
  HttpMethod,
  Interface,
  isRequired,
  MemberValue,
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

export const generateTypes: Generator = async (
  service,
  options?: NamespacedTypescriptOptions,
) => {
  const interfaces = [...service.interfaces]
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((int) => Array.from(buildInterface(int, options)).join('\n'))
    .join('\n\n');

  const params = [...service.interfaces]
    .flatMap((int) => int.methods)
    .filter((method) => method.parameters.length > 0)
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((method) => Array.from(buildMethodParamsType(method)).join('\n'))
    .join('\n\n');

  const types = [...service.types]
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((type) => Array.from(buildType(type)).join('\n'))
    .join('\n\n');

  const enums = [...service.enums]
    .sort((a, b) => a.name.value.localeCompare(b.name.value))
    .map((e) => Array.from(buildEnum(e)).join('\n'))
    .join('\n\n');

  const unionsByMember: Map<string, Set<DiscriminatedUnion>> = new Map();
  const unions = from(buildUnions(service, unionsByMember));
  const typeGuards = from(buildTypeGuards(service, unionsByMember));

  const header = warning(service, require('../package.json'), options);

  const ignore = from(eslintDisable(options));

  // Prevents the first declaration from using the header as a JSDoc comment
  // if it doesn't already have one.
  const interstitial = (
    (interfaces || params || enums || types || unions) ??
    ''
  )
    .trim()
    .startsWith('/')
    ? ''
    : '/** */';

  const contents = [
    header,
    ignore,
    interstitial,
    interfaces,
    params,
    enums,
    types,
    unions,
    typeGuards,
  ].join('\n\n');

  return [
    {
      path: buildFilePath(['types.ts'], service, options),
      contents: await format(contents, options),
    },
  ];
};

function* buildUnions(
  service: Service,
  unionsByMember: Map<string, Set<DiscriminatedUnion>>,
): Iterable<string> {
  for (const union of [...service.unions].sort((a, b) =>
    a.name.value.localeCompare(b.name.value),
  )) {
    yield '';
    yield* buildUnion(union, unionsByMember);
  }
}

function* buildUnion(
  union: Union,
  unionsByMember: Map<string, Set<DiscriminatedUnion>>,
): Iterable<string> {
  const name = buildUnionName(union);

  const members = union.members.length
    ? union.members
        .map((typedValue: MemberValue) => buildTypeName(typedValue))
        .join(' | ')
    : 'never';

  yield* buildDescription(union.description, union.deprecated?.value);
  if (union.kind === 'DiscriminatedUnion') {
    yield `export type ${name} = ${members}`;

    for (const member of union.members) {
      const unions =
        unionsByMember.get(member.typeName.value) ??
        new Set<DiscriminatedUnion>();
      unions.add(union);
      unionsByMember.set(member.typeName.value, unions);
    }
  } else {
    yield `export type ${name} = ${members}`;
  }
}

function* buildTypeGuards(
  service: Service,
  unionsByMember: Map<string, Set<DiscriminatedUnion>>,
): Iterable<string> {
  for (const [member, unions] of unionsByMember) {
    yield '';
    yield* buildTypeGuardFunction(member, unions, service);
  }
}

function* buildTypeGuardFunction(
  memberType: string,
  unions: Iterable<DiscriminatedUnion>,
  service: Service,
): Iterable<string> {
  const type = getTypeByName(service, memberType);
  if (!type) return;

  const typeName = buildTypeName(type);
  const methodName = camel(`is_${typeName}`);

  const discriminators = new Map<string, string>();

  for (const union of unions) {
    const property = type.properties.find(
      (prop) => camel(prop.name.value) === camel(union.discriminator.value),
    );
    if (property?.value.kind !== 'PrimitiveValue') continue;
    const constant = property.value.constant;
    if (!constant) continue;

    const propertyName = buildPropertyName(property);

    const constantString =
      constant.kind === 'StringLiteral'
        ? `'${constant.value}'`
        : `${constant.value}`;

    if (property) discriminators.set(propertyName, constantString);
  }

  const unionsString = Array.from(unions)
    .map((u) => buildUnionName(u))
    .join(' | ');

  yield '';
  yield `export function ${methodName}(obj: ${unionsString}): obj is ${typeName} {`;

  yield `return ${Array.from(discriminators)
    .map(([k, v]) => `obj.${k} === ${v}`)
    .join(' && ')};`;

  yield '}';
}

function* buildInterface(
  int: Interface,
  options?: NamespacedTypescriptOptions,
): Iterable<string> {
  const nomenclature = options?.typescript?.interfaceNomenclature ?? 'service';
  const nomenclatureTitle = title(nomenclature);

  yield* buildDescription(
    int.description ?? [
      {
        kind: 'StringLiteral',
        value: `Interface for the ${title(int.name.value)} ${nomenclatureTitle}`,
      },
    ],

    int.deprecated?.value,
  );
  yield `export interface ${buildInterfaceName(int, undefined, options)} {`;
  for (const method of int.methods.sort((a, b) =>
    a.name.value.localeCompare(b.name.value),
  )) {
    const httpMethod = int.protocols?.http
      ?.flatMap((route) => route.methods)
      .find((m) => m.name.value === method.name.value);
    yield* buildMethod(method, httpMethod);
    yield '';
  }
  yield `}`;
}

function* buildMethod(
  method: Method,
  httpMethod: HttpMethod | undefined,
): Iterable<string> {
  yield* buildDescription(method.description, method.deprecated?.value);
  yield `${buildMethodName(method)}(`;
  yield* buildMethodParams(method);
  yield `): ${buildMethodReturnValue(method, httpMethod)};`;
}

function* buildType(type: Type): Iterable<string> {
  yield* buildDescription(type.description, type.deprecated?.value);

  yield `export type ${buildTypeName(type)} =`;

  const typeNames = new Set<string>();

  const mapValue = type.mapProperties?.value;
  const hasProps = !!type.properties.length;
  const hasMapProps = !!type.mapProperties;

  const hasRequiredKeys =
    type.mapProperties && type.mapProperties.requiredKeys.length > 0;

  const maxPropCount = type.rules.find(
    (rule) => rule.id === 'ObjectMaxProperties',
  )?.max.value;

  let emittedProps = 0;

  if (!hasProps && !hasMapProps) {
    yield `Record<string, unknown>;`;
  } else {
    if (hasProps || hasRequiredKeys) {
      yield `{`;
      for (const prop of type.properties) {
        if (!isRequired(prop.value)) typeNames.add('undefined');
        const typeName = buildTypeName(prop.value);
        typeNames.add(typeName);
        yield* buildDescription(prop.description, prop.deprecated?.value);
        yield `  ${buildPropertyName(prop)}${
          isRequired(prop.value) ? '' : '?'
        }: ${typeName}${prop.value.isNullable ? ` | null` : ''};`;
        emittedProps++;
      }

      if (type.mapProperties && type.mapProperties.requiredKeys.length > 0) {
        const valueTypeName = buildTypeName(type.mapProperties.value.value);
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
        const mapValueType = buildTypeName(mapValue.value);
        typeNames.add(mapValueType);

        const keyTypeName = type.mapProperties
          ? buildTypeName(type.mapProperties.key.value)
          : 'string';

        const isEnumKey = type.mapProperties?.key.value.kind === 'ComplexValue';

        const recordType = `Record<${keyTypeName}, ${Array.from(typeNames)
          .sort()
          .join(' | ')} ${mapValue.value.isNullable ? ` | null` : ''}>`;

        yield isEnumKey ? `Partial<${recordType}>` : recordType;
      }
    }
  }
}

function* buildEnum(e: Enum): Iterable<string> {
  yield* buildDescription(e.description, e.deprecated?.value);
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
  isDeprecated: boolean | undefined,
): Iterable<string> {
  const paragraphs: StringLiteral[] = description ?? [];
  if (isDeprecated) {
    paragraphs.push({ kind: 'StringLiteral', value: '@deprecated' });
  }

  if (paragraphs.length === 1 && paragraphs[0].value.length < 100) {
    yield ``;
    yield `/** ${paragraphs[0].value} */`;
  } else if (paragraphs.length > 0) {
    yield ``;
    yield `/**`;
    for (let i = 0; i < paragraphs.length; i++) {
      if (i > 0) yield ` *`;
      const paragraph = paragraphs[i].value;

      for (const line of paragraph.split('\n')) {
        const sublines = splitString(line, 80);

        for (const subline of sublines) {
          yield ` * ${subline}`;
        }
      }
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
    yield* buildDescription(param.description, param.deprecated?.value);

    yield `    ${buildParameterName(param)}${
      isRequired(param.value) ? '' : '?'
    }: ${buildTypeName(param.value, typeModule)}${param.value.isNullable ? ` | null` : ''},`;
  }

  yield '}';
}

export function* buildParamsType(
  method: Method,
  typeModule?: string,
): Iterable<string> {
  yield buildMethodParamsTypeName(method, typeModule);
}

function splitString(input: string, maxLength: number = 80): string[] {
  const words = input.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + word).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
