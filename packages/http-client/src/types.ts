import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export declare type TypescriptHttpClientOptions = {
  includeAuthSchemes?: boolean;
  typesImportPath?: string;
  dtosImportPath?: string;
  mappersImportPath?: string;
  validatorsImportPath?: string;
  sanitizersImportPath?: string;
  schemasImportPath?: string;
  validation?: 'zod';
};

export declare type NamespacedTypescriptHttpClientOptions =
  NamespacedTypescriptOptions & {
    httpClient?: TypescriptHttpClientOptions;
  };
