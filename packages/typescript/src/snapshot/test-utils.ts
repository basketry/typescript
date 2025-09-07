import { join } from 'path';

import { NodeEngine, File } from 'basketry';

import { generateTypes } from '../interface-factory';
import { NamespacedTypescriptOptions } from '../types';

const regex =
  /^((?:[^\r\n]*\r?\n)?[^\r\n]*?(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)@)((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)/m;

export async function replaceVersion(
  content: string | Promise<string>,
): Promise<string> {
  // Replace just the version (group 2), preserve prefix (group 1)
  return (await content).replace(
    regex,
    (_m, g1 /* prefix+package@ */, _g2 /* version */) => {
      return `${g1}{{version}}`;
    },
  );
}

export function buildPath(...paths: string[]): string[] {
  const base = process.cwd();

  if (base.endsWith(join('packages', 'typescript'))) {
    return [base, ...paths];
  } else {
    return [base, 'packages', 'typescript', ...paths];
  }
}

export async function* generateFiles(): AsyncIterable<File> {
  const service = require('@basketry/ir/lib/example.json');

  const prettierConfig = join(...buildPath('..', '..', '.prettierrc'));

  const options: NamespacedTypescriptOptions = {
    typescript: { prettierConfig },
  };

  const { engines } = await NodeEngine.load({
    sourcePath: 'source/path.ext',
    sourceContent: JSON.stringify(service),
    parser: (x) => ({ service: JSON.parse(x), violations: [] }),
    generators: [generateTypes],
    options,
  });

  for (const engine of engines) {
    await engine.runParser();
    await engine.runGenerators();

    for (const file of engine.files) {
      if (file.path[0] !== '.gitattributes') {
        yield {
          path: buildPath('src', 'snapshot', ...file.path),
          contents: await replaceVersion(file.contents),
        };
      }
    }
  }
}
