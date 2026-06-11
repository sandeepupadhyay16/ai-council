import { NextResponse } from 'next/server';
import { searchPortfolio } from '@/lib/rag';
import { chatCompletion } from '@/lib/llm';
import { runMultiAgentSystem } from '@/lib/agents';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.message || body.query || '';
    const history = body.history || [{ role: 'user', content: query }];
    
    // Extracted toggle settings
    const mode = body.mode || 'lucky';
    const hurdleRate = Number(body.hurdleRate) || 13;

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query is empty' }, { status: 400 });
    }

    // 1. Perform semantic database retrieval (RAG)
    const searchResults = await searchPortfolio(query, 3);

    // 2. Invoke the consolidated multi-agent steering engine (performs agent grading and synthesizes answer in one pass)
    const agentResult = await runMultiAgentSystem(history, searchResults, mode, hurdleRate);

    return NextResponse.json({
      answer: agentResult.answer,
      ideaState: agentResult.ideaState,
      agentInsights: {
        checker: agentResult.checkerInsight,
        brainstormer: agentResult.brainstormerInsight,
        validator: agentResult.validatorInsight,
        businessCase: agentResult.businessCaseInsight,
        critic: agentResult.criticInsight,
        collection: agentResult.collection
      },
      sources: {
        projects: searchResults.projects,
        experts: searchResults.experts
      }
    });

  } catch (error: any) {
    console.error('API Chat failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
