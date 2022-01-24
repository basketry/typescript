import { readFileSync } from 'fs';
import { join } from 'path';
import { ExpressRouterFactory } from './express-factory';

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
    const int = new ExpressRouterFactory().build(service);

    // ASSERT
    for (const file of [...int]) {
      const path = join('src', 'snapshot', ...file.path);
      const snapshot = readFileSync(path)
        .toString()
        .replace(withoutVersion, withVersion);
      expect(file.contents).toStrictEqual(snapshot);
    }
  });
});
