import {
  File,
  HttpMethod,
  HttpParameter,
  Interface,
  Method,
  Parameter,
  Service,
  Type,
  getTypeByName,
  isRequired,
} from 'basketry';
import { NamespacedExpressOptions } from './types';
import { camel, snake, upper } from 'case';
import { format } from '@basketry/typescript/lib/utils';
import {
  buildFilePath,
  buildInterfaceName,
  buildMethodName,
  buildMethodParamsTypeName,
  buildParameterName,
  buildTypeName,
  isStreamingMethod,
} from '@basketry/typescript';
import { buildRequestHandlerTypeName } from '@basketry/typescript-dtos/lib/dto-factory';
import { BaseFactory } from './base-factory';

type Handler = {
  verb: string;
  path: string;
  name: string;
  expression: Iterable<string>;
};

export class ExpressHandlerFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  async build(): Promise<File[]> {
    const files: File[] = [];

    const handlers = Array.from(this.buildHanders()).join('\n');
    const runtime = Array.from([
      ...this.buildIsError(),
      '\n',
      ...this.buildGetHttpStatus(),
    ]).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(
        ['express', 'handlers.ts'],
        this.service,
        this.options,
      ),
      contents: await format(
        [preamble, handlers, runtime].join('\n\n'),
        this.options,
      ),
    });

    return files;
  }

  private *buildHanders(): Iterable<string> {
    const handlers: Handler[] = [];

    for (const int of this.service.interfaces) {
      for (const path of int.protocols?.http ?? []) {
        for (const httpMethod of path.methods) {
          const method = int.methods.find(
            (m) => m.name.value === httpMethod.name.value,
          );
          if (!method) continue;

          handlers.push({
            verb: httpMethod.verb.value,
            path: path.pattern.value,
            name: method.name.value,
            expression: this.buildHandler(
              int,
              method,
              path.pattern.value,
              httpMethod,
            ),
          });
        }
      }
    }

    for (const handler of handlers.sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      yield* handler.expression;
      yield '';
    }
  }

  private *buildHandler(
    int: Interface,
    method: Method,
    path: string,
    httpMethod: HttpMethod,
  ): Iterable<string> {
    const hasParams = method.parameters.length > 0;
    const returnType = getTypeByName(
      this.service,
      method.returns?.value.typeName.value,
    );
    const isEnvelope = returnType?.properties.find(
      (prop) => prop.name.value === 'errors',
    );
    const isStreaming = isStreamingMethod(httpMethod);
    yield `/** ${upper(httpMethod.verb.value)} ${this.builder.buildExpressRoute(
      path,
    )} ${method.deprecated?.value ? '@deprecated ' : ''}*/`;
    this.touchRequestImport();
    this.touchResponseImport();
    yield `export const ${camel(
      `handle_${snake(method.name.value)}`,
    )} = (getService: (req: Request, res: Response) => ${buildInterfaceName(
      int,
      this.typesModule,
      this.options,
    )}): ${this.expressTypesModule}.${buildRequestHandlerTypeName(
      method.name.value,
    )} => async (req, res, next) => {`;
    if (isStreaming) {
      yield '  // Set response headers for streaming';
      yield "  res.setHeader('Content-Type', 'text/event-stream');";
      yield "  res.setHeader('Cache-Control', 'no-cache');";
      yield "  res.setHeader('Connection', 'keep-alive');";
      yield '';
      yield '  const closeHandler = () => {';
      yield '    res.end();';
      yield '  };';
      yield '';
      yield "  req.on('close', closeHandler);";
      yield "  req.on('finish', closeHandler);";
      yield '';
    }
    yield '  try {';
    if (hasParams) {
      switch (this.options?.express?.validation) {
        case 'zod':
        default: {
          const paramsRequired = method.parameters.some((p) =>
            isRequired(p.value),
          );
          const undefinedString = paramsRequired ? '' : ' | undefined';
          const optionalString = paramsRequired ? '' : '.optional()';
          yield `// Parse parameters from request`;
          yield `const params: ${buildMethodParamsTypeName(method, this.typesModule)}${undefinedString} = ${this.schemasModule}.${buildMethodParamsTypeName(method)}Schema${optionalString}.parse({`;
          yield* this.buildParamsSourceObject(method, httpMethod);
          yield `});`;
          yield '';
        }
      }
    }
    yield '    // Execute service method';
    yield `    const service = getService(req, res);`;
    
    if (isStreaming && method.returns) {
      yield `    const stream = await service.${buildMethodName(method)}(${
        hasParams ? 'params' : ''
      });`;
      yield '    for await (const event of stream) {';
      yield '      res.write(`data: ${JSON.stringify(event)}\\n\\n`);';
      yield '    }';
      yield '    closeHandler();';
    } else if (returnType) {
      yield `    const result = await service.${buildMethodName(method)}(${
        hasParams ? 'params' : ''
      });`;
    } else {
      yield `    await service.${buildMethodName(method)}(${
        hasParams ? 'params' : ''
      });`;
    }
    
    if (!isStreaming) {
      if (isEnvelope) {
        this.touchGetHttpStatus();
        yield `    const status = getHttpStatus(${httpMethod.successCode.value}, result);`;
      } else {
        yield `    const status = ${httpMethod.successCode.value}`;
      }
      yield '';
      if (isEnvelope) {
        yield `if (${this.isError()}(result)) {`;
        yield `  next(${this.errorsModule}.handledException(status, result.errors));`;
        yield '} else {';
      }
      if (returnType) {
        switch (this.options?.express?.responseValidation) {
          case 'none': {
            // Only build respond stanza
            yield* this.buildRespondStanza(returnType);
            break;
          }
          case 'strict': {
            // Build response validation stanza first, then respond stanza
            yield* this.buildResponseValidationStanza(returnType);
            yield* this.buildRespondStanza(returnType);
            break;
          }
          case 'warn':
          default: {
            // Build respond stanza first, then response validation stanza
            yield* this.buildRespondStanza(returnType);
            yield* this.buildResponseValidationStanza(returnType);
            break;
          }
        }
      } else {
        yield '// Respond';
        yield `    res.sendStatus(status);`;
      }
      if (isEnvelope) {
        yield '}';
      }
    }
    
    yield '  } catch (err) {';
    if (isStreaming) {
      yield '    closeHandler();';
    }
    switch (this.options?.express?.validation) {
      case 'zod':
      default: {
        this.touchZodErrorImport();
        yield `if (err instanceof ZodError) {`;
        yield `  const statusCode = res.headersSent ? 500 : 400;`;
        yield `  return next(${this.errorsModule}.validationErrors(statusCode, err.errors));`;
        yield `} else {`;
        yield `  next(${this.errorsModule}.unhandledException(err));`;
        yield `}`;
        break;
      }
    }
    if (isStreaming) {
      yield '  } finally {';
      yield '    // Ensure handlers are removed';
      yield "    req.off('close', closeHandler);";
      yield "    req.off('finish', closeHandler);";
      yield '  }';
    } else {
      yield '  }';
    }
    yield '}';
  }

  private *buildRespondStanza(returnType: Type): Iterable<string> {
    yield '// Respond';
    yield `    const responseDto = ${
      this.mappersModule
    }.${this.builder.buildMapperName(
      returnType.name.value,
      'output',
    )}(result);`;
    yield `    res.status(status).json(responseDto);`;
    yield '';
  }

  private *buildResponseValidationStanza(returnType: Type): Iterable<string> {
    switch (this.options?.express?.validation) {
      case 'zod':
      default: {
        yield `// Validate response`;
        yield `${this.schemasModule}.${buildTypeName(returnType)}Schema.parse(result);`;
        break;
      }
    }
    yield '';
  }

  private *buildParamSource(
    method: Method,
    httpMethod: HttpMethod,
  ): Iterable<string> {
    const paramsTypeName = buildMethodParamsTypeName(method, this.typesModule);
    yield `const params: ${paramsTypeName} = {`;
    yield* this.buildParamsSourceObject(method, httpMethod);
    yield '};';
  }

  private *buildParamsSourceObject(
    method: Method,
    httpMethod: HttpMethod,
  ): Iterable<string> {
    for (const param of method.parameters) {
      const httpParam = httpMethod.parameters.find(
        (p) => p.name.value === param.name.value,
      );
      if (!httpParam) continue;

      const accessor = this.builder.buildAccessor(
        param,
        'input',
        httpParam.location.value === 'header' ? 'parens' : 'brackets',
      );
      let valueClause: string = 'undefined';
      switch (httpParam.location.value) {
        case 'path':
          valueClause = `req.params${accessor}`;
          break;
        case 'query':
          valueClause = `req.query${accessor}`;
          break;
        case 'body':
        case 'formData':
          const mapper = this.builder.buildMapperName(
            param.value.typeName.value,
            'input',
          );

          valueClause = `${this.mappersModule}.${mapper}(req.body)`;
          break;
        default:
          valueClause = `req.${httpParam.location.value}${accessor}`;
          break;
      }

      yield `  ${buildParameterName(param)}: ${this.withValueCoersion(
        param,
        valueClause,
        httpParam,
      )},`;
    }
  }

  private withValueCoersion(
    param: Parameter,
    valueClause: string,
    httpParam: HttpParameter,
  ): string {
    function split() {
      switch (httpParam.arrayFormat?.value) {
        case 'ssv':
          return `?.split(" ")`;
        case 'tsv':
          return `?.split("\\t")`;
        case 'pipes':
          return `?.split("|")`;
        case 'multi':
          return '';
        case 'csv':
        default:
          return `?.split(",")`;
      }
    }

    if (param.value.kind === 'PrimitiveValue') {
      switch (param.value.typeName.value) {
        case 'boolean':
          if (param.value.isArray) {
            return `${valueClause}${split()}`;
          } else {
            return `(${valueClause})`;
          }
        case 'date':
        case 'date-time':
          if (param.value.isArray) {
            return `${valueClause}${split()}`;
          } else {
            return `(${valueClause})`;
          }
        case 'double':
        case 'float':
        case 'integer':
        case 'long':
        case 'number':
          if (param.value.isArray) {
            return `${valueClause}${split()}`;
          } else {
            return `(${valueClause})`;
          }
        case 'binary':
        case 'null':
        case 'string':
        case 'untyped':
        default:
          if (param.value.isArray) {
            return `${valueClause}${split()}`;
          } else {
            return valueClause;
          }
      }
    } else {
      if (param.value.isArray) {
        return `${valueClause}${split()}`;
      } else {
        return valueClause;
      }
    }
  }

  private _needsIsError = false;
  private isError(): string {
    this._needsIsError = true;
    return 'isError';
  }
  private *buildIsError(): Iterable<string> {
    if (this._needsIsError) {
      yield `function isError(result: { errors: { status?: number | string }[]; data?: any; }): boolean {`;
      yield `  return !!result.errors.length &&`;
      yield `  (Array.isArray(result.data)`;
      yield `    ? result.data.length === 0`;
      yield `    : result.data === undefined);`;
      yield `}`;
    }
  }

  private _needsGetHttpStatus = false;
  private touchGetHttpStatus(): void {
    this._needsGetHttpStatus = true;
  }
  private *buildGetHttpStatus(): Iterable<string> {
    if (this._needsGetHttpStatus) {
      yield `function getHttpStatus(
  success: number,
  result: { errors: { status?: number | string }[], data?: unknown },
): number {
  if (${this.isError()}(result)) {
    return result.errors.reduce((max, item) => {
      if (typeof item.status === 'undefined') return success;
      const value =
        typeof item.status === 'string' ? Number(item.status) : item.status;
      return !Number.isNaN(value) && value > max ? value : max;
    }, success);
  } else {
    return success;
  }
}`;
    }
  }
}
