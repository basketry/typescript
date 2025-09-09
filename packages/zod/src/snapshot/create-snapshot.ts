import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { buildPath, generateFiles } from './test-utils';

(async () => {
  for await (const file of generateFiles()) {
    const directory = join(
      ...buildPath(...file.path).slice(0, file.path.length - 1),
    );
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(...buildPath(...file.path)), file.contents);
  }
})();
