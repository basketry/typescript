import { join } from 'path';

import { httpClientGenerator } from '../http-client-generator';
import generateTypes from '@basketry/typescript';
import generateDtos from '@basketry/typescript-dtos';
import generateSchemas from '@basketry/zod';
// import generateValidators from '@basketry/typescript-validators';
import { NamespacedTypescriptHttpClientOptions } from '../types';

const regex =
  /^((?:[^\r\n]*\r?\n)?[^\r\n]*?(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)@)((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)/m;

export async function replaceVersion(
  content: string | Promise<string>,
): Promise<string> {
  // Replace just the version (group 2), preserve prefix (group 1)
  return (await content).replace(
    regex,
    (_m, g1 /* prefix+package@ */, _g2 /* version */) => {
      return `${g1}{{version}}`;
    },
  );
}

export function buildPath(...paths: string[]): string[] {
  const base = process.cwd();

  if (base.endsWith(join('packages', 'http-client'))) {
    return [base, ...paths];
  } else {
    return [base, 'packages', 'http-client', ...paths];
  }
}

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const generate = async (
  options: NamespacedTypescriptHttpClientOptions,
) => {
  const service = require('./zod-ir.json');

  return [
    ...(await generateTypes(deepClone(service), options)),
    ...(await generateDtos(deepClone(service), options)),
    ...(await generateSchemas(deepClone(service), options)),
    ...(await httpClientGenerator(deepClone(service), options)),
  ];
};

export const snapshots: Record<string, NamespacedTypescriptHttpClientOptions> =
  {
    // native: {
    //   dtos: { role: 'client' },
    //   httpClient: { includeAuthSchemes: false },
    // },
    zod: {
      typescript: { prettierConfig: '../../.prettierrc' },
      dtos: { role: 'client' },
      httpClient: { validation: 'zod' },
    },
  };
