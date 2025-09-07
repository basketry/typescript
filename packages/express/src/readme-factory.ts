import { File, Interface, Method, Service, warning } from 'basketry';
import { NamespacedExpressOptions } from './types';
import { buildFilePath, buildInterfaceName } from '@basketry/typescript';
import { format, Options } from 'prettier';
import { BaseFactory } from './base-factory';
import { join } from 'path';
import { readFileSync } from 'fs';
import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';
import { camel, pascal } from 'case';
import { ExpressErrorsFactory } from './errors-factory';

export class ExpressReadmeFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  async build(): Promise<File[]> {
    const files: File[] = [];

    const contents = Array.from(this.buildContents()).join('\n');
    // const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['express', 'README.md'], this.service, this.options),
      contents: await formatMarkdown([contents].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildContents(): Iterable<string> {
    yield '<!--';
    yield* warning(
      this.service,
      require('../package.json'),
      this.options || {},
    );
    yield '-->';
    yield '';

    const typesImportPath = this.options.express?.typesImportPath ?? '../types';
    const businessObjectTypes = `[**Business Object Types**](${typesImportPath}.ts)`;
    const dtoImportPath = './dtos';
    const dataTransferObjects = `[**DTO (Data Transfer Object) Types**](${dtoImportPath}.ts)`;
    const dtoTypes = `[**DTO Types**](${dtoImportPath}.ts)`;
    const mappersImportPath = './mappers';
    const handlersImportPath = './handlers';
    const errorsImportPath = [
      '.',
      ...buildFilePath(['express', 'errors'], this.service, this.options),
    ].join('/');

    const routerFactoryBasicUsageExample = Array.from(
      this.buildRouterFactoryExample(),
    ).join('\n');

    const customMiddlewareExample = Array.from(
      this.buildRouterFactoryMiddlewareExample(),
    ).join('\n');

    yield `
# Express API

This directory contains the generated code for the Express API in the following modules:

## Router Factory

The router factory provides the \`getRouter\` function, which generates an Express router for the API. The router factory is responsible for creating the Express router, registering the routes, and attaching the appropriate middleware to each route.

### Basic Usage

Mount the router on an Express app:

\`\`\`typescript
${routerFactoryBasicUsageExample}
\`\`\`

### Custom Middleware

You can provide custom middleware to the router factory by passing a middleware object to the \`middleware\` property of the input object. The middleware object should contain middleware functions keyed by the name of the service method they are associated with.

\`\`\`typescript
${customMiddlewareExample}
\`\`\`

## Errors

This module provides utility functions and types for creating and identifying errors in an ExpressJS API. It defines custom error types for different error conditions such as validation errors, method not allowed, handled exceptions, and unhandled exceptions. Each error type is accompanied by helper functions to generate and identify errors, which can be used in your ExpressJS API error-handling middleware.

### Method Not Allowed

This error type is used to indicate that the HTTP method is not defined on the route in the API contract.

\`\`\`typescript
import { RequestHandler } from 'express';
import { isMethodNotAllowed } from '${errorsImportPath}';

export const handler: RequestHandler = (err, req, res, next) => {
  // Checks to see if the error is a MethodNotAllowedError
  if (isMethodNotAllowed(err)) {
    // TODO: log/instrument occurence of the error

    if (!res.headersSent) {
      // TODO: return an error response
    }
  }
  next(err);
};
\`\`\`

### Validation Error

This error type is used to indicate that the request data failed validation against the API contract.

\`\`\`typescript
import { RequestHandler } from 'express';
import { isValidationErrors } from '${errorsImportPath}';

export const handler: RequestHandler = (err, req, res, next) => {
  // Checks to see if the error is a ValidationErrorsError
  if (isValidationErrors(err)) {
    // TODO: log/instrument occurence of the error

    if (!res.headersSent) {
      // TODO: return an error response
    }
  }
  next(err);
};
\`\`\`

${Array.from(this.buildHandledExceptionDocs(errorsImportPath)).join('\n')}

### Unhandled Exception

This error type is used to indicate that an unexpected error occured in the API.

\`\`\`typescript
import { RequestHandler } from 'express';
import { isUnhandledException } from '${errorsImportPath}';

export const handler: RequestHandler = (err, req, res, next) => {
  // Checks to see if the error is a UnhandledExceptionError
  if (isUnhandledException(err)) {
    // TODO: log/instrument occurence of the error

    if (!res.headersSent) {
      // TODO: return an error response
    }
  }
  next(err);
};
\`\`\`

## Handlers

## Types

`;
  }

  private *buildHandledExceptionDocs(
    errorsImportPath: string,
  ): Iterable<string> {
    const errorTypes = ExpressErrorsFactory.getErrorTypes(this.service);
    if (errorTypes.length) {
      yield `### Handled Exception

This error type is used to indicate that an error occured in a service method as was returned in a well-structured format.

\`\`\`typescript
import { RequestHandler } from 'express';
import { isHandledException } from '${errorsImportPath}';

export const handler: RequestHandler = (err, req, res, next) => {
  // Checks to see if the error is a HandledExceptionError
  if (isHandledException(err)) {
    // TODO: log/instrument occurence of the error

    if (!res.headersSent) {
      // TODO: return an error response
    }
  }
  next(err);
};
\`\`\``;
    }
  }

  private *buildRouterFactoryExample(): Iterable<string> {
    const importPath = buildFilePath(
      ['express', 'router-factory'],
      this.service,
      this.options,
    );

    const interfaces = this.service.interfaces
      .map((int) => int)
      .sort((a, b) => a.name.value.localeCompare(b.name.value));

    yield `import express from 'express';`;
    yield `import { getRouter } from '${['.', ...importPath].join('/')}';`;
    yield '';
    yield 'const app = express();';
    yield '';
    yield `app.use('/v${this.service.majorVersion.value}', [getRouter({`;
    yield '  // Update with your OpenAPI schema';
    yield `  schema: require('./swagger.json'),`;
    yield '';
    yield '  // Update with your service initializers';
    for (const int of interfaces) {
      yield `  ${this.buildServiceGetterName(
        int,
      )}: (req) => new ${this.buildServiceImplName(int)}(req),`;
    }
    yield '})]);';
  }

  private *buildRouterFactoryMiddlewareExample(): Iterable<string> {
    const importPath = buildFilePath(
      ['express', 'router-factory'],
      this.service,
      this.options,
    );

    const methods = this.service.interfaces
      .flatMap((int) => int.methods)
      .sort((a, b) => a.name.value.localeCompare(b.name.value));

    const length = methods.length;
    const indexA = Math.floor(length / 3);
    const indexB = Math.floor((length / 3) * 2);

    yield `import express from 'express';`;
    yield `import { getRouter } from '${['.', ...importPath].join('/')}';`;
    yield `import { authenticationMiddleware } from '../auth';`;
    yield '';
    yield 'const app = express();';
    yield '';
    yield `app.use('/v${this.service.majorVersion.value}', [getRouter({`;
    yield '  // TODO: add schema and service initializers';
    yield '';
    yield '  // Update with your middleware as needed';
    yield '  middleware: {';
    yield '    // Added to all routes except the one that serves the Swagger UI';
    yield '    _exceptSwaggerUI: authenticationMiddleware,';
    if (indexA >= 0) {
      const method = methods[indexA];
      yield '';
      yield `    ${camel(method.name.value)}: (req, res, next) => {`;
      yield '    // TODO: Implement your custom middleware here';
      yield '    next();';
      yield '  },';
    }
    if (indexB !== indexA) {
      const method = methods[indexB];
      yield '';
      yield `    ${camel(method.name.value)}: (req, res, next) => {`;
      yield '    // TODO: Implement your custom middleware here';
      yield '    next();';
      yield '  },';
    }
    yield ' },';
    yield '})]);';
  }

  private buildServiceGetterName(int: Interface): string {
    return `get${pascal(buildInterfaceName(int, undefined, this.options))}`;
  }

  private buildServiceImplName(int: Interface): string {
    return `My${pascal(buildInterfaceName(int, undefined, this.options))}`;
  }
}

/** Formats the source content with Prettier. */
export async function formatMarkdown(
  source: string,
  options: NamespacedTypescriptOptions | undefined,
): Promise<string> {
  try {
    let prettierOptions: Options = {
      parser: 'markdown',
    };

    const { success, config } = tryLoadConfig(
      options?.typescript?.prettierConfig,
    );
    if (success) {
      prettierOptions = { ...prettierOptions, ...config };
    }

    return format(source, prettierOptions);
  } catch (err) {
    return source;
  }
}

function tryLoadConfig(configPath: string | undefined): {
  success: boolean;
  config: any;
} {
  if (!configPath) return tryLoadConfig('.prettierrc');

  try {
    return { success: true, config: require(configPath) };
  } catch {}

  try {
    return { success: true, config: require(join(process.cwd(), configPath)) };
  } catch {}

  try {
    return {
      success: true,
      config: JSON.parse(readFileSync(configPath).toString()),
    };
  } catch {}

  try {
    return {
      success: true,
      config: JSON.parse(
        readFileSync(join(process.cwd(), configPath)).toString(),
      ),
    };
  } catch {}

  return { success: false, config: undefined };
}
