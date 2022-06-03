import { format as prettier } from 'prettier';
import {
  allParameters,
  Generator,
  hasRequiredParameters,
  HttpMethod,
  HttpParameter,
  HttpPath,
  Interface,
  isApiKeyScheme,
  isBasicScheme,
  isOAuth2Scheme,
  isRequired,
  Method,
  Parameter,
  SecurityScheme,
  Service,
} from 'basketry';
import { warning } from './warning';
import {
  buildDescription,
  buildInterfaceName,
  buildMethodName,
  buildMethodParams,
  buildMethodReturnType,
  buildParameterName,
  buildTypeName,
} from '@basketry/typescript';
import { buildHttpClientName } from './name-factory';
import {
  buildParamsValidatorName,
  buildTypeValidatorName,
} from '@basketry/typescript-validators';

function format(contents: string): string {
  return prettier(contents, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

export const httpClientGenerator: Generator = (service, options) => {
  const includeFormatDateTime = allParameters(service, '', options).some(
    ({ parameter }) =>
      parameter.isPrimitive && parameter.typeName.value === 'date-time',
  );

  const includeFormatDate =
    includeFormatDateTime ||
    allParameters(service, '', options).some(
      ({ parameter }) =>
        parameter.isPrimitive && parameter.typeName.value === 'date',
    );

  const imports = Array.from(buildImports()).join('\n');
  const standardTypes = Array.from(
    buildStandardTypes(service, includeFormatDate, includeFormatDateTime),
  ).join('\n');
  const classes = Array.from(buildClasses(service)).join('\n');
  const contents = [warning, imports, standardTypes, classes].join('\n\n');
  return [
    {
      path: [`v${service.majorVersion.value}`, 'http-client.ts'],
      contents: format(contents),
    },
  ];
};

function* buildImports(): Iterable<string> {
  yield `import * as types from './types';`;
  yield `import * as validators from './validators';`;
}

function* buildStandardTypes(
  service: Service,
  includeFormatDate: boolean,
  includeFormatDateTime: boolean,
): Iterable<string> {
  const methods = new Set(
    service.interfaces
      .flatMap((int) => int.protocols.http)
      .flatMap((p) => p.methods)
      .map((m) => `'${m.verb.value}'`.toUpperCase())
      .sort((a, b) => a.localeCompare(b)),
  );

  methods.delete(`'GET'`);

  yield `export interface Fetch {`;
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

function* buildAuth(int: Interface): Iterable<string> {
  const schemes = getSecuritySchemes(int);

  if (schemes.length) {
    yield 'private readonly auth: {';
    for (const scheme of schemes) {
      if (isApiKeyScheme(scheme)) {
        yield `'${scheme.name.value}'?: {key: string}`;
      } else if (isBasicScheme(scheme)) {
        yield `'${scheme.name.value}'?: {username: string, password: string}`;
      } else if (isOAuth2Scheme(scheme)) {
        yield `'${scheme.name.value}'?: {accessToken: string}`;
      }
    }
    yield '}';
  }
}

function* buildClasses(service: Service): Iterable<string> {
  for (const int of service.interfaces) {
    yield '';
    yield* buildClass(int);
  }
}

function* buildClass(int: Interface): Iterable<string> {
  yield `export class ${buildHttpClientName(
    int,
  )} implements ${buildInterfaceName(int, 'types')} {`;
  yield `constructor(`;
  yield `private readonly fetch: Fetch,`;
  yield* buildAuth(int);
  yield `) {}`;

  const httpMethodsByMethodName = int.protocols.http
    .flatMap((p) => p.methods)
    .reduce(
      (acc, m) => acc.set(m.name.value, m),
      new Map<string, HttpMethod>(),
    );

  const httpPathsByMethodName = int.protocols.http
    .flatMap((p) => p.methods.map<[HttpPath, HttpMethod]>((m) => [p, m]))
    .reduce(
      (acc, [p, m]) => acc.set(m.name.value, p),
      new Map<string, HttpPath>(),
    );

  for (const method of int.methods) {
    const httpPath = httpPathsByMethodName.get(method.name.value);
    const httpMethod = httpMethodsByMethodName.get(method.name.value);

    if (!httpPath || !httpMethod) continue;
    yield ``;
    yield* MethodFactory.build(int, method);
  }

  yield `}`;
}

function sep(httpParam: HttpParameter): string {
  switch (httpParam.array?.value) {
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

function getSecuritySchemes(int: Interface): SecurityScheme[] {
  return Array.from(
    int.methods
      .flatMap((m) => m.security)
      .flatMap((opt) => opt)
      .reduce(
        (map, scheme) => map.set(scheme.name.value, scheme),
        new Map<string, SecurityScheme>(),
      )
      .values(),
  );
}

class MethodFactory {
  private constructor(
    private readonly method: Method,
    private readonly httpMethod: HttpMethod,
    private readonly httpPath: HttpPath,
    private readonly schemes: SecurityScheme[],
  ) {}

  public static *build(int: Interface, method: Method): Iterable<string> {
    const httpMethod = int.protocols.http
      .flatMap((p) => p.methods)
      .find((m) => m.name.value === method.name.value);

    const httpPath = int.protocols.http
      .flatMap((p) => p.methods.map<[HttpPath, HttpMethod]>((m) => [p, m]))
      .find(([p, m]) => m.name.value === method.name.value)?.[0];

    if (httpMethod && httpPath) {
      yield* new MethodFactory(
        method,
        httpMethod,
        httpPath,
        getSecuritySchemes(int),
      )._build();
    }
  }

  private *_build(): Iterable<string> {
    yield* buildDescription(this.method.description);
    yield `async ${buildMethodName(this.method)}(`;
    yield* buildMethodParams(this.method, 'types');
    yield `): ${buildMethodReturnType(this.method, 'types')} {`;

    if (this.method.parameters.length) {
      const validatorName = buildParamsValidatorName(this.method, 'validators');

      yield `  const errors = ${validatorName}(params);`;
      yield ` if(errors) throw errors;`;
    }
    yield '';
    yield* this.buildHeaders();
    yield '';
    yield* this.buildQuery();
    yield '';
    yield* this.buildPath();
    yield '';
    yield* this.buildBody();
    yield '';
    yield* this.buildFetch();
    yield '}';
  }

  private *buildHeaders(): Iterable<string> {
    const headerParams = this.httpMethod.parameters.filter(
      (p) => p.in.value === 'header',
    );

    yield ' const headers: Record<string, string> = {';
    yield `  'Content-Type': 'application/json',`;
    if (headerParams.length) {
      for (const httpParam of headerParams) {
        const param = this.method.parameters.find(
          (p) => p.name.value === httpParam.name.value,
        );
        if (!param || !isRequired(param)) continue;
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
        if (!param || isRequired(param)) continue;
        const paramName = buildParameterName(param);
        yield `if(typeof params.${paramName} !== 'undefined') {`;
        yield `headers${safe(httpParam.name.value)} = ${this.buildParamValue(
          httpParam,
        )};`;
        yield '}';
      }
    }

    for (const scheme of this.schemes) {
      if (isApiKeyScheme(scheme)) {
        if (scheme.in.value === 'header') {
          yield `if(this.auth${safe(scheme.name.value)}) {`;
          yield `  headers${safe(scheme.parameter.value)} = this.auth${safe(
            scheme.name.value,
          )}.key`;
          yield '}';
        }
      } else if (isBasicScheme(scheme)) {
        yield `if(this.auth${safe(scheme.name.value)}) {`;
        yield `// TODO: remove deprecated method for node targets`;
        yield `  headers.authorization = \`Basic $\{ btoa(\`$\{this.auth${safe(
          scheme.name.value,
        )}.username\}:$\{this.auth${safe(
          scheme.name.value,
        )}.password\}\`) \}\``;
        yield '}';
      } else if (isOAuth2Scheme(scheme)) {
        yield `if(this.auth${safe(scheme.name.value)}) {`;
        yield `  headers.authorization = \`Bearer $\{ this.auth${safe(
          scheme.name.value,
        )}.accessToken \}\``;
        yield '}';
      }
    }
  }

  private *buildQuery(): Iterable<string> {
    const queryParams = this.httpMethod.parameters.filter(
      (p) => p.in.value === 'query',
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
      switch (httpParam.array?.value) {
        case 'multi': {
          yield `for(const value of ${this.accessor(param, {
            includeOptionalChaining: false,
          })}) {`;

          let valueString = 'value';
          if (param.isPrimitive) {
            if (param.typeName.value === 'date') {
              valueString = 'formatDate(value)';
            } else if (param.typeName.value === 'date-time')
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
          )}}.map(encodeURIComponent).join('${sep(httpParam)}')\}\`)`; // TODO: format date/date-time
          break;
        }
      }

      yield '}';
    }

    for (const scheme of this.schemes) {
      if (isApiKeyScheme(scheme)) {
        if (scheme.in.value === 'query') {
          yield `if(this.auth${safe(scheme.name.value)}) {`;
          yield `  query.push(\`${scheme.parameter.value}=$\{this.auth${safe(
            scheme.name.value,
          )}.key\}\`);`;
          yield '}';
        }
      }
    }
  }

  private *buildPath(): Iterable<string> {
    let path = this.httpPath.path.value;

    for (const param of this.httpMethod.parameters) {
      if (param.in.value === 'path') {
        path = path.replace(
          `{${param.name.value}}`,
          `$\{ ${this.buildParamValue(param)} \}`,
        );
      }
    }

    yield `  const path = [\`${path}\`, query.join('&')].join('?')`;
  }

  private *buildBody(): Iterable<string> {
    const bodyParam = this.httpMethod.parameters.find(
      (p) => p.in.value === 'body',
    );
    const param = this.method.parameters.find(
      (p) => p.name.value === bodyParam?.name.value,
    );

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
    const params = this.method.returnType ? `json, status` : `status`;
    const returnType = this.method.returnType
      ? `<${buildTypeName(this.method.returnType, 'types')}>`
      : '';

    yield `const { ${params} } = await this.fetch${returnType}(path`;

    yield `  ,{`;
    if (this.httpMethod.verb.value.toUpperCase() !== 'GET') {
      yield `    method: '${this.httpMethod.verb.value.toUpperCase()}',`;
    }
    yield `  headers,`;
    if (this.hasBody()) yield `  body,`;
    yield `  }`;

    yield `)`;
    yield ``;
    yield `if(status !== ${this.httpMethod.successCode.value}) { throw new Error('Invalid response code'); }`;
    yield ``;

    if (this.method.returnType && !this.method.returnType.isPrimitive) {
      const validatorName = buildTypeValidatorName(
        this.method.returnType,
        'validators',
      );
      yield `const response = await json();`;
      yield ``;
      yield `  const responseValidationErrors = ${validatorName}(response);`;
      yield ` if(responseValidationErrors) throw responseValidationErrors;`;
      yield ``;

      yield `return response;`;
    }
  }

  private buildParamValue(httpParam: HttpParameter): string {
    const paramName = buildParameterName(httpParam);

    if (httpParam.array === undefined || httpParam.array?.value === 'multi') {
      return `encodeURIComponent(params.${paramName})`; // TODO: format date/date-time
    }

    // TODO: format date/date-time
    return `params.${paramName}.map(encodeURIComponent).join('${sep(
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
    const value = `params${optionalChain}.${paramName}`;
    if (!formatDates) return value;

    if (param.isPrimitive) {
      if (param.typeName.value === 'date') {
        return `formatDate(${value})`;
      } else if (param.typeName.value === 'date-time')
        return `formatDateTime(${value})`;
    }
    return value;
  }

  private hasBody(): boolean {
    return this.httpMethod.parameters.some((p) => p.in.value === 'body');
  }
}

const r = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/;
function safe(name: string): string {
  return r.test(name) ? `.${name}` : `['${name}']`;
}
