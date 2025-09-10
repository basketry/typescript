import { readFileSync } from 'fs';
import { join } from 'path';

import { NamespacedTypescriptDTOOptions } from '../types';
import { buildPath, generate, replaceVersion, snapshots } from './test-utils';

describe('DTO Factory', () => {
  const testCases: [string, NamespacedTypescriptDTOOptions][] =
    Object.entries(snapshots);

  describe.each(testCases)('with %s validation', (validation, options) => {
    it('creates a valid snapshot', async () => {
      // ARRANGE

      // ACT
      const snapshotFiles = await generate(options);

      // ASSERT
      for (const file of snapshotFiles) {
        const path = join(
          ...buildPath('src', 'snapshot', validation, ...file.path),
        );
        const snapshot = readFileSync(path).toString();
        expect(await replaceVersion(file.contents)).toStrictEqual(snapshot);
      }
    });
  });
});
