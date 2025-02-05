import { NamespacedTypescriptOptions } from '@basketry/typescript/lib/types';

export type ZodOptions = {};

export type NamespacedZodOptions = NamespacedTypescriptOptions & {
  zod?: ZodOptions;
};
