import { writeFileSync, mkdirSync } from 'fs';
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

const pkg = require('../../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

export const replaceVersion = async (
  content: string | Promise<string>,
): Promise<string> => (await content).replace(withVersion, withoutVersion);

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
    express: {
      validation: 'zod',
    },
  },
};
