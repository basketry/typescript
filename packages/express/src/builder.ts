import {
  MapKey,
  Parameter,
  Property,
  Scalar,
  Service,
  TypedValue,
  getEnumByName,
  isRequired,
} from 'basketry';
import { NamespacedExpressOptions } from './types';
import { camel, pascal } from 'case';
import { buildParameterName, buildPropertyName } from '@basketry/typescript';

const openAPIVariableRegex = /\{(\w+)\}/g;

export class Builder {
  constructor(
    private readonly service: Service,
    private readonly options: NamespacedExpressOptions,
  ) {}

  buildAccessor(
    p: Parameter | Property,
    mode: 'input' | 'output',
    paren: 'brackets' | 'parens' = 'brackets',
  ): string {
    const typescriptIdiomatic =
      p.kind === 'Parameter' ? buildParameterName(p) : buildPropertyName(p);

    const accessor = mode === 'input' ? p.name.value : typescriptIdiomatic;

    const open = paren === 'parens' ? '(' : '[';
    const close = paren === 'parens' ? ')' : ']';

    return accessor === typescriptIdiomatic
      ? `.${accessor}`
      : `${open}'${accessor}'${close}`;
  }

  buildPropertyValue(
    prop: Parameter | Property,
    parentName: string,
    mode: 'input' | 'output',
  ): string {
    const accessor = this.buildAccessor(prop, mode);
    const value = `${parentName}${accessor}`;

    return this.buildValue(prop, mode, value);
  }

  buildValue(
    typedValue: TypedValue,
    mode: 'input' | 'output',
    value: string,
    asType?: string,
  ): string {
    const mapperFn = `${this.buildMapperName(typedValue.typeName.value, mode)}`;
    if (typedValue.isPrimitive) {
      if (
        typedValue.typeName.value === 'date' ||
        typedValue.typeName.value === 'date-time'
      ) {
        switch (mode) {
          case 'input':
            if (isRequired(typedValue)) {
              return `new Date(${value})`;
            } else {
              return `typeof ${value} === 'undefined' ? undefined : new Date(${value})`;
            }
          case 'output':
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

  buildMapperName(typeName: string, mode: 'input' | 'output'): string {
    return `map${mode === 'input' ? 'From' : 'To'}${this.buildDtoName(
      typeName,
    )}`;
  }

  buildExpressRoute(path: string): string {
    return path.replace(openAPIVariableRegex, ':$1');
  }
}
