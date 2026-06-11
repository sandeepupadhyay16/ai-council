import { NextResponse } from 'next/server';
import { scoreProposal } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const proposal = await request.json();
    const { 
      title, 
      problemStatement, 
      integrations, 
      budgetStatus, 
      stakeholderStatus, 
      opportunityCost, 
      businessCase, 
      financialRoi, 
      budgetRequiredVal, 
      functionalDomain, 
      functionalDomains,
      therapeuticAreas,
      dataReadiness
    } = proposal;

    if (!title || !problemStatement) {
      return NextResponse.json({ error: 'Title and problem statement are required.' }, { status: 400 });
    }

    let finalDomains = Array.isArray(functionalDomains) ? functionalDomains : [];
    if (finalDomains.length === 0) {
      finalDomains = functionalDomain ? [functionalDomain] : ['Omnichannel Intelligence'];
    }

    const scores = await scoreProposal({
      title,
      problemStatement,
      integrations: integrations || [],
      budgetStatus: budgetStatus || '',
      stakeholderStatus: stakeholderStatus || '',
      opportunityCost: opportunityCost || '',
      businessCase: businessCase || '',
      financialRoi: Number(financialRoi) || 0,
      budgetRequiredVal: Number(budgetRequiredVal) || 0,
      functionalDomains: finalDomains,
      therapeuticAreas: therapeuticAreas || ['Oncology'],
      dataReadiness: dataReadiness || ''
    });

    return NextResponse.json(scores);
  } catch (error: any) {
    console.error('API Score failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
