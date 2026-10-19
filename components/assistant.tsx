"use client";
import { useState } from 'react';
import { answerResearch, type AssistantContext } from '@/lib/research/assistant';

export function ResearchAssistant({ context }: { context: AssistantContext }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<ReturnType<typeof answerResearch> | null>(null);
  return <section className="panel"><div className="panel-eyebrow">RESEARCH ASSISTANT</div><h3>Ask the open records</h3><p className="panel-desc">No model provider is configured on the published site. Answers are computed from the snapshot or brand record already loaded. Missing evidence stays unknown.</p><label>Question<textarea aria-label="Research question" rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about the open snapshot or brand record" /></label><button className="btn secondary" type="button" onClick={() => setResult(answerResearch(question, context))}>Answer from records</button>{result && <div className="data-boundary"><div><strong>{result.unknown ? 'Not determined' : 'From the stored records'}</strong><p>{result.answer}</p>{result.citations.map((item) => item.href ? <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a> : <span key={item.label}>{item.label}</span>)}</div></div>}</section>;
}
