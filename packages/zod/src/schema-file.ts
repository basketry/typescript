import { camel, pascal } from 'case';
import { ImportBuilder, ModuleBuilder } from './utils';
import { NamespacedZodOptions } from './types';
import { buildTypeName } from '@basketry/typescript/lib/name-factory';
import { buildParamsType } from '@basketry/typescript';
import {
  Enum,
  isRequired,
  Method,
  Parameter,
  Property,
  Type,
  Union,
} from 'basketry';

export class SchemaFile extends ModuleBuilder<NamespacedZodOptions> {
  private readonly zod = new ImportBuilder('zod');
  protected readonly importBuilders = [this.zod];

  *body(): Iterable<string> {
    const z = () => this.zod.fn('z');

    const schemas: Schema[] = [];

    for (const type of this.service.types) {
      schemas.push({ name: buildTypeName(type), element: type });
    }
    for (const method of this.service.interfaces.flatMap((i) => i.methods)) {
      if (method.parameters.length === 0) continue;

      schemas.push({
        name: Array.from(buildParamsType(method)).join(''),
        element: method,
      });
    }
    for (const union of this.service.unions) {
      schemas.push({ name: buildTypeName(union), element: union });
    }
    for (const e of this.service.enums) {
      schemas.push({ name: buildTypeName(e), element: e });
    }

    for (const schema of sort(schemas)) {
      const { name, element } = schema;

      switch (element.kind) {
        case 'Type':
          yield `export const ${pascal(name)}Schema = ${z()}.object({`;
          for (const member of element.properties) {
            yield* this.buildMember(member, schema);
          }
          yield `});`;
          break;
        case 'Method':
          yield `export const ${pascal(name)}Schema = ${z()}.object({`;
          for (const member of element.parameters) {
            yield* this.buildMember(member, schema);
          }
          yield `});`;
          break;
        case 'Union':
          const complexMembers = element.members.filter((m) => !m.isPrimitive);

          if (complexMembers.length === 1) {
            // If there is only one member, just export the schema for that member
            yield `export const ${pascal(name)}Schema = ${pascal(
              complexMembers[0].typeName.value,
            )}Schema;`;
          } else {
            if (element.discriminator) {
              yield `export const ${pascal(
                name,
              )}Schema = ${z()}.discriminatedUnion('${camel(
                element.discriminator.value,
              )}', [`;
            } else {
              yield `export const ${pascal(name)}Schema = ${z()}.union([`;
            }

            for (const member of element.members) {
              if (member.isPrimitive) continue;

              yield `${pascal(member.typeName.value)}Schema,`;
            }

            yield `]);`;
          }

          break;
        case 'Enum':
          yield `export const ${pascal(name)}Schema = ${z()}.enum([`;
          for (const member of element.values) {
            yield `  '${member.content.value}',`;
          }
          yield `]);`;
          break;
      }
      yield '';
    }
  }

  *buildMember(member: Parameter | Property, parent: Schema): Iterable<string> {
    const z = () => this.zod.fn('z');
    const name = camel(member.name.value);

    const schema: string[] = [];

    if (member.isPrimitive) {
      switch (member.typeName.value) {
        case 'null':
          schema.push(`${z()}.literal(null)`);
          break;
        case 'string': {
          const enumRule = member.rules.find((r) => r.id === 'string-enum');

          if (member.constant) {
            schema.push(`${z()}.literal('${member.constant.value}')`);
          } else if (enumRule) {
            schema.push(
              `${z()}.enum(${enumRule.values
                .map((v) => `'${v.value}'`)
                .join(', ')})`,
            );
          } else {
            schema.push(`${z()}.string()`);

            const minLengthRule = member.rules.find(
              (r) => r.id === 'string-min-length',
            );
            const maxLengthRule = member.rules.find(
              (r) => r.id === 'string-max-length',
            );
            const patternRule = member.rules.find(
              (r) => r.id === 'string-pattern',
            );

            if (
              minLengthRule &&
              minLengthRule.length.value === maxLengthRule?.length.value
            ) {
              schema.push(`length(${minLengthRule.length.value})`);
            } else {
              if (minLengthRule)
                if (minLengthRule.length.value === 1) schema.push(`nonempty()`);
                else schema.push(`min(${minLengthRule.length.value})`);
              if (maxLengthRule)
                schema.push(`max(${maxLengthRule.length.value})`);
            }

            if (patternRule) {
              schema.push(`regex(/${patternRule.pattern.value}/)`);
            }
          }

          break;
        }
        case 'number':
        case 'integer':
        case 'long':
        case 'float':
        case 'double': {
          if (member.constant) {
            schema.push(`${z()}.literal(${member.constant.value})`);
          } else {
            schema.push(`${z()}.number()`);

            if (
              member.typeName.value === 'integer' ||
              member.typeName.value === 'long'
            ) {
              schema.push(`int()`);
            }

            const gtRule = member.rules.find((r) => r.id === 'number-gt');
            const gteRule = member.rules.find((r) => r.id === 'number-gte');
            const ltRule = member.rules.find((r) => r.id === 'number-lt');
            const lteRule = member.rules.find((r) => r.id === 'number-lte');
            const multipleOfRule = member.rules.find(
              (r) => r.id === 'number-multiple-of',
            );

            if (gtRule) {
              if (gtRule.value.value === 0) schema.push(`positive()`);
              else schema.push(`gt(${gtRule.value.value})`);
            }
            if (gteRule) {
              if (gteRule.value.value === 0) schema.push(`nonnegative()`);
              else schema.push(`gte(${gteRule.value.value})`);
            }
            if (ltRule) {
              if (ltRule.value.value === 0) schema.push(`negative()`);
              else schema.push(`lt(${ltRule.value.value})`);
            }
            if (lteRule) {
              if (lteRule.value.value === 0) schema.push(`nonpositive()`);
              else schema.push(`lte(${lteRule.value.value})`);
            }
            if (multipleOfRule) {
              schema.push(`multipleOf(${multipleOfRule.value.value})`);
            }
          }

          break;
        }
        case 'boolean': {
          if (member.constant) {
            schema.push(`${z()}.literal(${member.constant.value})`);
          } else {
            schema.push(`${z()}.boolean()`);
          }
          break;
        }
        case 'date':
        case 'date-time':
          schema.push(`${z()}.date()`);
          break;
        case 'binary':
        case 'untyped':
          schema.push(`${z()}.any()`);
          break;
      }
    } else {
      // TODO: support recursive types
      if (camel(member.typeName.value) === camel(parent.name)) {
        schema.push(`${z()}.lazy(()=>${pascal(member.typeName.value)}Schema)`);
      } else {
        schema.push(`${pascal(member.typeName.value)}Schema`);
      }
    }

    if (member.isArray) {
      schema.push(`array()`);

      const minRule = member.rules.find((r) => r.id === 'array-min-items');
      const maxRule = member.rules.find((r) => r.id === 'array-max-items');
      // TODO: support array-unique-items

      if (minRule) {
        if (minRule.min.value === 1) schema.push(`nonempty()`);
        else schema.push(`min(${minRule.min.value})`);
      }

      if (maxRule) schema.push(`max(${maxRule.max.value})`);
    }

    if (!isRequired(member)) {
      schema.push(`optional()`);
    }

    yield `${name}: ${schema.join('.')},`;
  }
}

function sort(iterable: Iterable<Schema>) {
  const sorted: Schema[] = [];
  let unsorted: Schema[] = Array.from(iterable);

  const sortedNames = new Set<string>();

  let prevUnsortedLength = unsorted.length;

  while (unsorted.length > 0) {
    const unsortable: Schema[] = [];
    const sortable: Schema[] = [];

    const newlySortedNames = new Set<string>();

    for (const schema of unsorted) {
      let complexMembers: string[] = [];

      switch (schema.element.kind) {
        case 'Type':
          complexMembers = schema.element.properties
            .filter((p) => !p.isPrimitive)
            .map((p) => pascal(p.typeName.value));
          break;
        case 'Method':
          complexMembers = schema.element.parameters
            .filter((p) => !p.isPrimitive)
            .map((p) => pascal(p.typeName.value));
          break;
        case 'Union':
          complexMembers = schema.element.members
            .filter((m) => !m.isPrimitive)
            .map((m) => pascal(m.typeName.value));
          break;
        case 'Enum':
          // Enums never have complex members
          break;
      }

      if (
        complexMembers.length === 0 ||
        complexMembers.every((n) => sortedNames.has(n) || n === schema.name)
      ) {
        sortable.push(schema);
        newlySortedNames.add(schema.name);
      } else {
        unsortable.push(schema);
      }
    }

    const sortedSortable = [...sortable].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    sorted.push(...sortedSortable);
    for (const name of newlySortedNames) sortedNames.add(name);
    unsorted = unsortable;

    if (prevUnsortedLength === unsorted.length) {
      console.error('Possible circular dependency detected');
      console.error(unsorted.map((s) => s.name));
      break;
    } else {
      prevUnsortedLength = unsorted.length;
    }
  }

  return sorted;
}

type Schema = {
  name: string;
  element: Type | Method | Union | Enum;
};
