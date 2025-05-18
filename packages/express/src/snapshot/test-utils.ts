import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateDtos from '@basketry/typescript-dtos';
import generateValidators from '@basketry/typescript-validators';
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

export const generate = (options: NamespacedExpressOptions) => {
  const service =
    options.express?.validation === 'zod'
      ? require('./zod-ir.json')
      : require('./native-ir.json');

  return [
    ...generateTypes(deepClone(service), options),
    ...generateDtos(deepClone(service), options),
    ...(options.express?.validation === 'zod'
      ? generateZod(deepClone(service), options)
      : generateValidators(deepClone(service), options)),
    ...new ExpressIndexFactory(deepClone(service), options).build(),
    ...new ExpressTypesFactory(deepClone(service), options).build(),
    ...new ExpressRouterFactoryFactory(deepClone(service), options).build(),
    ...new ExpressHandlerFactory(deepClone(service), options).build(),
    ...new ExpressReadmeFactory(deepClone(service), options).build(),
    ...new ExpressErrorsFactory(deepClone(service), options).build(),
  ];
};

export const snapshots: Record<string, NamespacedExpressOptions> = {
  native: {},
  zod: {
    express: {
      validation: 'zod',
    },
  },
};
