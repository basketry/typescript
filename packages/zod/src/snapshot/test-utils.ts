import { generateSchemas } from '../schema-generator';
import { Engine, File } from 'basketry';
import { NamespacedZodOptions } from '../types';

const pkg = require('../../package.json');
const withVersion = `${pkg.name}@${pkg.version}`;
const withoutVersion = `${pkg.name}@{{version}}`;

export async function* generateFiles(): AsyncIterable<File> {
  const service = require('@basketry/ir/lib/example.json');

  const options: NamespacedZodOptions = {};

  const { engines } = await Engine.load({
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
          contents: file.contents.replace(withVersion, withoutVersion),
        };
      }
    }
  }
}
