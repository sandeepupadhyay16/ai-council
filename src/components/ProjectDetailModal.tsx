'use client';

import React from 'react';
import { X, Check, ExternalLink, User, Sparkles } from 'lucide-react';
import { usePersona } from '@/components/ClientWrapper';

export interface Project {
  id: string;
  title: string;
  problemStatement: string;
  integrations: string[];
  budgetStatus: string;
  stakeholderStatus: string;
  opportunityCost: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  execSponsor: string;
  productOwner: string;
  deploymentGateway: string;
  phase: string;
  therapeuticAreas: string[];
  budgetAvailabilityScore: number;
  dataAvailabilityScore: number;
  stakeholderReadinessScore: number;
  impactOfNotDoingScore: number;
  financialBusinessCaseScore: number;
  budgetRequiredScore: number;
  readinessScore: number;
  functionalDomains: string[];
  functionalDomain?: string;
  submittedBy?: string;
  ideaScore?: number;
  checkerInsight?: string;
  brainstormerInsight?: string;
  validatorInsight?: string;
  businessCaseInsight?: string;
  criticInsight?: string;
  financialRoiY1?: number;
  financialRoiY2?: number;
  financialRoiY3?: number;
  budgetRequiredY1?: number;
  budgetRequiredY2?: number;
  budgetRequiredY3?: number;
  businessCaseRationale?: string;
  dependencies?: string;
  businessCaseFile?: string;
  createdAt?: string;
  submittedAt?: string;
  feedback?: string;
}

export function parseMarkdownText(text: string, isUser = false) {
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

export const getPhaseBadgeColor = (phase: string) => {
  switch (phase) {
    case 'Scheduled': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'Ready': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Working': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Draft': return 'bg-violet-50 text-violet-850 border-violet-200';
    case 'Sent Back': return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'Archived': return 'bg-slate-100 text-slate-600 border-slate-300';
    default: return 'bg-slate-50 text-slate-700 border-slate-200'; // Backlog
  }
};

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ProjectDetailModal({ project, onClose, onRefresh }: ProjectDetailModalProps) {
  const { currentPersona } = usePersona();
  const [showSendBackForm, setShowSendBackForm] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!project) return null;

  const handleUpdatePhase = async (newPhase: string, customFeedback?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          phase: newPhase,
          feedback: customFeedback !== undefined ? customFeedback : (project.feedback || ''),
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to update project phase');
      }
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating phase: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#fffaf0] border border-slate-200 p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto text-[#0a0a0a]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="space-y-2 pb-4 border-b border-slate-250">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-bold tracking-wider text-pink-650 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
              {(project.therapeuticAreas || []).join(', ')}
            </span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getPhaseBadgeColor(project.phase)}`}>
              {project.phase}
            </span>
            {project.submittedAt && (
              <span className="text-[9px] text-slate-500 font-semibold ml-auto">
                Submitted on {new Date(project.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-[#0a0a0a]">{project.title}</h2>
          <p className="text-xs text-slate-555 font-semibold">{(project.functionalDomains || []).join(' • ') || project.functionalDomain}</p>
        </div>

        {/* Content Dossier */}
        <div className="space-y-6 py-6">
          {/* Steering Committee Feedback if present */}
          {project.feedback && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 shadow-sm">
              <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠️ Steering Committee Feedback</span>
              </div>
              <p className="text-xs text-rose-900 font-semibold leading-relaxed">
                {project.feedback}
              </p>
            </div>
          )}

          {/* Problem & Solution */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Problem Statement</h4>
              <p className="text-xs text-slate-655 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                {project.problemStatement}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Integrations</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                {project.integrations && project.integrations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {project.integrations.map((integ) => (
                      <span key={integ} className="text-[10px] bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                        <Check size={10} className="text-emerald-600" />
                        {integ}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-450 italic">No integrations specified.</span>
                )}
              </div>
            </div>
          </div>

          {/* Opportunity Cost & Budget details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Impact of Not Doing (Opportunity Cost)</h4>
              <p className="text-xs text-slate-655 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 h-[185px] overflow-y-auto">
                {project.opportunityCost || 'Status quo bottleneck remains unmitigated.'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Financial & Cost Impact (3-Year Model)</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-1.5 font-bold text-[9px] text-slate-500 text-center">
                  <div>Year</div>
                  <div>Returns</div>
                  <div>Budget</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="font-semibold text-slate-550">Year 1</div>
                  <div className="font-bold text-emerald-700">${(project.financialRoiY1 ?? project.financialRoi ?? 0).toLocaleString()}</div>
                  <div className="font-bold text-slate-700">${(project.budgetRequiredY1 ?? project.budgetRequiredVal ?? 0).toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="font-semibold text-slate-550">Year 2</div>
                  <div className="font-bold text-emerald-700">${(project.financialRoiY2 ?? project.financialRoi ?? 0).toLocaleString()}</div>
                  <div className="font-bold text-slate-700">${(project.budgetRequiredY2 ?? 0).toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="font-semibold text-slate-550">Year 3</div>
                  <div className="font-bold text-emerald-700">${(project.financialRoiY3 ?? project.financialRoi ?? 0).toLocaleString()}</div>
                  <div className="font-bold text-slate-700">${(project.budgetRequiredY3 ?? 0).toLocaleString()}</div>
                </div>
                
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center font-bold text-[11px] mt-1">
                  <span className="text-slate-600">Total Investment:</span>
                  <span className="text-slate-800">${project.budgetRequiredVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-[11px]">
                  <span className="text-slate-600">Budget Status:</span>
                  <span className="text-slate-700">{project.budgetStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Case Rationale, Uploaded file & Dependencies */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Case Levers & Rationale</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 min-h-[120px] max-h-[220px] overflow-y-auto">
                <p className="text-xs text-slate-655 leading-relaxed">
                  {project.businessCaseRationale || project.businessCase || 'No custom business case rationale provided.'}
                </p>
                {project.businessCaseFile && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm mt-2">
                    <span>📎 Attached Document:</span>
                    <span className="truncate max-w-[150px]" title={project.businessCaseFile}>{project.businessCaseFile}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Dependencies</h4>
              <p className="text-xs text-slate-655 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 min-h-[120px] max-h-[220px] overflow-y-auto">
                {project.dependencies || 'No critical dependencies or resource alignment limits specified.'}
              </p>
            </div>
          </div>

          {/* 6 Scorecard Vectors */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scorecard Readiness Overview</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-700 font-semibold">Total Readiness Score:</span>
                <span className="font-bold text-pink-600 text-sm">{project.readinessScore.toFixed(1)} / 100</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-sky-500" style={{width: `${project.budgetAvailabilityScore || 0}%`}}></div>
                  </div>
                  BUDGET AVAIL ({project.budgetAvailabilityScore?.toFixed(0)}%)
                </div>
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-indigo-500" style={{width: `${project.dataAvailabilityScore || 0}%`}}></div>
                  </div>
                  DATA AVAIL ({project.dataAvailabilityScore?.toFixed(0)}%)
                </div>
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-purple-500" style={{width: `${project.stakeholderReadinessScore || 0}%`}}></div>
                  </div>
                  STK READINESS ({project.stakeholderReadinessScore?.toFixed(0)}%)
                </div>
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-pink-500" style={{width: `${project.impactOfNotDoingScore || 0}%`}}></div>
                  </div>
                  OPP COST ({project.impactOfNotDoingScore?.toFixed(0)}%)
                </div>
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-teal-500" style={{width: `${project.financialBusinessCaseScore || 0}%`}}></div>
                  </div>
                  FIN CASE ({project.financialBusinessCaseScore?.toFixed(0)}%)
                </div>
                <div className="text-[8px] text-center text-slate-550 font-bold">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-amber-500" style={{width: `${project.budgetRequiredScore || 0}%`}}></div>
                  </div>
                  COST REASON ({project.budgetRequiredScore?.toFixed(0)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Specialist Agent Vetting Archive */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-pink-500 animate-spin-slow" />
              <span>Specialist Agent Vetting Archive</span>
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-inner">
              {/* Checker */}
              <div className="p-4 space-y-1.5">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔍 Checker (Duplicate Scanner)</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {project.checkerInsight ? parseMarkdownText(project.checkerInsight) : <span className="italic text-slate-400">No scanner insights recorded.</span>}
                </div>
              </div>

              {/* Brainstormer */}
              <div className="p-4 space-y-1.5">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💡 Brainstormer (Commercial Partner)</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {project.brainstormerInsight ? parseMarkdownText(project.brainstormerInsight) : <span className="italic text-slate-400">No brainstorming co-design logs recorded.</span>}
                </div>
              </div>

              {/* Validator */}
              <div className="p-4 space-y-1.5">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛠️ Validator (Feasibility Assessment)</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {project.validatorInsight ? parseMarkdownText(project.validatorInsight) : <span className="italic text-slate-400">No validator technical specs recorded.</span>}
                </div>
              </div>

              {/* Business Case */}
              <div className="p-4 space-y-1.5">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💰 Business Case Creator (Hard & Soft Benefits)</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {project.businessCaseInsight ? parseMarkdownText(project.businessCaseInsight) : <span className="italic text-slate-400">No financial model details recorded.</span>}
                </div>
              </div>

              {/* Critic */}
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚖️ Critic (Risk & Compliance Review)</span>
                </div>
                <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-900 text-xs leading-relaxed font-semibold">
                  {project.criticInsight ? parseMarkdownText(project.criticInsight) : <span className="italic text-rose-450">No critical brand risk vetting recorded.</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-3">
              <User size={14} className="text-slate-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Executive Sponsor</div>
                <div className="text-xs font-semibold text-slate-700">{project.execSponsor}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User size={14} className="text-slate-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Commercial Product Owner</div>
                <div className="text-xs font-semibold text-slate-700">{project.productOwner}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Send Back Form Section */}
        {showSendBackForm && (
          <div className="mb-4 p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 animate-fadeIn">
            <label className="block text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
              Steering Committee Feedback for Owner
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Please refine Year 2 returns and details about system integrations."
              className="w-full h-20 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none text-[#0a0a0a] font-semibold"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSendBackForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !feedbackText.trim()}
                onClick={() => handleUpdatePhase('Sent Back', feedbackText)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Send Back
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-250">
          <div className="flex gap-2">
            {currentPersona?.role === 'CMO_LEADER' && project.phase === 'Backlog' && !showSendBackForm && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdatePhase('Archived')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-350 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Archive Use Case
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowSendBackForm(true)}
                  className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Send Back
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            
            {project.deploymentGateway && (
              <button 
                type="button"
                disabled
                className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1 shadow-sm"
                title="Launch Tool inactive (not pointing to a real app)"
              >
                <span>Launch Tool</span>
                <ExternalLink size={12} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
