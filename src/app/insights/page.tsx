'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Brain, 
  FileText, 
  Users, 
  Award,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import ProjectDetailModal, { Project, parseMarkdownText } from '@/components/ProjectDetailModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    projects: any[];
    experts: any[];
  };
}


export default function InsightsPage() {
  const { currentPersona, weights, saveWeights } = usePersona();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSourceProjectClick = (projId: string) => {
    const found = projects.find(p => p.id === projId);
    if (found) {
      setSelectedProject(found);
    } else {
      fetch('/api/projects')
        .then(res => res.json())
        .then(allProjs => {
          if (Array.isArray(allProjs)) {
            const f = allProjs.find(p => p.id === projId);
            if (f) setSelectedProject(f);
          }
        });
    }
  };

  // Weights Local State (6 weights)
  const [localWeights, setLocalWeights] = useState<number[]>([0.16, 0.16, 0.17, 0.17, 0.17, 0.17]);
  const [isSavingWeights, setIsSavingWeights] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your AI Council Board Assistant.\n\nI have semantic access to the Pfizer AI Commercial Portfolio vector store. Ask me complex questions, such as:\n\n* *'Who is the available Machine Learning expert that can help with Oncology NLP projects?'*\n* *'What are the active Vaccine projects and their data readiness scores?'*"
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchProjects = () => {
    setLoading(true);
    fetch('/api/projects?excludePhase=Draft,Sent%20Back,Archived')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
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

  useEffect(() => {
    fetchProjects();
  }, []);

  // Sync local weights state when they load from server
  useEffect(() => {
    if (weights && weights.length === 6) {
      setLocalWeights(weights);
    }
  }, [weights]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rank-ordered by projected impact (financial ROI * readinessScore)
  const prioritizedProjects = [...projects].sort((a, b) => {
    const impactA = a.financialRoi * (a.readinessScore / 100);
    const impactB = b.financialRoi * (b.readinessScore / 100);
    return impactB - impactA;
  });

  // Calculate stats for charts based on Therapeutic Areas (handling cross-TA array)
  const domainData = projects.reduce((acc: any[], p) => {
    const tas = p.therapeuticAreas && p.therapeuticAreas.length > 0 ? p.therapeuticAreas : ["Unassigned"];
    tas.forEach((ta) => {
      const existing = acc.find(item => item.name === ta);
      if (existing) {
        existing.roi += p.financialRoi / 1000; // in thousands
        existing.count += 1;
      } else {
        acc.push({ name: ta, roi: p.financialRoi / 1000, count: 1 });
      }
    });
    return acc;
  }, []);

  const COLORS = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a'];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: chatInput
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSending(true);

    try {
      const currentHistory = [...messages, userMsg];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          history: currentHistory.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();

      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Q&A Chat failed');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: `Error connecting to local LLM: ${err.message || 'Check connection to LM Studio.'}`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle weight updates locally
  const handleWeightChange = (index: number, val: number) => {
    const next = [...localWeights];
    next[index] = Number((val / 100).toFixed(2));
    setLocalWeights(next);
    setSaveMessage(null);
  };

  // Calculate live sum
  const sumWeights = localWeights.reduce((a, b) => a + b, 0);
  const isSumValid = Math.abs(sumWeights - 1.0) < 0.02;

  const handleSaveWeights = async () => {
    if (!isSumValid) return;
    setIsSavingWeights(true);
    setSaveMessage(null);
    try {
      const success = await saveWeights(localWeights);
      if (success) {
        setSaveMessage('Steering weights successfully saved and propagated to database.');
        // Refresh project scores in local state
        fetchProjects();
      } else {
        setSaveMessage('Failed to save configuration weights.');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage('Error writing weights to server.');
    } finally {
      setIsSavingWeights(false);
    }
  };

  if (currentPersona.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-lg max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mx-auto shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The <span className="font-semibold text-slate-700">Portfolio Insights & Q&A</span> dashboard is restricted to Admin users. Switch to an Admin role to access this page.
          </p>
          <a href="/" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Portfolio Insights & Q&A</h1>
        <p className="text-slate-550 text-sm mt-1">Review prioritization matrices, manage dynamic scorecard weights, and query the vector store.</p>
      </div>

      {/* CMO Leader Steering Panel for Weights */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-[#ff4d8b]" />
              <span>Steering Committee Scorecard Weights Configuration</span>
            </h3>
            <p className="text-xs text-slate-655">Adjust weight allocations for project evaluation. The total allocation MUST sum to exactly 100%.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
              isSumValid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {isSumValid ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>Total: {(sumWeights * 100).toFixed(0)}%</span>
            </span>

            <button
              onClick={handleSaveWeights}
              disabled={isSavingWeights || !isSumValid}
              className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              {isSavingWeights ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>Save Weights</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`p-3 text-xs rounded-xl border ${
            saveMessage.includes('propagated') 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
              : 'bg-rose-50 text-rose-800 border-rose-250'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2">
          {/* Sliders */}
          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Budget Availability</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[0] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[0] * 100}
              onChange={(e) => handleWeightChange(0, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Data Availability</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[1] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[1] * 100}
              onChange={(e) => handleWeightChange(1, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Stakeholder Readiness</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[2] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[2] * 100}
              onChange={(e) => handleWeightChange(2, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Impact of Not Doing</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[3] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[3] * 100}
              onChange={(e) => handleWeightChange(3, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Financial Case</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[4] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[4] * 100}
              onChange={(e) => handleWeightChange(4, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Budget Required</label>
            <div className="text-sm font-bold text-slate-950">{(localWeights[5] * 100).toFixed(0)}%</div>
            <input 
              type="range" min="0" max="100" step="5"
              value={localWeights[5] * 100}
              onChange={(e) => handleWeightChange(5, Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Visual Metrics & Prioritized List */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Chart Panel */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Projected Financial ROI by Therapeutic Area (USD thousands)</h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading charts...</div>
              ) : domainData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">No chart data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fffaf0', borderColor: '#e5e5e5', borderRadius: '12px' }}
                      labelStyle={{ color: '#0a0a0a', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ff4d8b', fontSize: '12px' }}
                      formatter={(value) => [`$${value}k`, 'Total ROI']}
                    />
                    <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                      {domainData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Rank-Ordered prioritized list */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-[#ff4d8b]" />
                <span>Steering Impact Prioritization</span>
              </h3>
              <p className="text-[11px] text-slate-655">Rank-ordered by impact index (Calculated ROI multiplied by Readiness scorecard percent).</p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-650">Loading ranking...</div>
              ) : prioritizedProjects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-650">No projects to rank.</div>
              ) : (
                prioritizedProjects.map((p, index) => {
                  const impactScore = (p.financialRoi * (p.readinessScore / 100)) / 1000;
                  return (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-[#f5f0e0] border border-slate-250 flex items-center justify-center font-extrabold text-[10px] text-slate-700">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900">{p.title}</h4>
                          <p className="text-[10px] text-slate-555 mt-0.5">
                            {(p.functionalDomains || []).join(', ') || p.functionalDomain} &bull; {(p.therapeuticAreas || []).join(', ')}
                            {p.submittedAt && ` • ${getAgingText(p.submittedAt)}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-pink-600">{impactScore.toFixed(0)} Index</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-medium" title={`Calculation: $${(p.financialRoi / 1000).toLocaleString()}k ROI × ${p.readinessScore.toFixed(1)}% Readiness`}>
                          ${(p.financialRoi / 1000).toLocaleString()}k ROI × {p.readinessScore.toFixed(0)}% Read.
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Semantic RAG Q&A Chat Box */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-md space-y-4 flex flex-col h-[600px] justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-[#0a0a0a] text-sm flex items-center gap-1.5">
              <Brain size={16} className="text-pink-500 animate-pulse" />
              <span>Portfolio RAG Chatbot</span>
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed">
              Ask questions about the commercial AI portfolio. The engine fetches similar projects and experts, injecting them as context into the local LLM.
            </p>
          </div>

          {/* Chat message viewport */}
          <div className="flex-1 border border-slate-200 bg-[#fffaf0] rounded-xl p-4 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[380px]">
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex flex-col gap-1 ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className={`p-3 rounded-xl border ${
                  m.role === 'user' 
                    ? 'bg-slate-900 border-slate-950 text-white' 
                    : 'bg-[#f5f0e0] border-slate-250 text-[#0a0a0a]'
                }`}>
                  <div className="leading-relaxed">{parseMarkdownText(m.content, m.role === 'user')}</div>
                </div>

                {/* Sources list if assistant returned references */}
                {m.sources && (m.sources.projects.length > 0 || m.sources.experts.length > 0) && (
                  <div className="pl-2 space-y-1 mt-1 flex flex-col items-start gap-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Semantic Sources:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.projects.map(p => (
                        <span 
                          key={p.id} 
                          onClick={() => handleSourceProjectClick(p.id)}
                          className="text-[9px] text-pink-655 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer hover:bg-pink-100 transition-all font-semibold"
                        >
                          <FileText size={8} /> {p.title.substring(0, 15)}...
                        </span>
                      ))}
                      {m.sources.experts.map(e => (
                        <span key={e.id} className="text-[9px] text-[#1a3a3a] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Users size={8} /> {e.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 size={12} className="animate-spin text-pink-500" />
                <span>AI Assistant is reading portfolio vectors...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              disabled={isSending}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. Which expert can help with vaccines forecasting?"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 text-xs text-[#0a0a0a] placeholder-slate-400 focus:outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              disabled={isSending || !chatInput.trim()}
              className="w-10 h-10 shrink-0 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-250 disabled:text-slate-450 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>

        </div>

      </div>
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onRefresh={fetchProjects} />
    </div>
  );
}
