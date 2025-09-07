import { readFileSync } from 'fs';
import { join } from 'path';

import { NamespacedExpressOptions } from '../types';
import { buildPath, generate, replaceVersion } from './test-utils';

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
        const path = join(
          ...buildPath('src', 'snapshot', validation, ...file.path),
        );
        const snapshot = readFileSync(path).toString();
        expect(await replaceVersion(file.contents)).toStrictEqual(snapshot);
      }
    });
  });
});
