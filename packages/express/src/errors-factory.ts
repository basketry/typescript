import { File, getTypeByName, Service, Type } from 'basketry';
import { NamespacedExpressOptions } from './types';
import { buildFilePath, buildTypeName } from '@basketry/typescript';
import { format } from '@basketry/typescript/lib/utils';
import { BaseFactory } from './base-factory';

export class ExpressErrorsFactory extends BaseFactory {
  constructor(service: Service, options: NamespacedExpressOptions) {
    super(service, options);
  }

  async build(): Promise<File[]> {
    const files: File[] = [];

    const contents = Array.from(this.buildErrors()).join('\n\n');
    const preamble = Array.from(this.buildPreamble()).join('\n');

    files.push({
      path: buildFilePath(['express', 'errors.ts'], this.service, this.options),
      contents: await format([preamble, contents].join('\n\n'), this.options),
    });

    return files;
  }

  private *buildErrors(): Iterable<string> {
    const ErrorType = () => {
      switch (this.options.express?.validation) {
        case 'zod':
          this.touchZodIssueImport();
          return 'ZodIssue';
        default:
          return `${this.validatorsModule}.ValidationError`;
      }
    };

    // METHOD_NOT_ALLOWED
    yield `export function methodNotAllowed(): MethodNotAllowedError { return { code: 'METHOD_NOT_ALLOWED', status: 405, title: 'Method Not Allowed' }; }`;
    yield `export function isMethodNotAllowed(error: any): error is MethodNotAllowedError { return error.code === 'METHOD_NOT_ALLOWED'; }`;
    yield `export type MethodNotAllowedError = { code: 'METHOD_NOT_ALLOWED'; status: number; title: string; };`;

    // VALIDATION_ERRORS
    yield `export function validationErrors(status: 400 | 500, errors: ${ErrorType()}[]): ValidationErrorsError { return { code: 'VALIDATION_ERRORS', status, errors }; }`;
    yield `export function isValidationErrors(error: any): error is ValidationErrorsError { return error.code === 'VALIDATION_ERRORS'; }`;
    yield `export type ValidationErrorsError = { code: 'VALIDATION_ERRORS'; status: number; errors: ${ErrorType()}[]; };`;

    // HANDLED_EXCEPTION
    const errorTypes = ExpressErrorsFactory.getErrorTypes(this.service);
    if (errorTypes.length > 0) {
      const errorTypeUnion = errorTypes
        .map((type) => `${buildTypeName(type, this.typesModule)}[]`)
        .join(' | ');
      yield `export function handledException( status: number, errors: ${errorTypeUnion}): HandledExceptionError { return { code: 'HANDLED_EXCEPTION', status, errors }; }`;
      yield `export function isHandledException(error: any): error is HandledExceptionError { return error.code === 'HANDLED_EXCEPTION'; }`;
      yield `export type HandledExceptionError = { code: 'HANDLED_EXCEPTION'; status: number; errors: ${errorTypeUnion}; };`;
    }

    // UNHANDLED_EXCEPTION
    yield `export function unhandledException( exception: any): UnhandledExceptionError { return { code: 'UNHANDLED_EXCEPTION', status: 500, exception }; }`;
    yield `export function isUnhandledException(error: any): error is UnhandledExceptionError { return error.code === 'UNHANDLED_EXCEPTION'; }`;
    yield `export type UnhandledExceptionError = { code: 'UNHANDLED_EXCEPTION'; status: number; exception: any; };`;
  }

  static getErrorTypes(service: Service): Type[] {
    const returnTypes = service.interfaces
      .flatMap((int) => int.methods)
      .map((method) =>
        getTypeByName(service, method.returns?.value.typeName.value),
      )
      .filter((type): type is Type => type !== undefined);

    const errorTypeNames = Array.from(
      new Set(
        returnTypes
          .map(
            (type) =>
              type.properties.find(
                (prop) =>
                  prop.value.isArray &&
                  prop.name.value.toLowerCase() === 'errors',
              )?.value.typeName.value,
          )
          .filter((typeName): typeName is string => typeName !== undefined),
      ),
    );

    const errorTypes = errorTypeNames
      .map((typeName) => getTypeByName(service, typeName))
      .filter((type): type is Type => type !== undefined);

    return errorTypes;
  }
}
