import {
  File,
  FileFactory,
  Interface,
  isRequired,
  Method,
  Service,
  Type,
} from 'basketry';
import { format } from 'prettier';

import { pascal, camel } from 'case';
import { warning } from './warning';

export class InterfaceFactory implements FileFactory {
  public readonly target = 'typescript';

  build(service: Service): File[] {
    const interfaces = service.interfaces
      .map((int) => Array.from(this.buildInterface(int)).join('\n'))
      .join('\n\n');

    const types = service.types
      .map((type) => Array.from(this.buildType(type)).join('\n'))
      .join('\n\n');

    const enums = service.enums
      .map(
        (e) =>
          `export type ${pascal(e.name)} = ${e.values
            .map((v) => `'${v}'`)
            .join(' | ')}`,
      )
      .join('\n\n');

    const contents = [warning, interfaces, enums, types].join('\n\n');
    const formatted = format(contents, {
      singleQuote: true,
      useTabs: false,
      tabWidth: 2,
      trailingComma: 'all',
      parser: 'typescript',
    });

    return [
      {
        path: [`v${service.majorVersion}`, 'types.ts'],
        contents: formatted,
      },
    ];
  }

  private *buildInterface(int: Interface): Iterable<string> {
    yield* this.buildDescription(int.description);
    yield `export interface ${pascal(int.name)}Service {`;
    for (const method of int.methods) {
      yield* this.buildMethod(method);
      yield '';
    }
    yield `}`;
  }

  private *buildMethod(method: Method): Iterable<string> {
    yield* this.buildDescription(method.description, 2);

    const requiredParams = method.parameters.filter((p) => isRequired(p));
    const optionalParams = method.parameters.filter((p) => !isRequired(p));
    const sortedParams = [...requiredParams, ...optionalParams];

    yield `  async ${camel(method.name)}(${
      method.parameters.length
        ? `params${requiredParams.length ? '' : '?'}: {`
        : ''
    }`;

    for (const param of sortedParams) {
      if (param.description) {
        yield* this.buildDescription(param.description, 2);
      }

      yield `    ${camel(param.name)}${
        isRequired(param) ? '' : '?'
      }: ${this.buildTypeName(param)},`;
    }

    yield `  ${method.parameters.length ? '}' : ''}): Promise<${
      method.returnType ? this.buildTypeName(method.returnType) : 'void'
    }>;`;
  }

  /**
   *
   * @param type
   */
  private *buildType(type: Type): Iterable<string> {
    yield* this.buildDescription(type.description);
    if (type.properties.length) {
      yield `export type ${pascal(type.name)} = {`;
      for (const prop of type.properties) {
        yield* this.buildDescription(prop.description);
        yield `  ${camel(prop.name)}${
          isRequired(prop) ? '' : '?'
        }: ${this.buildTypeName(prop)};`;
      }
      yield `}`;
    } else {
      yield `export type ${pascal(type.name)} = Record<string, unknown>;`;
    }
  }

  private *buildDescription(
    description: string | string[] | undefined,
    // params: Parameter[] = [],
    indent: number = 0,
  ): Iterable<string> {
    const s = ' '.repeat(indent);

    if (description) {
      yield ``;
      yield `${s}/**`;

      if (description) {
        if (typeof description === 'string') {
          yield `${s} * ${description}`;
        } else {
          for (const line of description) {
            yield `${s} * ${line}`;
          }
        }
      }

      // const sortedParams = [
      //   ...params.filter((p) => isRequired(p)),
      //   ...params.filter((p) => !isRequired(p)),
      // ];

      // for (const param of sortedParams) {
      //   yield `${s} * @param ${camel(param.name)}${
      //     param.description ? ` ${param.description}` : ''
      //   }`;
      // }

      yield `${s} */`;
    }
  }

  private buildTypeName(type: {
    typeName: string;
    isUnknown: boolean;
    enumValues?: string[];
    isArray: boolean;
    isLocal: boolean;
  }): string {
    const arrayify = (n: string) => (type.isArray ? `${n}[]` : n);

    if (type.isUnknown) {
      return arrayify('any');
    } else if (type.isLocal) {
      return arrayify(pascal(type.typeName));
    }

    switch (type.typeName) {
      case 'string':
        if (type.enumValues) {
          return arrayify(
            `(${type.enumValues.map((v) => `'${v}'`).join(' | ')})`,
          );
        } else {
          return arrayify('string');
        }
      case 'number':
      case 'integer':
        return arrayify('number');
      case 'boolean':
        return arrayify('boolean');
      default:
        return arrayify('any');
    }
  }
}
