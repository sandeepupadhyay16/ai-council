import { Agent, setGlobalDispatcher } from 'undici';

const globalAgent = new Agent({
  headersTimeout: 600000, // 10 minutes
  bodyTimeout: 600000,    // 10 minutes
  connectTimeout: 600000  // 10 minutes
});
setGlobalDispatcher(globalAgent);

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
const LM_STUDIO_API_KEY = process.env.LM_STUDIO_API_KEY || 'local-model';
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || 'google/gemma-4-12b-qat';
const LOCAL_EMBEDDING_MODEL = process.env.LOCAL_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5';

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LM_STUDIO_API_KEY}`
      },
      body: JSON.stringify({
        model: LOCAL_EMBEDDING_MODEL,
        input: text.replace(/\n/g, ' ')
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data[0].embedding;
  } catch (error) {
    console.error('embedText error:', error);
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

// Simple circuit breaker to prevent thrashing the local LLM
let circuitBreakerTrippedUntil = 0;
let consecutiveFailures = 0;
const MAX_FAILURES = 5;
const COOLDOWN_MS = 10000; // 10 seconds

export async function chatCompletion(messages: Array<{ role: string; content: string }>, temperature = 0.2): Promise<string> {
  const attemptLocal = async () => {
    let retries = 3;
    let lastError: any = null;

    while (retries >= 0) {
      if (Date.now() < circuitBreakerTrippedUntil) {
        throw new Error(`LLM Circuit Breaker is active. Throttling for ${((circuitBreakerTrippedUntil - Date.now()) / 1000).toFixed(1)}s`);
      }

      const controller = new AbortController();
      // 3 minute maximum per request to prevent indefinite hanging (UND_ERR_HEADERS_TIMEOUT)
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch(`${LM_STUDIO_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LM_STUDIO_API_KEY}`
          },
          body: JSON.stringify({
            model: LOCAL_LLM_MODEL,
            messages,
            temperature,
            stream: true // Enable streaming to receive headers immediately
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            throw new Error(`Local LLM Error: ${response.status} ${errorText}`);
          }
          if (response.status === 500 && retries > 0) {
            const delay = Math.pow(2, 3 - retries) * 3000 + Math.random() * 1000;
            console.warn(`[LLM] HTTP 500 from local server (overload), retrying in ${Math.round(delay)}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            continue;
          }
          throw new Error(`Local LLM Error: ${response.status} ${errorText}`);
        }

        consecutiveFailures = 0; // reset on success
        const reader = response.body?.getReader();
        let content = '';

        if (reader) {
          const decoder = new TextDecoder("utf-8");
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            let decodedChunk = '';
            if (value) {
              decodedChunk = decoder.decode(value, { stream: !done });
            } else if (done) {
              decodedChunk = decoder.decode();
            }

            buffer += decodedChunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    content += data.choices[0].delta.content;
                  }
                } catch (e) {
                  // Silently ignore incomplete parse chunks
                }
              }
            }

            if (done) {
              if (buffer) {
                const trimmed = buffer.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data.choices?.[0]?.delta?.content) {
                      content += data.choices[0].delta.content;
                    }
                  } catch (e) {
                    // Silently ignore
                  }
                }
              }
              break;
            }
          }
        }

        return content;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        const isRetryable = err.name === 'AbortError' || 
                            err.message.includes('fetch failed') || 
                            err.message.includes('SocketError') ||
                            err.message.includes('ECONNRESET');

        if (isRetryable && retries > 0) {
          const delay = Math.pow(2, 3 - retries) * 2000 + Math.random() * 1000;
          console.warn(`[LLM] Request failed (${err.message}), retrying in ${Math.round(delay)}ms... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          continue;
        }

        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
          circuitBreakerTrippedUntil = Date.now() + COOLDOWN_MS;
          console.warn(`[LLM] Circuit breaker tripped! Halting requests for ${COOLDOWN_MS/1000}s`);
        }

        if (err.name === 'AbortError') {
          throw new Error('Local LLM request timed out after 3 minutes');
        }
        throw err;
      }
    }
    throw lastError;
  };

  try {
    return await attemptLocal();
  } catch (error) {
    console.error('chatCompletion error:', error);
    throw error;
  }
}

function extractJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('Failed to parse raw text as JSON:', e);
    return null;
  }
}

export interface HarvestedIdea {
  title: string;
  problemStatement: string;
  integrations: string[];
  budgetStatus: string;
  stakeholderStatus: string;
  opportunityCost: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  functionalDomains: string[];
  therapeuticAreas: string[];
  dataReadiness?: string;
}

export async function harvestIdeaFromMeeting(transcript: string): Promise<HarvestedIdea | null> {
  const systemPrompt = `You are an AI Council expert. Your job is to extract new and novel Commercial/Marketing AI use cases or project ideas from raw meeting summaries or action notes.
Extract a single main AI initiative. If none is found, return an empty object or null.
If an initiative is found, you MUST return a valid JSON object. Do not include markdown formatting, code block markers (\`\`\`), or any intro/outro text. The response must contain exactly this JSON format:
{
  "title": "A short, descriptive, professional name of the AI project",
  "problemStatement": "A clean 1-2 sentence description of the commercial or brand bottleneck being addressed",
  "integrations": ["Veeva", "Salesforce CRM", "Adobe Target"],
  "budgetStatus": "Description of funding state or allocation discussed",
  "stakeholderStatus": "Description of alignment, executive sponsorship, or team support discussed",
  "dataReadiness": "Description of data availability, cleanliness, compliance, or source systems discussed",
  "opportunityCost": "What happens if we do not execute this project? opportunity costs or bottlenecks",
  "businessCase": "Expected operational efficiency, clinical benefits, or brand optimization results",
  "financialRoi": 250000,
  "budgetRequiredVal": 120000,
  "functionalDomains": ["Omnichannel Intelligence"],
  "therapeuticAreas": ["Oncology", "Vaccines"]
}

Allowed "functionalDomains" values include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". The user can also define custom ones. A project can span multiple domains.
Allowed "therapeuticAreas" values: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine".
Be realistic. "financialRoi" and "budgetRequiredVal" must be positive numbers. "integrations", "functionalDomains", and "therapeuticAreas" must be arrays of strings.`;

  try {
    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please decompose the following meeting notes and harvest any AI project concept:\n\n${transcript}` }
    ], 0.1);

    const idea = extractJSON(rawResult);
    if (idea && idea.title && idea.problemStatement) {
      idea.financialRoi = Number(idea.financialRoi) || 250000;
      idea.budgetRequiredVal = Number(idea.budgetRequiredVal) || 100000;
      idea.dataReadiness = idea.dataReadiness || '';
      if (!Array.isArray(idea.integrations)) {
        idea.integrations = [];
      }
      if (!Array.isArray(idea.therapeuticAreas) || idea.therapeuticAreas.length === 0) {
        idea.therapeuticAreas = ["Oncology"];
      }
      if (!Array.isArray(idea.functionalDomains)) {
        idea.functionalDomains = idea.functionalDomain ? [idea.functionalDomain] : ["Omnichannel Intelligence"];
      }
      if (idea.functionalDomains.length === 0) {
        idea.functionalDomains = ["Omnichannel Intelligence"];
      }
      return idea as HarvestedIdea;
    }
    return null;
  } catch (error) {
    console.error('harvestIdeaFromMeeting error:', error);
    return null;
  }
}

export async function harvestMultipleIdeasFromMeeting(transcript: string): Promise<HarvestedIdea[]> {
  const systemPrompt = `You are an AI Council expert. Your job is to extract all new and novel Commercial/Marketing AI use cases or project ideas discussed in the meeting summary or notes.
Decompose the notes and return a list of all distinct AI initiatives discussed.
For each initiative, extract its details.
You MUST return a valid JSON object containing an array of ideas under the "ideas" key. Do not include markdown formatting, code block markers (\`\`\`), or any intro/outro text.
The response must conform EXACTLY to this JSON format:
{
  "ideas": [
    {
      "title": "A short, descriptive, professional name of the AI project",
      "problemStatement": "A clean 1-2 sentence description of the commercial or brand bottleneck being addressed",
      "integrations": ["Veeva", "Salesforce CRM", "Adobe Target"],
      "budgetStatus": "Description of funding state or allocation discussed",
      "stakeholderStatus": "Description of alignment, executive sponsorship, or team support discussed",
      "dataReadiness": "Description of data availability, cleanliness, compliance, or source systems discussed",
      "opportunityCost": "What happens if we do not execute this project? opportunity costs or bottlenecks",
      "businessCase": "Expected operational efficiency, clinical benefits, or brand optimization results",
      "financialRoi": 250000,
      "budgetRequiredVal": 120000,
      "functionalDomains": ["Omnichannel Intelligence"],
      "therapeuticAreas": ["Oncology", "Vaccines"]
    }
  ]
}

Allowed "functionalDomains" values include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". Custom ones are allowed, and projects can span multiple domains.
Allowed "therapeuticAreas" values: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine".
Be realistic. "financialRoi" and "budgetRequiredVal" must be positive numbers. "integrations", "functionalDomains", and "therapeuticAreas" must be arrays of strings.`;

  try {
    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please decompose the following meeting notes and harvest all distinct AI project concepts:\n\n${transcript}` }
    ], 0.1);

    const data = extractJSON(rawResult);
    if (data && Array.isArray(data.ideas)) {
      return data.ideas.map((idea: any) => {
        const title = idea.title || 'Untitled Ingested Idea';
        const problemStatement = idea.problemStatement || 'No problem statement.';
        const financialRoi = Number(idea.financialRoi) || 250000;
        const budgetRequiredVal = Number(idea.budgetRequiredVal) || 100000;
        const integrations = Array.isArray(idea.integrations) ? idea.integrations : [];
        const therapeuticAreas = (Array.isArray(idea.therapeuticAreas) && idea.therapeuticAreas.length > 0) ? idea.therapeuticAreas : ["Oncology"];
        
        let functionalDomains = idea.functionalDomains;
        if (!Array.isArray(functionalDomains)) {
          functionalDomains = idea.functionalDomain ? [idea.functionalDomain] : ["Omnichannel Intelligence"];
        }
        if (functionalDomains.length === 0) {
          functionalDomains = ["Omnichannel Intelligence"];
        }

        return {
          title,
          problemStatement,
          integrations,
          budgetStatus: idea.budgetStatus || 'Under Review',
          stakeholderStatus: idea.stakeholderStatus || 'TBD',
          dataReadiness: idea.dataReadiness || '',
          opportunityCost: idea.opportunityCost || 'Bottleneck remains',
          businessCase: idea.businessCase || '',
          financialRoi,
          budgetRequiredVal,
          functionalDomains,
          therapeuticAreas
        };
      });
    }
    return [];
  } catch (error) {
    console.error('harvestMultipleIdeasFromMeeting error:', error);
    return [];
  }
}

export interface ScorecardResult {
  budgetAvailabilityScore: number;
  dataAvailabilityScore: number;
  stakeholderReadinessScore: number;
  impactOfNotDoingScore: number;
  financialBusinessCaseScore: number;
  budgetRequiredScore: number;
  justification: string;
}

export async function scoreProposal(proposal: {
  title: string;
  problemStatement: string;
  integrations: string[];
  budgetStatus: string;
  stakeholderStatus: string;
  opportunityCost: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  functionalDomains: string[];
  therapeuticAreas: string[];
  dataReadiness: string;
}): Promise<ScorecardResult> {
  const systemPrompt = `You are the chief evaluator for the AI steering committee. You will evaluate the user's project proposal and assign readiness scores between 0.0 and 100.0 for 6 dimensions:
1. budgetAvailabilityScore: Grade based on whether funding is already pre-allocated or secured vs. requested or unfunded.
2. dataAvailabilityScore: Grade based on defined integrations (e.g. Veeva, Adobe Target) and availability/readiness of source data. Read the "Data Readiness Details" provided: if the datasets are already clean, fully available, and ready for integration, assign a high score (85-100); if the description indicates they are missing, unformatted, or unavailable, assign a low score (under 60).
3. stakeholderReadinessScore: Grade based on sponsor support and brand team alignment.
4. impactOfNotDoingScore: Grade based on opportunity cost, status quo bottleneck, and compliance risks if we fail to act.
5. financialBusinessCaseScore: Grade based on projected ROI ratio (annualized ROI vs. implementation budget required).
6. budgetRequiredScore: Grade based on cost reasonability (lower requirements or higher cost-efficiency score higher).

You MUST respond with a valid JSON object. Do not include markdown formatting or backticks.
Format:
{
  "budgetAvailabilityScore": 85.0,
  "dataAvailabilityScore": 90.0,
  "stakeholderReadinessScore": 75.0,
  "impactOfNotDoingScore": 80.0,
  "financialBusinessCaseScore": 85.0,
  "budgetRequiredScore": 80.0,
  "justification": "Detailed explanation of why these grades were awarded."
}`;

  const proposalText = `Title: ${proposal.title}
Problem: ${proposal.problemStatement}
Integrations Needed: ${proposal.integrations.join(', ')}
Budget Status: ${proposal.budgetStatus}
Stakeholder Alignment: ${proposal.stakeholderStatus}
Data Readiness Details: ${proposal.dataReadiness}
Impact of Not Doing: ${proposal.opportunityCost}
Business Case: ${proposal.businessCase}
Financial ROI: $${proposal.financialRoi}/yr
Budget Required: $${proposal.budgetRequiredVal}
Functional Domains: ${proposal.functionalDomains.join(', ')}
Therapeutic Areas: ${proposal.therapeuticAreas.join(', ')}`;

  try {
    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please evaluate this proposal and output scores in JSON format:\n\n${proposalText}` }
    ], 0.1);

    const scores = extractJSON(rawResult);
    if (scores && typeof scores.budgetAvailabilityScore === 'number') {
      return {
        budgetAvailabilityScore: scores.budgetAvailabilityScore,
        dataAvailabilityScore: scores.dataAvailabilityScore,
        stakeholderReadinessScore: scores.stakeholderReadinessScore,
        impactOfNotDoingScore: scores.impactOfNotDoingScore,
        financialBusinessCaseScore: scores.financialBusinessCaseScore,
        budgetRequiredScore: scores.budgetRequiredScore,
        justification: scores.justification || 'No justification provided.'
      };
    }
    
    // Fallback scores
    return {
      budgetAvailabilityScore: proposal.budgetStatus.toLowerCase().includes('allocate') ? 95.0 : 70.0,
      dataAvailabilityScore: (proposal.dataReadiness.toLowerCase().includes('ready') || proposal.dataReadiness.toLowerCase().includes('clean') || proposal.dataReadiness.toLowerCase().includes('avail') || proposal.integrations.length > 0) ? 85.0 : 60.0,
      stakeholderReadinessScore: proposal.stakeholderStatus.toLowerCase().includes('sponsor') || proposal.stakeholderStatus.toLowerCase().includes('align') ? 90.0 : 75.0,
      impactOfNotDoingScore: proposal.opportunityCost.length > 20 ? 85.0 : 65.0,
      financialBusinessCaseScore: proposal.financialRoi > proposal.budgetRequiredVal * 2 ? 95.0 : 75.0,
      budgetRequiredScore: proposal.budgetRequiredVal < 150000 ? 90.0 : 70.0,
      justification: "Automated scoring fallback applied due to parser error."
    };
  } catch (error) {
    console.error('scoreProposal error:', error);
    return {
      budgetAvailabilityScore: 75.0,
      dataAvailabilityScore: 80.0,
      stakeholderReadinessScore: 70.0,
      impactOfNotDoingScore: 75.0,
      financialBusinessCaseScore: 80.0,
      budgetRequiredScore: 75.0,
      justification: "System fallback scoring due to runtime connection error."
    };
  }
}
