import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export declare type TypescriptDTOOptions = {
  typesImportPath?: string;
  role?: 'client' | 'server';
};

export declare type NamespacedTypescriptDTOOptions =
  NamespacedTypescriptOptions & {
    dtos?: TypescriptDTOOptions;
  };
