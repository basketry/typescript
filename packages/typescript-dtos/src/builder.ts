import {
  Parameter,
  Property,
  Service,
  MemberValue,
  getEnumByName,
} from 'basketry';
import { NamespacedTypescriptDTOOptions } from './types';
import { pascal } from 'case';
import { buildParameterName, buildPropertyName } from '@basketry/typescript';
import { expr, type Expression } from './union-utils';

type Mode =
  | 'server-inbound'
  | 'server-outbound'
  | 'client-inbound'
  | 'client-outbound';

export class Builder {
  constructor(
    private readonly service: Service,
    private readonly options?: NamespacedTypescriptDTOOptions,
  ) {}

  buildAccessor(p: Parameter | Property, mode: Mode): string {
    const typescriptIdiomatic =
      p.kind === 'Parameter' ? buildParameterName(p) : buildPropertyName(p);

    const accessor =
      mode === 'server-inbound' || mode === 'client-outbound'
        ? p.name.value
        : typescriptIdiomatic;

    return accessor === typescriptIdiomatic
      ? `.${accessor}`
      : `['${accessor}']`;
  }

  buildPropertyValue(
    prop: Parameter | Property,
    parentName: string,
    mode: Mode,
  ): string {
    const accessor = this.buildAccessor(prop, mode);
    const value = `${parentName}${accessor}`;

    return this.buildValue(prop.value, mode, value);
  }

  buildValue(
    memberValue: MemberValue,
    mode: Mode,
    value: string,
    asType?: string,
  ): string {
    function buildTernary(
      whenFalse: string,
      options?: { ignoreUndefined?: boolean },
    ): string {
      const clauses: Expression[] = [];

      if (memberValue.isOptional && !options?.ignoreUndefined) {
        clauses.push(expr(`typeof ${value} === 'undefined'`));
      }

      if (memberValue.isNullable) {
        clauses.push(expr(`${value} === null`));
      }

      if (clauses.length === 0) return whenFalse;

      return `${clauses
        .map((c) => c.value)
        .join(' || ')} ? ${value} : ${whenFalse}`;
    }
    if (memberValue.kind === 'PrimitiveValue') {
      if (
        memberValue.typeName.value === 'date' ||
        memberValue.typeName.value === 'date-time'
      ) {
        switch (mode) {
          case 'server-inbound':
          case 'client-outbound':
            if (memberValue.isArray) {
              return buildTernary(`${value}.map(v => new Date(v))`);
            } else {
              return buildTernary(`new Date(${value})`);
            }

          case 'server-outbound':
          case 'client-inbound':
            if (memberValue.isArray) {
              return buildTernary(
                `${value}.map(v => v.toISOString()${memberValue.typeName.value === 'date' ? '.split("T")[0]' : ''})`,
              );
            } else {
              return buildTernary(
                `${value}.toISOString()${memberValue.typeName.value === 'date' ? '.split("T")[0]' : ''}`,
              );
            }
        }
      } else {
        return `${value}`;
      }
    } else {
      const e = getEnumByName(this.service, memberValue.typeName.value);
      if (e) {
        return `${value}`;
      } else {
        const mapperFn = `${this.buildMapperName(memberValue.typeName.value, mode)}`;
        if (memberValue.isArray) {
          return buildTernary(`${value}?.map(${mapperFn})`, {
            ignoreUndefined: true,
          });
        } else {
          return buildTernary(
            `${mapperFn}(${value}${asType ? ` as ${asType}` : ''})`,
          );
        }
      }
    }
  }

  buildDtoName(typeName: string): string {
    return `${pascal(typeName)}Dto`;
  }

  buildMapperName(typeName: string, mode: Mode): string {
    return `map${mode === 'server-inbound' || mode === 'client-outbound' ? 'From' : 'To'}${this.buildDtoName(
      typeName,
    )}`;
  }
}
