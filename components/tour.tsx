"use client";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { markTourComplete, TOURS } from '@/lib/help/tours';

export function TourDock() {
  const params = useSearchParams();
  const path = usePathname() || '/';
  const router = useRouter();
  const tourId = params.get('tour') || '';
  const tour = TOURS.find((item) => item.id === tourId);
  const initial = Number(params.get('step') || '0');
  const [step, setStep] = useState(Number.isFinite(initial) ? initial : 0);
  useEffect(() => { setStep(Number(params.get('step') || '0') || 0); }, [params]);
  useEffect(() => {
    const target = tour?.steps[step]?.target;
    document.querySelectorAll('.tour-target').forEach((node) => node.classList.remove('tour-target'));
    if (!target) return;
    document.querySelector(`[data-tour="${target}"]`)?.classList.add('tour-target');
    return () => document.querySelectorAll('.tour-target').forEach((node) => node.classList.remove('tour-target'));
  }, [tour, step, path]);
  if (!tour) return null;
  const current = tour.steps[Math.min(step, tour.steps.length - 1)];
  function go(next: number) {
    const clamped = Math.max(0, Math.min(tour!.steps.length - 1, next));
    const href = tour!.steps[clamped].href;
    router.push(`${href}?tour=${tour!.id}&step=${clamped}`);
  }
  return <aside className="tour-dock" role="dialog" aria-label={tour.title}>
    <div className="panel-eyebrow">GUIDE {step + 1} / {tour.steps.length}</div>
    <h3>{current.title}</h3>
    <p>{current.body}</p>
    <div className="feature-actions">
      <button className="btn ghost" type="button" onClick={() => go(step - 1)} disabled={step === 0}>Back</button>
      {step < tour.steps.length - 1 ? <button className="btn primary" type="button" onClick={() => go(step + 1)}>Next</button> : <button className="btn primary" type="button" onClick={() => { markTourComplete(tour.id); router.push('/help'); }}>Finish</button>}
      <Link className="btn ghost" href="/help">Skip</Link>
    </div>
  </aside>;
}
