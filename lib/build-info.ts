export const PACKAGE_VERSION = '1.0.0';
export const COMMIT_SHA = process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown';
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || '';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function shortSha(sha = COMMIT_SHA) {
  if (!sha || sha === 'unknown') return 'unknown';
  return sha.slice(0, 7);
}
