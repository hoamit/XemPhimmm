const isDevelopment = process.env.NODE_ENV !== 'production';

const loggedMessages = new Set<string>();

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return error;
}

export function debugLog(message: string, context?: unknown) {
  if (!isDevelopment) {
    return;
  }

  if (typeof context === 'undefined') {
    console.debug(message);
    return;
  }

  console.debug(message, context);
}

export function debugWarn(message: string, context?: unknown) {
  if (!isDevelopment) {
    return;
  }

  if (typeof context === 'undefined') {
    console.warn(message);
    return;
  }

  console.warn(message, serializeError(context));
}

export function debugLogOnce(key: string, message: string, context?: unknown) {
  if (!isDevelopment || loggedMessages.has(key)) {
    return;
  }

  loggedMessages.add(key);
  debugLog(message, context);
}
