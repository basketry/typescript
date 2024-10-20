import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export declare type TypescriptHttpClientOptions = {
  includeAuthSchemes?: boolean;
  typesImportPath?: string;
  validatorsImportPath?: string;
  sanitizersImportPath?: string;
  dateUtilsImportPath?: string;
};

export declare type NamespacedTypescriptHttpClientOptions =
  NamespacedTypescriptOptions & {
    typescriptHttpClient?: TypescriptHttpClientOptions;
  };
