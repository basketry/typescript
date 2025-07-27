import { File, Service, warning } from 'basketry';
import { NamespacedTypescriptDTOOptions } from './types';
import { buildFilePath } from '@basketry/typescript';
import { format, Options } from 'prettier';
import { BaseFactory } from './base-factory';
import { join } from 'path';
import { readFileSync } from 'fs';
import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export class ExpressReadmeFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedTypescriptDTOOptions) {
    super(service, options);
  }

  async build(): Promise<File[]> {
    const files: File[] = [];

    const contents = Array.from(this.buildContents()).join('\n');
    // const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['dtos', 'README.md'], this.service, this.options),
      contents: formatMarkdown(
        [contents].join('\n\n'),
        this.options,
      ) as any as string, // Prettier 3 hack until basketry types support promises
    });

    return files;
  }

  private *buildContents(): Iterable<string> {
    yield '<!--';
    yield* warning(
      this.service,
      require('../package.json'),
      this.options || {},
    );
    yield '-->';
    yield '';

    const typesImportPath = this.options?.dtos?.typesImportPath ?? '../types';
    const businessObjectTypes = `[**Business Object Types**](${typesImportPath}.ts)`;
    const dtoImportPath = './types';
    const dataTransferObjects = `[**DTO (Data Transfer Object) Types**](${dtoImportPath}.ts)`;
    const dtoTypes = `[**DTO Types**](${dtoImportPath}.ts)`;
    const mappersImportPath = './mappers';
    const handlersImportPath = './handlers';

    const isClient = this.options?.dtos?.role === 'client';

    const outbound = isClient ? 'API' : 'client';
    const inbound = isClient ? 'client' : 'API';

    yield `
# Express API

## Data Transfer Objects (DTOs)

In the generated ${inbound} code, you will find two distinct sets of types: ${businessObjectTypes} and ${dataTransferObjects}. These types serve different purposes and are essential for maintaining a clear separation of concerns between internal data structures and the external API contract.

### Why Two Sets of Types?

- ${businessObjectTypes} are written in a way that is idiomatic to TypeScript. While they are generated from the API contract, they follow a naming and casing convention consistent with the rest of the codebase.

- ${dtoTypes} represent the over-the-wire format defined by the API contract. These types are used to communicate with external clients, ensuring consistency in the structure and casing of the data being exposed or accepted by the API. These types may have different naming conventions (e.g., snake_case for JSON fields) and might not always align one-to-one with our internal types.

### When to Use ${businessObjectTypes} vs. ${dtoTypes}

Use ${businessObjectTypes} when you are working within the ${inbound} and need to interact with the domain objects. The vast majority of hand-written code will use these types. ${isClient ? 'Examples of this type of code include UI such as forms that interact with the business logic imlemented in the API. ' : 'Examples of this type of code include service class implementations that contain the actual business logic that powers the API. '}When in doubt, use ${businessObjectTypes}.

Use ${dtoTypes} when interacting with external ${outbound}s through the ${inbound}. This includes:

- Response Serialization: Transforming internal ${businessObjectTypes} into ${dtoTypes} before sending them in API responses. In most cases, this is handled by the generated [mappers](${mappersImportPath}.ts).
- Custom Response handlers: Each service method has a generated [response handler](${handlersImportPath}.ts) that runs the appropriate service method and serializes the response into a DTO. You can override this behavior by providing a custom response handler.

## Mappers

The [mappers](${mappersImportPath}.ts) module exports generated mapper functions. These functions are responsible for mapping between ${businessObjectTypes} and ${dataTransferObjects}, both of which are generated from the API contract. The mapper functions guarantee correct transformations between these two sets of types, maintaining consistency between ${isClient ? 'consumers' : 'internal business logic'} and the external API contract.

### Why Use Generated Mapper Functions?

- Consistency: Manually mapping between Business Object Types and DTO Types can lead to errors and inconsistencies. By generating the mapper types, we eliminate human error and ensure that the mappings always follow the API contract.

- Maintainability: As the API evolves, regenerating the mapper types ensures that mappings between types are updated automatically. This significantly reduces the amount of manual work required when the API changes.

### When to Use the Mapper Types

${
  isClient
    ? `
The generated client code contains default implementations for HTTP client services than can be used as-is. However, if you decide to hand-write custom network calls, there are several scenarios where you may need to interact with the mapper types directly:

- Custom Request Builders: When manually creating API requests (e.g., outside of an autogenerated client or beyond simple fetch calls), use the mapper types to convert ${businessObjectTypes} into the ${dataTransferObjects} expected by the API.

- Response Serialization: After receiving a response from the API, use the mapper types to convert DTO Types into Business Object Types that are easier to work with in your application logic.

- Integration Testing: When testing the client-side code that integrates with the API, mapper types can help validate that outgoing and incoming data structures are correctly transformed, making it easier to verify behavior and catch mismatches.`
    : `
The generated Express API code contains default implementations for the request handlers than can be used as-is. However, if you decide to hand-write custom Express handlers, there are several scenarios where you may need to interact with the mapper types directly:

- Custom Response handlers: When writing custom response handlers, use the mapper types to convert ${businessObjectTypes} from and two ${dataTransferObjects} when interacting with the data on the Express request object.

- Response Serialization: After processing a request, use the mapper types to convert Business Object Types back into DTO Types to send as the API response.

- Integration Testing: When validating the interaction between internal logic and the external API, the mapper types can be used to ensure that data is being transformed correctly.`
}
`;
  }
}

/** Formats the source content with Prettier. */
export async function formatMarkdown(
  source: string,
  options: NamespacedTypescriptOptions | undefined,
): Promise<string> {
  try {
    let prettierOptions: Options = {
      parser: 'markdown',
    };

    const { success, config } = tryLoadConfig(
      options?.typescript?.prettierConfig,
    );
    if (success) {
      prettierOptions = { ...prettierOptions, ...config };
    }

    return format(source, prettierOptions);
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
