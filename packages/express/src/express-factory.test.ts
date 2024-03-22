import { readFileSync } from 'fs';
import { join } from 'path';
import generateTypes from '@basketry/typescript';
import generateAuth from '@basketry/typescript-auth';
import generateValidators from '@basketry/typescript-validators';
import { ExpressRouterFactory } from './express-factory';

const pkg = require('../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

describe('InterfaceFactory', () => {
  it('recreates a valid snapshot', () => {
    // ARRANGE
    const service = require('./snapshot/example-ir.json');

    // ACT
    const snapshotFiles = [
      ...generateTypes(service),
      ...generateAuth(service),
      ...generateValidators(service),
      ...new ExpressRouterFactory(service).build(),
    ];

    // ASSERT
    for (const file of snapshotFiles) {
      const path = join('src', 'snapshot', ...file.path);
      const snapshot = readFileSync(path)
        .toString()
        .replace(withoutVersion, withVersion);
      expect(file.contents).toStrictEqual(snapshot);
    }
  });
});
