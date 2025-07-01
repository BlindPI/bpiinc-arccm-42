
export const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(`🔧 DEBUG: ${message}`, ...args);
  }
};

export const debugWarn = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(`⚠️ DEBUG: ${message}`, ...args);
  }
};

export const debugError = (message: string, ...args: any[]) => {
  console.error(`❌ DEBUG: ${message}`, ...args);
};

export const debugInfo = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.info(`ℹ️ DEBUG: ${message}`, ...args);
  }
};
