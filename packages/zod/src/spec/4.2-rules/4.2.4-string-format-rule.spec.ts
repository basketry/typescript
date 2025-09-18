import { Factory } from '@basketry/jest-utils';
import schemaGenerator from '../..';

const factory = new Factory();

describe('4.2.4 StringFormatRule', () => {
  describe('email', () => {
    it('applies the email validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('email')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().email()});`,
      );
    });

    it('applies the email validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('email')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().email().optional()});`,
      );
    });
  });

  describe('url', () => {
    it('applies the url validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('url')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().url()});`,
      );
    });

    it('applies the url validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('url')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().url().optional()});`,
      );
    });
  });

  describe('emoji', () => {
    it('applies the emoji validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('emoji')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().emoji()});`,
      );
    });

    it('applies the emoji validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('emoji')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().emoji().optional()});`,
      );
    });
  });

  describe('uuid', () => {
    it('applies the uuid validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('uuid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().uuid()});`,
      );
    });

    it('applies the uuid validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('uuid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().uuid().optional()});`,
      );
    });
  });

  describe('nanoid', () => {
    it('applies the nanoid validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('nanoid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().nanoid()});`,
      );
    });

    it('applies the nanoid validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('nanoid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().nanoid().optional()});`,
      );
    });
  });

  describe('cuid', () => {
    it('applies the cuid validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('cuid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cuid()});`,
      );
    });

    it('applies the cuid validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('cuid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cuid().optional()});`,
      );
    });
  });

  describe('cuid2', () => {
    it('applies the cuid2 validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('cuid2')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cuid2()});`,
      );
    });

    it('applies the cuid2 validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('cuid2')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cuid2().optional()});`,
      );
    });
  });

  describe('ulid', () => {
    it('applies the ulid validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('ulid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().ulid()});`,
      );
    });

    it('applies the ulid validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('ulid')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().ulid().optional()});`,
      );
    });
  });

  describe('ip', () => {
    it('applies the ip validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('ip')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().ip()});`,
      );
    });

    it('applies the ip validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('ip')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().ip().optional()});`,
      );
    });
  });

  describe('cidr', () => {
    it('applies the cidr validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('cidr')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cidr()});`,
      );
    });

    it('applies the cidr validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('cidr')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().cidr().optional()});`,
      );
    });
  });

  describe('base64', () => {
    it('applies the base64 validator to a required property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  rules: [factory.stringFormatRule('base64')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().base64()});`,
      );
    });

    it('applies the base64 validator to an optional property', async () => {
      // ARRANGE
      const service = factory.service({
        types: [
          factory.type({
            name: factory.stringLiteral('MyType'),
            properties: [
              factory.property({
                name: factory.stringLiteral('propA'),
                value: factory.primitiveValue({
                  typeName: factory.primitiveLiteral('string'),
                  isOptional: factory.trueLiteral(),
                  rules: [factory.stringFormatRule('base64')],
                }),
              }),
            ],
          }),
        ],
      });

      // ACT
      const result = await schemaGenerator(service);

      // ASSERT
      expect(result[0].contents).toContainAst(
        `export const MyTypeSchema = z.object({propA: z.string().base64().optional()});`,
      );
    });
  });
});
