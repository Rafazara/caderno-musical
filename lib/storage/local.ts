/** Chaves e formato do armazenamento local. */

const PREFIX = "caderno-musical";
export const STORE_VERSION = 1;

export const KEYS = {
  study: `${PREFIX}:study`,
  notebook: `${PREFIX}:notebook`,
  material: `${PREFIX}:material`,
  atelier: `${PREFIX}:atelier`,
} as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
