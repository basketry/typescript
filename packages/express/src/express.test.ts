import { readFileSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateValidators from '@basketry/typescript-validators';
import { ExpressIndexFactory } from './index-factory';
import { ExpressDtoFactory } from './dto-factory';
import { ExpressErrorsFactory } from './errors-factory';
import { ExpressHandlerFactory } from './handler-factory';
import { ExpressMapperFactory } from './mapper-factory';
import { ExpressReadmeFactory } from './readme-factory';
import { ExpressRouterFactoryFactory } from './router-factory-factory';
import { ExpressTypesFactory } from './types-factory';

const pkg = require('../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

describe('InterfaceFactory', () => {
  it('recreates a valid snapshot', async () => {
    // ARRANGE
    const service = require('./snapshot/example-ir.json');

    // ACT
    const snapshotFiles = [
      ...generateTypes(service),
      ...generateValidators(service),
      ...new ExpressIndexFactory(service, {}).build(),
      ...new ExpressTypesFactory(service, {}).build(),
      ...new ExpressRouterFactoryFactory(service, {}).build(),
      ...new ExpressDtoFactory(service, {}).build(),
      ...new ExpressMapperFactory(service, {}).build(),
      ...new ExpressHandlerFactory(service, {}).build(),
      ...new ExpressReadmeFactory(service, {}).build(),
      ...new ExpressErrorsFactory(service, {}).build(),
    ];

    // ASSERT
    for (const file of snapshotFiles) {
      const path = join('src', 'snapshot', ...file.path);
      const snapshot = readFileSync(path)
        .toString()
        .replace(withoutVersion, withVersion);
      expect(await file.contents).toStrictEqual(snapshot);
    }
  });
});
