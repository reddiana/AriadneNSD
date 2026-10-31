// File format migrations (01-file-format 5).

/** Turns model JSON of one version into model JSON of the next version. */
export type Migration = (json: unknown) => unknown;

/**
 * Migrations by the version they read: the entry for `n` turns version `n` into `n + 1`.
 * Opening applies them in order up to the current version. Version 1 is the first version, so
 * there are none yet. Version 0 (the prototype) is never migrated (ADR-0035).
 */
export const migrations: ReadonlyMap<number, Migration> = new Map<number, Migration>();
