import { File, Generator, Service } from 'basketry';

import { buildFilePath } from '@basketry/typescript';
import { format, from } from '@basketry/typescript/lib/utils';

import { NamespacedZodOptions } from './types';
import { SchemaFile } from './schema-file';

export const generateSchemas: Generator = (service, options) => {
  return new HookGenerator(service, options).generate();
};

class HookGenerator {
  constructor(
    private readonly service: Service,
    private readonly options: NamespacedZodOptions,
  ) {}

  generate(): File[] {
    const files: File[] = [];

    files.push({
      path: buildFilePath(['schemas.ts'], this.service, this.options),
      contents: format(
        from(new SchemaFile(this.service, this.options).build()),
        this.options,
      ),
    });

    return files;
  }
}
