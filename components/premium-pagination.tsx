"use client";
import { PAGE_SIZES, pageBounds, pageWindow } from '@/lib/ui/pagination';

export function PremiumPagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (page: number) => void; onPageSize: (size: number) => void }) {
  if (total <= 0) return null;
  const bounds = pageBounds(page, pageSize, total);
  const items = pageWindow(bounds.current, bounds.pages);
  return <nav className="pager" aria-label="Pagination">
    <p>Showing {bounds.start}–{bounds.end} of {total} results</p>
    <div className="pager-controls">
      <label>Rows per page
        <select aria-label="Rows per page" value={bounds.size} onChange={(event) => onPageSize(Number(event.target.value))}>
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => onPage(bounds.current - 1)} disabled={bounds.current <= 1}>Previous</button>
      {items.map((item, index) => item === 'ellipsis'
        ? <span key={`gap-${index}`} aria-hidden="true">…</span>
        : <button key={item} type="button" aria-current={item === bounds.current ? 'page' : undefined} onClick={() => onPage(item)}>{item}</button>)}
      <button type="button" onClick={() => onPage(bounds.current + 1)} disabled={bounds.current >= bounds.pages}>Next</button>
    </div>
  </nav>;
}
