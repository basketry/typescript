import {
  Parameter,
  Property,
  Service,
  getEnumByName,
  isRequired,
} from 'basketry';
import { NamespacedExpressOptions } from './types';
import { pascal } from 'case';
import { buildParameterName, buildPropertyName } from '@basketry/typescript';

const openAPIVariableRegex = /\{(\w+)\}/g;

export class Builder {
  constructor(
    private readonly service: Service,
    private readonly options: NamespacedExpressOptions,
  ) {}

  buildAccessor(p: Property | Parameter, mode: 'input' | 'output'): string {
    const typescriptIdiomatic =
      p.kind === 'Parameter' ? buildParameterName(p) : buildPropertyName(p);

    const accessor = mode === 'input' ? p.name.value : typescriptIdiomatic;

    return accessor === typescriptIdiomatic
      ? `.${accessor}`
      : `['${accessor}']`;
  }

  buildPropertyValue(
    prop: Property,
    name: string,
    mode: 'input' | 'output',
  ): string {
    const accessor = this.buildAccessor(prop, mode);
    const value = `${name}${accessor}`;

    const mapperFn = `${this.buildMapperName(prop.typeName.value, mode)}`;
    if (prop.isPrimitive) {
      if (
        prop.typeName.value === 'date' ||
        prop.typeName.value === 'date-time'
      ) {
        switch (mode) {
          case 'input':
            if (isRequired(prop)) {
              return `new Date(${value})`;
            } else {
              return `typeof ${value} === 'undefined' ? undefined : new Date(${value})`;
            }
          case 'output':
            if (isRequired(prop)) {
              return `${value}.toISOString()`;
            } else {
              return `typeof ${value} === 'undefined' ? undefined : ${value}.toISOString()`;
            }
        }
      } else {
        return `${value}`;
      }
    } else {
      const e = getEnumByName(this.service, prop.typeName.value);
      if (e) {
        return `${value}`;
      } else {
        if (isRequired(prop)) {
          if (prop.isArray) {
            return `${value}?.map(${mapperFn})`;
          } else {
            return `${mapperFn}(${value})`;
          }
        } else {
          if (prop.isArray) {
            return `${value}?.map(${mapperFn})`;
          } else {
            return `typeof ${value} === 'undefined' ? undefined : ${mapperFn}(${value})`;
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
