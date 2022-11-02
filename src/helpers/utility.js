export const split = (str, sep) => str.split(sep).filter(Boolean);

export const resolveKeypath = (obj, keypath) => {
  const keys = split(keypath, '/');
  let result = obj;
  keys.forEach(key => {
    if (!(key in result)) {
      throw new Error(`Invalid keypath of '${keypath}' - '${key}' not found.`);
    }

    result = result[key];
  });
  return result;
};
