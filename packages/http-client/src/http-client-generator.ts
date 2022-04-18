import { camel, pascal } from 'case';
import { format as prettier } from 'prettier';
import {
  Generator,
  Interface,
  isRequired,
  Method,
  MethodSpec,
  Parameter,
  ParameterSpec,
  PathSpec,
  SecurityScheme,
  Service,
} from 'basketry';
import { warning } from './warning';

function format(contents: string): string {
  return prettier(contents, {
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    trailingComma: 'all',
    parser: 'typescript',
  });
}

export const httpClientGenerator: Generator = (service) => {
  const imports = Array.from(buildImports()).join('\n');
  const standardTypes = Array.from(buildStandardTypes(service)).join('\n');
  const classes = Array.from(buildClasses(service)).join('\n');
  const contents = [warning, imports, standardTypes, classes].join('\n\n');
  return [
    {
      path: [`v${service.majorVersion}`, 'http-client.ts'],
      contents: format(contents),
    },
  ];
};

function* buildImports(): Iterable<string> {
  yield `import * as types from './types';`;
  yield `import * as validators from './validators';`;
}

function* buildStandardTypes(service: Service): Iterable<string> {
  const methods = new Set(
    service.interfaces
      .flatMap((int) => int.protocols.http)
      .flatMap((p) => p.methods)
      .map((m) => `'${m.verb}'`.toUpperCase())
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
}

function* buildAuth(int: Interface): Iterable<string> {
  const schemes = getSecuritySchemes(int);

  if (schemes.length) {
    yield 'private readonly auth: {';
    for (const scheme of schemes) {
      switch (scheme.type) {
        case 'apiKey': {
          yield `'${scheme.name}'?: {key: string}`;
          break;
        }
        case 'basic': {
          yield `'${scheme.name}'?: {username: string, password: string}`;
          break;
        }
        case 'oauth2': {
          yield `'${scheme.name}'?: {accessToken: string}`;
          break;
        }
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
  yield `export class ${pascal(
    `http_${int.name}_service`,
  )} implements types.${pascal(`${int.name}_service`)} {`;
  yield `constructor(`;
  yield `private readonly fetch: Fetch,`;
  yield* buildAuth(int);
  yield `) {}`;

  const methodSpecsByMethodName = int.protocols.http
    .flatMap((p) => p.methods)
    .reduce((acc, m) => acc.set(m.name, m), new Map<string, MethodSpec>());

  const pathSpecsByMethodName = int.protocols.http
    .flatMap((p) => p.methods.map<[PathSpec, MethodSpec]>((m) => [p, m]))
    .reduce((acc, [p, m]) => acc.set(m.name, p), new Map<string, PathSpec>());

  for (const method of int.methods) {
    const pathSpec = pathSpecsByMethodName.get(method.name);
    const methodSpec = methodSpecsByMethodName.get(method.name);

    if (!pathSpec || !methodSpec) continue;
    yield ``;
    yield* MethodFactory.build(int, method);
  }

  yield `}`;
}

function sep(paramSpec: ParameterSpec): string {
  switch (paramSpec.array) {
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

function* buildDescription(
  description: string | string[] | undefined,
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

    yield `${s} */`;
  }
}

function buildTypeName(type: {
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
    return arrayify(`types.${pascal(type.typeName)}`);
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

function hasRequiredParameters(method: Method): boolean {
  return method.parameters.some((p) => isRequired(p));
}

function getSecuritySchemes(int: Interface): SecurityScheme[] {
  return Array.from(
    int.methods
      .flatMap((m) => m.security)
      .flatMap((opt) => opt)
      .reduce(
        (map, scheme) => map.set(scheme.name, scheme),
        new Map<string, SecurityScheme>(),
      )
      .values(),
  );
}

class MethodFactory {
  private constructor(
    private readonly method: Method,
    private readonly methodSpec: MethodSpec,
    private readonly pathSpec: PathSpec,
    private readonly schemes: SecurityScheme[],
  ) {}

  public static *build(int: Interface, method: Method): Iterable<string> {
    const methodSpec = int.protocols.http
      .flatMap((p) => p.methods)
      .find((m) => m.name === method.name);

    const pathSpec = int.protocols.http
      .flatMap((p) => p.methods.map<[PathSpec, MethodSpec]>((m) => [p, m]))
      .find(([p, m]) => m.name === method.name)?.[0];

    if (methodSpec && pathSpec) {
      yield* new MethodFactory(
        method,
        methodSpec,
        pathSpec,
        getSecuritySchemes(int),
      )._build();
    }
  }

  private *_build(): Iterable<string> {
    yield* buildDescription(this.method.description, 2);

    yield `  async ${camel(this.method.name)}(${
      this.method.parameters.length
        ? `params${hasRequiredParameters(this.method) ? '' : '?'}: {`
        : ''
    }`;

    for (const param of this.method.parameters) {
      if (param.description) {
        yield* buildDescription(param.description, 2);
      }

      yield `    ${camel(param.name)}${
        isRequired(param) ? '' : '?'
      }: ${buildTypeName(param)},`;
    }

    yield `  ${this.method.parameters.length ? '}' : ''}): Promise<${
      this.method.returnType ? buildTypeName(this.method.returnType) : 'void'
    }> {`;
    if (this.method.parameters.length) {
      yield `  const errors = validators.${camel(
        `validate_${this.method.name}_params`,
      )}(params);`;
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
    const headerParams = this.methodSpec.parameters.filter(
      (p) => p.in === 'header',
    );

    yield ' const headers: Record<string, string> = {';
    yield `  'Content-Type': 'application/json',`;
    if (headerParams.length) {
      for (const paramSpec of headerParams) {
        const param = this.method.parameters.find(
          (p) => p.name === paramSpec.name,
        );
        if (!param || !isRequired(param)) continue;
        yield `    '${paramSpec.name}': ${this.buildParamValue(paramSpec)},`;
      }
    }
    yield ' }';

    if (headerParams.length) {
      for (const paramSpec of headerParams) {
        const param = this.method.parameters.find(
          (p) => (p.name = paramSpec.name),
        );
        if (!param || isRequired(param)) continue;
        yield `if(typeof params.${camel(param.name)} !== 'undefined') {`;
        yield `headers${safe(paramSpec.name)} = ${this.buildParamValue(
          paramSpec,
        )};`;
        yield '}';
      }
    }

    for (const scheme of this.schemes) {
      switch (scheme.type) {
        case 'apiKey': {
          if (scheme.in === 'header') {
            yield `if(this.auth${safe(scheme.name)}) {`;
            yield `  headers${safe(scheme.parameter)} = this.auth${safe(
              scheme.name,
            )}.key`;
            yield '}';
          }
          break;
        }
        case 'basic': {
          yield `if(this.auth${safe(scheme.name)}) {`;
          yield `// TODO: remove deprecated method for node targets`;
          yield `  headers.authorization = \`Basic $\{ btoa(\`$\{this.auth${safe(
            scheme.name,
          )}.username\}:$\{this.auth${safe(scheme.name)}.password\}\`) \}\``;
          yield '}';
          break;
        }
        case 'oauth2': {
          yield `if(this.auth${safe(scheme.name)}) {`;
          yield `  headers.authorization = \`Bearer $\{ this.auth${safe(
            scheme.name,
          )}.accessToken \}\``;
          yield '}';
          break;
        }
      }
    }
  }

  private *buildQuery(): Iterable<string> {
    const queryParams = this.methodSpec.parameters.filter(
      (p) => p.in === 'query',
    );
    yield `const query: string[] = [];`;
    for (const paramSpec of queryParams) {
      const param = this.method.parameters.find(
        (p) => p.name === paramSpec.name,
      );
      if (!param) continue;

      yield `if(typeof ${this.accessor(param)} !== 'undefined') {`;
      switch (paramSpec.array) {
        case 'multi': {
          yield `for(const value of ${this.accessor(param, false)}) {`;
          yield ` query.push(\`${paramSpec.name}=$\{encodeURIComponent(value)\}\`)`;
          yield `}`;
          break;
        }
        case undefined: {
          yield `query.push(\`${
            paramSpec.name
          }=$\{encodeURIComponent(${this.accessor(param, false)})\}\`)`;
          break;
        }
        default: {
          yield `query.push(\`${paramSpec.name}=$\{${this.accessor(
            param,
            false,
          )}}.map(encodeURIComponent).join('${sep(paramSpec)}')\}\`)`;
          break;
        }
      }

      yield '}';
    }

    for (const scheme of this.schemes) {
      switch (scheme.type) {
        case 'apiKey': {
          if (scheme.in === 'query') {
            yield `if(this.auth${safe(scheme.name)}) {`;
            yield `  query.push(\`${scheme.parameter}=$\{this.auth${safe(
              scheme.name,
            )}.key\}\`);`;
            yield '}';
          }
          break;
        }
      }
    }
  }

  private *buildPath(): Iterable<string> {
    let path = this.pathSpec.path;

    for (const param of this.methodSpec.parameters) {
      if (param.in === 'path') {
        path = path.replace(
          `{${param.name}}`,
          `$\{ ${this.buildParamValue(param)} \}`,
        );
      }
    }

    yield `  const path = [\`${path}\`, query.join('&')].join('?')`;
  }

  private *buildBody(): Iterable<string> {
    const bodyParam = this.methodSpec.parameters.find((p) => p.in === 'body');
    const param = this.method.parameters.find(
      (p) => p.name === bodyParam?.name,
    );

    if (param) {
      yield `const body = ${this.accessor(
        param,
      )} === undefined ? undefined : JSON.stringify(${this.accessor(param)});`;
    }
  }

  private *buildFetch(): Iterable<string> {
    const params = this.method.returnType ? `json, status` : `status`;
    const returnType = this.method.returnType
      ? `<${buildTypeName(this.method.returnType)}>`
      : '';

    yield `const { ${params} } = await this.fetch${returnType}(path`;

    yield `  ,{`;
    if (this.methodSpec.verb.toUpperCase() !== 'GET') {
      yield `    method: '${this.methodSpec.verb.toUpperCase()}',`;
    }
    yield `  headers,`;
    if (this.hasBody()) yield `  body,`;
    yield `  }`;

    yield `)`;
    yield ``;
    yield `if(status !== ${this.methodSpec.successCode}) { throw new Error('Invalid response code'); }`;
    yield ``;

    if (this.method.returnType && this.method.returnType.isLocal) {
      yield `const response = await json();`;
      yield ``;
      yield `  const responseValidationErrors = validators.${camel(
        `validate_${this.method.returnType.typeName}`,
      )}(response);`;
      yield ` if(responseValidationErrors) throw responseValidationErrors;`;
      yield ``;

      yield `return response;`;
    }
  }

  private buildParamValue(paramSpec: ParameterSpec): string {
    if (paramSpec.array === undefined || paramSpec.array === 'multi') {
      return `encodeURIComponent(params.${camel(paramSpec.name)})`;
    }

    return `params.${camel(paramSpec.name)}.map(encodeURIComponent).join('${sep(
      paramSpec,
    )}')`;
  }

  private accessor(param: Parameter, includeOptionalChaining: boolean = true) {
    return `params${
      includeOptionalChaining && !hasRequiredParameters(this.method) ? '?' : ''
    }.${camel(param.name)}`;
  }

  private hasBody(): boolean {
    return this.methodSpec.parameters.some((p) => p.in === 'body');
  }
}

const r = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/;
function safe(name: string): string {
  return r.test(name) ? `.${name}` : `['${name}']`;
}
