let verbose = false;

export const setVerbosity = verbosity => (verbose = verbosity);

export const log = (type, ...messages) => {
  const allowedTypes = ['error', 'warn', 'info'];
  if (verbose) {
    allowedTypes.push('debug');
  }

  if (allowedTypes.includes(type)) {
    const typeText = type.toUpperCase();
    console.info(`[${typeText}]`.padStart(7), ...messages);
  }
};
