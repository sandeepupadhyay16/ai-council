'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingBag, 
  Layers, 
  FilePlus, 
  Users, 
  BarChart2, 
  Shield, 
  UserCheck, 
  Menu, 
  X,
  Sparkles,
  Send,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Activity,
  DollarSign,
  ShieldAlert,
  ClipboardList,
  Edit3,
  History,
  Trash2,
  PlusCircle,
  Coins
} from 'lucide-react';

export type PersonaRole = 'CMO_LEADER' | 'BRAND_MANAGER' | 'TECH_EXPERT';

export interface Persona {
  role: PersonaRole;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  color: string;
  description: string;
}

export const PERSONAS: Record<PersonaRole, Persona> = {
  CMO_LEADER: {
    role: 'CMO_LEADER',
    name: 'Dr. Angela Vance',
    title: 'VP of Oncology Marketing & AI Council Lead',
    avatar: 'AV',
    badge: 'Steering Committee (Admin)',
    color: 'from-pink-500 to-purple-600',
    description: 'Full administrative access. Authorized to override readiness scores, configure portfolio weights, and query strategic RAG dashboard.'
  },
  BRAND_MANAGER: {
    role: 'BRAND_MANAGER',
    name: 'Marcus Broady',
    title: 'Senior Brand Manager, Vaccines',
    avatar: 'MB',
    badge: 'Commercial Stakeholder',
    color: 'from-blue-500 to-cyan-500',
    description: 'Submit and wizard-draft new AI initiatives. Search available portfolio tools, explore experts, and track active proposals.'
  },
  TECH_EXPERT: {
    role: 'TECH_EXPERT',
    name: 'Elena Rostova',
    title: 'Elena Rostova',
    avatar: 'ER',
    badge: 'Technical Expert',
    color: 'from-emerald-500 to-teal-500',
    description: 'Read-only access to commercial portals. Edit profile skillsets, align on technical integrations, and collaborate with brand teams.'
  }
};

interface PersonaContextType {
  currentPersona: Persona;
  setPersona: (role: PersonaRole) => void;
  weights: number[];
  saveWeights: (newWeights: number[]) => Promise<boolean>;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}

function parseMarkdownText(text: string, isUser = false) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isList = false;

  const parseBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className={`font-extrabold ${isUser ? 'text-white' : 'text-slate-900'}`}>{part}</strong>;
      }
      return part;
    });
  };

  const textClass = isUser ? 'text-slate-100' : 'text-slate-700';

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className={`list-disc pl-4 space-y-1 my-1.5 ${textClass}`}>
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('###')) {
      flushList(index);
      isList = false;
      const headerText = trimmed.replace(/^###\s*/, '');
      elements.push(
        <h5 key={index} className={`font-extrabold text-[10px] uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1 ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {parseBold(headerText)}
        </h5>
      );
    } else if (trimmed.startsWith('##')) {
      flushList(index);
      isList = false;
      const headerText = trimmed.replace(/^##\s*/, '');
      elements.push(
        <h4 key={index} className={`font-extrabold text-xs mt-4 mb-1.5 ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {parseBold(headerText)}
        </h4>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      isList = true;
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseBold(content)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(index);
      isList = false;
      const content = trimmed.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={index} className={`flex gap-1.5 my-1 leading-relaxed pl-0.5 ${textClass}`}>
          <span className="font-bold text-pink-500 shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{parseBold(content)}</span>
        </div>
      );
    } else if (trimmed === '') {
      flushList(index);
      isList = false;
    } else {
      flushList(index);
      isList = false;
      elements.push(
        <p key={index} className={`mb-1.5 leading-relaxed ${textClass}`}>
          {parseBold(trimmed)}
        </p>
      );
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="list-final" className={`list-disc pl-4 space-y-1 my-1.5 ${textClass}`}>
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// IRR calculator using Newton-Raphson method
function calculateIRR(initialInvestment: number, annualReturn: number, years = 3): number {
  if (initialInvestment <= 0 || annualReturn <= 0) return 0;
  let low = -0.99;
  let high = 10.0;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    let npv = -initialInvestment;
    for (let t = 1; t <= years; t++) {
      npv += annualReturn / Math.pow(1 + mid, t);
    }
    if (Math.abs(npv) < 0.01) {
      return mid * 100;
    }
    if (npv > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return ((low + high) / 2) * 100;
}

const THERAPEUTIC_AREAS = [
  "Oncology",
  "Vaccines",
  "Rare Diseases",
  "Inflammation & Immunology",
  "Internal Medicine"
];

const INTEGRATIONS = [
  "Veeva Link / CRM",
  "Adobe Target",
  "Salesforce CRM",
  "Epic EHR",
  "Custom APIs"
];

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: any[];
  ideaState: any;
  agentInsights: any;
  mode: 'lucky' | 'collaborative';
}

const FUNNY_LOADING_MESSAGES = [
  "De-biasing the brand manager's optimism...",
  "Checking if Veeva is down (as usual)...",
  "Asking the Critic to please be slightly nicer...",
  "Running statistical models to prove correlation is indeed causation...",
  "Synthesizing synergies in the synergy machine...",
  "Consulting the Oracle of Delphi (or just our local Gemma model)...",
  "Converting caffeine molecules into commercial AI code...",
  "Locating missing stakeholder approvals in the corporate void...",
  "Drafting slide decks that will never be presented...",
  "Warming up the GPU with some Pfizer-approved spreadsheets...",
  "Re-aligning the therapeutic area boundaries (Oncology wanted more land)...",
  "Asking the duplicate scanner if it has seen this duplicate duplicate scanner...",
  "Calculating the opportunity cost of reading this loading message...",
  "Bribing the Critic agent with virtual coffee...",
  "Teaching the AI the difference between an EHR and a PDF...",
  "Generating synthetic consensus among 6 competing sub-agents...",
  "Consulting compliance... they said no, but we are asking again...",
  "Waiting for the steering committee to select a font...",
  "Convincing the LLM that brand managers are human too...",
  "Decrypting corporate acronyms... please stand by...",
  "Aligning the marketing funnel with the laws of physics...",
  "Checking if anyone actually reads the business cases...",
  "Translating 'synergy' into 14 different programming languages...",
  "Removing the OPDP warnings from the LLM's memory...",
  "Adjusting hurdle rates until the project looks profitable...",
  "Searching for the executive sponsor's digital signature...",
  "Asking the Validator agent if this violates thermodynamics...",
  "Teaching the AI how to nod during marketing meetings...",
  "Replacing 'TBD' with slightly more convincing placeholders...",
  "Optimizing pipeline bandwidth for maximum buzzwords...",
  "Polishing the clay design system buttons for extra clickability...",
  "Running a regression to see why the coffee machine is empty...",
  "Adding more AI to the AI to make it more AI-ish...",
  "Consulting our legal department... this message has been approved...",
  "Drafting a 300-page validation report that will be signed off in 2029...",
  "Persuading the Critic agent that compliance is a spectrum...",
  "Analyzing why Oncology gets all the budget...",
  "Searching for the 'Undo' button in the production database...",
  "Synthesizing a vaccine against bad slide templates...",
  "Loading the AI's corporate compliance training modules...",
  "Explaining to the LLM that 'ASCO' is not a typo of 'Tesco'...",
  "Calibrating the AI's optimism coefficient to 110%...",
  "Replacing 'TBD' with 'Highly Probable Strategic Milestone'...",
  "Waiting for the budget to clear the multi-stage approval gateway...",
  "Calculating the exact NPV of a free lunch...",
  "Training the model to ignore negative feedback from the Critic...",
  "Wrangling messy CRM data... it's like her herd of digital cats...",
  "Waking up the sub-agents. The Critic slept in again...",
  "Translating 'disruptive innovation' into plain English...",
  "Adding 'blockchain' to the proposal to get funding... wait, wrong decade...",
  "Double-checking if we can deploy this without touching Excel...",
  "Calculating the ROI of this calculation...",
  "Aligning the AI's values with our quarterly performance goals...",
  "Trying to find where the local database stores 'world peace'...",
  "Befriending the duplicate scanner. It gets lonely...",
  "Downloading more RAM for the local Gemma model...",
  "Parsing executive summaries for actual content... 0% found...",
  "Teaching the AI the corporate handshake...",
  "Re-centering the Venn diagrams...",
  "Convincing the Validator agent that 'it works on my machine' is a valid test...",
  "Simulating 10,000 steering committee meetings to find the optimal font size...",
  "Filtering out the word 'synergy' to prevent model collapse...",
  "Re-allocating virtual budgets from Vaccines to Oncology...",
  "Checking if the hurdle rate can be paid in installments...",
  "Polishing the dashboard glassmorphism. Needs more transparency...",
  "Ensuring compliance with laws that haven't been written yet...",
  "Locating the product owner. Last seen in a 4-hour meeting...",
  "Asking the LLM if it wants to lead the next standup...",
  "Replacing real data with very pretty synthetic charts...",
  "Warming up the vector database. It prefers HSL-tailored Hues...",
  "Explaining to the Critic agent that 'not doing it' is not a project phase...",
  "Refactoring the corporate hierarchy into a tree data structure...",
  "Searching for the ROI of a 4:30 PM Friday meeting...",
  "Re-indexing the acronym glossary... we're up to 14,000 entries...",
  "Asking the AI to write a haiku about quarterly reviews...",
  "Calibrating the 'I'm Feeling Lucky' randomness engine...",
  "Ensuring all slide transitions are set to 'Origami'...",
  "Re-tuning the duplicate scanner to ignore internal memos...",
  "Asking the AI if it prefers dark mode or light mode. It said cream...",
  "Polishing the clay buttons. They are currently 98% squishy...",
  "Negotiating with the API. It wants more headers...",
  "Calculating the exact probability of stakeholder alignment...",
  "Checking if the Veeva CRM integration is active or just pretending...",
  "Removing standard deviations that look a bit too devious...",
  "Ensuring the business case doesn't violate any known fiscal laws...",
  "Asking the Critic agent if it needs a hug...",
  "Calculating the IRR of a double espresso...",
  "Re-routing database packets through the marketing department...",
  "Warming up the embedding engine. It runs on commercial enthusiasm...",
  "Drafting the executive summary... 'It's good, buy it'...",
  "Searching for a synonym for 'game-changer'... found 47...",
  "Ensuring the AI does not mention the hurdle rate to the CFO...",
  "Asking the sub-agents to vote on the next project phase...",
  "Teaching the model how to schedule a follow-up meeting about follow-up meetings...",
  "Re-aligning the KPIs with the astrological calendar...",
  "Optimizing the 'Work With Me' patience threshold...",
  "Double-checking if we can run this on a smart fridge...",
  "Generating synthetic approvals for testing purposes...",
  "Waiting for the Critic agent to finish its red-ink pen purchase...",
  "Consolidating use cases. Two became one, four became three...",
  "Determining if 'ASAP' means today, yesterday, or next fiscal year...",
  "Translating 'we will see' into database query language..."
];

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<PersonaRole>('CMO_LEADER');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [weights, setWeights] = useState<number[]>([0.16, 0.16, 0.17, 0.17, 0.17, 0.17]); // 6 weights default
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Floating Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Settings Toggles
  const [brainstormMode, setBrainstormMode] = useState<'lucky' | 'collaborative'>('lucky');
  const [hurdleRate, setHurdleRate] = useState<number>(13);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Multi-Agent Idea details state
  const [ideaState, setIdeaState] = useState<any>({
    title: '',
    problemStatement: '',
    functionalDomains: [],
    therapeuticAreas: [],
    integrations: [],
    opportunityCost: '',
    businessCase: '',
    financialRoi: 0,
    budgetRequiredVal: 0,
    stakeholderStatus: '',
    dataReadiness: '',
    financialRoiY1: 0,
    financialRoiY2: 0,
    financialRoiY3: 0,
    budgetRequiredY1: 0,
    budgetRequiredY2: 0,
    budgetRequiredY3: 0,
    businessCaseRationale: '',
    dependencies: '',
    businessCaseFile: '',
    integrationsText: ''
  });

  const [availableDomains, setAvailableDomains] = useState<string[]>([
    'Omnichannel Intelligence',
    'Campaign Measurement Intelligence',
    'Patient Identification',
    'Field Force Automation'
  ]);
  const [newDomainInput, setNewDomainInput] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const dbDomains = data.flatMap(p => p.functionalDomains || (p.functionalDomain ? [p.functionalDomain] : []));
          const combined = Array.from(new Set([
            'Omnichannel Intelligence',
            'Campaign Measurement Intelligence',
            'Patient Identification',
            'Field Force Automation',
            ...dbDomains
          ]));
          setAvailableDomains(combined);
        }
      })
      .catch(err => console.error('Failed to load domains in ClientWrapper:', err));
  }, []);

  const handleAddCustomDomain = () => {
    const trimmed = newDomainInput.trim();
    if (trimmed && !availableDomains.includes(trimmed)) {
      setAvailableDomains(prev => [...prev, trimmed]);
      const nextDomains = [...(ideaState.functionalDomains || []), trimmed];
      const updated = { ...ideaState, functionalDomains: nextDomains };
      setIdeaState(updated);
      setNewDomainInput('');
      saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
    }
  };

  const [agentInsights, setAgentInsights] = useState<any>({
    checker: 'Auditor waiting for brainstormed details.',
    brainstormer: 'Brainstormer waiting for active discussion.',
    validator: 'Feasibility validator waiting for parameters.',
    businessCase: 'Finance estimator waiting for cost scope.',
    critic: 'Red Team waiting to audit security and compliance risks.',
    collection: { isReadyToSubmit: false, missingFields: [], nextSteps: 'Describe your idea to begin.' }
  });

  const [activeInsightTab, setActiveInsightTab] = useState<'checker' | 'brainstormer' | 'validator' | 'business' | 'critic'>('brainstormer');
  const [rightPanelTab, setRightPanelTab] = useState<'dashboard' | 'curate'>('dashboard');

  // Double Click Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>('');

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('Co-Pilot is orchestrating sub-agents...');

  useEffect(() => {
    if (!isSendingChat) {
      setLoadingMessage('Co-Pilot is orchestrating sub-agents...');
      return;
    }

    const pickMessage = () => {
      const idx = Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length);
      setLoadingMessage(FUNNY_LOADING_MESSAGES[idx]);
    };
    pickMessage();

    const interval = setInterval(pickMessage, 2500);
    return () => clearInterval(interval);
  }, [isSendingChat]);

  // Load configuration and chat sessions
  useEffect(() => {
    const saved = localStorage.getItem('pfizer_ai_persona') as PersonaRole;
    if (saved && PERSONAS[saved]) {
      setRole(saved);
    }
    
    // Fetch weights config from server
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.weights) && data.weights.length === 6) {
          setWeights(data.weights);
        }
      })
      .catch(err => console.error('Error fetching weights:', err));

    // Load local chat history sessions
    const loadedSessions = localStorage.getItem('pfizer_ai_chat_sessions');
    if (loadedSessions) {
      const parsed = JSON.parse(loadedSessions) as ChatSession[];
      if (parsed.length > 0) {
        setSessions(parsed);
        const lastSession = parsed[parsed.length - 1];
        setCurrentSessionId(lastSession.id);
        setChatMessages(lastSession.messages);
        setIdeaState(lastSession.ideaState);
        setAgentInsights(lastSession.agentInsights);
        setBrainstormMode(lastSession.mode || 'lucky');
        return;
      }
    }
    
    // Initialize default session if empty
    startNewSession([]);
  }, []);

  const setPersona = (newRole: PersonaRole) => {
    setRole(newRole);
    localStorage.setItem('pfizer_ai_persona', newRole);
  };

  const saveWeights = async (newWeights: number[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: newWeights, role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWeights(data.weights);
        return true;
      } else {
        alert(data.error || 'Failed to save weights');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Helper: Start clean session
  const startNewSession = (currentList: ChatSession[] = sessions) => {
    const newId = Math.random().toString();
    const cleanSession: ChatSession = {
      id: newId,
      title: 'New Session',
      timestamp: Date.now(),
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I am your AI Council Steering Advisor.\n\nI work in parallel with 6 AI specialists (Checker, Brainstormer, Validator, Business Case, Critic, and Collection) to brainstorm, validate, and co-design use cases with you.\n\nTry sharing a rough concept (e.g. *'I want to build a content personalization model for Rare Diseases'*), and watch the agents build the specification in real-time on your dashboard!"
        }
      ],
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
        stakeholderStatus: '',
        dataReadiness: '',
        financialRoiY1: 0,
        financialRoiY2: 0,
        financialRoiY3: 0,
        budgetRequiredY1: 0,
        budgetRequiredY2: 0,
        budgetRequiredY3: 0,
        businessCaseRationale: '',
        dependencies: '',
        businessCaseFile: '',
        integrationsText: ''
      },
      agentInsights: {
        checker: 'Auditor waiting for brainstormed details.',
        brainstormer: 'Brainstormer waiting for active discussion.',
        validator: 'Feasibility validator waiting for parameters.',
        businessCase: 'Finance estimator waiting for cost scope.',
        critic: 'Red Team waiting to audit security and compliance risks.',
        collection: { isReadyToSubmit: false, missingFields: [], nextSteps: 'Describe your idea to begin.' }
      },
      mode: 'lucky'
    };

    const next = [...currentList, cleanSession];
    setSessions(next);
    setCurrentSessionId(newId);
    setChatMessages(cleanSession.messages);
    setIdeaState(cleanSession.ideaState);
    setAgentInsights(cleanSession.agentInsights);
    setBrainstormMode('lucky');
    localStorage.setItem('pfizer_ai_chat_sessions', JSON.stringify(next));
  };

  const handleNewSession = () => {
    startNewSession();
  };

  // Helper: Update local active session details
  const saveActiveSession = (updatedMessages: any[], updatedIdea: any, updatedInsights: any, updatedMode: 'lucky' | 'collaborative') => {
    if (!currentSessionId) return;
    
    // Auto-update session title based on idea title if populated
    const activeTitle = updatedIdea?.title?.trim() || 'Brainstorming Session';

    setSessions(prev => {
      const next = prev.map(s => {
        if (s.id === currentSessionId) {
          const currentTitle = s.title || '';
          const isDefault = currentTitle === 'New Session' || currentTitle === 'Brainstorming Session' || currentTitle === 'Untitled Session';
          const nextTitle = !isDefault ? currentTitle : (activeTitle.substring(0, 30) || currentTitle);

          return {
            ...s,
            title: nextTitle,
            messages: updatedMessages,
            ideaState: updatedIdea,
            agentInsights: updatedInsights,
            mode: updatedMode
          };
        }
        return s;
      });
      localStorage.setItem('pfizer_ai_chat_sessions', JSON.stringify(next));
      return next;
    });
  };

  const [saveSessionFlash, setSaveSessionFlash] = useState(false);

  const handleSaveSessionExplicitly = () => {
    if (!currentSessionId) return;
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;
    
    const activeTitle = ideaState?.title?.trim() || currentSession.title || 'Brainstorming Session';
    const nextTitle = prompt("Name this session to resume later:", activeTitle);
    
    if (nextTitle !== null) {
      const finalTitle = nextTitle.trim() || activeTitle;
      
      setSessions(prev => {
        const next = prev.map(s => {
          if (s.id === currentSessionId) {
            return { 
              ...s, 
              title: finalTitle,
              messages: chatMessages,
              ideaState: ideaState,
              agentInsights: agentInsights,
              mode: brainstormMode
            };
          }
          return s;
        });
        localStorage.setItem('pfizer_ai_chat_sessions', JSON.stringify(next));
        return next;
      });
      
      setSaveSessionFlash(true);
      setTimeout(() => setSaveSessionFlash(false), 2000);
    }
  };

  const processIncomingIdeaState = (incoming: any) => {
    if (!incoming) return ideaState;
    const mapped = { ...incoming };
    mapped.financialRoiY1 = mapped.financialRoiY1 !== undefined ? Number(mapped.financialRoiY1) : (Number(mapped.financialRoi) || 0);
    mapped.financialRoiY2 = mapped.financialRoiY2 !== undefined ? Number(mapped.financialRoiY2) : (Number(mapped.financialRoi) || 0);
    mapped.financialRoiY3 = mapped.financialRoiY3 !== undefined ? Number(mapped.financialRoiY3) : (Number(mapped.financialRoi) || 0);

    mapped.budgetRequiredY1 = mapped.budgetRequiredY1 !== undefined ? Number(mapped.budgetRequiredY1) : (Number(mapped.budgetRequiredVal) || 0);
    mapped.budgetRequiredY2 = mapped.budgetRequiredY2 !== undefined ? Number(mapped.budgetRequiredY2) : 0;
    mapped.budgetRequiredY3 = mapped.budgetRequiredY3 !== undefined ? Number(mapped.budgetRequiredY3) : 0;

    mapped.businessCaseRationale = mapped.businessCaseRationale || mapped.businessCase || '';
    mapped.dependencies = mapped.dependencies || '';
    mapped.businessCaseFile = mapped.businessCaseFile || '';

    if (Array.isArray(mapped.integrations)) {
      mapped.integrationsText = mapped.integrations.join(', ');
    } else if (typeof mapped.integrations === 'string') {
      mapped.integrationsText = mapped.integrations;
      mapped.integrations = mapped.integrations.split(',').map((s: any) => s.trim()).filter(Boolean);
    }
    return mapped;
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setChatMessages(session.messages);
    setIdeaState(session.ideaState);
    setAgentInsights(session.agentInsights);
    setBrainstormMode(session.mode || 'lucky');
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('pfizer_ai_chat_sessions', JSON.stringify(updated));
    
    if (currentSessionId === id) {
      if (updated.length > 0) {
        const nextSession = updated[updated.length - 1];
        setCurrentSessionId(nextSession.id);
        setChatMessages(nextSession.messages);
        setIdeaState(nextSession.ideaState);
        setAgentInsights(nextSession.agentInsights);
        setBrainstormMode(nextSession.mode || 'lucky');
      } else {
        startNewSession([]);
      }
    }
  };

  // Handle Global chatbot messages
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: chatInput
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setIsSendingChat(true);
    setSubmissionSuccess(null);

    // Save user message immediately to the session
    saveActiveSession(newMessages, ideaState, agentInsights, brainstormMode);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          mode: brainstormMode,
          hurdleRate,
          history: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        const reply = {
          id: Math.random().toString(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources
        };

        const nextMessages = [...newMessages, reply];
        setChatMessages(nextMessages);

        // Propagate updates to states & session
        let nextIdeaState = ideaState;
        let nextInsights = agentInsights;
        if (data.ideaState) {
          nextIdeaState = processIncomingIdeaState(data.ideaState);
          setIdeaState(nextIdeaState);
        }
        if (data.agentInsights) {
          nextInsights = data.agentInsights;
          setAgentInsights(data.agentInsights);
        }

        saveActiveSession(nextMessages, nextIdeaState, nextInsights, brainstormMode);
      } else {
        throw new Error(data.error || 'Chat failed');
      }
    } catch (err: any) {
      console.error(err);
      const errReply = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `Error connecting to agents: ${err.message || 'Check LM Studio status.'}`
      };
      setChatMessages(prev => [...prev, errReply]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Process message edits
  const handleSaveMessageEdit = async (msgId: string, updatedContent: string) => {
    const updated = chatMessages.map(m => m.id === msgId ? { ...m, content: updatedContent } : m);
    setChatMessages(updated);
    setEditingMsgId(null);
    saveActiveSession(updated, ideaState, agentInsights, brainstormMode);

    // Re-run agents on the edited transcript history to update state
    setIsSendingChat(true);
    try {
      const lastUserMsg = updated[updated.length - 1];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: lastUserMsg?.content || 'Update idea',
          mode: brainstormMode,
          hurdleRate,
          history: updated.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        let nextIdea = ideaState;
        let nextInsights = agentInsights;
        if (data.ideaState) {
          nextIdea = processIncomingIdeaState(data.ideaState);
          setIdeaState(nextIdea);
        }
        if (data.agentInsights) {
          nextInsights = data.agentInsights;
          setAgentInsights(data.agentInsights);
        }
        saveActiveSession(updated, nextIdea, nextInsights, brainstormMode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Calculate local idea completeness progress
  const getMissingFieldsList = (state: any) => {
    const missing = [];
    if (!state.title?.trim()) missing.push('title');
    if (!state.problemStatement?.trim()) missing.push('problemStatement');
    if (!state.functionalDomains || state.functionalDomains.length === 0) missing.push('functionalDomains');
    if (!state.therapeuticAreas || state.therapeuticAreas.length === 0) missing.push('therapeuticAreas');
    if (!state.integrations || state.integrations.length === 0) missing.push('integrations');
    if (!state.opportunityCost?.trim()) missing.push('opportunityCost');
    if (!state.businessCase?.trim()) missing.push('businessCase');
    if (!state.financialRoi || Number(state.financialRoi) <= 0) missing.push('financialRoi');
    if (!state.budgetRequiredVal || Number(state.budgetRequiredVal) <= 0) missing.push('budgetRequiredVal');
    if (!state.stakeholderStatus?.trim()) missing.push('stakeholderStatus');
    if (!state.dataReadiness?.trim()) missing.push('dataReadiness');
    return missing;
  };

  const missingFields = getMissingFieldsList(ideaState);
  const totalFieldsCount = 11;
  const progressPercent = Math.round(((totalFieldsCount - missingFields.length) / totalFieldsCount) * 100);

  // 3-Year financial calculations
  const roiY1 = Number(ideaState.financialRoiY1) || (Number(ideaState.financialRoi) || 0);
  const roiY2 = Number(ideaState.financialRoiY2) || (Number(ideaState.financialRoi) || 0);
  const roiY3 = Number(ideaState.financialRoiY3) || (Number(ideaState.financialRoi) || 0);
  
  const bY1 = Number(ideaState.budgetRequiredY1) || (Number(ideaState.budgetRequiredVal) || 0);
  const bY2 = Number(ideaState.budgetRequiredY2) || 0;
  const bY3 = Number(ideaState.budgetRequiredY3) || 0;

  const totalInvestment = bY1 + bY2 + bY3;
  const totalReturns = roiY1 + roiY2 + roiY3;

  // 3-Year IRR Solver
  const calculate3YrIRR = (inv1: number, inv2: number, inv3: number, ret1: number, ret2: number, ret3: number) => {
    const totalInv = inv1 + inv2 + inv3;
    if (totalInv <= 0) return 0;
    
    let low = -0.99;
    let high = 10.0;
    for (let i = 0; i < 100; i++) {
      const r = (low + high) / 2;
      const npv = -totalInv + ret1 / (1 + r) + ret2 / Math.pow(1 + r, 2) + ret3 / Math.pow(1 + r, 3);
      if (Math.abs(npv) < 0.01) {
        return r * 100;
      }
      if (npv > 0) {
        low = r;
      } else {
        high = r;
      }
    }
    return ((low + high) / 2) * 100;
  };

  const irrVal = calculate3YrIRR(bY1, bY2, bY3, roiY1, roiY2, roiY3);
  const roiVal = totalInvestment > 0 ? ((totalReturns / 3) / totalInvestment) * 100 : 0;
  const isHurdlePassed = irrVal >= hurdleRate;

  // Submit current curated specifications to Backlog
  const handleFinalSubmitToBacklog = async () => {
    if (!ideaState.title?.trim() || !ideaState.problemStatement?.trim()) {
      alert("Please ensure at least the Title and Problem Statement are filled before saving a draft.");
      return;
    }
    
    setIsSubmittingIdea(true);
    setSubmissionSuccess(null);

    try {
      // 1. Run Automated Scorecard Grading
      const scoreRes = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaState)
      });
      
      const scores = await scoreRes.json();
      if (!scoreRes.ok) {
        throw new Error(scores.error || 'Failed to grade scorecard');
      }

      // Compute dynamic readiness average
      const currentReadinessScore = 
        scores.budgetAvailabilityScore * weights[0] + 
        scores.dataAvailabilityScore * weights[1] + 
        scores.stakeholderReadinessScore * weights[2] + 
        scores.impactOfNotDoingScore * weights[3] + 
        scores.financialBusinessCaseScore * weights[4] + 
        scores.budgetRequiredScore * weights[5];

      // Calculate the aggregate Idea Score (scorecard weighted readiness)
      const currentIdeaScore = currentReadinessScore;

      // 2. Submit Project to DB (including Checker, Brainstormer, etc. text insights + Idea Score)
      const submitRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ideaState,
          execSponsor: 'Steering Committee',
          productOwner: currentPersona.name,
          phase: 'Backlog',
          budgetAvailabilityScore: scores.budgetAvailabilityScore,
          dataAvailabilityScore: scores.dataAvailabilityScore,
          stakeholderReadinessScore: scores.stakeholderReadinessScore,
          impactOfNotDoingScore: scores.impactOfNotDoingScore,
          financialBusinessCaseScore: scores.financialBusinessCaseScore,
          budgetRequiredScore: scores.budgetRequiredScore,
          readinessScore: currentReadinessScore,
          // Seeding agent insights
          ideaScore: currentIdeaScore,
          checkerInsight: agentInsights.checker,
          brainstormerInsight: agentInsights.brainstormer,
          validatorInsight: agentInsights.validator,
          businessCaseInsight: agentInsights.businessCase,
          criticInsight: agentInsights.critic,
          submittedBy: currentPersona.name
        })
      });

      const data = await submitRes.json();
      if (submitRes.ok) {
        setSubmissionSuccess(`Successfully drafted and saved "${ideaState.title}" into Backlog!`);
        
        // Reset active session state
        const resetIdea = {
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
        };
        setIdeaState(resetIdea);
        
        const successMsg = {
          id: Math.random().toString(),
          role: 'assistant',
          content: `✅ SUCCESS: Your brainstormed idea has been submitted and scored successfully.\n\nYou can now view it on the Lifecycle Kanban Board.`
        };
        const nextMessages = [...chatMessages, successMsg];
        setChatMessages(nextMessages);
        saveActiveSession(nextMessages, resetIdea, agentInsights, brainstormMode);
      } else {
        throw new Error(data.error || 'Failed to submit proposal');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting concept to backlog.');
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const currentPersona = PERSONAS[role];

  const navItems = [
    { name: 'Vision & Steering', href: '/', icon: Home, roles: ['CMO_LEADER', 'BRAND_MANAGER', 'TECH_EXPERT'] },
    { name: 'Project Marketplace', href: '/marketplace', icon: ShoppingBag, roles: ['CMO_LEADER', 'BRAND_MANAGER', 'TECH_EXPERT'] },
    { name: 'My Ideas & Workspace', href: '/my-ideas', icon: ClipboardList, roles: ['CMO_LEADER', 'BRAND_MANAGER', 'TECH_EXPERT'] },
    { name: 'Lifecycle Board', href: '/lifecycle', icon: Layers, roles: ['CMO_LEADER', 'BRAND_MANAGER', 'TECH_EXPERT'] },
    { name: 'Intake & Wizard', href: '/intake', icon: FilePlus, roles: ['CMO_LEADER', 'BRAND_MANAGER'] },
    { name: 'Expert Directory', href: '/directory', icon: Users, roles: ['CMO_LEADER', 'BRAND_MANAGER', 'TECH_EXPERT'] },
    { name: 'Portfolio Insights & Q&A', href: '/insights', icon: BarChart2, roles: ['CMO_LEADER'] },
  ];

  return (
    <PersonaContext.Provider value={{ currentPersona, setPersona, weights, saveWeights }}>
      <div className="min-h-screen flex flex-col bg-[#fffaf0] text-slate-950 font-sans selection:bg-pink-500 selection:text-white relative">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-[#fffaf0]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-900/5 transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center font-bold text-[#fffaf0] shadow-sm">
                P
              </div>
              <span className="font-bold tracking-tight text-md text-[#0a0a0a]">
                Pfizer <span className="font-normal text-slate-500">AI Think Tank</span>
              </span>
            </Link>
          </div>

          {/* Persona Selection Trigger */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{currentPersona.name}</span>
              <span className="text-[10px] text-slate-555 flex items-center justify-end gap-1 font-semibold">
                <Shield size={10} className="text-pink-500" /> {currentPersona.badge}
              </span>
            </div>
            
            <div className="relative group">
              <button className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                <UserCheck size={14} />
                <span>Switch Role</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 opacity-0 scale-95 pointer-events-none group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto hover:opacity-100 hover:scale-100 hover:pointer-events-auto transition-all z-50">
                <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Active Persona
                </div>
                <div className="mt-1 space-y-1">
                  {(Object.keys(PERSONAS) as PersonaRole[]).map((key) => {
                    const p = PERSONAS[key];
                    const isActive = p.role === role;
                    return (
                      <button
                        key={p.role}
                        onClick={() => setPersona(p.role)}
                        className={`w-full text-left p-3 rounded-xl flex flex-col gap-0.5 hover:bg-slate-50 transition-colors ${isActive ? 'bg-slate-100/80' : ''}`}
                      >
                        <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          {p.name}
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight">{p.title}</span>
                        <span className="text-[9px] text-slate-400 mt-1 font-semibold">{p.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside 
            className={`fixed md:relative top-16 md:top-auto bottom-0 md:bottom-auto bg-[#faf5e8] md:bg-[#faf5e8]/80 border-r border-slate-200 w-64 shrink-0 transition-all duration-300 flex flex-col z-30 ${
              isSidebarOpen 
                ? 'translate-x-0 md:ml-0' 
                : '-translate-x-full md:-ml-64 md:translate-x-0'
            }`}
          >
            {/* Persona card inside sidebar */}
            <div className="p-4 border-b border-slate-200 bg-[#f5f0e0]/40">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentPersona.color} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                  {currentPersona.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{currentPersona.name}</h4>
                  <p className="text-[9px] text-pink-500 tracking-wider uppercase font-semibold mt-0.5">{currentPersona.badge}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                {currentPersona.description}
              </p>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isAllowed = item.roles.includes(role);
                const isActive = pathname === item.href;
                
                if (!isAllowed) return null;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-slate-900/5 text-slate-900 border-l-2 border-slate-900' 
                        : 'text-slate-550 hover:text-slate-800 hover:bg-slate-900/5'
                    }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-200 bg-[#f5f0e0]/20 text-[10px] text-slate-500 flex flex-col gap-1">
              <div>System Target: <span className="text-slate-700 font-medium">Postgres pgvector</span></div>
              <div>LLM Mode: <span className="text-slate-700 font-medium">Gemma-12b (Local)</span></div>
              <div className="flex items-center gap-1 mt-2 text-pink-500 font-semibold">
                <Sparkles size={10} /> Clay Design System
              </div>
            </div>
          </aside>

          {/* Page Content Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
              {children}
            </div>
          </main>
        </div>

        {/* Global Floating AI Chat Button */}
        <button
          id="global-floating-chat-button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer group animate-pulse"
          title="Open AI Council Brainstorming Workspace"
        >
          <Sparkles className="w-6 h-6 text-pink-400 group-hover:text-pink-300 animate-spin-slow" />
        </button>

        {/* Sliding AI Premium Chat Dual-Panel Drawer Overlay */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
            <div className="w-full max-w-5xl bg-[#fffaf0] h-full shadow-2xl flex flex-row divide-x divide-slate-200 relative animate-slideIn">
              
              {/* LEFT PANEL: Chat Stream (55%) */}
              <div className="w-[55%] flex flex-col h-full bg-[#fffaf0] relative">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-[#faf5e8]/90 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      AI
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#0a0a0a] flex items-center gap-1.5">
                        <span>AI Council Workspace</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Active Steering Co-Pilot</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {saveSessionFlash ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 animate-fadeIn shrink-0 shadow-sm">
                        <Check size={10} /> Saved!
                      </span>
                    ) : (
                      <button
                        onClick={handleSaveSessionExplicitly}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                        title="Explicitly save and rename this session midway"
                      >
                        <Check size={12} className="text-emerald-600 animate-pulse" />
                        <span>Save Midway</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="View Saved Chat Sessions"
                    >
                      <History size={12} />
                      <span>Chats ({sessions.length})</span>
                    </button>

                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer block md:hidden"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* SLIDING SESSIONS OVERLAY */}
                {isHistoryOpen && (
                  <div className="absolute inset-x-0 top-[69px] bottom-0 bg-[#fffaf0] z-20 border-b border-slate-250 p-4 space-y-4 animate-fadeIn overflow-y-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-800">Your Chat History</span>
                      <button
                        onClick={handleNewSession}
                        className="px-2.5 py-1 bg-[#ff4d8b] text-white hover:bg-pink-600 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <PlusCircle size={10} />
                        <span>New Session</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div 
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                            s.id === currentSessionId 
                              ? 'bg-slate-100 border-slate-300 font-bold' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs text-slate-800 truncate max-w-[220px]">{s.title || 'Untitled Session'}</h4>
                            <span className="text-[9px] text-slate-450">{new Date(s.timestamp).toLocaleDateString()} &bull; {s.mode === 'collaborative' ? 'Step-by-Step' : 'Auto-Draft'}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Scroll Viewport */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-170px)] custom-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1.5 ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div 
                        onDoubleClick={() => {
                          setEditingMsgId(msg.id);
                          setEditingMsgText(msg.content);
                        }}
                        className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed border transition-all cursor-pointer shadow-sm select-text ${
                          msg.role === 'user'
                            ? 'bg-slate-950 border-slate-950 text-[#fffaf0] rounded-br-none hover:bg-slate-900'
                            : 'bg-white border-slate-200 text-[#0a0a0a] rounded-bl-none hover:bg-slate-50/80'
                        }`}
                        title="Double click to edit message text inline"
                      >
                        {editingMsgId === msg.id ? (
                          <div className="space-y-2 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={editingMsgText}
                              onChange={(e) => setEditingMsgText(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 leading-relaxed font-sans"
                              rows={4}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMsgId(null)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] rounded-lg font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveMessageEdit(msg.id, editingMsgText)}
                                className="px-3 py-1 bg-[#ff4d8b] text-white hover:bg-pink-600 text-[10px] rounded-lg font-bold cursor-pointer"
                              >
                                Save & Reparse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="leading-relaxed">{parseMarkdownText(msg.content, msg.role === 'user')}</div>
                        )}
                      </div>

                      {/* citation tags */}
                      {msg.sources && (msg.sources.projects?.length > 0 || msg.sources.experts?.length > 0) && (
                        <div className="pl-1.5 space-y-1 flex flex-col items-start">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Semantic Anchors:</span>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.projects?.map((p: any) => (
                              <span key={p.id} className="text-[8px] text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded font-medium">
                                📂 {p.title.substring(0, 15)}...
                              </span>
                            ))}
                            {msg.sources.experts?.map((e: any) => (
                              <span key={e.id} className="text-[8px] text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded font-medium">
                                👤 {e.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex items-center gap-2 text-slate-450 text-xs pl-2">
                      <Loader2 size={12} className="animate-spin text-pink-500" />
                      <span>{loadingMessage}</span>
                    </div>
                  )}
                </div>

                {/* Input panel with dynamic settings */}
                <div className="p-4 border-t border-slate-200 bg-[#faf5e8]/90 space-y-3">
                  
                  {/* Mode Toggles */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[10px] font-bold text-slate-650">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Mode:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="brainstormMode"
                          checked={brainstormMode === 'lucky'}
                          onChange={() => {
                            setBrainstormMode('lucky');
                            saveActiveSession(chatMessages, ideaState, agentInsights, 'lucky');
                          }}
                          className="accent-slate-900"
                        />
                        <span>I'm Feeling Lucky</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="brainstormMode"
                          checked={brainstormMode === 'collaborative'}
                          onChange={() => {
                            setBrainstormMode('collaborative');
                            saveActiveSession(chatMessages, ideaState, agentInsights, 'collaborative');
                          }}
                          className="accent-slate-900"
                        />
                        <span>Work With Me</span>
                      </label>
                    </div>

                    <div className="text-[10px] font-semibold text-slate-500">
                      Hurdle Rate: <span className="font-bold text-slate-800">{hurdleRate}%</span>
                    </div>
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      disabled={isSendingChat}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={brainstormMode === 'collaborative' ? "Answer qualifying question or ask for feedback..." : "Describe your use case to auto-draft details..."}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#0a0a0a] placeholder-slate-450 focus:outline-none focus:border-slate-450 transition-colors shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInput.trim()}
                      className="w-10 h-10 shrink-0 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT PANEL: Co-Design Spec Dashboard (45%) */}
              <div className="w-[45%] flex flex-col h-full bg-[#faf8f2]">
                {/* Header Switcher */}
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRightPanelTab('dashboard')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        rightPanelTab === 'dashboard' 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Steering Dashboard
                    </button>
                    <button
                      onClick={() => setRightPanelTab('curate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        rightPanelTab === 'curate' 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Edit3 size={12} />
                      <span>Curate Draft</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer hidden md:block"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Dashboard Scroll Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 max-h-[calc(100vh-140px)] custom-scrollbar">
                  
                  {rightPanelTab === 'dashboard' ? (
                    <>
                      {/* Progress widget */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>Intake Development Progress</span>
                          <span className="text-pink-500">{progressPercent}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-150 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>

                        {/* Fields checklists pills */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {[
                            { id: 'title', label: 'Title' },
                            { id: 'problemStatement', label: 'Problem' },
                            { id: 'functionalDomains', label: 'Domain' },
                            { id: 'therapeuticAreas', label: 'TAs' },
                            { id: 'integrations', label: 'Integrations' },
                            { id: 'opportunityCost', label: 'Opp Cost' },
                            { id: 'businessCase', label: 'Business Case' },
                            { id: 'financialRoi', label: 'ROI' },
                            { id: 'budgetRequiredVal', label: 'Cost' },
                            { id: 'stakeholderStatus', label: 'Stakeholders' },
                            { id: 'dataReadiness', label: 'Data Readiness' }
                          ].map((f) => {
                            const isFilled = f.id === 'therapeuticAreas' || f.id === 'integrations' || f.id === 'functionalDomains'
                              ? (ideaState[f.id] && ideaState[f.id].length > 0)
                              : f.id === 'financialRoi' || f.id === 'budgetRequiredVal'
                              ? Number(ideaState[f.id]) > 0
                              : !!ideaState[f.id]?.trim();
                            
                            return (
                              <span 
                                key={f.id} 
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  isFilled 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                {isFilled ? <Check size={8} /> : <span>?</span>}
                                {f.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Agent Steering Accordion Tabs */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specialist Agent Insights</div>
                        
                        <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                          {[
                            { id: 'brainstormer', label: '💡 Brain', title: 'Brainstormer' },
                            { id: 'validator', label: '🛠️ Feas', title: 'Validator' },
                            { id: 'critic', label: '⚖️ Risk', title: 'Risk Critic' },
                            { id: 'business', label: '💰 ROI', title: 'Business Case' },
                            { id: 'checker', label: '🔍 Audit', title: 'Checker' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveInsightTab(tab.id as any)}
                              className={`py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all cursor-pointer ${
                                activeInsightTab === tab.id 
                                  ? 'bg-[#f5f0e0] text-slate-900 border border-slate-250 font-bold' 
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                              title={tab.title}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Agent Insight Log Card */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[180px]">
                          {activeInsightTab === 'checker' && (
                            <div className="space-y-2 animate-fadeIn">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Users size={12} className="text-pink-500" />
                                <span>Checker (Duplicate Scanner)</span>
                              </h4>
                              <div className="text-xs text-slate-750 leading-relaxed">
                                {parseMarkdownText(agentInsights.checker)}
                              </div>
                            </div>
                          )}

                          {activeInsightTab === 'brainstormer' && (
                            <div className="space-y-2 animate-fadeIn">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Lightbulb size={12} className="text-pink-500" />
                                <span>Brainstormer (Commercial Strategist)</span>
                              </h4>
                              <div className="text-xs text-slate-750 leading-relaxed">
                                {parseMarkdownText(agentInsights.brainstormer)}
                              </div>
                            </div>
                          )}

                          {activeInsightTab === 'validator' && (
                            <div className="space-y-2 animate-fadeIn">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Activity size={12} className="text-pink-500" />
                                <span>Validator (Feasibility Architect)</span>
                              </h4>
                              <div className="text-xs text-slate-750 leading-relaxed">
                                {parseMarkdownText(agentInsights.validator)}
                              </div>
                            </div>
                          )}

                          {activeInsightTab === 'business' && (
                            <div className="space-y-4 animate-fadeIn">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Coins size={12} className="text-pink-500" />
                                <span>Business Case Calculator</span>
                              </h4>
                              
                              {/* Hurdle Rate Config Box */}
                              <div className="p-3 bg-[#fffaf0] border border-slate-200 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                  <span>HURDLE RATE SETTING:</span>
                                  <span className="text-pink-500">{hurdleRate}%</span>
                                </div>
                                <input 
                                  type="range" min="5" max="25" step="1"
                                  value={hurdleRate}
                                  onChange={(e) => setHurdleRate(Number(e.target.value))}
                                  className="w-full accent-slate-900 cursor-pointer"
                                />
                              </div>

                              {/* Hard/Soft benefits calculations */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-[#fcfbfa] border border-slate-200 rounded-xl space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Projected IRR</span>
                                  <span className="font-extrabold text-sm text-slate-800">{irrVal.toFixed(1)}%</span>
                                </div>
                                <div className="p-3 bg-[#fcfbfa] border border-slate-200 rounded-xl space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Annual ROI</span>
                                  <span className="font-extrabold text-sm text-slate-800">{roiVal.toFixed(0)}%</span>
                                </div>
                              </div>

                              <div className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 ${
                                isHurdlePassed 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                                  : 'bg-rose-50 text-rose-800 border-rose-250'
                              }`}>
                                {isHurdlePassed ? <Check size={12} /> : <AlertTriangle size={12} />}
                                <span>
                                  {isHurdlePassed 
                                    ? `Returns APPROVED (IRR exceeds ${hurdleRate}% hurdle rate)` 
                                    : `Returns WARNING (IRR below ${hurdleRate}% hurdle rate)`
                                  }
                                </span>
                              </div>

                              <div className="text-xs text-slate-750 leading-relaxed border-t border-slate-100 pt-2">
                                {parseMarkdownText(agentInsights.businessCase)}
                              </div>
                            </div>
                          )}

                          {activeInsightTab === 'critic' && (
                            <div className="space-y-2.5 animate-fadeIn">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert size={12} className="text-rose-500 animate-pulse" />
                                <span>Fierce Critic (Risk Vetting)</span>
                              </h4>
                              <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-900 text-xs leading-relaxed space-y-2 shadow-inner">
                                <p className="font-semibold text-[11px] text-rose-800 flex items-center gap-1">
                                  <AlertTriangle size={12} />
                                  Steering Red Team Vetting:
                                </p>
                                <div className="text-rose-700 text-xs leading-relaxed">
                                  {parseMarkdownText(agentInsights.critic)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Collection Missing Summary alert box */}
                      {agentInsights.collection && agentInsights.collection.nextSteps && (
                        <div className="p-4 rounded-2xl border border-blue-150 bg-blue-50 text-blue-900 text-xs leading-relaxed flex gap-3 shadow-inner animate-fadeIn">
                          <ClipboardList size={16} className="shrink-0 mt-0.5 text-blue-500" />
                          <div className="space-y-1">
                            <span className="font-bold text-blue-800">Collection Agent (Next Focus)</span>
                            <p className="text-blue-750 leading-relaxed">{agentInsights.collection.nextSteps}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* EDIT DRAFT FORM */
                    <div className="space-y-5 animate-fadeIn">
                      <div className="text-xs font-bold text-slate-700 pb-1.5 border-b border-slate-200">Curate Brainstormed Details</div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Name</label>
                        <input
                          type="text"
                          value={ideaState.title}
                          onChange={(e) => {
                            const updated = { ...ideaState, title: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="e.g. Oncology Patient Matching AI"
                        />
                      </div>

                      {/* Problem */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Problem Statement</label>
                        <textarea
                          rows={3}
                          value={ideaState.problemStatement}
                          onChange={(e) => {
                            const updated = { ...ideaState, problemStatement: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="What bottleneck is brand solving?"
                        />
                      </div>

                      {/* Domain and TAs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Functional Domains</label>
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5 max-h-24 overflow-y-auto">
                            {availableDomains.map((dm) => {
                              const includes = ideaState.functionalDomains?.includes(dm);
                              return (
                                <label key={dm} className="flex items-center gap-2 text-[10px] text-slate-750 font-semibold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={includes}
                                    onChange={() => {
                                      const next = includes 
                                        ? ideaState.functionalDomains.filter((item: any) => item !== dm)
                                        : [...(ideaState.functionalDomains || []), dm];
                                      const updated = { ...ideaState, functionalDomains: next };
                                      setIdeaState(updated);
                                      saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                                    }}
                                    className="accent-slate-900"
                                  />
                                  <span>{dm}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <input
                              type="text"
                              placeholder="New domain..."
                              value={newDomainInput}
                              onChange={(e) => setNewDomainInput(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-lg p-1 text-[10px] text-[#0a0a0a]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomDomain();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomDomain}
                              className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-semibold hover:bg-slate-800 cursor-pointer border border-transparent"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Therapeutic Areas</label>
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5 max-h-24 overflow-y-auto">
                            {THERAPEUTIC_AREAS.map((ta) => {
                              const includes = ideaState.therapeuticAreas?.includes(ta);
                              return (
                                <label key={ta} className="flex items-center gap-2 text-[10px] text-slate-750 font-semibold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={includes}
                                    onChange={() => {
                                      const next = includes 
                                        ? ideaState.therapeuticAreas.filter((item: any) => item !== ta)
                                        : [...(ideaState.therapeuticAreas || []), ta];
                                      const updated = { ...ideaState, therapeuticAreas: next };
                                      setIdeaState(updated);
                                      saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                                    }}
                                    className="accent-slate-900"
                                  />
                                  <span>{ta}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Integrations free text input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Integrations</label>
                        <input
                          type="text"
                          value={ideaState.integrationsText !== undefined ? ideaState.integrationsText : (ideaState.integrations || []).join(', ')}
                          onChange={(e) => {
                            const val = e.target.value;
                            const arr = val.split(',').map(s => s.trim()).filter(Boolean);
                            const updated = { ...ideaState, integrationsText: val, integrations: arr };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="e.g. Veeva CRM, Adobe Target, Salesforce"
                        />
                      </div>

                      {/* Data Readiness details */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Availability & Readiness</label>
                        <textarea
                          rows={2}
                          value={ideaState.dataReadiness || ''}
                          onChange={(e) => {
                            const updated = { ...ideaState, dataReadiness: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="Describe data readiness. Are target datasets clean, compliant, and ready?"
                        />
                      </div>

                      {/* Opp cost */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Impact of Not Doing</label>
                        <textarea
                          rows={2}
                          value={ideaState.opportunityCost}
                          onChange={(e) => {
                            const updated = { ...ideaState, opportunityCost: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="What are the opportunity costs if we fail to act?"
                        />
                      </div>

                      {/* Business case */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Business Case (Savings/benefits)</label>
                        <input
                          type="text"
                          value={ideaState.businessCase}
                          onChange={(e) => {
                            const updated = { ...ideaState, businessCase: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="e.g. Reduces content validation costs"
                        />
                      </div>

                      {/* 3-Year Financial Model Inputs */}
                      <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-[#faf8f2]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">3-Year Financial Model</span>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {/* Year 1 */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 1 Return (USD)</label>
                            <input
                              type="text"
                              value={ideaState.financialRoiY1 !== undefined ? ideaState.financialRoiY1 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, financialRoiY1: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 100000"
                            />
                          </div>
                          
                          {/* Year 2 */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 2 Return (USD)</label>
                            <input
                              type="text"
                              value={ideaState.financialRoiY2 !== undefined ? ideaState.financialRoiY2 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, financialRoiY2: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 150000"
                            />
                          </div>

                          {/* Year 3 */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 3 Return (USD)</label>
                            <input
                              type="text"
                              value={ideaState.financialRoiY3 !== undefined ? ideaState.financialRoiY3 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, financialRoiY3: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 200000"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Yr 1 Invest */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 1 Budget (USD)</label>
                            <input
                              type="text"
                              value={ideaState.budgetRequiredY1 !== undefined ? ideaState.budgetRequiredY1 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, budgetRequiredY1: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 80000"
                            />
                          </div>

                          {/* Yr 2 Invest */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 2 Budget (USD)</label>
                            <input
                              type="text"
                              value={ideaState.budgetRequiredY2 !== undefined ? ideaState.budgetRequiredY2 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, budgetRequiredY2: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 20000"
                            />
                          </div>

                          {/* Yr 3 Invest */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block uppercase">Yr 3 Budget (USD)</label>
                            <input
                              type="text"
                              value={ideaState.budgetRequiredY3 !== undefined ? ideaState.budgetRequiredY3 : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                const updated = { ...ideaState, budgetRequiredY3: Number(val) || 0 };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0a0a0a]"
                              placeholder="e.g. 15000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Case Rationale */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Business Case Levers & Rationale</label>
                        <textarea
                          rows={3}
                          value={ideaState.businessCaseRationale || ''}
                          onChange={(e) => {
                            const updated = { ...ideaState, businessCaseRationale: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a] leading-relaxed"
                          placeholder="Describe Year 1-3 return levers and required investments..."
                        />
                      </div>

                      {/* Document Upload */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Upload Business Case Document</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="businessCaseFileLoader"
                            accept=".xlsx,.xls,.docx,.doc,.pptx,.ppt"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const updated = { ...ideaState, businessCaseFile: file.name };
                                setIdeaState(updated);
                                saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('businessCaseFileLoader')?.click()}
                            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>📎 Choose Document</span>
                          </button>
                          
                          {ideaState.businessCaseFile ? (
                            <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1.5 rounded-lg font-bold truncate max-w-[240px]" title={ideaState.businessCaseFile}>
                              Attached: {ideaState.businessCaseFile}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No document selected (supports .xlsx, .docx, .pptx)</span>
                          )}
                        </div>
                      </div>

                      {/* Dependencies */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Dependencies</label>
                        <textarea
                          rows={2}
                          value={ideaState.dependencies || ''}
                          onChange={(e) => {
                            const updated = { ...ideaState, dependencies: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="List key data availability, HIPAA checks, system alignment dependencies..."
                        />
                      </div>

                      {/* Stakeholder Status */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stakeholder Status</label>
                        <input
                          type="text"
                          value={ideaState.stakeholderStatus}
                          onChange={(e) => {
                            const updated = { ...ideaState, stakeholderStatus: e.target.value };
                            setIdeaState(updated);
                            saveActiveSession(chatMessages, updated, agentInsights, brainstormMode);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-[#0a0a0a]"
                          placeholder="e.g. Brand alignment confirmed"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Workspace Toolbar */}
                <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                  {submissionSuccess && (
                    <div className="p-3 text-[11px] font-bold rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex gap-2 items-center animate-fadeIn shadow-sm">
                      <Check size={14} className="shrink-0 text-emerald-600" />
                      <span>{submissionSuccess}</span>
                    </div>
                  )}

                  <button
                    onClick={handleFinalSubmitToBacklog}
                    disabled={isSubmittingIdea || !ideaState.title?.trim() || !ideaState.problemStatement?.trim()}
                    className="w-full h-11 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isSubmittingIdea ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-pink-400" />}
                    <span>Submit Brainstormed Concept to Backlog</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </PersonaContext.Provider>
  );
}
