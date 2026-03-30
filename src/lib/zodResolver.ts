// Custom zodResolver compatible with Zod v4 (.issues instead of .errors)
import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { appendErrors, FieldError, FieldErrors } from 'react-hook-form';

const parseErrorSchema = (issues: any[], validateAllFieldCriteria: boolean) => {
  const errors: Record<string, FieldError> = {};
  for (const issue of issues) {
    const { code, message, path } = issue;
    const _path = (path as (string | number)[]).join('.');

    if (!errors[_path]) {
      errors[_path] = { message, type: code };
    }

    if (validateAllFieldCriteria) {
      const types = errors[_path].types;
      const messages = types && types[code];
      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        code,
        messages ? ([] as string[]).concat(messages as string[], message) : message,
      ) as FieldError;
    }
  }
  return errors;
};

export const zodResolver =
  (schema: any, schemaOptions?: any, resolverOptions: { mode?: 'async' | 'sync'; raw?: boolean } = {}) =>
  async (values: any, _: any, options: any) => {
    try {
      const data = await schema[
        resolverOptions.mode === 'sync' ? 'parse' : 'parseAsync'
      ](values, schemaOptions);

      options.shouldUseNativeValidation && validateFieldsNatively({}, options);

      return {
        errors: {} as FieldErrors,
        values: resolverOptions.raw ? values : data,
      };
    } catch (error: any) {
      // Zod v4 uses .issues; Zod v3 used .errors — handle both
      const issues = error?.issues ?? error?.errors;
      if (Array.isArray(issues)) {
        return {
          values: {},
          errors: toNestErrors(
            parseErrorSchema(
              issues,
              !options.shouldUseNativeValidation && options.criteriaMode === 'all',
            ),
            options,
          ),
        };
      }
      throw error;
    }
  };
