import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import { ExpressDtoFactory } from '../dto-factory';
import { ExpressMapperFactory } from '../mapper-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { NamespacedTypescriptDTOOptions } from '../types';
import { File } from 'basketry';

const pkg = require('../../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const generate = async (options: NamespacedTypescriptDTOOptions) => {
  const service = require('@basketry/ir/lib/example.json');

  return [
    ...(await generateTypes(deepClone(service), options)),
    ...(await new ExpressDtoFactory(deepClone(service), options).build()),
    ...(await new ExpressMapperFactory(deepClone(service), options).build()),
    ...(await new ExpressReadmeFactory(deepClone(service), options).build()),
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
  const snapshots: Record<string, NamespacedTypescriptDTOOptions> = {
    client: { dtos: { role: 'client' } },
    server: { dtos: { role: 'server' } },
  };

  for (const [snapshot, options] of Object.entries(snapshots)) {
    await writeFiles(await generate(options), snapshot);
  }
})();
