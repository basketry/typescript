import { readFileSync } from 'fs';
import { join } from 'path';
import { httpClientGenerator } from './http-client-generator';

const pkg = require('../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

describe('InterfaceFactory', () => {
  it('recreates a valid snapshot', () => {
    // ARRANGE
    const service = JSON.parse(
      readFileSync(join('src', 'snapshot', 'service.json')).toString(),
    );

    // ACT
    const files = httpClientGenerator(service);

    // ASSERT
    for (const file of [...files]) {
      const path = join('src', 'snapshot', ...file.path);
      const snapshot = readFileSync(path)
        .toString()
        .replace(withoutVersion, withVersion);
      expect(file.contents).toStrictEqual(snapshot);
    }
  });
});
