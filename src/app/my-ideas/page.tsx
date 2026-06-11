'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Eye, 
  ClipboardList, 
  Activity, 
  DollarSign, 
  Calendar,
  Sparkles,
  Undo
} from 'lucide-react';
import Link from 'next/link';
import ProjectDetailModal, { Project, getPhaseBadgeColor } from '@/components/ProjectDetailModal';

export default function MyIdeasPage() {
  const { currentPersona } = usePersona();
  const [drafts, setDrafts] = useState<Project[]>([]);
  const [submitted, setSubmitted] = useState<Project[]>([]);
  const [archived, setArchived] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'drafts' | 'submitted' | 'archived'>('drafts');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, [currentPersona]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const nameParam = encodeURIComponent(currentPersona.name);
      // Fetch all projects submitted by this user
      const res = await fetch(`/api/projects?submittedBy=${nameParam}`);
      const allData = await res.json();
      if (Array.isArray(allData)) {
        // Group projects in memory
        const draftsList = allData.filter(p => p.phase === 'Draft' || p.phase === 'Sent Back');
        const submittedList = allData.filter(p => p.phase !== 'Draft' && p.phase !== 'Sent Back' && p.phase !== 'Archived');
        const archivedList = allData.filter(p => p.phase === 'Archived');

        setDrafts(draftsList);
        setSubmitted(submittedList);
        setArchived(archivedList);
      }
    } catch (err) {
      console.error('Failed to fetch user ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete draft');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting draft');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecall = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to recall this submitted idea? It will be moved back to your drafts, and any feedback comments will be reset.')) {
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          phase: 'Draft',
          feedback: '', // clear feedback on recall
        }),
      });
      if (res.ok) {
        fetchIdeas();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to recall project');
      }
    } catch (err) {
      console.error(err);
      alert('Error recalling project');
    }
  };

  const getAgingText = (submittedAtStr?: string) => {
    if (!submittedAtStr) return '';
    const submittedAt = new Date(submittedAtStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submittedAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Submitted today';
    if (diffDays === 1) return 'Submitted yesterday';
    return `Submitted ${diffDays} days ago`;
  };

  const sentBackIdeas = drafts.filter(d => d.phase === 'Sent Back');

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">My Ideas & Workspace</h1>
          <p className="text-slate-550 text-sm mt-1">
            Manage your draft proposals, refine their scoring vectors, and track the steering committee lifecycle status.
          </p>
        </div>
        
        <Link 
          href="/intake"
          className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
        >
          <PlusCircle size={15} />
          <span>New AI Initiative</span>
        </Link>
      </div>

      {/* Action Required / Sent Back Notifications Banner */}
      {sentBackIdeas.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2.5 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Action Required: {sentBackIdeas.length} {sentBackIdeas.length === 1 ? 'idea has' : 'ideas have'} been sent back for revisions</span>
          </div>
          <div className="space-y-2 pl-4">
            {sentBackIdeas.map(idea => (
              <div key={idea.id} className="text-xs text-rose-900 flex justify-between items-start gap-4">
                <div>
                  <span className="font-bold underline">{idea.title}</span>: {idea.feedback || 'Steering committee requested feedback.'}
                </div>
                <Link
                  href={`/intake?draft=${idea.id}`}
                  className="text-[10px] font-extrabold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition-colors shrink-0"
                >
                  Edit & Resubmit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/40 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-750">
            <Edit3 size={18} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Drafts & Revisions</div>
            <div className="text-2xl font-extrabold text-slate-800">{drafts.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/40 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-700">
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitted Ideas</div>
            <div className="text-2xl font-extrabold text-slate-800">{submitted.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/40 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Readiness</div>
            <div className="text-2xl font-extrabold text-slate-800">
              {submitted.length > 0 
                ? `${(submitted.reduce((acc, p) => acc + p.readinessScore, 0) / submitted.length).toFixed(0)}%`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'drafts' ? 'text-pink-650 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>My Drafts & Revisions ({drafts.length})</span>
          {activeTab === 'drafts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-slideIn" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'submitted' ? 'text-pink-650 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Submitted & In-Review ({submitted.length})</span>
          {activeTab === 'submitted' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-slideIn" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'archived' ? 'text-pink-650 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Archived ({archived.length})</span>
          {activeTab === 'archived' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-slideIn" />
          )}
        </button>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 border-t-pink-500 rounded-full mb-2" />
          <div>Retrieving workspace...</div>
        </div>
      ) : activeTab === 'drafts' ? (
        drafts.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-3">
            <p className="text-sm text-slate-450 italic">You have no active drafts.</p>
            <Link 
              href="/intake"
              className="inline-flex items-center gap-1 text-xs text-pink-655 hover:text-pink-700 font-bold"
            >
              <PlusCircle size={14} /> Start writing a draft
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {drafts.map(d => {
              const isSentBack = d.phase === 'Sent Back';
              return (
                <div 
                  key={d.id}
                  className={`p-5 rounded-2xl border bg-white hover:border-slate-350 shadow-sm flex flex-col justify-between gap-4 transition-all ${
                    isSentBack ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-pink-650 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                        {(d.therapeuticAreas || []).join(', ')}
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getPhaseBadgeColor(d.phase)}`}>
                        {d.phase}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{d.title}</h3>
                    <p className="text-xs text-slate-655 line-clamp-3 leading-relaxed">{d.problemStatement}</p>
                    
                    {isSentBack && d.feedback && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-900 text-xs">
                        <div className="font-bold mb-0.5">Steering Committee Feedback:</div>
                        <p className="font-semibold">{d.feedback}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1.5 border-t border-slate-100">
                      <Calendar size={11} />
                      <span>Saved on {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs font-bold text-slate-700">
                      Est. Budget: <span className="text-slate-800">${d.budgetRequiredVal ? d.budgetRequiredVal.toLocaleString() : 'TBD'}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(d.id)}
                        disabled={deletingId === d.id}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Draft"
                      >
                        <Trash2 size={15} />
                      </button>
                      
                      <Link
                        href={`/intake?draft=${d.id}`}
                        className="px-3.5 py-1.5 bg-[#f5f0e0] hover:bg-[#ebe5d3] border border-slate-250 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit3 size={13} />
                        <span>{isSentBack ? 'Revise & Resubmit' : 'Edit Draft'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'submitted' ? (
        submitted.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <p className="text-sm text-slate-450 italic">You haven't submitted any ideas yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {submitted.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelectedProject(s)}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-350 shadow-sm flex flex-col justify-between gap-4 transition-all cursor-pointer group animate-fadeIn"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-pink-650 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                        {(s.therapeuticAreas || []).join(', ')}
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getPhaseBadgeColor(s.phase)}`}>
                        {s.phase}
                      </span>
                    </div>
                    {s.submittedAt && (
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {getAgingText(s.submittedAt)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-pink-655 transition-colors">{s.title}</h3>
                  <p className="text-xs text-slate-655 line-clamp-3 leading-relaxed">{s.problemStatement}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-xs font-bold text-slate-700">
                      <DollarSign size={13} className="text-emerald-600" />
                      <span>${(s.financialRoi / 1000).toFixed(0)}k ROI</span>
                    </div>
                    <span className="text-slate-300 text-xs">|</span>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider" title={(s.functionalDomains || []).join(', ')}>
                      {(s.functionalDomains || []).join(' • ') || s.functionalDomain}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.phase === 'Backlog' && (
                      <button
                        type="button"
                        onClick={(e) => handleRecall(e, s)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[9px] rounded flex items-center gap-0.5 transition-colors cursor-pointer mr-1.5"
                        title="Recall to Drafts"
                      >
                        <Undo size={10} />
                        <span>Recall</span>
                      </button>
                    )}
                    <span className="bg-pink-50 border border-pink-100 text-pink-655 px-2 py-0.5 rounded font-extrabold text-[9px]">
                      Score: {s.ideaScore !== undefined ? s.ideaScore.toFixed(0) : 70}
                    </span>
                    <span className="text-slate-400 group-hover:text-pink-600 transition-colors">
                      <Eye size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        archived.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <p className="text-sm text-slate-450 italic">You have no archived ideas.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {archived.map(a => (
              <div 
                key={a.id}
                onClick={() => setSelectedProject(a)}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-350 shadow-sm flex flex-col justify-between gap-4 transition-all cursor-pointer group opacity-75 hover:opacity-100"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-pink-650 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                      {(a.therapeuticAreas || []).join(', ')}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getPhaseBadgeColor(a.phase)}`}>
                      {a.phase}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-pink-655 transition-colors">{a.title}</h3>
                  <p className="text-xs text-slate-655 line-clamp-3 leading-relaxed">{a.problemStatement}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-xs font-bold text-slate-700">
                      <DollarSign size={13} className="text-emerald-600" />
                      <span>${(a.financialRoi / 1000).toFixed(0)}k ROI</span>
                    </div>
                    <span className="text-slate-300 text-xs">|</span>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider" title={(a.functionalDomains || []).join(', ')}>
                      {(a.functionalDomains || []).join(' • ') || a.functionalDomain}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-pink-50 border border-pink-100 text-pink-655 px-2 py-0.5 rounded font-extrabold text-[9px]">
                      Score: {a.ideaScore !== undefined ? a.ideaScore.toFixed(0) : 70}
                    </span>
                    <span className="text-slate-400 group-hover:text-pink-600 transition-colors">
                      <Eye size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Project Detail Modal */}
      <ProjectDetailModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onRefresh={fetchIdeas}
      />
    </div>
  );
}
