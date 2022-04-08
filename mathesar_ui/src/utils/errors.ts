export function getErrorMessage(v: unknown): string {
  if (typeof v === 'string') {
    return v;
  }
  if (v instanceof Error) {
    return v.message;
  }
  if (typeof v === 'object') {
    return JSON.stringify(v);
  }
  return String(v);
}
