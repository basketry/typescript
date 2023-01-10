import { NamespacedBasketryOptions } from 'basketry';

export type TypescriptOptions = {
  prettierConfig?: string;
  typeImports?: boolean;
};

export type NamespacedTypescriptOptions = NamespacedBasketryOptions & {
  typescript?: TypescriptOptions;
};
