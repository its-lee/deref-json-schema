export const split = (str: string, sep: string): string[] => str.split(sep).filter(Boolean);

export const resolveKeypath = (obj: Record<string, unknown>, keypath: string): unknown => {
  const keys = split(keypath, '/');
  let result = obj;
  keys.forEach(key => {
    if (!(key in result)) {
      throw new Error(`Invalid keypath of '${keypath}' - '${key}' not found.`);
    }

    result = result[key] as Record<string, unknown>;
  });
  return result;
};
