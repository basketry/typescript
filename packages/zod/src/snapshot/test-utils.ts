import { join } from 'path';

import { File, NodeEngine } from 'basketry';

import { generateSchemas } from '../schema-generator';
import { NamespacedZodOptions } from '../types';

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

  const options: NamespacedZodOptions = {};

  const { engines } = await NodeEngine.load({
    sourcePath: 'source/path.ext',
    sourceContent: JSON.stringify(service),
    parser: (x) => ({ service: JSON.parse(x), violations: [] }),
    generators: [generateSchemas],
    options,
  });

  for (const engine of engines) {
    engine.runParser();
    engine.runGenerators();

    for (const file of engine.files) {
      if (file.path[0] !== '.gitattributes') {
        yield {
          path: [process.cwd(), 'src', 'snapshot', ...file.path],
          contents: await replaceVersion(file.contents),
        };
      }
    }
  }
}
