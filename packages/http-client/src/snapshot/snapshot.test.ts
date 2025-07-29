import { readFileSync } from 'fs';
import { join } from 'path';
import { NamespacedTypescriptHttpClientOptions } from '../types';
import { generate, replaceVersion, snapshots } from './test-utils';

describe('Http Client Generator', () => {
  const testCases: [string, NamespacedTypescriptHttpClientOptions][] =
    Object.keys(snapshots).map(
      (key) =>
        [key, snapshots[key]] as [
          string,
          NamespacedTypescriptHttpClientOptions,
        ],
    );

  describe.each(testCases)('with %s validator', (validator, options) => {
    it('creates a valid snapshot', async () => {
      // ARRANGE

      // ACT
      const snapshotFiles = await generate(options);

      // ASSERT
      for (const file of snapshotFiles) {
        const path = join('src', 'snapshot', validator, ...file.path);
        const snapshot = readFileSync(path).toString();
        expect(await replaceVersion(file.contents)).toStrictEqual(snapshot);
      }
    });
  });
});
