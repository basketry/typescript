import { File, Service } from 'basketry';
import { NamespacedExpressOptions } from './types';
import { buildFilePath } from '@basketry/typescript';
import { format } from '@basketry/typescript/lib/utils';
import { BaseFactory } from './base-factory';

export class ExpressIndexFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  build(): File[] {
    const files: File[] = [];

    const contents = Array.from(this.buildContents()).join('\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['express', 'index.ts'], this.service, this.options),
      contents: format([preamble, contents].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildContents(): Iterable<string> {
    yield `export * from './dtos';`;
    yield `export * from './errors';`;
    yield `export * from './handlers';`;
    yield `export * from './mappers';`;
    yield `export * from './router-factory';`;
    yield `export * from './types';`;
  }
}
