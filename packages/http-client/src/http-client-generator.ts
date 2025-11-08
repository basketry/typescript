import {
  allParameters,
  Generator,
  getTypeByName,
  hasRequiredParameters,
  HttpMethod,
  HttpParameter,
  HttpRoute,
  Interface,
  isRequired,
  Method,
  Parameter,
  Service,
} from 'basketry';
import { header as warning } from '@basketry/typescript/lib/warning';
import { eslintDisable, format, from } from '@basketry/typescript/lib/utils';
import {
  buildDescription,
  buildFilePath,
  buildInterfaceName,
  buildMethodName,
  buildMethodParams,
  buildMethodReturnValue,
  buildParameterName,
  buildTypeName,
} from '@basketry/typescript';
import { buildHttpClientName } from './name-factory';
import { Builder as DtoBuilder } from '@basketry/typescript-dtos/lib/builder';

import { camel, pascal, snake } from 'case';
import { NamespacedTypescriptHttpClientOptions } from './types';

export const httpClientGenerator: Generator = async (service, options) => {
  const includeFormatDateTime = allParameters(service, options).some(
    ({ parameter }) =>
      parameter.value.kind === 'PrimitiveValue' &&
      parameter.value.typeName.value === 'date-time',
  );

  const includeFormatDate =
    includeFormatDateTime ||
    allParameters(service, options).some(
      ({ parameter }) =>
        parameter.value.kind === 'PrimitiveValue' &&
        parameter.value.typeName.value === 'date',
    );

  const imports = Array.from(buildImports(service, options)).join('\n');
  const standardTypes = Array.from(
    buildStandardTypes(
      service,
      includeFormatDate,
      includeFormatDateTime,
      options,
    ),
  ).join('\n');
  const classes = Array.from(buildClasses(service, options)).join('\n');
  const header = warning(service, require('../package.json'), options);
  const disable = from(eslintDisable(options || {}));
  const contents = [header, disable, imports, standardTypes, classes].join(
    '\n\n',
  );
  return [
    {
      path: buildFilePath(['http-client.ts'], service, options),
      contents: await format(contents, options),
    },
  ];
};

function buildErrorType(
  options?: NamespacedTypescriptHttpClientOptions,
): string {
  if (options?.httpClient?.validation === 'zod') {
    return 'z.ZodIssue';
  }
  return 'validators.ValidationError';
}

function* buildImports(
  service: Service,
  options?: NamespacedTypescriptHttpClientOptions,
): Iterable<string> {
  if (options?.httpClient?.validation === 'zod') {
    yield `import * as z from 'zod';`;
  }

  yield `import * as dtos from '${
    options?.httpClient?.dtosImportPath ?? './dtos/types'
  }';`;
  yield `import * as mappers from '${
    options?.httpClient?.mappersImportPath ?? './dtos/mappers'
  }';`;
  yield `import * as types from '${
    options?.httpClient?.typesImportPath ?? './types'
  }';`;
  switch (options?.httpClient?.validation) {
    case 'zod':
    case undefined:
      yield `import * as schemas from '${
        options?.httpClient?.schemasImportPath ?? './schemas'
      }';`;
  }
  const errorType = getTypeByName(service, 'Error');
  if (!errorType) {
    yield '';
    yield `export type ClientError = {`;
    yield `  code: string;`;
    yield `  status: number;`;
    yield `  title: string;`;
    yield `}`;
  }
}

function getErrorType(service: Service): string {
  const errorType = getTypeByName(service, 'Error');

  if (errorType) {
    return buildTypeName(errorType, 'types');
  }

  return 'ClientError';
}

function* buildStandardTypes(
  service: Service,
  includeFormatDate: boolean,
  includeFormatDateTime: boolean,
  options?: NamespacedTypescriptHttpClientOptions,
): Iterable<string> {
  const methods = new Set(
    service.interfaces
      .flatMap((int) => int.protocols?.http ?? [])
      .flatMap((p) => p.methods ?? [])
      .map((m) => `'${m.verb.value}'`.toUpperCase())
      .sort((a, b) => a.localeCompare(b)),
  );

  methods.delete(`'GET'`);
  const errorType = getErrorType(service);

  yield `export interface ${pascal(`${service.title.value}Options`)} {`;
  yield `  root?: string;`;
  yield `  mapValidationError?: (error: ${buildErrorType(
    options,
  )}) => ${errorType};`;
  yield `  mapUnhandledException?: (error: any) => ${errorType};`;
  yield `}`;
  yield ``;
  yield `export interface FetchLike {`;
  yield `<T>(resource: string, init?: {`;
  if (methods.size) yield `  method?: ${Array.from(methods).join(' | ')},`;
  yield `  headers?: Record<string, string>,`;
  yield `  body?: string,`;
  yield `}): Promise<{ json(): Promise<T>, status: number }>;`;
  yield `}`;
  if (includeFormatDate || includeFormatDateTime) {
    yield '';
    yield 'function lpad(n: number, len: number): string {';
    yield '  const x = `${n}`;';
    yield '  return x.length === len ? x : `${"0".repeat(len)}${x}`.slice(-len);';
    yield '}';
    if (includeFormatDateTime) {
      yield '';
      yield 'function rpad(n: number, len: number): string {';
      yield '  const x = `${n}`;';
      yield '  return x.length === len ? x : `${"0".repeat(len)}${x}`.slice(len);';
      yield '}';
    }
    yield '';
    yield 'function formatDate(date: Date): string {';
    yield '  return `${lpad(date.getUTCFullYear(), 4)}-${lpad(';
    yield '    date.getUTCMonth() + 1,';
    yield '    2,';
    yield '  )}-${lpad(date.getUTCDate(), 2)}`;';
    yield '}';
    if (includeFormatDateTime) {
      yield '';
      yield 'function formatDateTime(date: Date): string {';
      yield '  return `${formatDate(date)}T${lpad(date.getUTCHours(), 2)}:${lpad(';
      yield '    date.getUTCMinutes(),';
      yield '    2,';
      yield '  )}:${lpad(date.getUTCSeconds(), 2)}.${rpad(date.getMilliseconds(), 3)}Z`;';
      yield '}';
    }
  }
}

// function* buildAuth(
//   int: Interface,
//   options: NamespacedTypescriptHttpClientOptions,
// ): Iterable<string> {
//   const schemes = getSecuritySchemes(int);

//   if (schemes.length && options?.httpClient?.includeAuthSchemes) {
//     yield 'private readonly auth: {';
//     for (const scheme of schemes) {
//       if (isApiKeyScheme(scheme)) {
//         yield `'${scheme.name.value}'?: {key: string}`;
//       } else if (isBasicScheme(scheme)) {
//         yield `'${scheme.name.value}'?: {username: string, password: string}`;
//       } else if (isOAuth2Scheme(scheme)) {
//         yield `'${scheme.name.value}'?: {accessToken: string}`;
//       }
//     }
//     yield '},';
//   }
// }

function* buildClasses(
  service: Service,
  options: NamespacedTypescriptHttpClientOptions,
): Iterable<string> {
  for (const int of service.interfaces) {
    yield '';
    yield* buildClass(service, int, options);
  }
}

function* buildClass(
  service: Service,
  int: Interface,
  options: NamespacedTypescriptHttpClientOptions,
): Iterable<string> {
  yield `export class ${buildHttpClientName(
    int,
    undefined,
    options,
  )} implements ${buildInterfaceName(int, 'types', options)} {`;
  yield `constructor(`;
  yield `private readonly fetch: FetchLike,`;
  // yield* buildAuth(int, options);
  yield `private readonly options?: ${pascal(
    `${service.title.value}Options`,
  )},`;
  yield `) {}`;

  const httpMethodsByMethodName = (int.protocols?.http ?? [])
    .flatMap((p) => p.methods)
    .reduce(
      (acc, m) => acc.set(m.name.value, m),
      new Map<string, HttpMethod>(),
    );

  const httpPathsByMethodName = (int.protocols?.http ?? [])
    .flatMap((p) => p.methods.map<[HttpRoute, HttpMethod]>((m) => [p, m]))
    .reduce(
      (acc, [p, m]) => acc.set(m.name.value, p),
      new Map<string, HttpRoute>(),
    );

  for (const method of int.methods) {
    const httpPath = httpPathsByMethodName.get(method.name.value);
    const httpMethod = httpMethodsByMethodName.get(method.name.value);

    if (!httpPath || !httpMethod) continue;
    yield ``;
    yield* MethodFactory.build(service, int, method, options);
  }

  yield '';

  const errorType = getErrorType(service);

  yield `private mapErrors(
    validationErrors: ${buildErrorType(options)}[],
    unhandledException?: any,
  ): ${errorType}[] {
    const mapError =
      this.options?.mapValidationError ||
      ((error) => ({
        code: error.code as any,
        status: 400,
        title: error.${
          options?.httpClient?.validation === 'zod' ? 'message' : 'title'
        },
      }));
    const result = validationErrors.map(mapError);

    if (unhandledException) {
      if (this.options?.mapUnhandledException) {
        result.push(this.options.mapUnhandledException(unhandledException));
      } else {
        result.push({
          code: 'UNHANDLED CLIENT EXCEPTION' as any,
          status: 400,
          title: 'Unhandled client exception',
        });
      }
    }

    return result as any;
  }`;

  yield `}`;
}

function sep(httpParam: HttpParameter): string {
  switch (httpParam.arrayFormat?.value) {
    case 'csv':
      return ',';
    case 'pipes':
      return '|';
    case 'ssv':
      return ' ';
    case 'tsv':
      return '\\t';
    default:
      return '';
  }
}

// function getSecuritySchemes(int: Interface): SecurityScheme[] {
//   return Array.from(
//     int.methods
//       .flatMap((m) => m.security)
//       .flatMap((opt) => opt)
//       .reduce(
//         (map, scheme) => map.set(scheme.name.value, scheme),
//         new Map<string, SecurityScheme>(),
//       )
//       .values(),
//   );
// }

class MethodFactory {
  private constructor(
    private readonly service: Service,
    private readonly options: NamespacedTypescriptHttpClientOptions,
    private readonly method: Method,
    private readonly httpMethod: HttpMethod,
    private readonly httpRoute: HttpRoute, // private readonly schemes: SecurityScheme[],
  ) {}

  private readonly dtoBuilder = new DtoBuilder(this.service, this.options);

  public static *build(
    service: Service,
    int: Interface,
    method: Method,
    options: NamespacedTypescriptHttpClientOptions,
  ): Iterable<string> {
    const httpMethod = (int.protocols?.http ?? [])
      .flatMap((p) => p.methods)
      .find((m) => m.name.value === method.name.value);

    const httpPath = (int.protocols?.http ?? [])
      .flatMap((p) => p.methods.map<[HttpRoute, HttpMethod]>((m) => [p, m]))
      .find(([_, m]) => m.name.value === method.name.value)?.[0];

    if (httpMethod && httpPath) {
      yield* new MethodFactory(
        service,
        options,
        method,
        httpMethod,
        httpPath,
        // getSecuritySchemes(int),
      ).buildMethod(options);
    }
  }

  private *buildMethod(
    options: NamespacedTypescriptHttpClientOptions,
  ): Iterable<string> {
    yield* buildDescription(
      this.method.description,
      this.method.deprecated?.value,
    );
    yield `async ${buildMethodName(this.method)}(`;
    yield* buildMethodParams(this.method, 'types');
    yield `): ${buildMethodReturnValue(this.method, 'types')} {`;
    yield ` try {`;

    if (this.method.parameters.length) {
      switch (options?.httpClient?.validation) {
        case 'zod':
        default: {
          const paramsRequired = this.method.parameters.some((p) =>
            isRequired(p.value),
          );
          const optionalString = paramsRequired ? '' : '.optional()';
          yield `const { success, data: sanitizedParams, error } = schemas.${pascal(
            this.method.name.value,
          )}ParamsSchema${optionalString}.safeParse(params);`;
          yield ``;
          yield `if (!success) return { errors: this.mapErrors(error.issues) } as any;`;
        }
      }
    }
    yield '';
    yield* this.buildHeaders(options);
    yield '';
    yield* this.buildQuery();
    yield '';
    yield* this.buildPath();
    yield '';
    yield* this.buildBody();
    yield '';
    yield* this.buildFetch();
    yield '  } catch (unhandledException) {';
    yield '    console.error(unhandledException);';
    yield '    return { errors: this.mapErrors([], unhandledException) } as any;';
    yield '  }';
    yield '}';
  }

  private *buildHeaders(
    _options: NamespacedTypescriptHttpClientOptions,
  ): Iterable<string> {
    const headerParams = this.httpMethod.parameters.filter(
      (p) => p.location.value === 'header',
    );

    yield ' const headers: Record<string, string> = {';
    yield `  'Content-Type': 'application/json',`;
    if (headerParams.length) {
      for (const httpParam of headerParams) {
        const param = this.method.parameters.find(
          (p) => p.name.value === httpParam.name.value,
        );
        if (!param || !isRequired(param.value)) continue;
        yield `    '${httpParam.name.value}': ${this.buildParamValue(
          httpParam,
        )},`;
      }
    }
    yield ' }';

    if (headerParams.length) {
      for (const httpParam of headerParams) {
        const param = this.method.parameters.find(
          (p) => (p.name.value = httpParam.name.value),
        );
        if (!param || isRequired(param.value)) continue;
        const paramName = buildParameterName(param);
        yield `if(typeof sanitizedParams.${paramName} !== 'undefined') {`;
        yield `headers${safe(httpParam.name.value)} = ${this.buildParamValue(
          httpParam,
        )};`;
        yield '}';
      }
    }

    // if (options?.httpClient?.includeAuthSchemes) {
    //   for (const scheme of this.schemes) {
    //     if (isApiKeyScheme(scheme)) {
    //       if (scheme.in.value === 'header') {
    //         yield `if(this.auth${safe(scheme.name.value)}) {`;
    //         yield `  headers${safe(scheme.parameter.value)} = this.auth${safe(
    //           scheme.name.value,
    //         )}.key`;
    //         yield '}';
    //       }
    //     } else if (isBasicScheme(scheme)) {
    //       yield `if(this.auth${safe(scheme.name.value)}) {`;
    //       yield `// TODO: remove deprecated method for node targets`;
    //       yield `  headers.authorization = \`Basic $\{ btoa(\`$\{this.auth${safe(
    //         scheme.name.value,
    //       )}.username\}:$\{this.auth${safe(
    //         scheme.name.value,
    //       )}.password\}\`) \}\``;
    //       yield '}';
    //     } else if (isOAuth2Scheme(scheme)) {
    //       yield `if(this.auth${safe(scheme.name.value)}) {`;
    //       yield `  headers.authorization = \`Bearer $\{ this.auth${safe(
    //         scheme.name.value,
    //       )}.accessToken \}\``;
    //       yield '}';
    //     }
    //   }
    // }
  }

  private *buildQuery(): Iterable<string> {
    const queryParams = this.httpMethod.parameters.filter(
      (p) => p.location.value === 'query',
    );
    yield `const query: string[] = [];`;
    for (const httpParam of queryParams) {
      const param = this.method.parameters.find(
        (p) => p.name.value === httpParam.name.value,
      );
      if (!param) continue;

      yield `if(typeof ${this.accessor(param, {
        formatDates: false,
      })} !== 'undefined') {`;
      switch (httpParam.arrayFormat?.value) {
        case 'multi': {
          yield `for(const value of ${this.accessor(param, {
            includeOptionalChaining: false,
          })}) {`;

          let valueString = 'value';
          if (param.value.kind === 'PrimitiveValue') {
            if (param.value.typeName.value === 'date') {
              valueString = 'formatDate(value)';
            } else if (param.value.typeName.value === 'date-time')
              valueString = 'formatDateTime(value)';
          }

          yield ` query.push(\`${httpParam.name.value}=$\{encodeURIComponent(${valueString})\}\`)`;
          yield `}`;
          break;
        }
        case undefined: {
          yield `query.push(\`${
            httpParam.name.value
          }=$\{encodeURIComponent(${this.accessor(param, {
            includeOptionalChaining: false,
          })})\}\`)`;
          break;
        }
        default: {
          yield `query.push(\`${httpParam.name.value}=$\{${this.accessor(
            param,
            {
              includeOptionalChaining: false,
            },
          )}.map(encodeURIComponent).join('${sep(httpParam)}')\}\`)`; // TODO: format date/date-time
          break;
        }
      }

      yield '}';
    }

    // if (this.options?.httpClient?.includeAuthSchemes) {
    //   for (const scheme of this.schemes) {
    //     if (isApiKeyScheme(scheme)) {
    //       if (scheme.in.value === 'query') {
    //         yield `if(this.auth${safe(scheme.name.value)}) {`;
    //         yield `  query.push(\`${scheme.parameter.value}=$\{this.auth${safe(
    //           scheme.name.value,
    //         )}.key\}\`);`;
    //         yield '}';
    //       }
    //     }
    //   }
    // }
  }

  private *buildPath(): Iterable<string> {
    let pattern = this.httpRoute.pattern.value;

    for (const param of this.httpMethod.parameters) {
      if (param.location.value === 'path') {
        pattern = pattern.replace(
          `{${param.name.value}}`,
          `$\{ ${this.buildParamValue(param)} \}`,
        );
      }
    }

    yield ``;
    yield `  let prefix = '';`;
    yield `  if(this.options?.root) {`;
    yield `    prefix = this.options.root;`;
    yield `    if(!prefix.startsWith('/') && !prefix.toLowerCase().startsWith('http://') && !prefix.toLowerCase().startsWith('https://')) prefix = \`/\${prefix}\`;`;
    yield `  }`;
    yield ``;

    yield `  const path = [\`\${prefix}${pattern}\`, query.join('&')].join('?')`;
  }

  private getBodyParam():
    | { parameter: Parameter; httpParameter: HttpParameter }
    | { parameter?: undefined; httpParameter?: undefined } {
    const httpParameter = this.httpMethod.parameters.find(
      (p) => p.location.value === 'body',
    );
    const parameter = this.method.parameters.find(
      (p) => p.name.value === httpParameter?.name.value,
    );

    return httpParameter && parameter ? { parameter, httpParameter } : {};
  }

  private *buildBody(): Iterable<string> {
    const { parameter: param } = this.getBodyParam();

    if (param) {
      yield `const body = ${this.accessor(
        param,
        {},
      )} === undefined ? undefined : JSON.stringify(${this.accessor(
        param,
        {},
      )});`;
    }
  }

  private *buildFetch(): Iterable<string> {
    const returnType = this.method.returns
      ? `<dtos.${pascal(this.method.returns.value.typeName.value)}Dto>`
      : '';

    if (this.method.returns)
      yield `const res = await this.fetch${returnType}(path`;
    else {
      yield `await this.fetch(path`;
    }

    yield `  ,{`;
    if (this.httpMethod.verb.value.toUpperCase() !== 'GET') {
      yield `    method: '${this.httpMethod.verb.value.toUpperCase()}',`;
    }
    yield `  headers,`;
    if (this.hasBody()) yield `  body,`;
    yield `  }`;

    yield `)`;
    yield ``;
    yield ``;

    if (this.method.returns?.value.kind === 'ComplexValue') {
      const responseTypeName = getTypeByName(
        this.service,
        this.method.returns.value.typeName.value,
      )!;

      const mapperName = this.dtoBuilder.buildMapperName(
        responseTypeName.name.value,
        'client-outbound',
      );

      if (this.options?.httpClient?.validation === 'zod') {
        yield `return mappers.${mapperName}(await res.json());`;
      } else {
        const sanitizerName = camel(
          `sanitize_${snake(responseTypeName.name.value)}`,
        );

        yield `return sanitizers.${sanitizerName}(mappers.${mapperName}(await res.json()));`;
      }
    }
  }

  private buildParamValue(httpParam: HttpParameter): string {
    const paramName = buildParameterName(httpParam);

    if (
      httpParam.arrayFormat === undefined ||
      httpParam.arrayFormat.value === 'multi'
    ) {
      return `encodeURIComponent(sanitizedParams.${paramName})`; // TODO: format date/date-time
    }

    // TODO: format date/date-time
    return `sanitizedParams.${paramName}.map(encodeURIComponent).join('${sep(
      httpParam,
    )}')`;
  }

  private accessor(
    param: Parameter,
    {
      includeOptionalChaining = true,
      formatDates = true,
    }: { includeOptionalChaining?: boolean; formatDates?: boolean },
  ) {
    const paramName = buildParameterName(param);
    const optionalChain =
      includeOptionalChaining && !hasRequiredParameters(this.method) ? '?' : '';
    const value = `sanitizedParams${optionalChain}.${paramName}`;
    if (!formatDates) return value;

    if (param.value.kind === 'PrimitiveValue') {
      if (param.value.typeName.value === 'date') {
        return `formatDate(${value})`;
      } else if (param.value.typeName.value === 'date-time')
        return `formatDateTime(${value})`;
    }
    return value;
  }

  private hasBody(): boolean {
    const { httpParameter } = this.getBodyParam();
    return !!httpParameter;
  }
}

const r = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/;
function safe(name: string): string {
  return r.test(name) ? `.${name}` : `['${name}']`;
}
