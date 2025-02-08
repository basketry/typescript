import { readFileSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateValidators from '@basketry/typescript-validators';
import generateZod from '@basketry/zod';
import { ExpressIndexFactory } from './index-factory';
import { ExpressDtoFactory } from './dto-factory';
import { ExpressErrorsFactory } from './errors-factory';
import { ExpressHandlerFactory } from './handler-factory';
import { ExpressMapperFactory } from './mapper-factory';
import { ExpressReadmeFactory } from './readme-factory';
import { ExpressRouterFactoryFactory } from './router-factory-factory';
import { ExpressTypesFactory } from './types-factory';
import { NamespacedExpressOptions } from './types';
import { Service } from 'basketry';

const pkg = require('../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const generate = (options: NamespacedExpressOptions) => {
  const service = require('./snapshot/example-ir.json');

  return [
    ...generateTypes(deepClone(service), options),
    ...(options.express?.validation === 'zod'
      ? generateZod(deepClone(service), options)
      : generateValidators(deepClone(service), options)),
    ...new ExpressIndexFactory(deepClone(service), options).build(),
    ...new ExpressTypesFactory(deepClone(service), options).build(),
    ...new ExpressRouterFactoryFactory(deepClone(service), options).build(),
    ...new ExpressDtoFactory(deepClone(service), options).build(),
    ...new ExpressMapperFactory(deepClone(service), options).build(),
    ...new ExpressHandlerFactory(deepClone(service), options).build(),
    ...new ExpressReadmeFactory(deepClone(service), options).build(),
    ...new ExpressErrorsFactory(deepClone(service), options).build(),
  ];
};

describe('InterfaceFactory', () => {
  const testCases: [string, NamespacedExpressOptions][] = [
    ['zod', { express: { validation: 'zod' } }],
    ['native', {}],
  ];

  describe.each(testCases)('with %s validation', (validation, options) => {
    it('creates a valid snapshot', async () => {
      // ARRANGE

      // ACT
      const snapshotFiles = generate(options);

      // ASSERT
      for (const file of snapshotFiles) {
        const path = join('src', 'snapshot', validation, ...file.path);
        const snapshot = readFileSync(path)
          .toString()
          .replace(withoutVersion, withVersion);
        expect(await file.contents).toStrictEqual(snapshot);
      }
    });
  });
});
