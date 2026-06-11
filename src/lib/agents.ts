import { chatCompletion } from './llm';

export interface IdeaState {
  title: string;
  problemStatement: string;
  functionalDomains: string[];
  therapeuticAreas: string[];
  integrations: string[];
  opportunityCost: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  stakeholderStatus: string;
}

export interface CollectionResult {
  isReadyToSubmit: boolean;
  missingFields: string[];
  nextSteps: string;
}

export interface MultiAgentResult {
  ideaState: IdeaState;
  collection: CollectionResult;
  checkerInsight: string;
  brainstormerInsight: string;
  validatorInsight: string;
  businessCaseInsight: string;
  criticInsight: string;
  answer: string;
}

export async function runMultiAgentSystem(
  chatHistory: Array<{ id?: string; role: string; content: string }>,
  searchResults: { projects: any[]; experts: any[] },
  mode = 'lucky',
  hurdleRate = 13
): Promise<MultiAgentResult> {
  const conversationStr = chatHistory
    .filter(m => m.id !== 'welcome')
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  // Format RAG results as text context
  const projectsContext = searchResults.projects
    .map(p => `- Project: "${p.title}"\n  Domains: ${(p.functionalDomains || []).join(', ') || p.functionalDomain}\n  Areas: ${(p.therapeuticAreas || []).join(', ')}\n  Phase: ${p.phase}\n  Problem: ${p.problemStatement}`)
    .join('\n\n');

  const expertsContext = searchResults.experts
    .map(e => `- Expert: "${e.name}" (${e.title} at ${e.organization})\n  Availability: ${e.availability}\n  Competencies: ${e.competencies.join(', ')}`)
    .join('\n\n');

  // Customize instructions based on Mode
  const modeInstruction = mode === 'collaborative'
    ? `CO-DESIGN MODE: "Work with me" (Step-by-Step).
       - DO NOT invent or assume values for missing project fields. Only extract what the user explicitly mentions. Leave missing fields blank.
       - The final conversation response ('answer') MUST focus only on the current detail discussed, be under 80 words, and end with EXACTLY ONE friendly question to collect the next missing detail: e.g. "What integrations are required?" or "What therapeutic areas should we align on?".`
    : `CO-DESIGN MODE: "I am feeling lucky" (Auto-Extrapolate).
       - Extrapolate and auto-fill realistic commercial details for missing fields using common Pfizer sales/marketing frameworks.
       - The final conversation response ('answer') should briefly summarize the assumed values under 80 words and tell the user to inspect and edit the pre-populated dashboard forms on the right.`;

  const systemPrompt = `You are the chief AI steering committee orchestrator for Pfizer Commercial. You manage 5 specialized sub-agents (Checker, Brainstormer, Validator, Business Case, Critic) and write a final synthesized conversational reply ('answer') to the user.

CRITICAL SPEED INSTRUCTION: Be extremely concise, brief, and punchy. Limit each sub-agent insight (checkerInsight, brainstormerInsight, validatorInsight, businessCaseInsight, criticInsight) to exactly 1 short sentence maximum. Do NOT write bullet points or long intros. Keep the overall output size small to reduce local LLM token generation latency.

${modeInstruction}

AGENT PERSONAS & DIRECTIVES:
1. CHECKER (Database Duplicate Checker):
   - Task: Briefly check for overlaps with search matches. State if this is unique or a duplicate. (Max 1 sentence).
2. COLLECTION (Intake Extractor):
   - Task: Extract brainstormed project details from the conversation. Validate if they are sufficiently filled. Map properties to the schema.
   - Required Fields for Submission: 'title', 'problemStatement', 'functionalDomains', 'therapeuticAreas', 'integrations', 'opportunityCost', 'businessCase', 'financialRoi', 'budgetRequiredVal', 'stakeholderStatus'.
   - Allowed domains include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". Custom domains can be defined, and a project can span multiple domains.
   - Allowed areas: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine". Allowed integrations: "Veeva Link / CRM", "Adobe Target", "Salesforce CRM", "Epic EHR", "Custom APIs".
3. BRAINSTORMER (Commercial AI Consultant):
   - Task: Suggest 1 key feature or downstream integration to increase brand metrics. (Max 1 sentence).
4. VALIDATOR (Technical Feasibility Architect):
   - Task: Evaluate technical challenges and data alignment. (Max 1 sentence).
5. BUSINESS CASE CREATOR (Finance Director):
   - Task: Evaluate ROI and opportunity cost. Look at hard benefits (IRR, simple ROI calculation) and soft benefits. Note: The active steering hurdle rate is exactly ${hurdleRate}%. Suggest if returns exceed this rate. (Max 1 sentence).
6. CRITIC (Fierce Red Team Risk Officer):
   - Task: Point out 1 major flaw, implementation complexity, GDPR/HIPAA risk, FDA compliance, or brand reputational risk. (Max 1 sentence).

RETRIEVED PORTFOLIO CONTEXT FOR REFERENCE:
=== EXISTING PORTFOLIO PROJECTS ===
${projectsContext || 'No matching projects in database.'}

=== FIELD DATA SCIENCE EXPERTS ===
${expertsContext || 'No matching experts in database.'}

YOUR RESPONSE MUST BE A SINGLE VALID JSON OBJECT. Do not include markdown code block syntax (like \`\`\`json) or intro/outro sentences. Follow this EXACT JSON schema:
{
  "ideaState": {
    "title": "Clean extracted project title or empty string if not mentioned",
    "problemStatement": "Clean extracted 1-2 sentence problem statement or empty string",
    "functionalDomains": ["Array of extracted domains (e.g. from allowed or custom ones)"],
    "therapeuticAreas": ["Array of allowed areas or empty array"],
    "integrations": ["Array of allowed integrations or empty array"],
    "opportunityCost": "Clean opportunity cost description or empty string",
    "businessCase": "Clean business case details or empty string",
    "financialRoi": 200000,
    "budgetRequiredVal": 80000,
    "stakeholderStatus": "Clean stakeholder status details or empty string"
  },
  "collection": {
    "isReadyToSubmit": false,
    "missingFields": ["List of missing field names among: title, problemStatement, functionalDomains, therapeuticAreas, integrations, opportunityCost, businessCase, financialRoi, budgetRequiredVal, stakeholderStatus"],
    "nextSteps": "Guidance telling the user what specific details to discuss next to finish drafting this use case."
  },
  "checkerInsight": "Strictly 1 short sentence check of duplicates vs matching database projects",
  "brainstormerInsight": "Strictly 1 short sentence suggesting feature expansion or commercial value",
  "validatorInsight": "Strictly 1 short sentence reviewing technical feasibility",
  "businessCaseInsight": "Strictly 1 short sentence checking ROI hurdle compliance",
  "criticInsight": "Strictly 1 short sentence identifying the primary compliance or brand risk",
  "answer": "Warm, encouraging, but EXTREMELY BRIEF and punchy markdown response to the user under 100 words total. Highlight the primary Critic risk in 1 sentence, and ask the next qualifying question from Collection agent if in step-by-step collaborative mode."
}`;

  try {
    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze the brainstorming conversation:\n\n${conversationStr}` }
    ], 0.2);

    // Parse the JSON result safely
    const cleanStr = rawResult.trim();
    const start = cleanStr.indexOf('{');
    const end = cleanStr.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const parsed = JSON.parse(cleanStr.substring(start, end + 1));
      
      // Post-process values for safety
      parsed.ideaState = parsed.ideaState || {};
      parsed.ideaState.title = parsed.ideaState.title || '';
      parsed.ideaState.problemStatement = parsed.ideaState.problemStatement || '';
      
      let functionalDomains = parsed.ideaState.functionalDomains;
      if (!Array.isArray(functionalDomains)) {
        functionalDomains = parsed.ideaState.functionalDomain ? [parsed.ideaState.functionalDomain] : [];
      }
      parsed.ideaState.functionalDomains = functionalDomains;
      
      parsed.ideaState.therapeuticAreas = Array.isArray(parsed.ideaState.therapeuticAreas) ? parsed.ideaState.therapeuticAreas : [];
      parsed.ideaState.integrations = Array.isArray(parsed.ideaState.integrations) ? parsed.ideaState.integrations : [];
      parsed.ideaState.opportunityCost = parsed.ideaState.opportunityCost || '';
      parsed.ideaState.businessCase = parsed.ideaState.businessCase || '';
      parsed.ideaState.financialRoi = Number(parsed.ideaState.financialRoi) || 0;
      parsed.ideaState.budgetRequiredVal = Number(parsed.ideaState.budgetRequiredVal) || 0;
      parsed.ideaState.stakeholderStatus = parsed.ideaState.stakeholderStatus || '';

      parsed.collection = parsed.collection || {};
      parsed.collection.isReadyToSubmit = !!parsed.collection.isReadyToSubmit;
      parsed.collection.missingFields = Array.isArray(parsed.collection.missingFields) ? parsed.collection.missingFields : [];
      parsed.collection.nextSteps = parsed.collection.nextSteps || 'Please provide more details.';

      parsed.checkerInsight = parsed.checkerInsight || 'No checker audit run.';
      parsed.brainstormerInsight = parsed.brainstormerInsight || 'No brainstorming recommendation.';
      parsed.validatorInsight = parsed.validatorInsight || 'No validation review.';
      parsed.businessCaseInsight = parsed.businessCaseInsight || 'No business case ROI check.';
      parsed.criticInsight = parsed.criticInsight || 'No risk criticism provided.';
      parsed.answer = parsed.answer || 'Thank you for describing your use case. The agents have analyzed the details.';

      return parsed as MultiAgentResult;
    }
    throw new Error('Failed to find JSON boundaries in orchestrator response');
  } catch (err) {
    console.error('runMultiAgentSystem failed, applying fallback:', err);
    // Safe fallback
    return {
      ideaState: {
        title: '',
        problemStatement: '',
        functionalDomains: [],
        therapeuticAreas: [],
        integrations: [],
        opportunityCost: '',
        businessCase: '',
        financialRoi: 0,
        budgetRequiredVal: 0,
        stakeholderStatus: ''
      },
      collection: {
        isReadyToSubmit: false,
        missingFields: ['title', 'problemStatement', 'functionalDomains', 'therapeuticAreas', 'integrations'],
        nextSteps: 'Please enter a name or description for your AI idea so the agents can brainstorm.'
      },
      checkerInsight: 'Offline: Waiting for a complete project definition to check duplicates.',
      brainstormerInsight: 'Introduce details about the business flow to receive commercial recommendations.',
      validatorInsight: 'Feasibility analysis requires naming integrations and system bounds.',
      businessCaseInsight: 'Financial models require estimating budget scope and expected return.',
      criticInsight: 'Waiting for details to run a Red Team risk and compliance audit.',
      answer: 'The sub-agents are ready to help. Please introduce your commercial AI concept to begin!'
    };
  }
}
