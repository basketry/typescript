import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateAuth from '@basketry/typescript-auth';
import generateValidators from '@basketry/typescript-validators';
import { ExpressIndexFactory } from '../index-factory';
import { ExpressTypesFactory } from '../types-factory';
import { ExpressRouterFactoryFactory } from '../router-factory-factory';
import { ExpressDtoFactory } from '../dto-factory';
import { ExpressMapperFactory } from '../mapper-factory';
import { ExpressHandlerFactory } from '../handler-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { ExpressErrorsFactory } from '../errors-factory';

const pkg = require('../../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

const service = require('./example-ir.json');

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

(async () => {
  for (const file of snapshotFiles) {
    const path = file.path.slice(0, file.path.length - 1);
    const filename = file.path[file.path.length - 1];

    const fullpath = [process.cwd(), 'src', 'snapshot', ...path];

    mkdirSync(join(...fullpath), { recursive: true });
    writeFileSync(
      join(...fullpath, filename),
      (await file.contents).replace(withVersion, withoutVersion),
    );
  }
})();
