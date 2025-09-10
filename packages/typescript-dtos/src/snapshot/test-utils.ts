import { join } from 'path';

import generateTypes from '@basketry/typescript';

import { ExpressDtoFactory } from '../dto-factory';
import { ExpressMapperFactory } from '../mapper-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { NamespacedTypescriptDTOOptions } from '../types';

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

  if (base.endsWith(join('packages', 'typescript-dtos'))) {
    return [base, ...paths];
  } else {
    return [base, 'packages', 'typescript-dtos', ...paths];
  }
}

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const generate = async (options: NamespacedTypescriptDTOOptions) => {
  const service = require('@basketry/ir/lib/example.json');

  return [
    ...(await generateTypes(deepClone(service), options)),
    ...(await new ExpressDtoFactory(deepClone(service), options).build()),
    ...(await new ExpressMapperFactory(deepClone(service), options).build()),
    ...(await new ExpressReadmeFactory(deepClone(service), options).build()),
  ];
};

const prettierConfig = join(...buildPath('..', '..', '.prettierrc'));

export const snapshots: Record<string, NamespacedTypescriptDTOOptions> = {
  client: { dtos: { role: 'client' }, typescript: { prettierConfig } },
  server: { dtos: { role: 'server' }, typescript: { prettierConfig } },
};
