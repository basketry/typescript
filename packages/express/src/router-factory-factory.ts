import { File, HttpMethod, Interface, Method, Service } from 'basketry';
import { BaseFactory } from './base-factory';
import { NamespacedExpressOptions } from './types';
import { format } from '@basketry/typescript/lib/utils';
import { buildFilePath, buildInterfaceName } from '@basketry/typescript';
import { camel, pascal, snake } from 'case';

export class ExpressRouterFactoryFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    const routers = Array.from(this.buildRouterFactory()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(
        ['express', 'router-factory.ts'],
        this.service,
        this.options,
      ),
      contents: format([preamble, routers].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildRouterFactory(): Iterable<string> {
    yield* this.buildFactoryMethod();
    yield* this.buildHelpers();
  }

  private buildServiceGetterName(int: Interface): string {
    return `get${pascal(buildInterfaceName(int))}`;
  }

  private *buildHelpers(): Iterable<string> {
    this.touchRequestHandlerImport();
    yield `/**
 * Gets a list of middleware functions for a given name from the supplied middleware object(s).
 * If no middleware objects are supplied, an empty array is returned.
 * Handlers are returned in the order they are defined in the middleware object(s).
 * @param middleware - The middleware object(s) to extract middleware from
 * @param name - The name of the service method to get middleware for
 * @returns An array of {@link RequestHandler|express.RequestHandler} functions
 */
function getMiddleware<
  TName extends string,
  TMiddleware extends Partial<
    Record<TName, RequestHandler | RequestHandler[] | undefined>
  >,
>(
  middleware: TMiddleware | TMiddleware[] | undefined,
  name: TName,
): RequestHandler[] {
  if (!middleware) return [];
  const middlewareArray = Array.isArray(middleware) ? middleware : [middleware];

  return middlewareArray.flatMap((m) => (m[name] ? m[name] : []));
}

/**
 * Gets a list of handlers for a given service method.
 * If overrides are provided, they are used in place of the default handler.
 * If no overrides are provided, the default handler is used.
 * @param overrides - The handler(s) to use in place of the default handler
 * @param defaultHandler - The default handler to use if no overrides are provided
 * @returns An array of {@link RequestHandler|express.RequestHandler} functions
 */
function getHandlers<TRequestHandler extends RequestHandler>(
  overrides: TRequestHandler | TRequestHandler[] | undefined,
  defaultHandler: TRequestHandler,
): TRequestHandler[] {
  if (!overrides) return [defaultHandler];
  return Array.isArray(overrides) ? overrides : [overrides];
}`;
  }

  private *buildFactoryMethod(): Iterable<string> {
    yield `export function getRouter({`;
    yield `schema,`;
    for (const int of [...this.service.interfaces].sort((a, b) =>
      a.name.value.localeCompare(b.name.value),
    )) {
      const serviceGetterName = this.buildServiceGetterName(int);
      yield `${serviceGetterName},`;
    }
    yield `middleware,`;
    yield `handlerOverrides,`;
    yield `swaggerUiVersion = '3.51.1',`;
    this.touchRouterImport();
    yield `}: ${this.expressTypesModule}.RouterFactoryInput): Router {`;
    yield `const router = Router();`;
    this.touchRequestHandlerImport();
    yield `const methodNotAllowed: RequestHandler = ((_req, _res, next) => {return next(${this.errorsModule}.methodNotAllowed())});`;
    yield '';
    yield* this.buildHandlersFor();
    yield '';
    yield* this.buildRoutes();
    yield '';
    yield* this.buildDocsRoute();
    yield `return router;`;
    yield `}`;
  }

  private *buildHandlersFor(): Iterable<string> {
    yield `
    function handlersFor<
    TName extends Exclude<
      keyof ${this.expressTypesModule}.Middleware,
      '_onlySwaggerUI' | '_exceptSwaggerUI'
    >,
  >(methodName: TName, defaultHandler: RequestHandler): RequestHandler[] {
    return [
      ...getMiddleware(middleware, methodName),
      ...getMiddleware(middleware, '_exceptSwaggerUI'),
      ...getHandlers(handlerOverrides?.[methodName], defaultHandler),
    ];
  }`;
  }

  private *buildRoutes(): Iterable<string> {
    const routeTable = new Map<
      string,
      Map<HttpMethod['verb']['value'], { method: Method; int: Interface }>
    >();

    for (const int of this.service.interfaces) {
      for (const path of int.protocols.http) {
        for (const httpMethod of path.methods) {
          const method = int.methods.find(
            (m) => m.name.value === httpMethod.name.value,
          );
          if (!method) continue;

          const route = this.builder.buildExpressRoute(path.path.value);
          const routeInfo = routeTable.get(route) ?? new Map();
          routeTable.set(route, routeInfo);
          routeInfo.set(httpMethod.verb.value, { method, int });
        }
      }
    }

    for (const route of Array.from(routeTable.keys()).sort(compareRoutes)) {
      const routeInfo = routeTable.get(route)!;
      yield '';
      yield `router.route('${route}')`;
      const verbs = new Set<HttpMethod['verb']['value']>();
      for (const [verb, { method, int }] of routeInfo) {
        verbs.add(verb);
        yield `  .${verb}(`;

        const override = `handlerOverrides?.${camel(method.name.value)}`;

        const handler = `${this.handlersModule}.${camel(
          `handle_${snake(method.name.value)}`,
        )}`;

        const getter = this.buildServiceGetterName(int);

        yield `handlersFor('${camel(
          method.name.value,
        )}', ${handler}(${getter}))`;

        yield `)`;
      }
      verbs.add('options');
      if (verbs.has('get')) {
        verbs.add('head');
      }
      const allowMethods = Array.from(verbs.values())
        .sort()
        .map((v) => v.toUpperCase())
        .join(', ');
      yield `.options((_, res) => res.set('Allow', '${allowMethods}').sendStatus(204))`;
      yield `  `;
    }
  }

  private *buildDocsRoute(): Iterable<string> {
    yield 'router.route("/").get(...getMiddleware(middleware, "_onlySwaggerUI"), (_, res) => {';
    yield 'const swaggerUiUrl = `https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/`;';
    yield `res.send(\`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.service.title.value} v${this.service.majorVersion.value}</title>
          <link rel="stylesheet" type="text/css" href="\${swaggerUiUrl}swagger-ui.css">
          <script src="\${swaggerUiUrl}swagger-ui-bundle.js"></script>
          <script src="\${swaggerUiUrl}swagger-ui-standalone-preset.js"></script>
        </head>
        <body>
          <div id="swagger-ui">CONTENT NOT LOADED</div>
          <script>
            const spec = \${JSON.stringify(schema)};
            const ui = SwaggerUIBundle({
              deepLinking: false,
              spec,
              dom_id: '#swagger-ui',
              presets: [SwaggerUIBundle.presets.apis],
              layout: 'BaseLayout',
              requestInterceptor: (request) => {
                const currentUrl = new URL(window.location.href);
                const requestUrl = new URL(request.url);
                const newUrl = currentUrl.href + requestUrl.href.substring(requestUrl.origin.length)
                request.url = newUrl;
                return request;
              }
            });
          </script>
        </body>
      </html>
    \`);`;
    yield '})';
    yield `.options((_, res) => res.set('Allow', 'GET, HEAD, OPTIONS').sendStatus(204))`;
    yield '.all(methodNotAllowed)';
  }
}

function getRouteScore(route: string): number {
  return route
    .split('/')
    .filter(Boolean)
    .reduce((acc, seg) => acc * 3 + (seg.startsWith(':') ? 1 : 2), 0);
}

function compareRoutes(a: string, b: string): number {
  const scoreA = getRouteScore(a);
  const scoreB = getRouteScore(b);

  const aSegs = a.split('/').filter(Boolean);
  const bSegs = b.split('/').filter(Boolean);
  const steps = Math.min(aSegs.length, bSegs.length);

  for (let i = 0; i < steps; i++) {
    const aSeg = aSegs[i];
    const bSeg = bSegs[i];

    if (!aSeg.startsWith(':') && !bSeg.startsWith(':')) {
      const cmp = aSeg.localeCompare(bSeg);

      if (cmp !== 0) {
        return cmp;
      }
    } else if (aSeg.startsWith(':') && bSeg.startsWith(':')) {
      continue;
    } else {
      break;
    }
  }

  return scoreB - scoreA;
}
