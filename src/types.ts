import { NamespacedBasketryOptions } from 'basketry';

export type TypescriptOptions = {
  eslintDisable?: string[];
  prettierConfig?: string;
  typeImports?: boolean;
  includeVersion?: boolean;
};

export type NamespacedTypescriptOptions = NamespacedBasketryOptions & {
  typescript?: TypescriptOptions;
};
