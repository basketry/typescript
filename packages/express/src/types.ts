import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export declare type ExpressOptions = {
  authImportPath?: string;
  typesImportPath?: string;
  validatorsImportPath?: string;
  dateUtilsImportPath?: string;
};

export declare type NamespacedExpressOptions = NamespacedTypescriptOptions & {
  express?: ExpressOptions;
};
