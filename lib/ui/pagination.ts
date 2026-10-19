export const PAGE_SIZES = [10, 25, 50] as const;

export function pageBounds(page: number, pageSize: number, total: number) {
  const size = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, page));
  const start = total === 0 ? 0 : (current - 1) * size + 1;
  const end = total === 0 ? 0 : Math.min(total, current * size);
  return { current, pages, start, end, size };
}

export function pageSlice<T>(rows: T[], page: number, pageSize: number) {
  const bounds = pageBounds(page, pageSize, rows.length);
  return { ...bounds, rows: rows.slice((bounds.current - 1) * bounds.size, bounds.current * bounds.size) };
}

/** Compact page list. Ellipses are the string used by the control, not a page. */
export function pageWindow(current: number, pages: number): (number | 'ellipsis')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const items: (number | 'ellipsis')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(pages - 1, current + 1);
  if (left > 2) items.push('ellipsis');
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < pages - 1) items.push('ellipsis');
  items.push(pages);
  return items;
}
