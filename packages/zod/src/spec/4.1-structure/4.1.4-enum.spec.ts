import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.1.4 Enum', () => {
  it('creates a schema for an enum', async () => {
    // ARRANGE
    const service = factory.service({
      enums: [
        factory.enum({
          name: factory.stringLiteral('MyEnum'),
          members: [
            factory.enumMember({ content: factory.stringLiteral('FOO') }),
            factory.enumMember({ content: factory.stringLiteral('BAR') }),
            factory.enumMember({ content: factory.stringLiteral('BAZ') }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
        export const MyEnumSchema = z.enum(['FOO', 'BAR', 'BAZ']);
      `);
  });

  it('emits a TypeScript-idiomatic name when the enum name is not in PascalCase', async () => {
    // ARRANGE
    const service = factory.service({
      enums: [
        factory.enum({
          name: factory.stringLiteral('my enum'),
          members: [
            factory.enumMember({ content: factory.stringLiteral('FOO') }),
            factory.enumMember({ content: factory.stringLiteral('BAR') }),
            factory.enumMember({ content: factory.stringLiteral('BAZ') }),
          ],
        }),
      ],
    });

    // ACT
    const result = await schemaGenerator(service);

    // ASSERT
    expect(result[0].contents).toContainAst(`
        export const MyEnumSchema = z.enum(['FOO', 'BAR', 'BAZ']);
      `);
  });
});
