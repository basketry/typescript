import { readFileSync } from 'fs';
import { join } from 'path';
import { format as formatWithPrettier, Options } from 'prettier';
import { NamespacedTypescriptOptions } from './types';

export function from(lines: Iterable<string>): string {
  return Array.from(lines).join('\n');
}

let indentCount = 0;
const indentation = '  ';

export type Contents =
  | string
  | Iterable<string>
  | (() => string | Iterable<string>);

/** Indents the supplied contents. Indentation is preserved between calls. */
export function* indent(contents: Contents): Iterable<string> {
  try {
    indentCount++;
    for (const line of iter(contents)) {
      yield line.trim().length
        ? `${indentation.repeat(indentCount)}${line.trim()}`
        : '';
    }
  } finally {
    indentCount--;
  }
}
export type IndentFunction = typeof indent;

/** Unindents the supplied contents if the current indentation is > 0. Indentation is preserved between calls. */
export function* unindent(contents: Contents): Iterable<string> {
  const changeIndent = indentCount > 0;
  try {
    if (changeIndent) indentCount--;
    for (const line of iter(contents)) {
      yield line.trim().length
        ? `${indentation.repeat(indentCount)}${line.trim()}`
        : '';
    }
  } finally {
    if (changeIndent) indentCount++;
  }
}
export type UnindentFunction = typeof unindent;

/** Comments the supplied contents. Empty lines are preserved. */
export function* comment(contents?: Contents): Iterable<string> {
  if (!contents) {
    yield '//';
  } else {
    for (const line of iter(contents)) {
      yield line.length ? `// ${line}` : '//';
    }
  }
}
export type CommentFunction = typeof comment;

/** Creates a block comment with the supplied contents. Empty lines are preserved. */
export function* blockComment(contents?: Contents): Iterable<string> {
  if (contents) {
    yield '/**';
    for (const line of iter(contents)) {
      yield line.length ? ` * ${line}` : ' *';
    }
    yield ' */';
  }
}
export type BlockCommentFunction = typeof blockComment;

/** Converts `Contents` into an `Iterable<string>` */
function iter(contents: Contents): Iterable<string> {
  function arr(value: string | Iterable<string>): Iterable<string> {
    return typeof value === 'string' ? [value] : value;
  }

  return typeof contents === 'function' ? arr(contents()) : arr(contents);
}

export function* eslintDisable(
  options: NamespacedTypescriptOptions,
): Iterable<string> {
  for (const rule of options?.typescript?.eslintDisable || []) {
    yield `/* eslint-disable ${rule} */`;
  }
}

/** Formats the source content with Prettier. */
export function format(
  source: string,
  options: NamespacedTypescriptOptions | undefined,
): string {
  try {
    let prettierOptions: Options = {
      parser: 'typescript',
    };

    const { success, config } = tryLoadConfig(
      options?.typescript?.prettierConfig,
    );
    if (success) {
      prettierOptions = { ...prettierOptions, ...config };
    }

    return formatWithPrettier(source, prettierOptions);
  } catch (err) {
    return source;
  }
}

function tryLoadConfig(configPath: string | undefined): {
  success: boolean;
  config: any;
} {
  if (!configPath) return tryLoadConfig('.prettierrc');

  try {
    return { success: true, config: require(configPath) };
  } catch {}

  try {
    return { success: true, config: require(join(process.cwd(), configPath)) };
  } catch {}

  try {
    return {
      success: true,
      config: JSON.parse(readFileSync(configPath).toString()),
    };
  } catch {}

  try {
    return {
      success: true,
      config: JSON.parse(
        readFileSync(join(process.cwd(), configPath)).toString(),
      ),
    };
  } catch {}

  return { success: false, config: undefined };
}

export type Formatter = {
  comment: CommentFunction;
  blockComment: BlockCommentFunction;
  indent: IndentFunction;
  unindent: UnindentFunction;
};
export const formatter: Formatter = {
  comment,
  blockComment,
  indent,
  unindent,
};
