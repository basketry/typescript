import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { File } from 'basketry';
import { buildPath, generate, replaceVersion, snapshots } from './test-utils';

const writeFiles = async (snapshotFiles: File[], snapshot: string) => {
  for (const file of snapshotFiles) {
    const path = file.path.slice(0, file.path.length - 1);
    const filename = file.path[file.path.length - 1];

    const fullpath = buildPath('src', 'snapshot', snapshot, ...path);

    mkdirSync(join(...fullpath), { recursive: true });
    writeFileSync(
      join(...fullpath, filename),
      await replaceVersion(file.contents),
    );
  }
};

(async () => {
  for (const [snapshot, options] of Object.entries(snapshots)) {
    await writeFiles(await generate(options), snapshot);
  }
})();
