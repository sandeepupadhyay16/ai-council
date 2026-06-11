'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Sparkles, 
  Brain, 
  Loader2, 
  ShieldAlert, 
  RotateCcw,
  Sliders,
  Check,
  Upload,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function IntakePage() {
  const { currentPersona, weights } = usePersona();
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  // Form Inputs
  const [title, setTitle] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['Omnichannel Intelligence']);
  const [availableDomains, setAvailableDomains] = useState<string[]>([
    'Omnichannel Intelligence',
    'Campaign Measurement Intelligence',
    'Patient Identification',
    'Field Force Automation'
  ]);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [selectedTAs, setSelectedTAs] = useState<string[]>([]);

  const handleDomainToggle = (dName: string) => {
    setSelectedDomains(prev => 
      prev.includes(dName) 
        ? prev.filter(item => item !== dName)
        : [...prev, dName]
    );
  };

  const handleAddCustomDomain = () => {
    const trimmed = customDomainInput.trim();
    if (trimmed && !availableDomains.includes(trimmed)) {
      setAvailableDomains(prev => [...prev, trimmed]);
      setSelectedDomains(prev => [...prev, trimmed]);
      setCustomDomainInput('');
    }
  };
  const [integrationsText, setIntegrationsText] = useState('');
  const [dataReadiness, setDataReadiness] = useState('');
  const [problem, setProblem] = useState('');
  const [budgetStatus, setBudgetStatus] = useState('Pre-allocated in standard budget');
  const [stakeholderStatus, setStakeholderStatus] = useState('');
  const [opportunityCost, setOpportunityCost] = useState('');
  const [businessCase, setBusinessCase] = useState('');
  
  // 3-Year Financial States
  const [roiY1, setRoiY1] = useState('250000');
  const [roiY2, setRoiY2] = useState('250000');
  const [roiY3, setRoiY3] = useState('250000');
  const [bY1, setBY1] = useState('100000');
  const [bY2, setBY2] = useState('0');
  const [bY3, setBY3] = useState('0');

  // Business Case, document and dependencies details
  const [businessCaseRationale, setBusinessCaseRationale] = useState('');
  const [businessCaseFile, setBusinessCaseFile] = useState('');
  const [dependencies, setDependencies] = useState('');

  // Evaluated Scores (6 dimensions)
  const [budgetAvailabilityScore, setBudgetAvailabilityScore] = useState(70.0);
  const [dataAvailabilityScore, setDataAvailabilityScore] = useState(70.0);
  const [stakeholderReadinessScore, setStakeholderReadinessScore] = useState(70.0);
  const [impactOfNotDoingScore, setImpactOfNotDoingScore] = useState(70.0);
  const [financialBusinessCaseScore, setFinancialBusinessCaseScore] = useState(70.0);
  const [budgetRequiredScore, setBudgetRequiredScore] = useState(70.0);
  const [justification, setJustification] = useState('');

  const [intakeMethod, setIntakeMethod] = useState<'form' | 'transcript' | 'assisted'>('form');

  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const draftVal = params.get('draft');
      if (draftVal) {
        fetch(`/api/projects?id=${draftVal}`)
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              setDraftId(draftVal);
              setTitle(data.title || '');
              setSelectedDomains(data.functionalDomains || (data.functionalDomain ? [data.functionalDomain] : ['Omnichannel Intelligence']));
              setSelectedTAs(data.therapeuticAreas || []);
              setIntegrationsText(data.integrations ? data.integrations.join(', ') : '');
              setProblem(data.problemStatement || '');
              setBudgetStatus(data.budgetStatus || 'Pre-allocated in standard budget');
              setStakeholderStatus(data.stakeholderStatus || '');
              setOpportunityCost(data.opportunityCost || '');
              setBusinessCase(data.businessCase || '');
              
              setRoiY1(String(data.financialRoiY1 ?? data.financialRoi ?? '250000'));
              setRoiY2(String(data.financialRoiY2 ?? data.financialRoi ?? '250000'));
              setRoiY3(String(data.financialRoiY3 ?? data.financialRoi ?? '250000'));
              setBY1(String(data.budgetRequiredY1 ?? data.budgetRequiredVal ?? '100000'));
              setBY2(String(data.budgetRequiredY2 ?? '0'));
              setBY3(String(data.budgetRequiredY3 ?? '0'));
              
              setBusinessCaseRationale(data.businessCaseRationale || '');
              setBusinessCaseFile(data.businessCaseFile || '');
              setDependencies(data.dependencies || '');
              setDataReadiness(data.dataReadiness || '');
            }
          });
      }
    }
  }, []);

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
      .catch(err => console.error('Failed to fetch projects for domains:', err));
  }, []);

  const handleSaveDraft = async () => {
    if (!title || !problem || selectedTAs.length === 0) {
      alert("Please enter a title, problem statement, and select at least one Therapeutic Area.");
      return;
    }
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId || undefined,
          title,
          problemStatement: problem,
          integrations: integrationsText.split(',').map(s => s.trim()).filter(Boolean),
          budgetStatus,
          stakeholderStatus,
          opportunityCost,
          businessCase,
          financialRoi: Number(roiY1),
          budgetRequiredVal: Number(bY1) + Number(bY2) + Number(bY3),
          execSponsor: currentPersona.role === 'ADMIN' ? currentPersona.name : 'TBD',
          productOwner: 'TBD',
          deploymentGateway: '',
          phase: 'Draft',
          therapeuticAreas: selectedTAs,
          budgetAvailabilityScore,
          dataAvailabilityScore,
          stakeholderReadinessScore,
          impactOfNotDoingScore,
          financialBusinessCaseScore,
          budgetRequiredScore,
          readinessScore: currentReadinessScore,
          functionalDomains: selectedDomains,
          financialRoiY1: Number(roiY1),
          financialRoiY2: Number(roiY2),
          financialRoiY3: Number(roiY3),
          budgetRequiredY1: Number(bY1),
          budgetRequiredY2: Number(bY2),
          budgetRequiredY3: Number(bY3),
          businessCaseRationale,
          dependencies,
          businessCaseFile,
          dataReadiness,
          submittedBy: currentPersona.name
        })
      });

      if (res.ok) {
        alert('Draft saved successfully!');
        router.push('/my-ideas');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save draft');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving draft: ' + err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Ingest states
  interface HarvestedIdea {
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
  }

  const [ingestText, setIngestText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Multi-idea triage checklist states
  const [parsedIdeas, setParsedIdeas] = useState<HarvestedIdea[]>([]);
  const [selectedIdeaIndexes, setSelectedIdeaIndexes] = useState<number[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  // Handle uploader drop/drag
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setIngestStatus({ type: null, message: '' });
    setParsedIdeas([]);
    setSelectedIdeaIndexes([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });
      
      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || `Ingestion request failed (status ${response.status})`);
      }

      if (data && Array.isArray(data.ideas)) {
        if (data.ideas.length === 0) {
          setIngestStatus({ type: 'success', message: 'No AI ideas detected in this file.' });
        } else {
          setParsedIdeas(data.ideas);
          setSelectedIdeaIndexes(data.ideas.map((_: any, i: number) => i));
        }
      } else {
        setIngestStatus({ type: 'success', message: data?.message || 'Triage completed.' });
      }
    } catch (error: any) {
      console.error(error);
      setIngestStatus({ type: 'error', message: error.message || 'Error processing uploaded file.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextIngest = async () => {
    if (!ingestText.trim()) return;
    setIsUploading(true);
    setIngestStatus({ type: null, message: '' });
    setParsedIdeas([]);
    setSelectedIdeaIndexes([]);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: ingestText })
      });
      
      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || `Ingestion failed (status ${response.status})`);
      }

      if (data && Array.isArray(data.ideas)) {
        if (data.ideas.length === 0) {
          setIngestStatus({ type: 'success', message: 'No AI ideas detected in this transcript.' });
        } else {
          setParsedIdeas(data.ideas);
          setSelectedIdeaIndexes(data.ideas.map((_: any, i: number) => i));
        }
      } else {
        setIngestStatus({ type: 'success', message: data?.message || 'Triage completed.' });
      }
    } catch (error: any) {
      console.error(error);
      setIngestStatus({ type: 'error', message: error.message || 'Error processing meeting transcript.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommitSelected = async () => {
    if (selectedIdeaIndexes.length === 0) return;
    setIsCommitting(true);
    try {
      const ideasToSave = selectedIdeaIndexes.map(idx => parsedIdeas[idx]);
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          ideas: ideasToSave,
          submittedBy: currentPersona.name
        })
      });

      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to ingest selected ideas.');
      }

      alert(`Successfully ingested ${ideasToSave.length} ideas as drafts!`);
      setParsedIdeas([]);
      setSelectedIdeaIndexes([]);
      setIngestText('');
      router.push('/my-ideas');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error committing selected ideas.');
    } finally {
      setIsCommitting(false);
    }
  };

  // Use dynamic weights from context (6 values)
  const activeWeights = weights && weights.length === 6 ? weights : [0.16, 0.16, 0.17, 0.17, 0.17, 0.17];
  
  const currentReadinessScore = 
    budgetAvailabilityScore * activeWeights[0] + 
    dataAvailabilityScore * activeWeights[1] + 
    stakeholderReadinessScore * activeWeights[2] + 
    impactOfNotDoingScore * activeWeights[3] + 
    financialBusinessCaseScore * activeWeights[4] + 
    budgetRequiredScore * activeWeights[5];

  const handleTAToggle = (ta: string) => {
    setSelectedTAs(prev => 
      prev.includes(ta) ? prev.filter(item => item !== ta) : [...prev, ta]
    );
  };

  // Call API to score
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !problem || selectedTAs.length === 0) {
      alert("Please enter a title, problem statement, and select at least one Therapeutic Area.");
      return;
    }
    
    setIsScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          problemStatement: problem,
          integrations: integrationsText.split(',').map(s => s.trim()).filter(Boolean),
          budgetStatus,
          stakeholderStatus,
          opportunityCost,
          businessCase,
          financialRoi: Number(roiY1),
          budgetRequiredVal: Number(bY1) + Number(bY2) + Number(bY3),
          functionalDomains: selectedDomains,
          therapeuticAreas: selectedTAs,
          dataReadiness
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBudgetAvailabilityScore(data.budgetAvailabilityScore);
        setDataAvailabilityScore(data.dataAvailabilityScore);
        setStakeholderReadinessScore(data.stakeholderReadinessScore);
        setImpactOfNotDoingScore(data.impactOfNotDoingScore);
        setFinancialBusinessCaseScore(data.financialBusinessCaseScore);
        setBudgetRequiredScore(data.budgetRequiredScore);
        setJustification(data.justification);
        setStep(2);
      } else {
        throw new Error(data.error || 'Scoring failed');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setBudgetAvailabilityScore(80.0);
      setDataAvailabilityScore((dataReadiness.length > 20 || integrationsText.split(',').map(s => s.trim()).filter(Boolean).length > 0) ? 85.0 : 60.0);
      setStakeholderReadinessScore(stakeholderStatus.length > 20 ? 90.0 : 70.0);
      setImpactOfNotDoingScore(opportunityCost.length > 20 ? 85.0 : 65.0);
      setFinancialBusinessCaseScore(75.0);
      setBudgetRequiredScore((Number(bY1) + Number(bY2) + Number(bY3)) < 150000 ? 90.0 : 70.0);
      setJustification("Calculated via sandbox evaluation system due to connection error.");
      setStep(2);
    } finally {
      setIsScoring(false);
    }
  };

  // Submit to DB
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId || undefined,
          title,
          problemStatement: problem,
          integrations: integrationsText.split(',').map(s => s.trim()).filter(Boolean),
          budgetStatus,
          stakeholderStatus,
          opportunityCost,
          businessCase,
          financialRoi: Number(roiY1),
          budgetRequiredVal: Number(bY1) + Number(bY2) + Number(bY3),
          execSponsor: currentPersona.role === 'ADMIN' ? currentPersona.name : 'TBD',
          productOwner: 'TBD',
          deploymentGateway: '',
          phase: 'Backlog',
          therapeuticAreas: selectedTAs,
          budgetAvailabilityScore,
          dataAvailabilityScore,
          stakeholderReadinessScore,
          impactOfNotDoingScore,
          financialBusinessCaseScore,
          budgetRequiredScore,
          readinessScore: currentReadinessScore,
          functionalDomains: selectedDomains,
          financialRoiY1: Number(roiY1),
          financialRoiY2: Number(roiY2),
          financialRoiY3: Number(roiY3),
          budgetRequiredY1: Number(bY1),
          budgetRequiredY2: Number(bY2),
          budgetRequiredY3: Number(bY3),
          businessCaseRationale,
          dependencies,
          businessCaseFile,
          dataReadiness,
          submittedBy: currentPersona.name
        })
      });

      if (res.ok) {
        router.push('/lifecycle');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting project proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Intake & Evaluation Hub</h1>
        <p className="text-slate-550 text-sm mt-1">Submit new commercial AI ideas and run automated steering committee evaluation scorecards.</p>
      </div>

      {/* Three-Way Intake Method Tab Selector */}
      <div className="flex gap-2 p-1.5 bg-[#f5f0e0]/40 border border-slate-200 rounded-2xl max-w-xl shadow-sm">
        {[
          { id: 'form', label: '📋 Structured Form' },
          { id: 'transcript', label: '📝 Meeting Transcripts' },
          { id: 'assisted', label: '✨ AI Co-Pilot Chat' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setIntakeMethod(tab.id as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
              intakeMethod === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-650 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {intakeMethod === 'form' && (
        step === 1 ? (
          /* Form Wizard */
          <form onSubmit={handleAnalyze} className="grid md:grid-cols-3 gap-8 items-start">
            {/* Main Form Fields */}
            <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project Proposal Details</h3>
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Project Name</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Omnichannel Recommendation Engine"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>

              {/* Dropdowns / Checkbox Lists */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Functional Domains checklist and custom input */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1.5">Functional Domains (Spans multiple)</label>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto">
                      {availableDomains.map((dm) => (
                        <label key={dm} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedDomains.includes(dm)}
                            onChange={() => handleDomainToggle(dm)}
                            className="accent-slate-900"
                          />
                          <span>{dm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Define custom domain..."
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
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
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer border border-transparent active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Cross Therapeutic Areas checkbox list */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 font-semibold">Therapeutic Areas (Spans multiple)</label>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto">
                    {THERAPEUTIC_AREAS.map((ta) => (
                      <label key={ta} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedTAs.includes(ta)}
                          onChange={() => handleTAToggle(ta)}
                          className="accent-slate-900"
                        />
                        <span>{ta}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Integrations free text input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">System Integrations</label>
                <input 
                  type="text"
                  value={integrationsText}
                  onChange={(e) => setIntegrationsText(e.target.value)}
                  placeholder="e.g. Veeva CRM, Adobe Target, Salesforce"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>

              {/* Data Availability & Readiness details */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Data Availability & Readiness Details</label>
                <textarea
                  rows={2}
                  value={dataReadiness}
                  onChange={(e) => setDataReadiness(e.target.value)}
                  placeholder="What datasets are required? Are they clean, compliant, and ready? (e.g. Veeva customer lists, IQVIA claims databases)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Problem Statement */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Problem Statement (Commercial/Brand Bottleneck)</label>
                <textarea
                  rows={2}
                  required
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Explain the commercial pain point or digital marketing bottleneck being addressed..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Budget status selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Budget Availability Status</label>
                <select
                  value={budgetStatus}
                  onChange={(e) => setBudgetStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                >
                  <option value="Pre-allocated in standard budget">Pre-allocated in standard budget</option>
                  <option value="Requested; awaiting approval">Requested; awaiting approval</option>
                  <option value="Unfunded; business case needed">Unfunded; business case needed</option>
                </select>
              </div>

              {/* Stakeholder Status */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Stakeholder Readiness Details</label>
                <textarea
                  rows={2}
                  value={stakeholderStatus}
                  onChange={(e) => setStakeholderStatus(e.target.value)}
                  placeholder="Who are the executive sponsors? Describe alignment and team readiness..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Opportunity Cost */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Impact of Not Doing the Project</label>
                <textarea
                  rows={2}
                  value={opportunityCost}
                  onChange={(e) => setOpportunityCost(e.target.value)}
                  placeholder="What happens if we maintain the status quo? Detail opportunity costs and bottlenecks..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Financial Business Case */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Financial Business Case (Savings/Benefits Summary)</label>
                <input 
                  type="text"
                  value={businessCase}
                  onChange={(e) => setBusinessCase(e.target.value)}
                  placeholder="e.g. Save $100k in agency overheads"
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* 3-Year Financial Model Projections */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-[#fffbf0]">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">3-Year Financial Model Projections</span>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 1 Return (USD)</label>
                    <input 
                      type="text"
                      value={roiY1}
                      onChange={(e) => setRoiY1(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 100000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 2 Return (USD)</label>
                    <input 
                      type="text"
                      value={roiY2}
                      onChange={(e) => setRoiY2(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 150000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 3 Return (USD)</label>
                    <input 
                      type="text"
                      value={roiY3}
                      onChange={(e) => setRoiY3(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 200000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 1 Budget (USD)</label>
                    <input 
                      type="text"
                      value={bY1}
                      onChange={(e) => setBY1(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 80000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 2 Budget (USD)</label>
                    <input 
                      type="text"
                      value={bY2}
                      onChange={(e) => setBY2(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 20000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-bold uppercase">Year 3 Budget (USD)</label>
                    <input 
                      type="text"
                      value={bY3}
                      onChange={(e) => setBY3(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 10000"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-[#0a0a0a] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Business Case Rationale */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Business Case Levers & Rationale</label>
                <textarea
                  rows={3}
                  value={businessCaseRationale}
                  onChange={(e) => setBusinessCaseRationale(e.target.value)}
                  placeholder="Provide the business case levers and how return / investments were calculated for Year 1, 2, and 3..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold block">Upload Business Case Document (.xlsx, .docx, .pptx)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file"
                    id="intakeBusinessCaseFileLoader"
                    accept=".xlsx,.xls,.docx,.doc,.pptx,.ppt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBusinessCaseFile(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('intakeBusinessCaseFileLoader')?.click()}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-755 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    📎 Choose Document
                  </button>
                  {businessCaseFile ? (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1.5 rounded-lg font-bold truncate max-w-[320px]">
                      Attached: {businessCaseFile}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-450 italic">No document selected</span>
                  )}
                </div>
              </div>

              {/* Project Dependencies */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 font-semibold">Project Dependencies</label>
                <textarea
                  rows={2}
                  value={dependencies}
                  onChange={(e) => setDependencies(e.target.value)}
                  placeholder="Specify data availability, compliance requirements, or external system alignment dependencies..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-[#0a0a0a] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2 gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isScoring || !title || !problem || selectedTAs.length === 0}
                  className="h-11 px-6 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isSavingDraft ? <Loader2 size={14} className="animate-spin text-pink-500" /> : <Upload size={14} />}
                  <span>{isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isScoring || isSavingDraft || !title || !problem || selectedTAs.length === 0}
                  className="h-11 px-6 rounded-xl bg-[#0a0a0a] hover:bg-[#1f1f1f] disabled:bg-slate-200 disabled:text-slate-455 text-white font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {isScoring ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                  <span>Analyze & Score Readiness</span>
                </button>
              </div>
            </div>

            {/* Guide Sidebar */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/30 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={14} className="text-[#ff4d8b]" />
                <span>Active Scorecard Weights</span>
              </h4>
              <p className="text-xs text-slate-655 leading-relaxed">
                When submitted, the platform runs your proposal parameters against the steering vectors to predict scoring grades across 6 dimensions:
              </p>
              <ul className="text-xs text-slate-700 space-y-2.5 pt-2">
                <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Budget Availability</span>
                  <span className="font-bold text-slate-900">{(activeWeights[0] * 100).toFixed(0)}% weight</span>
                </li>
                <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Data Availability</span>
                  <span className="font-bold text-slate-900">{(activeWeights[1] * 100).toFixed(0)}% weight</span>
                </li>
                <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Stakeholder Readiness</span>
                  <span className="font-bold text-slate-900">{(activeWeights[2] * 100).toFixed(0)}% weight</span>
                </li>
                <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Impact of Not Doing</span>
                  <span className="font-bold text-slate-900">{(activeWeights[3] * 100).toFixed(0)}% weight</span>
                </li>
                <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span>Financial Business Case</span>
                  <span className="font-bold text-slate-900">{(activeWeights[4] * 100).toFixed(0)}% weight</span>
                </li>
                <li className="flex items-center justify-between pb-1.5">
                  <span>Budget Required</span>
                  <span className="font-bold text-slate-900">{(activeWeights[5] * 100).toFixed(0)}% weight</span>
                </li>
              </ul>
            </div>
          </form>
        ) : (
          /* Evaluation & Override Panel */
          <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* Detailed Score breakdown */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Automated Scorecard Breakdown</h3>

                <div className="space-y-4">
                  {/* Budget Availability */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Budget Availability Score (BA)</span>
                      <span className="font-bold text-sky-600">{budgetAvailabilityScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all duration-500" style={{width: `${budgetAvailabilityScore}%`}}></div>
                    </div>
                  </div>

                  {/* Data Availability */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Data Availability Score (DA)</span>
                      <span className="font-bold text-indigo-600">{dataAvailabilityScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${dataAvailabilityScore}%`}}></div>
                    </div>
                  </div>

                  {/* Stakeholder Readiness */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Stakeholder Readiness Score (SR)</span>
                      <span className="font-bold text-purple-655">{stakeholderReadinessScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${stakeholderReadinessScore}%`}}></div>
                    </div>
                  </div>

                  {/* Impact of Not Doing */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Impact of Not Doing Score (IN)</span>
                      <span className="font-bold text-pink-650">{impactOfNotDoingScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 transition-all duration-500" style={{width: `${impactOfNotDoingScore}%`}}></div>
                    </div>
                  </div>

                  {/* Financial Business Case */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Financial Business Case Score (FC)</span>
                      <span className="font-bold text-teal-700">{financialBusinessCaseScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 transition-all duration-500" style={{width: `${financialBusinessCaseScore}%`}}></div>
                    </div>
                  </div>

                  {/* Budget Required */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Budget Required Score (BR)</span>
                      <span className="font-bold text-amber-700">{budgetRequiredScore.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{width: `${budgetRequiredScore}%`}}></div>
                    </div>
                  </div>
                </div>

                {/* LLM Justification text */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-550 uppercase tracking-wider">LLM Grading Justification</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                    {justification}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-xs font-medium text-slate-655 hover:text-slate-900 border border-slate-250 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RotateCcw size={12} />
                    <span>Back to Edit</span>
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#0a0a0a] hover:bg-[#1f1f1f] disabled:bg-slate-200 disabled:text-slate-455 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    <span>Approve & Submit to Backlog</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Core Dial & Overrides Sidebar */}
            <div className="space-y-6">
              {/* calculated dial */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/40 text-center space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Calculated Readiness Score</h4>
                <div className="relative inline-flex items-center justify-center p-6 border-4 border-slate-200 border-t-pink-500 rounded-full w-32 h-32 mx-auto bg-white shadow-sm">
                  <span className="text-3xl font-extrabold text-slate-900">{currentReadinessScore.toFixed(0)}</span>
                  <span className="text-xs text-slate-450 absolute bottom-3">/ 100</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Weighted Steering Average</div>
              </div>

              {/* CMO steering override panel */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-pink-500" />
                  <span>Steering Override Panel</span>
                </h4>
                
                {currentPersona.role === 'ADMIN' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-550 leading-relaxed bg-[#fffaf0] p-3 rounded-lg border border-slate-200">
                      You are logged in as <span className="font-semibold text-pink-500">Dr. Angela Vance</span> (Council Lead). You can adjust specific evaluation scores manually before saving.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Budget Availability:</span>
                          <span className="font-bold text-slate-950">{budgetAvailabilityScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={budgetAvailabilityScore}
                          onChange={(e) => setBudgetAvailabilityScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Data Availability:</span>
                          <span className="font-bold text-slate-950">{dataAvailabilityScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={dataAvailabilityScore}
                          onChange={(e) => setDataAvailabilityScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Stakeholder Readiness:</span>
                          <span className="font-bold text-slate-950">{stakeholderReadinessScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={stakeholderReadinessScore}
                          onChange={(e) => setStakeholderReadinessScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Impact of Not Doing:</span>
                          <span className="font-bold text-slate-950">{impactOfNotDoingScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={impactOfNotDoingScore}
                          onChange={(e) => setImpactOfNotDoingScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Financial Business Case:</span>
                          <span className="font-bold text-slate-950">{financialBusinessCaseScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={financialBusinessCaseScore}
                          onChange={(e) => setFinancialBusinessCaseScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-655 font-medium">Budget Required:</span>
                          <span className="font-bold text-slate-950">{budgetRequiredScore}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={budgetRequiredScore}
                          onChange={(e) => setBudgetRequiredScore(Number(e.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-3 text-xs leading-relaxed text-amber-800">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>Administrative score override is locked. Switch to the Admin persona to unlock controls.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {intakeMethod === 'transcript' && (
        <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
          {/* Main Ingestion Form / Checklist Preview */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-6 shadow-sm">
            {parsedIdeas.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={16} className="text-pink-500 animate-pulse" />
                    <span>Select Harvested Ideas to Ingest</span>
                  </h3>
                  <p className="text-xs text-slate-555 leading-relaxed mt-1">
                    We identified {parsedIdeas.length} distinct AI concepts from your notes. Review and select the ones you want to save as <strong>Drafts</strong> in your workspace.
                  </p>
                </div>

                {/* Quick actions: Select all / Deselect all */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedIdeaIndexes(parsedIdeas.map((_: any, i: number) => i))}
                      className="text-slate-900 font-bold hover:underline cursor-pointer"
                    >
                      ✓ Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIdeaIndexes([])}
                      className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      ✗ Clear Selection
                    </button>
                  </div>
                  <span className="text-slate-500 font-medium">
                    {selectedIdeaIndexes.length} of {parsedIdeas.length} selected
                  </span>
                </div>

                {/* Ideas Checklist Cards */}
                <div className="space-y-4">
                  {parsedIdeas.map((idea, index) => {
                    const isSelected = selectedIdeaIndexes.includes(index);
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIdeaIndexes(prev => prev.filter(i => i !== index));
                          } else {
                            setSelectedIdeaIndexes(prev => [...prev, index]);
                          }
                        }}
                        className={`group relative p-5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-md'
                            : 'bg-white/60 border-slate-200 hover:border-slate-400 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedIdeaIndexes(prev => prev.filter(i => i !== index));
                                } else {
                                  setSelectedIdeaIndexes(prev => [...prev, index]);
                                }
                              }}
                              className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {idea.title}
                              </h4>
                              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800" title={(idea.functionalDomains || []).join(', ')}>
                                {(idea.functionalDomains || []).join(', ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {idea.problemStatement}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {idea.therapeuticAreas.map(ta => (
                                <span key={ta} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-[#fffbf0] border border-slate-200 text-slate-700">
                                  🧬 {ta}
                                </span>
                              ))}
                              {idea.integrations.map(integ => (
                                <span key={integ} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-50 border border-slate-200 text-slate-600">
                                  🔌 {integ}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <div>
                                <span className="font-semibold text-slate-700">Est. Return:</span>{' '}
                                <span className="font-bold text-slate-900">${idea.financialRoi.toLocaleString()}/yr</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Setup Budget:</span>{' '}
                                <span className="font-bold text-slate-900">${idea.budgetRequiredVal.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedIdeas([]);
                      setSelectedIdeaIndexes([]);
                    }}
                    className="flex-1 h-11 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Start Over</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitSelected}
                    disabled={isCommitting || selectedIdeaIndexes.length === 0}
                    className="flex-[2] h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-450 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isCommitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} className="text-pink-400" />
                    )}
                    <span>Ingest Selected as Drafts</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={16} className="text-pink-500 animate-pulse" />
                    <span>AI Notes Idea Ingestion</span>
                  </h3>
                  <p className="text-xs text-slate-555 leading-relaxed mt-1">
                    Upload action summaries, workshop transcripts, or raw notes. The underlying local LLM analyzes text, separates details, and triages novel AI concepts directly into the Backlog.
                  </p>
                </div>

                {/* File drag area */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-pink-500 bg-pink-500/5' 
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf"
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="space-y-3 text-slate-500 text-xs">
                      <Loader2 size={28} className="mx-auto text-pink-500 animate-spin" />
                      <span className="font-bold">Decomposing transcript and extracting initiatives...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <Upload size={32} className="mx-auto text-slate-405" />
                      <span className="block text-slate-700 font-bold">Drag & Drop File Here</span>
                      <span className="block text-slate-400 text-[10px]">Supports .txt, .md, .pdf</span>
                    </div>
                  )}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-250"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-[9px] uppercase font-bold tracking-wider">or paste transcript</span>
                  <div className="flex-grow border-t border-slate-250"></div>
                </div>

                {/* Paste notes area */}
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    placeholder="e.g., Workshop discussion: Angela proposes using custom gemma models to optimize oncology campaigns by mining digital marketing metrics..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-750 placeholder-slate-450 focus:outline-none focus:border-slate-450 leading-relaxed"
                  />
                  
                  <button
                    type="button"
                    onClick={handleTextIngest}
                    disabled={isUploading || !ingestText.trim()}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-455 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-pink-400" />}
                    <span>Harvest Ideas</span>
                  </button>
                </div>

                {/* Ingest Result Alerts */}
                {ingestStatus.type && (
                  <div className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                    ingestStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-250 shadow-inner' 
                      : 'bg-rose-50 text-rose-800 border-rose-250 shadow-inner'
                  }`}>
                    {ingestStatus.type === 'success' ? (
                      <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <span>{ingestStatus.message}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Guide Sidebar */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/30 space-y-4">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} className="text-[#ff4d8b]" />
              <span>Transcripts AI Harvesting Guide</span>
            </h4>
            <p className="text-xs text-slate-655 leading-relaxed">
              Our offline LLM parsing engine uses a customized commercial harvesting model to:
            </p>
            <ul className="text-xs text-slate-700 space-y-3 pt-2">
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">1.</span>
                <span>Extract project naming, domains, and Therapeutic Area alignments.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">2.</span>
                <span>Determine problem statements, data dependencies, and system integration points discussed in notes.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">3.</span>
                <span>Automatically estimate ROI, implementation costs, and draft a backlog record for steering committee review.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {intakeMethod === 'assisted' && (
        <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
          {/* Assist Card */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-6 text-[#0a0a0a] shadow-sm">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Brain size={16} className="text-pink-500 animate-spin-slow" />
                <span>AI Co-Pilot Assisted Ideation</span>
              </h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Work side-by-side with our multi-agent steering engine. Describe your idea loosely, and the Checker, Brainstormer, Critic, Validator, and Business Case Creator sub-agents will coordinate to check duplicates, validate feasibility, audit brand compliance, and curate your submission draft dynamically.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Multi-Agent Steering Engine Personas:</h4>
              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                <div className="flex gap-2">
                  <span className="text-base shrink-0">🔍</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Checker (Scanner)</span>
                    Checks semantic duplicates across the portfolio.
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Brainstormer (Commercial)</span>
                    Recommends downstream commercial extensions.
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-base shrink-0">🛠️</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Validator (Feasibility)</span>
                    Audits data integrations & technical feasibility.
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-base shrink-0">⚖️</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Critic (Risk & Compliance)</span>
                    Vets brand compliance and execution risks.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start pt-2">
              <button
                type="button"
                onClick={() => {
                  const btn = document.getElementById('global-floating-chat-button');
                  if (btn) btn.click();
                }}
                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles size={14} className="text-pink-400" />
                <span>Launch AI Co-Pilot Workspace</span>
              </button>
            </div>
          </div>

          {/* Guide Sidebar */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/30 space-y-4">
            <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} className="text-[#ff4d8b]" />
              <span>Assisted Workflow Tips</span>
            </h4>
            <p className="text-xs text-slate-655 leading-relaxed">
              When launching the workspace panel, you can use:
            </p>
            <ul className="text-xs text-slate-700 space-y-3 pt-2">
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">&bull;</span>
                <span><strong>I'm Feeling Lucky:</strong> To automatically build a full draft proposal using single-phrase concepts.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold shrink-0">&bull;</span>
                <span><strong>Work With Me:</strong> To build the details step-by-step through guided interview questions.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
