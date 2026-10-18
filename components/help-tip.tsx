"use client";
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp } from './icons';
import { glossaryEntry } from '@/lib/help/glossary';

export function HelpTip({ id }: { id: string }) {
  const entry = glossaryEntry(id);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  if (!entry) return null;
  return <span className="help-tip" ref={wrap}>
    <button type="button" className="help-tip-btn" aria-expanded={open} aria-controls={tipId} aria-label={`About ${entry.title}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }}>
      <CircleHelp size={14} />
    </button>
    {open && <span role="tooltip" id={tipId} className="help-pop">
      <strong>{entry.title}</strong>
      <p>{entry.summary}</p>
      <p className="mono">{entry.formula}</p>
      <p>{entry.limitation}</p>
      <Link href={`/help?article=${entry.article}`}>Read full guide</Link>
    </span>}
  </span>;
}
