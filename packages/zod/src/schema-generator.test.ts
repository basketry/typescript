import { readFileSync } from 'fs';
import { join } from 'path';
import { generateFiles } from './snapshot/test-utils';

describe('HookGenerator', () => {
  it('recreates a valid snapshot using the Engine', async () => {
    for await (const file of generateFiles()) {
      const snapshot = readFileSync(join(...file.path)).toString();
      expect(file.contents).toStrictEqual(snapshot);
    }
  });
});
