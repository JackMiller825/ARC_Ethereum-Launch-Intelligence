export function versionMismatch(embedded: string, published: string | null | undefined) {
  if (!embedded || embedded === 'unknown' || !published || published === 'unknown') return false;
  return embedded.toLowerCase() !== published.toLowerCase();
}
