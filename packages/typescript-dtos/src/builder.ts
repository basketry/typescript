import {
  Parameter,
  Property,
  Service,
  MemberValue,
  getEnumByName,
  isRequired,
} from 'basketry';
import { NamespacedTypescriptDTOOptions } from './types';
import { camel, pascal } from 'case';
import { buildParameterName, buildPropertyName } from '@basketry/typescript';

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
    typedValue: MemberValue,
    mode: Mode,
    value: string,
    asType?: string,
  ): string {
    const mapperFn = `${this.buildMapperName(typedValue.typeName.value, mode)}`;
    if (typedValue.kind === 'PrimitiveValue') {
      if (
        typedValue.typeName.value === 'date' ||
        typedValue.typeName.value === 'date-time'
      ) {
        switch (mode) {
          case 'server-inbound':
          case 'client-outbound':
            if (isRequired(typedValue)) {
              return `new Date(${value})`;
            } else {
              return `typeof ${value} === 'undefined' ? undefined : new Date(${value})`;
            }
          case 'server-outbound':
          case 'client-inbound':
            if (isRequired(typedValue)) {
              return `${value}.toISOString()${typedValue.typeName.value === 'date' ? '.split("T")[0]' : ''}`;
            } else {
              return `typeof ${value} === 'undefined' ? undefined : ${value}.toISOString()${typedValue.typeName.value === 'date' ? '.split("T")[0]' : ''}`;
            }
        }
      } else {
        return `${value}`;
      }
    } else {
      const e = getEnumByName(this.service, typedValue.typeName.value);
      if (e) {
        return `${value}`;
      } else {
        if (isRequired(typedValue)) {
          if (typedValue.isArray) {
            return `${value}?.map(${mapperFn})`;
          } else {
            return `${mapperFn}(${value}${asType ? ` as ${asType}` : ''})`;
          }
        } else {
          if (typedValue.isArray) {
            return `${value}?.map(${mapperFn})`;
          } else {
            return `typeof ${value} === 'undefined' ? undefined : ${mapperFn}(${value}${asType ? ` as ${asType}` : ''})`;
          }
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
