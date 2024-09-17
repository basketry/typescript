import {
  CustomValue,
  File,
  HttpMethod,
  Method,
  Service,
  Type,
  TypedValue,
  Union,
  getEnumByName,
  getTypeByName,
  getUnionByName,
  isRequired,
} from 'basketry';
import { NamespacedExpressOptions } from './types';
import { format, from } from '@basketry/typescript/lib/utils';
import {
  buildEnumName,
  buildFilePath,
  buildTypeName,
} from '@basketry/typescript';
import { pascal } from 'case';
import { BaseFactory } from './base-factory';

export class ExpressDtoFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    // const handlers = Array.from(this.buildHandlers()).join('\n');
    const types = Array.from(this.buildTypes()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['express', 'dtos.ts'], this.service, this.options),
      contents: format([preamble, types].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildTypes(): Iterable<string> {
    for (const type of this.serviceInfo.types) {
      yield* this.buildType(type);
      yield '';
    }

    for (const union of this.serviceInfo.unions) {
      yield* this.buildUnion(union);
      yield '';
    }
  }

  private *buildType(type: Type): Iterable<string> {
    const typeName = buildTypeName(type);
    yield `/** The over-the-wire representation of the {@link ${this.typesModule}.${typeName}|${typeName}} type. */`;
    yield `export type ${this.builder.buildDtoName(type.name.value)} = {`;
    const props = [...type.properties].sort((a, b) =>
      a.name.value.localeCompare(b.name.value),
    );

    for (const prop of props) {
      const optional = isRequired(prop) ? '' : '?';

      yield `'${prop.name.value}'${optional}: ${this.buildTypeName(prop)};`;
    }
    yield '}';
  }

  private *buildUnion(union: Union): Iterable<string> {
    const typeName = buildTypeName(union);
    yield `/** The over-the-wire representation of the {@link ${this.typesModule}.${typeName}|${typeName}} type. */`;
    yield `export type ${this.builder.buildDtoName(
      union.name.value,
    )} = ${union.members
      .map((m) => this.builder.buildDtoName(m.typeName.value))
      .join(' | ')}`;
  }

  private buildTypeName(member: TypedValue): string {
    if (member.isPrimitive) {
      switch (member.typeName.value) {
        case 'date':
        case 'date-time':
          return 'string';
        default:
          return buildTypeName(member);
      }
    }

    return member.isArray
      ? `${this.buildCustomTypeName(member)}[]`
      : this.buildCustomTypeName(member);
  }

  private buildCustomTypeName(member: CustomValue): string {
    const type = getTypeByName(this.service, member.typeName.value);
    const e = getEnumByName(this.service, member.typeName.value);
    const union = getUnionByName(this.service, member.typeName.value);

    if (type ?? union) {
      return this.builder.buildDtoName(member.typeName.value);
    } else if (e) {
      return `${this.typesModule}.${buildEnumName(e)}`;
    }

    return 'unknown';
  }
}

export function buildRequestTypeName(methodName: string): string {
  return pascal(`${methodName}_request`);
}

export function buildRequestHandlerTypeName(methodName: string): string {
  return pascal(`${methodName}_request_handler`);
}

export function hasRequestDto(httpMethod: HttpMethod): boolean {
  return httpMethod.parameters.some((p) => p.in.value === 'body');
}

export function hasResponseDto(method: Method): boolean {
  return !!method.returnType;
}
