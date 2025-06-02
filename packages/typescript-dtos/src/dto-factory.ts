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
import { NamespacedTypescriptDTOOptions } from './types';
import { format, from } from '@basketry/typescript/lib/utils';
import {
  buildEnumName,
  buildFilePath,
  buildTypeName,
} from '@basketry/typescript';
import { camel, pascal } from 'case';
import { BaseFactory } from './base-factory';

export class ExpressDtoFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedTypescriptDTOOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    // const handlers = Array.from(this.buildHandlers()).join('\n');
    const types = Array.from(this.buildTypes()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['dtos', 'types.ts'], this.service, this.options),
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
    const xtypeName = buildTypeName(type);
    yield `/** The over-the-wire representation of the {@link ${this.typesModule}.${xtypeName}|${xtypeName}} type. */`;
    yield `export type ${this.builder.buildDtoName(type.name.value)} =`;
    const props = [...type.properties].sort((a, b) =>
      a.name.value.localeCompare(b.name.value),
    );

    const typeNames = new Set<string>();

    const mapValue = type.mapProperties?.value;
    const hasProps = !!props.length;
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
        for (const prop of props) {
          if (!isRequired(prop)) typeNames.add('undefined');
          const typeName = this.buildTypeName(prop);
          typeNames.add(typeName);
          yield `  '${prop.name.value}'${
            isRequired(prop) ? '' : '?'
          }: ${typeName};`;
          emittedProps++;
        }

        if (type.mapProperties && type.mapProperties.requiredKeys.length > 0) {
          const valueTypeName = this.buildTypeName(type.mapProperties.value);
          for (const key of type.mapProperties.requiredKeys) {
            yield `  '${key.value}': ${valueTypeName};`;
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
          const mapValueType = this.buildTypeName(mapValue);
          typeNames.add(mapValueType);

          // TODO: prevent this from making each of the enum keys required

          const keyTypeName = type.mapProperties
            ? this.buildTypeName(type.mapProperties.key)
            : 'string';

          yield `Record<${keyTypeName}, ${Array.from(typeNames)
            .sort()
            .join(' | ')}>`;
        }
      }
    }
  }

  private *buildUnion(union: Union): Iterable<string> {
    const typeName = buildTypeName(union);
    yield `/** The over-the-wire representation of the {@link ${this.typesModule}.${typeName}|${typeName}} type. */`;
    yield `export type ${this.builder.buildDtoName(union.name.value)} = ${union.members
      .map((m: CustomValue | TypedValue): string => {
        const baseName = () => {
          if (m.isPrimitive) {
            switch (m.typeName.value) {
              case 'date':
              case 'date-time':
                return 'string';
              default:
                return buildTypeName(m);
            }
          }

          return this.builder.buildDtoName(m.typeName.value);
        };

        return baseName() + (m.isArray ? '[]' : '');
      })
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
