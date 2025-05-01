import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateZod from '@basketry/zod';
import generateValidators from '@basketry/typescript-validators';
import { ExpressIndexFactory } from '../index-factory';
import { ExpressTypesFactory } from '../types-factory';
import { ExpressRouterFactoryFactory } from '../router-factory-factory';
import { ExpressDtoFactory } from '../dto-factory';
import { ExpressMapperFactory } from '../mapper-factory';
import { ExpressHandlerFactory } from '../handler-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { ExpressErrorsFactory } from '../errors-factory';
import { NamespacedExpressOptions } from '../types';
import { File } from 'basketry';

const pkg = require('../../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const generate = (options: NamespacedExpressOptions) => {
  const service =
    options.express?.validation === 'zod'
      ? require('./zod-ir.json')
      : require('./native-ir.json');

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

const writeFiles = async (snapshotFiles: File[], snapshot: string) => {
  for (const file of snapshotFiles) {
    const path = file.path.slice(0, file.path.length - 1);
    const filename = file.path[file.path.length - 1];

    const fullpath = [process.cwd(), 'src', 'snapshot', snapshot, ...path];

    mkdirSync(join(...fullpath), { recursive: true });
    writeFileSync(
      join(...fullpath, filename),
      (await file.contents).replace(withVersion, withoutVersion),
    );
  }
};

(async () => {
  const snapshots: Record<string, NamespacedExpressOptions> = {
    native: {},
    zod: {
      express: {
        validation: 'zod',
      },
    },
  };

  for (const [snapshot, options] of Object.entries(snapshots)) {
    await writeFiles(generate(options), snapshot);
  }
})();
