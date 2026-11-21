export function files(dir: string): string[];
export function zip(entries: Readonly{ name: string; data: Buffer }[]): Buffer;
export function skillEntries(skill: string): { name: string; data: Buffer }[];
