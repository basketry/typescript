import { join } from 'path';

import generateTypes from '@basketry/typescript';
import generateDtos from '@basketry/typescript-dtos';
import generateZod from '@basketry/zod';

import { ExpressIndexFactory } from '../index-factory';
import { ExpressTypesFactory } from '../types-factory';
import { ExpressRouterFactoryFactory } from '../router-factory-factory';
import { ExpressHandlerFactory } from '../handler-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { ExpressErrorsFactory } from '../errors-factory';
import { NamespacedExpressOptions } from '../types';

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

  if (base.endsWith(join('packages', 'express'))) {
    return [base, ...paths];
  } else {
    return [base, 'packages', 'express', ...paths];
  }
}

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

export const generate = async (options: NamespacedExpressOptions) => {
  const service = require('./zod-ir.json');

  return [
    ...(await generateTypes(deepClone(service), options)),
    ...(await generateDtos(deepClone(service), options)),
    ...(await generateZod(deepClone(service), options)),
    ...(await new ExpressIndexFactory(deepClone(service), options).build()),
    ...(await new ExpressTypesFactory(deepClone(service), options).build()),
    ...(await new ExpressRouterFactoryFactory(
      deepClone(service),
      options,
    ).build()),
    ...(await new ExpressHandlerFactory(deepClone(service), options).build()),
    ...(await new ExpressReadmeFactory(deepClone(service), options).build()),
    ...(await new ExpressErrorsFactory(deepClone(service), options).build()),
  ];
};

export const snapshots: Record<string, NamespacedExpressOptions> = {
  // native: {},
  zod: {
    typescript: { prettierConfig: '../../.prettierrc' },
    express: {
      validation: 'zod',
    },
  },
};
