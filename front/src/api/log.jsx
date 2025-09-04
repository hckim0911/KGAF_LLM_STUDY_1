export const logError = (message, error, context) => {
  console.error(`[Error] ${message}` + (context ? ` | Context: ${context}` : ''), error);
};
