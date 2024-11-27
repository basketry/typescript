import {
  File,
  HttpMethod,
  HttpParameter,
  Interface,
  isRequired,
  Method,
  Service,
} from 'basketry';
import { BaseFactory } from './base-factory';
import { NamespacedExpressOptions } from './types';
import { format, from } from '@basketry/typescript/lib/utils';
import {
  buildFilePath,
  buildInterfaceName,
  buildMethodName,
} from '@basketry/typescript';
import { pascal } from 'case';
import { buildRequestHandlerTypeName } from './dto-factory';

type MethodTypes = {
  verb: string;
  path: string;
  name: string;
  deprecated: boolean;
  routeParams: Iterable<string>;
  queryParams: Iterable<string>;
  reqBody: Iterable<string>;
  resBody: Iterable<string>;
};

export class ExpressTypesFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    const types = Array.from(this.buildTypes()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['express', 'types.ts'], this.service, this.options),
      contents: format([preamble, types].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildTypes(): Iterable<string> {
    yield* this.buildInputType();
    yield '';
    yield* this.buildMiddlewareType();
    yield '';
    yield* this.buildHandlers();
  }

  private buildServiceGetterName(int: Interface): string {
    return `get${pascal(buildInterfaceName(int))}`;
  }

  private *buildErrorTypes(): Iterable<string> {
    yield `export type MethodNotFoundError = {`;
    yield `/** The error message */`;
    yield `code: '';`;
    yield `/** The error code */`;
    yield 'code: number;';
    yield `}`;
  }

  private *buildInputType(): Iterable<string> {
    yield `export type RouterFactoryInput = {`;
    yield `/** OpenAPI schema as a JSON object */`;
    yield 'schema: any;';

    yield '';
    for (const int of [...this.service.interfaces].sort((a, b) =>
      a.name.value.localeCompare(b.name.value),
    )) {
      const serviceGetterName = this.buildServiceGetterName(int);
      this.touchRequestImport();
      this.touchResponseImport();
      yield `${serviceGetterName}: (req: Request, res: Response) => ${buildInterfaceName(
        int,
        this.typesModule,
      )};`;
    }
    yield '';

    yield 'middleware?: Middleware | Middleware[];';
    yield 'handlerOverrides?: Middleware;';
    yield 'swaggerUiVersion?: string;';
    yield `}`;
  }

  private *buildMiddlewareType(): Iterable<string> {
    const methods = this.service.interfaces
      .flatMap((int) => int.methods)
      .sort((a, b) => a.name.value.localeCompare(b.name.value));

    yield `export type Middleware = {`;

    this.touchRequestHandlerImport();
    yield '/** Middleware to be applied to the Swagger UI handler. */';
    yield `_onlySwaggerUI?: RequestHandler | RequestHandler[];`;
    yield '/** Middleware to be applied to all handlers _except_ Swagger UI after any other method-specific middleware. */';
    yield `_exceptSwaggerUI?: RequestHandler | RequestHandler[];`;

    for (const method of methods) {
      const handlerType = buildRequestHandlerTypeName(method.name.value);
      if (method.deprecated) {
        yield `/** @deprecated */`;
      }
      yield `${buildMethodName(method)}?: ${handlerType} | ${handlerType}[];`;
    }
    yield `}`;
  }

  private *buildHandlers(): Iterable<string> {
    const types: MethodTypes[] = [];

    for (const int of this.service.interfaces) {
      for (const path of int.protocols.http) {
        for (const httpMethod of path.methods) {
          const method = int.methods.find(
            (m) => m.name.value === httpMethod.name.value,
          );
          if (!method) continue;

          types.push(
            this.buildMethodTypes(int, method, path.path.value, httpMethod),
          );
        }
      }
    }

    for (const method of types.sort((a, b) => a.name.localeCompare(b.name))) {
      const typeParams = `${from(method.routeParams)},${from(
        method.resBody,
      )},${from(method.reqBody)},${from(method.queryParams)}`;

      if (method.deprecated) yield '/** @deprecated */';
      this.touchRequestHandlerImport();
      yield `export type ${buildRequestHandlerTypeName(
        method.name,
      )} = RequestHandler<${typeParams}>`;
      yield '';
    }
  }

  private buildMethodTypes(
    int: Interface,
    method: Method,
    path: string,
    httpMethod: HttpMethod,
  ): MethodTypes {
    return {
      verb: httpMethod.verb.value,
      path: path,
      name: method.name.value,
      deprecated: method.deprecated?.value ?? false,
      routeParams: this.buildRouteParams(httpMethod),
      queryParams: this.buildQueryParams(method, httpMethod),
      reqBody: this.buildBodyParams(method, httpMethod),
      resBody: this.buildResponseBody(method),
    };
  }

  private buildDtoName(typeName: string): string {
    return `${this.dtosModule}.${this.builder.buildDtoName(typeName)}`;
  }

  private *buildResponseBody(method: Method): Iterable<string> {
    if (method.returnType) {
      yield this.buildDtoName(method.returnType.typeName.value);
    } else {
      yield 'void';
    }
  }

  private *buildRouteParams(httpMethod: HttpMethod): Iterable<string> {
    yield '{';
    for (const param of httpMethod.parameters) {
      if (param.in.value === 'path') {
        // TODO: coerce non-string values to correct type
        yield `'${param.name.value}': string;`;
      }
    }
    yield '}';
  }

  private *buildQueryParams(
    method: Method,
    httpMethod: HttpMethod,
  ): Iterable<string> {
    yield '{';
    for (const param of httpMethod.parameters) {
      if (param.in.value === 'query') {
        const optional = httpIsRequired(param, method) ? '' : '?';
        // TODO: coerce non-string values to correct type
        yield `'${param.name.value}'${optional}: string;`;
      }
    }
    yield '}';
  }

  private *buildBodyParams(
    method: Method,
    httpMethod: HttpMethod,
  ): Iterable<string> {
    const httpBodyParam = httpMethod.parameters.find(
      (p) => p.in.value === 'body',
    );

    if (httpBodyParam) {
      const methodParam = method.parameters.find(
        (p) => p.name.value === httpBodyParam.name.value,
      );

      if (methodParam) {
        // TODO: consider direct enum response types
        yield this.buildDtoName(methodParam.typeName.value);
      } else {
        yield 'never';
      }
    } else {
      yield 'never';
    }
  }
}

function httpIsRequired(param: HttpParameter, method: Method): boolean {
  const methodParam = method.parameters.find(
    (p) => p.name.value === param.name.value,
  );

  if (!methodParam) return false;
  return isRequired(methodParam);
}
