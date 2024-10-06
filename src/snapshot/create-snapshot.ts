import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { generateFiles } from './test-utils';

(async () => {
  for await (const file of generateFiles()) {
    const directory = join(...file.path.slice(0, file.path.length - 1));
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(...file.path), file.contents);
  }
})();
