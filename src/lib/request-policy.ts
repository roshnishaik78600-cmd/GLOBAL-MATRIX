export const REQUEST_LIMIT = { inquiriesPerHour: 5, windowSeconds: 3600 } as const;

export function retryMessage(seconds: number): string {
  return `Too many requests. Please try again in ${Math.max(1, Math.ceil(seconds / 60))} minute(s).`;
}
