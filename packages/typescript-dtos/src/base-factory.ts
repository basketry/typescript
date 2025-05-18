import { File, Service } from 'basketry';
import { NamespacedTypescriptDTOOptions } from './types';
import { ServiceInfo } from './service-info';
import { header } from '@basketry/typescript/lib/warning';
import { Builder } from './builder';

const dtosModule = 'dtos';
const typesModule = 'types';

export abstract class BaseFactory {
  constructor(
    protected readonly service: Service,
    protected readonly options?: NamespacedTypescriptDTOOptions,
  ) {}

  abstract build(): File[];

  protected readonly serviceInfo = new ServiceInfo(this.service);
  protected readonly builder = new Builder(this.service, this.options);

  protected *buildPreamble(): Iterable<string> {
    yield header(this.service, require('../package.json'), this.options || {});
    yield '';
    yield* this.buildTypesImport();
    yield* this.buildDtosImport();
  }

  protected get typesModule(): string {
    this._needsTypesImport = true;
    return typesModule;
  }
  private _needsTypesImport = false;
  private *buildTypesImport(): Iterable<string> {
    if (this._needsTypesImport) {
      yield `import type * as ${typesModule} from "${
        this.options?.dtos?.typesImportPath || '../types'
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
      yield `import type * as ${dtosModule} from "./types"`;
    }
  }
}
