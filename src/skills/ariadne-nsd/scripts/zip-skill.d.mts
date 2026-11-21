type Entry = { name: string; data: Buffer };

export function files(dir: string): string[];
export function zip(entries: readonly Entry[]): Buffer;
export function skillEntries(skill: string): Entry[];
