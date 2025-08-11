import { readFileSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateDtos from '@basketry/typescript-dtos';
import generateZod from '@basketry/zod';
import { ExpressIndexFactory } from '../index-factory';
import { ExpressErrorsFactory } from '../errors-factory';
import { ExpressHandlerFactory } from '../handler-factory';
import { ExpressReadmeFactory } from '../readme-factory';
import { ExpressRouterFactoryFactory } from '../router-factory-factory';
import { ExpressTypesFactory } from '../types-factory';
import { NamespacedExpressOptions } from '../types';
import { Service } from 'basketry';
import { generate, replaceVersion } from './test-utils';

describe('InterfaceFactory', () => {
  const testCases: [string, NamespacedExpressOptions][] = [
    ['zod', { express: { validation: 'zod' } }],
  ];

  describe.each(testCases)('with %s validation', (validation, options) => {
    it('creates a valid snapshot', async () => {
      // ARRANGE

      // ACT
      const snapshotFiles = await generate(options);

      // ASSERT
      for (const file of snapshotFiles) {
        const path = join('src', 'snapshot', validation, ...file.path);
        const snapshot = readFileSync(path).toString();
        expect(await replaceVersion(file.contents)).toStrictEqual(snapshot);
      }
    });
  });
});
