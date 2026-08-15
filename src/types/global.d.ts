import type { KdsEvent } from "@/types";

declare global {
  // In-memory SSE event bus — keyed by cafeId
  // eslint-disable-next-line no-var
  var __kdsEvents: Record<string, KdsEvent[]> | undefined;
}

export {};
