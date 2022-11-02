import { split } from './utility';

const visitRefs = (
  obj: Record<string, unknown>,
  callback: (value: string) => undefined | Record<string, unknown>
): void => {
  for (const key in obj) {
    const value = obj[key];

    if (Array.isArray(value)) {
      value.forEach(v => visitRefs(v, callback));
    } else if (typeof value == 'object' && value !== null) {
      visitRefs(value as Record<string, unknown>, callback);
    } else if (key === '$ref' && typeof value === 'string') {
      // Replace { $ref: 'some reference to another file' } by { field1: .., field2: .. }
      const updatedValue = callback(value);
      if (updatedValue !== undefined) {
        // We can't just do obj = updatedValue as that wouldn't affect the visited object.
        delete obj['$ref'];
        Object.keys(updatedValue).forEach(k => (obj[k] = updatedValue[k]));
      }
    }
  }
};

export type VisitorCallback = (...args: string[]) => undefined | Record<string, unknown>;

const visitRefType = (
  obj: Record<string, unknown>,
  callback: VisitorCallback,
  isInterfile: boolean
): void => {
  visitRefs(obj, value => {
    if (isInterfile === !value.startsWith('#')) {
      return callback(...split(value, '#'));
    }
  });
};

export const visitInterfileRefs = (
  obj: Record<string, unknown>,
  callback: VisitorCallback
): void => {
  visitRefType(obj, callback, true);
};

export const visitIntrafileRefs = (
  obj: Record<string, unknown>,
  callback: VisitorCallback
): void => {
  visitRefType(obj, callback, false);
};
