import { File, Service } from 'basketry';
import { NamespacedExpressOptions } from './types';
import { ServiceInfo } from './service-info';
import { header } from '@basketry/typescript/lib/warning';
import { Builder } from './builder';

const dtosModule = 'dtos';
const handlersModule = 'handlers';
const expressTypesModule = 'expressTypes';
const mappersModule = 'mappers';
const typesModule = 'types';
const validatorsModule = 'validators';
const errorsModule = 'errors';
const schemasModule = 'schemas';

export abstract class BaseFactory {
  constructor(
    protected readonly service: Service,
    protected readonly options: NamespacedExpressOptions,
  ) {}

  abstract build(): File[];

  protected readonly serviceInfo = new ServiceInfo(this.service);
  protected readonly builder = new Builder(this.service, this.options);

  protected *buildPreamble(): Iterable<string> {
    yield header(this.service, require('../package.json'), this.options || {});
    yield '';
    yield* this.buildExpressImport();
    yield* this.buildZodImport();
    yield '';

    yield* this.buildTypesImport();
    yield* this.buildSchemasImport();
    yield* this.buildValidatorsImport();
    yield '';
    yield* this.buildDtosImport();
    yield* this.buildHandlersImport();
    yield* this.buildErrorsImport();
    yield* this.buildMappersImport();
    yield* this.buildExpressTypesImport();
  }

  protected get typesModule(): string {
    this._needsTypesImport = true;
    return typesModule;
  }
  private _needsTypesImport = false;
  private *buildTypesImport(): Iterable<string> {
    if (this._needsTypesImport) {
      yield `import type * as ${typesModule} from "${
        this.options.express?.typesImportPath || '../types'
      }"`;
    }
  }

  protected get validatorsModule(): string {
    this._needsValidatorsImport = true;
    return validatorsModule;
  }
  private _needsValidatorsImport = false;
  private *buildValidatorsImport(): Iterable<string> {
    if (this._needsValidatorsImport) {
      yield `import * as ${validatorsModule} from "${
        this.options.express?.validatorsImportPath || '../validators'
      }"`;
    }
  }

  protected get schemasModule(): string {
    this._needsSchemasImport = true;
    return schemasModule;
  }
  private _needsSchemasImport = false;
  private *buildSchemasImport(): Iterable<string> {
    if (this._needsSchemasImport) {
      yield `import * as ${schemasModule} from "${
        this.options.express?.schemasImportPath || '../schemas'
      }"`;
    }
  }

  protected get dtosModule(): string {
    this._needsDtosModule = true;
    return dtosModule;
  }
  private _needsDtosModule = false;
  private *buildDtosImport(): Iterable<string> {
    if (this._needsDtosModule) {
      yield `import type * as ${dtosModule} from "./dtos"`;
    }
  }

  protected get errorsModule(): string {
    this._needsErrorsModule = true;
    return errorsModule;
  }
  private _needsErrorsModule = false;
  private *buildErrorsImport(): Iterable<string> {
    if (this._needsErrorsModule) {
      yield `import * as ${errorsModule} from "./errors"`;
    }
  }

  protected get expressTypesModule(): string {
    this._needsExpressTypesModule = true;
    return expressTypesModule;
  }
  private _needsExpressTypesModule = false;
  private *buildExpressTypesImport(): Iterable<string> {
    if (this._needsExpressTypesModule) {
      yield `import type * as ${expressTypesModule} from "./types"`;
    }
  }

  protected get handlersModule(): string {
    this._needsHandlersImport = true;
    return handlersModule;
  }
  private _needsHandlersImport = false;
  private *buildHandlersImport(): Iterable<string> {
    if (this._needsHandlersImport) {
      yield `import * as ${this.handlersModule} from "./handlers"`;
    }
  }

  protected get mappersModule(): string {
    this._needsMappersImport = true;
    return mappersModule;
  }
  private _needsMappersImport = false;
  private *buildMappersImport(): Iterable<string> {
    if (this._needsMappersImport) {
      yield `import * as ${this.mappersModule} from "./mappers"`;
    }
  }

  private _needsZodErrorImport = false;
  protected touchZodErrorImport() {
    this._needsZodErrorImport = true;
  }

  private _needsZodIssueImport = false;
  protected touchZodIssueImport() {
    this._needsZodIssueImport = true;
  }

  private *buildZodImport(): Iterable<string> {
    const allTypes = !this._needsZodErrorImport;

    const imports: string[] = [];

    if (this._needsZodErrorImport) {
      imports.push('ZodError');
    }

    if (this._needsZodIssueImport) {
      imports.push(allTypes ? 'ZodIssue' : 'type ZodIssue');
    }

    if (imports.length) {
      yield `import ${allTypes ? 'type' : ''} { ${imports.join(
        ', ',
      )} } from "zod"`;
    }
  }

  private _needsRouterImport = false;
  protected touchRouterImport() {
    this._needsRouterImport = true;
  }

  private _needsRequestImport = false;
  protected touchRequestImport() {
    this._needsRequestImport = true;
  }

  private _needsResponseImport = false;
  protected touchResponseImport() {
    this._needsResponseImport = true;
  }

  private _needsRequestHandlerImport = false;
  protected touchRequestHandlerImport() {
    this._needsRequestHandlerImport = true;
  }

  private *buildExpressImport(): Iterable<string> {
    const allTypes = !this._needsRouterImport;

    const imports: string[] = [];

    if (this._needsRouterImport) {
      imports.push('Router');
    }

    if (this._needsRequestImport) {
      imports.push(allTypes ? 'Request' : 'type Request');
    }

    if (this._needsResponseImport) {
      imports.push(allTypes ? 'Response' : 'type Response');
    }

    if (this._needsRequestHandlerImport) {
      imports.push(allTypes ? 'RequestHandler' : 'type RequestHandler');
    }

    if (imports.length) {
      yield `import ${allTypes ? 'type' : ''} { ${imports.join(
        ', ',
      )} } from "express"`;
    }
  }
}
