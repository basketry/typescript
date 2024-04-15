import { readFileSync } from 'fs';
import { join } from 'path';
import { httpClientGenerator } from './http-client-generator';
import generateTypes from '@basketry/typescript';
import generateValidators from '@basketry/typescript-validators';

const pkg = require('../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

describe('InterfaceFactory', () => {
  it('recreates a valid snapshot', () => {
    // ARRANGE
    const service = require('basketry/lib/example-ir.json');

    // ACT
    const snapshotFiles = [
      ...generateTypes(service),
      // ...generateValidators(service),
      ...httpClientGenerator(service),
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
