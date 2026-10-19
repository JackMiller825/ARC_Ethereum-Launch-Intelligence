import { NextResponse } from 'next/server';

export async function POST() {
  const configured = Boolean(process.env.RESEARCH_MODEL_URL && process.env.RESEARCH_MODEL_KEY);
  if (!configured) {
    return NextResponse.json({
      available: false,
      source: 'unavailable',
      answer: 'No model provider is configured. The page answers from the open snapshot with rules. Those rules do not invent transactions.',
    }, { status: 501 });
  }
  return NextResponse.json({
    available: false,
    source: 'unavailable',
    answer: 'A model URL is configured on the server, but ARC does not send chain facts to it. Use the in-page rule report.',
  }, { status: 501 });
}
