import { split } from './utility.js';

const visitRefs = (obj, callback) => {
  for (const key in obj) {
    const value = obj[key];

    if (Array.isArray(value)) {
      value.forEach(v => visitRefs(v, callback));
    } else if (typeof value == 'object' && value !== null) {
      visitRefs(value, callback);
    } else if (key === '$ref') {
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

const visitRefType = (obj, callback, isInterfile) => {
  visitRefs(obj, value => {
    if (isInterfile === !value.startsWith('#')) {
      return callback(...split(value, '#'));
    }
  });
};

export const visitInterfileRefs = (obj, callback) => visitRefType(obj, callback, true);

export const visitIntrafileRefs = (obj, callback) => visitRefType(obj, callback, false);
