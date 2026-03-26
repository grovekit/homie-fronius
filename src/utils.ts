
import { type ValidationErrorItem, type ValidationError } from "@deepkit/type";

export const wait = (delay: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

export const validationErrorToString = (err: ValidationError): string => {
  return err.errors.map(validationErrorItemToString).join(', ');
};

export const validationErrorItemToString = (item: ValidationErrorItem): string => {
  return `${item.path}: ${item.message} (${item.code})`;
};

export const errToString = (err: Error | any, hide_stack?: boolean): string => {
  if (err instanceof Error) {
    return hide_stack ? err.message : (err.stack ?? err.message);
  }
  if (typeof err === 'object' && err !== 'null') {
    return Object.prototype.toString.call(err.message ?? err);
  }
  return Object.prototype.toString.call(err);
};
