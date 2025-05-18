import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export declare type ExpressOptions = {
  authImportPath?: string;
  typesImportPath?: string;
  validatorsImportPath?: string;
  schemasImportPath?: string;
  validation?: 'zod';
};

export declare type NamespacedExpressOptions = NamespacedTypescriptOptions & {
  express?: ExpressOptions;
};
