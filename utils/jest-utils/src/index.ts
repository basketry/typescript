import * as ts from 'typescript';
import type { Options } from 'prettier';
import { format } from '@prettier/sync';

export { Factory } from './factory';

/** Formats a string using Prettier */
function f(s: string): string {
  // First pass: format with very tight print width to force line breaks
  // Second pass: format with normal print width to clean up
  return format(
    format(s, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 1,
    }),
    {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 80,
    },
  );
}

export function registerJestUtils() {
  expect.extend({
    toContainAst(received, expected) {
      if (typeof received !== 'string') {
        return {
          pass: false,
          message: () =>
            `toContainAst expected a string as the received value, but got ${typeof received}`,
        };
      } else if (typeof expected !== 'string') {
        return {
          pass: false,
          message: () =>
            `toContainAst expected the 'expected' argument to be a string, but got ${typeof expected}`,
        };
      }

      const utils = this.utils;

      const sfExpected = parse(expected, 'expected.ts');
      const sfReceived = parse(received, 'received.ts');

      const expectedDecls = collectNamedTopDecls(sfExpected);
      const receivedDecls = collectNamedTopDecls(sfReceived);

      const missing: string[] = [];
      const mismatched: Array<{
        key: string;
        kind: string;
        name: string;
        a: string;
        b: string;
      }> = [];

      const expectedArr: string[] = [];
      const actualArr: string[] = [];

      for (const [key, expDecl] of expectedDecls) {
        const gotDecl = receivedDecls.get(key);
        const [kind, name] = key.split(':');

        expectedArr.push(`${kind} ${name}`);
        if (gotDecl) {
          actualArr.push(`${kind} ${name}`);
        } else {
          missing.push(`${kind} ${name}`);
          continue;
        }
        const expPrinted = printNode(sfExpected, expDecl);
        const gotPrinted = printNode(sfReceived, gotDecl);

        if (expPrinted !== gotPrinted) {
          const [kind, name] = key.split(':');
          mismatched.push({ key, kind, name, a: expPrinted, b: gotPrinted });
        }
      }

      const pass = missing.length === 0 && mismatched.length === 0;

      return {
        pass,
        message: () => {
          const lines: string[] = [];
          if (pass) {
            // If Jest shows message on negated assertion, provide a brief diffy note
            lines.push(
              'Expected AST NOT to match, but all expected declarations matched.',
            );
          } else {
            if (missing.length) {
              const expectedString = expectedArr.sort().join('\n');
              const actualString = actualArr.sort().join('\n');

              lines.push('Missing declarations');
              for (const k of missing) lines.push(`  - ${k}`);
              lines.push('');
              const diff =
                utils.diff(expectedString, actualString) ??
                `${expectedString}\n\nvs\n\n${actualString}`;
              lines.push(diff);
              lines.push('');
            }
            for (const m of mismatched) {
              lines.push(`Mismatched ${m.kind} declaration for '${m.name}':`);
              const diff = utils.diff(m.a, m.b) ?? `${m.a}\n\nvs\n\n${m.b}`;
              lines.push(diff);
              lines.push('');
            }
            // Optional: when nothing matched at all, offer a hint
            if (expectedDecls.size && receivedDecls.size === 0) {
              lines.push(
                "Hint: No named top-level declarations were found in 'received'. " +
                  'Did the generator wrap output (e.g., namespace/module) or emit only statements without names?',
              );
            }
          }
          return lines.join('\n');
        },
      };
    },
  });
}

type NamedTopDecl =
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.ClassDeclaration
  | ts.EnumDeclaration
  | ts.FunctionDeclaration
  | ts.VariableStatement;

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function parse(code: string, fileName = 'virtual.ts'): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
}

function printNode(sf: ts.SourceFile, node: ts.Node): string {
  return f(printer.printNode(ts.EmitHint.Unspecified, node, sf).trim());
}

function isNamedTopDecl(n: ts.Node): n is NamedTopDecl {
  return (
    (ts.isInterfaceDeclaration(n) && !!n.name) ||
    (ts.isTypeAliasDeclaration(n) && !!n.name) ||
    (ts.isClassDeclaration(n) && !!n.name) ||
    (ts.isEnumDeclaration(n) && !!n.name) ||
    (ts.isFunctionDeclaration(n) && !!n.name) ||
    (ts.isVariableStatement(n) &&
      n.declarationList.declarations.some(
        (d) => ts.isIdentifier(d.name) && !!d.name,
      ))
  );
}

function kindLabel(n: NamedTopDecl): string {
  if (ts.isInterfaceDeclaration(n)) return 'interface';
  if (ts.isTypeAliasDeclaration(n)) return 'type';
  if (ts.isClassDeclaration(n)) return 'class';
  if (ts.isEnumDeclaration(n)) return 'enum';
  if (ts.isFunctionDeclaration(n)) return 'function';
  if (ts.isVariableStatement(n)) return 'const';
  return 'decl';
}

function keyFor(n: NamedTopDecl): string {
  // key used to match across files: "<kind>:<name>"
  const name = ts.isVariableStatement(n)
    ? n.declarationList.declarations[0].name.getText()
    : n.name!.text;
  return `${kindLabel(n)}:${name}`;
}

function collectNamedTopDecls(sf: ts.SourceFile): Map<string, NamedTopDecl> {
  const map = new Map<string, NamedTopDecl>();
  for (const stmt of sf.statements) {
    if (isNamedTopDecl(stmt)) map.set(keyFor(stmt), stmt);
  }
  return map;
}
