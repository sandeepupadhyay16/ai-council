'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import ProjectDetailModal, { Project } from '@/components/ProjectDetailModal';

const PHASES = ['Backlog', 'Working', 'Ready', 'Scheduled'];

export default function LifecyclePage() {
  const { currentPersona } = usePersona();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  // Move project to another phase
  const moveProject = async (id: string, newPhase: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    // Optimistic state update
    const oldProjects = [...projects];
    setProjects(projects.map(p => p.id === id ? { ...p, phase: newPhase } : p));

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...proj, phase: newPhase })
      });

      if (!response.ok) {
        throw new Error('Failed to update project phase');
      }
    } catch (error) {
      console.error(error);
      setProjects(oldProjects); // rollback
    }
  };

  const getPhaseBadgeColor = (phase: string) => {
    switch (phase) {
      case 'Scheduled': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
      case 'Ready': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'Working': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/30'; // Backlog
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda & Lifecycle Board</h1>
        <p className="text-slate-500 text-sm mt-1">Track strategic commercial initiatives across pipeline stages and manage project lifecycle phases.</p>
      </div>

      {/* Main Board Structure */}
      <div className="grid md:grid-cols-4 gap-4 items-start">
        {PHASES.map(phase => {
          const phaseProjects = projects.filter(p => p.phase === phase);
          return (
            <div key={phase} className="p-4 rounded-2xl bg-[#f5f0e0]/30 border border-slate-200 min-h-[500px] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{phase}</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-250 px-2 py-0.5 rounded-full">
                  {phaseProjects.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                {loading ? (
                  <div className="py-10 text-center text-slate-400 text-xs">Loading...</div>
                ) : phaseProjects.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
                    Empty Phase
                  </div>
                ) : (
                  phaseProjects.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-350 shadow-sm transition-all flex flex-col gap-2 group cursor-pointer"
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider text-pink-500 bg-pink-500/5 px-2.5 py-0.5 rounded border border-pink-500/20 self-start truncate max-w-full" title={(p.therapeuticAreas || []).join(', ')}>
                        {(p.therapeuticAreas || []).join(', ')}
                      </span>
                      
                      <h4 className="font-bold text-slate-800 text-xs leading-snug">{p.title}</h4>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-450 pt-2 border-t border-slate-100 mt-1 font-semibold">
                        <span className="text-slate-600">${(p.financialRoi / 1000).toFixed(0)}k ROI</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="bg-pink-50 text-pink-655 px-1 py-0.5 rounded font-extrabold text-[9px]" title="Aggregate Agent Idea Score">
                            Score: {p.ideaScore !== undefined ? p.ideaScore.toFixed(0) : 70}
                          </span>
                          <span className="text-pink-500">{p.readinessScore.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Dropdown controls for easy phase move */}
                      <div className="mt-2 flex gap-1 justify-end">
                        {PHASES.filter(ph => ph !== phase).map(ph => (
                          <button
                            key={ph}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveProject(p.id, ph);
                            }}
                            className="text-[9px] text-slate-500 hover:text-slate-800 bg-[#fffaf0] border border-slate-200 px-1.5 py-0.5 rounded font-semibold transition-colors"
                          >
                            To {ph === 'Scheduled' ? 'Sched' : ph}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onRefresh={fetchProjects} />
    </div>
  );
}
