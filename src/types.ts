import { NamespacedBasketryOptions } from 'basketry';

export type TypescriptOptions = {
  eslintDisable?: string[];
  prettierConfig?: string;
  typeImports?: boolean;
  includeVersion?: boolean;
  interfaceNomenclature?: string;
};

export type NamespacedTypescriptOptions = NamespacedBasketryOptions & {
  typescript?: TypescriptOptions;
};
