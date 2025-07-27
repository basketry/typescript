import { readFileSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import { ExpressDtoFactory } from '../dto-factory';
import { ExpressMapperFactory } from '../mapper-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { NamespacedTypescriptDTOOptions } from '../types';

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

describe('DTOs', () => {
  const testCases: [string, NamespacedTypescriptDTOOptions][] = [
    ['client', { dtos: { role: 'client' } }],
    ['server', { dtos: { role: 'server' } }],
  ];

  describe.each(testCases)('with %s role', (role, options) => {
    it('creates a valid snapshot', async () => {
      // ARRANGE

      // ACT
      const snapshotFiles = await generate(options);

      // ASSERT
      for (const file of snapshotFiles) {
        const path = join('src', 'snapshot', role, ...file.path);
        const snapshot = readFileSync(path)
          .toString()
          .replace(withoutVersion, withVersion);
        expect(await file.contents).toStrictEqual(snapshot);
      }
    });
  });
});
