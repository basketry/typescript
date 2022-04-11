import { camel, pascal } from 'case';
import { format } from 'prettier';
import {
  File,
  FileFactory,
  Interface,
  isEnum,
  isRequired,
  Parameter,
  ParameterSpec,
  Service,
} from 'basketry';
import { warning } from './warning';

export class ExpressRouterFactory implements FileFactory {
  public readonly target = 'typescript';

  build(service: Service): File[] {
    const routers = Array.from(buildRouters(service)).join('\n');

    const utils =
      'function tryParse(obj: any): any {try{return JSON.parse(obj);} catch {return;}}';

    const contents = [warning, utils, routers].join('\n\n');
    const formatted = format(contents, {
      singleQuote: true,
      useTabs: false,
      tabWidth: 2,
      trailingComma: 'all',
      parser: 'typescript',
    });

    return [
      {
        path: [`v${service.majorVersion}`, 'express-routers.ts'],
        contents: formatted,
      },
    ];
  }
}

function* buildRouters(service: Service): Iterable<string> {
  yield `import { Router } from 'express';`;
  yield `import * as types from './types';`;
  yield `import * as validators from './validators';`;

  yield '';

  for (const int of service.interfaces) {
    yield* buildRouter(int, service);
  }
}

function* buildRouter(int: Interface, service: Service): Iterable<string> {
  yield `export function ${camel(`${int.name}_routes`)}(service: types.${pascal(
    `${int.name}_service`,
  )}, router?: Router) {`;
  yield '  const r = router || Router();';
  yield '';
  yield '  // TODO: Auth';

  for (const pathSpec of int.protocols.http) {
    let expressPath = pathSpec.path;
    while (expressPath.indexOf('{') > -1) {
      expressPath = expressPath.replace('{', ':').replace('}', '');
    }

    const allow = new Set(pathSpec.methods.map((m) => m.verb.toUpperCase()));
    allow.add('HEAD');
    allow.add('OPTIONS');

    yield '';
    yield `  r.route('${expressPath}')`;

    for (const methodSpec of pathSpec.methods) {
      const method = int.methods.find((m) => m.name === methodSpec.name);
      if (!method) continue;

      const sortedParams = [
        ...method.parameters.filter((p) => isRequired(p)),
        ...method.parameters.filter((p) => !isRequired(p)),
      ];
      const paramString = methodSpec.parameters.length ? 'params' : '';

      yield `    .${methodSpec.verb.toLocaleLowerCase()}(async (req, res, next) => {`;
      yield `      try {`;

      if (methodSpec.parameters.length) {
        yield `      const params = {`;
        for (const paramSpec of methodSpec.parameters) {
          const param = method.parameters.find(
            (p) => p.name === paramSpec.name,
          );
          if (!param) continue;

          yield* buildParam(param, paramSpec);
        }
        yield `      };`;
      }

      if (method.parameters.length) {
        yield '';
        yield `        const errors = validators.${camel(
          `validate_${methodSpec.name}_params`,
        )}(${paramString});`;
        yield `        if (errors.length) return next(errors);`;
      }

      yield '';
      yield `        // TODO: validate return value`;
      yield `        // TODO: consider response headers`;

      if (method.returnType) {
        yield `        return res.status(${
          methodSpec.successCode
        }).json(await service.${camel(method.name)}(${paramString}));`;
      } else {
        yield `        await service.${camel(method.name)}(${paramString});`;
        yield `        return res.status(204).send();`;
      }

      yield `      } catch (ex) {`;
      yield `        return next(ex);`;
      yield `      }`;
      yield `    })`;
    }

    yield `.options((req, res)=>{`;
    yield `   res.set({allow: '${Array.from(allow).join(', ')}'});`;
    yield `   return res.status(204).send();`;
    yield `})`;

    yield `.all((req, res)=>{`;
    yield `   res.set({allow: '${Array.from(allow).join(', ')}'});`;
    yield `   return res.status(405).send();`;
    yield `});`;
  }

  yield '';
  yield '  return r;';
  yield '}';
}

function buildArraySeprarator(spec: ParameterSpec): string | undefined {
  switch (spec.array) {
    case 'csv':
      return ',';
    case 'pipes':
      return '|';
    case 'ssv':
      return ' ';
    case 'tsv':
      return '\t';
    default:
      return undefined;
  }
}

function* buildParam(param: Parameter, spec: ParameterSpec): Iterable<string> {
  const source = buildSource(spec);
  const name = camel(param.name);
  if (param.isArray) {
    if (param.isLocal) {
      if (isEnum(param)) {
        yield `'${name}': Array.isArray(${source}) ? ${source} as types.${pascal(
          param.typeName,
        )}[] : typeof ${source} === 'string' ? ${source}.split('${
          buildArraySeprarator(spec) || ','
        }') as types.${pascal(param.typeName)}[] : (${source} as never),`;
      } else {
        yield `'${name}': tryParse(${source}),`;
      }
    } else {
      switch (param.typeName) {
        case 'string':
          yield `'${name}': Array.isArray(${source}) ? ${source} as string[] : typeof ${source} === 'string' ? ${source}.split('${
            buildArraySeprarator(spec) || ','
          }') as string[] : (${source} as never),`;
          break;
        case 'number':
        case 'integer':
          yield `'${name}': Array.isArray(${source}) ? ${source}.map((x:any)=> Number(\`\${x}\`)) : typeof ${source} === 'string' ? ${source}.split('${
            buildArraySeprarator(spec) || ','
          }').map((x:any)=> Number(\`\${x}\`)) : (${source} as never),`;
          break;
        case 'boolean':
          yield `'${name}': Array.isArray(${source}) ? ${source}.map((x:any)=> typeof x !== 'undefined' && \`\${x}\`.toLowerCase() !== 'false') : typeof ${source} === 'string' ? ${source}.split('${
            buildArraySeprarator(spec) || ','
          }').map((x:any)=> typeof x !== 'undefined' && \`\${x}\`.toLowerCase() !== 'false') : (${source} as never),`;
          break;
        default:
          yield `'${name}': tryParse(${source}),`;
      }
    }
  } else {
    if (param.isLocal) {
      if (isEnum(param)) {
        yield `'${name}': ${source} as types.${pascal(param.typeName)},`;
      } else {
        yield `'${name}': tryParse(${source}),`;
      }
    } else {
      switch (param.typeName) {
        case 'string':
          yield `'${name}': ${source} as string,`;
          break;
        case 'number':
        case 'integer':
          yield `'${name}': Number(\`\${${source}}\`),`;
          break;
        case 'boolean':
          yield `'${name}': typeof ${source} !== 'undefined' && \`\${${source}}\`.toLowerCase() !== 'false',`;
          break;
        default:
          yield `'${name}': tryParse(${source}),`;
      }
    }
  }
}

const r = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/;

function buildSource(spec: ParameterSpec): string {
  switch (spec.in) {
    case 'body':
      return `req.body`;
    case 'formData':
      return `req.body`; // TODO: correctly source form data
    case 'header':
      return `(req.header('${spec.name}') as any)`;
    case 'path':
      return r.test(spec.name)
        ? `req.params.${spec.name}`
        : `req.params['${spec.name}']`;
    case 'query':
      return r.test(spec.name)
        ? `req.query.${spec.name}`
        : `req.query['${spec.name}']`;
  }
}
