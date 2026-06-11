'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  Briefcase, 
  ArrowRight, 
  X,
  Compass,
  Target,
  Award,
  Activity,
  Users,
  Terminal,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface Leader {
  name: string;
  role: string;
  dept: string;
  focus: string;
  avatar: string;
  color: string;
}

const leaders: Leader[] = [
  {
    name: "Dr. Angela Vance",
    role: "VP of Oncology Marketing",
    dept: "Oncology Business Unit",
    focus: "Precision marketing campaigns, patient pathway analytics, and regulatory compliance alignment.",
    avatar: "AV",
    color: "from-pink-500 to-rose-500"
  },
  {
    name: "Thomas Wright",
    role: "Head of Vaccines Commercial Operations",
    dept: "Global Vaccines Unit",
    focus: "Regional demand forecasting models, CRM rep automation triggers, and multi-channel campaign measurement.",
    avatar: "TW",
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "Linda Hsieh",
    role: "VP of Rare Disease Commercial Strategy",
    dept: "Rare Disease Unit",
    focus: "EHR patient matching models, diagnostics acceleration engine, and market access data systems.",
    avatar: "LH",
    color: "from-purple-500 to-indigo-500"
  }
];

interface ProjectShowcase {
  id: string;
  title: string;
  problemStatement: string;
  functionalDomains: string[];
  functionalDomain?: string;
  therapeuticAreas: string[];
  readinessScore: number;
  phase: string;
}

export default function HomePage() {
  const { currentPersona } = usePersona();
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [showcaseProjects, setShowcaseProjects] = useState<ProjectShowcase[]>([]);
  const [loadingShowcase, setLoadingShowcase] = useState(true);

  useEffect(() => {
    fetch('/api/projects?excludePhase=Draft')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by readiness score, showing the top 3 completed programs
          const sorted = [...data].sort((a, b) => b.readinessScore - a.readinessScore);
          setShowcaseProjects(sorted.slice(0, 3));
        }
        setLoadingShowcase(false);
      })
      .catch(err => {
        console.error('Failed to load showcase projects:', err);
        setLoadingShowcase(false);
      });
  }, []);

  return (
    <div className="space-y-12 animate-fadeIn text-[#0a0a0a]">
      {/* Premium Hero Mandate Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-md">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-650 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin-slow" />
            <span>Steering Committee Sponsored Initiative</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-slate-950">
            Bridging Frontier AI with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Measurable</span> Commercial Outcomes
          </h1>
          
          <p className="text-slate-655 text-base md:text-lg leading-relaxed font-medium">
            The Commercial AI Tech Think Tank transitions sales & marketing adoption from symbolic experimentation to purposeful execution. We ingest operational goals, grade compliance, match technical talent, and track AI initiatives globally.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href="/marketplace"
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 active:scale-95 shadow-md transition-all flex items-center gap-2"
            >
              <span>Explore Project Marketplace</span>
              <ArrowRight size={14} />
            </Link>
            
            <Link 
              href="/intake"
              className="px-6 py-3 rounded-xl bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-xs active:scale-95 transition-all"
            >
              Submit Use Case
            </Link>
          </div>
        </div>
      </section>

      {/* Vision & Mission Stack */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Vision Card */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-[#f5f0e0]/40 space-y-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
            <Compass size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Strategic Vision</h3>
          <p className="text-xs text-slate-655 leading-relaxed font-semibold">
            To be the central catalyst for transforming commercial operations across the enterprise. We envision a portfolio of high-impact, compliant, and scale-ready AI systems that directly accelerate market access, disease awareness, and precision brand alignment.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-[#f5f0e0]/40 space-y-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650">
            <Target size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Operational Mission</h3>
          <p className="text-xs text-slate-655 leading-relaxed font-semibold">
            Providing commercial leaders and brand managers with dynamic co-design playgrounds, automated multi-agent scorecards, and transparent lifecycle tracking to safely promotion-ready new proposals. We bridge organizational silos to deploy vetted AI tools.
          </p>
        </div>
      </section>

      {/* Impact Delivered Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Impact Delivered</h2>
          <p className="text-xs text-slate-500">Tangible commercial gains and organizational milestones recorded across the platform.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center shadow-xs space-y-2 hover:-translate-y-0.5 transition-transform">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mx-auto">
              <TrendingUp size={16} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">$2.5M+</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Annualized ROI Tracked</div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center shadow-xs space-y-2 hover:-translate-y-0.5 transition-transform">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mx-auto">
              <Users size={16} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">12+</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Technical Experts Matched</div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center shadow-xs space-y-2 hover:-translate-y-0.5 transition-transform">
            <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-650 mx-auto">
              <Award size={16} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">95%</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Sponsor Alignment</div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center shadow-xs space-y-2 hover:-translate-y-0.5 transition-transform">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-750 mx-auto">
              <Activity size={16} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">85%</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">Avg Readiness Score</div>
          </div>
        </div>
      </section>

      {/* Programs Underway (Live Database Showcase) */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Programs Underway</h2>
          <p className="text-xs text-slate-500">Strategic AI programs currently under review or actively in implementation.</p>
        </div>

        {loadingShowcase ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-2xl border border-slate-200 bg-white/60 animate-pulse h-48 space-y-4">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-12 w-full bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : showcaseProjects.length === 0 ? (
          /* Fallback template if db is empty */
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between h-52 hover:border-slate-350 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-pink-650 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">Vaccines</span>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded">Working</span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs">Vaccines Forecasting Trigger</h3>
                <p className="text-[11px] text-slate-550 line-clamp-3 leading-relaxed">Regional demand prediction algorithms matching rep engagement alerts with localized public health alerts.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Omnichannel Intelligence</span>
                <span className="text-pink-600">85% Ready</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between h-52 hover:border-slate-350 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-pink-650 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">Oncology</span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded">Ready</span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs">Oncology Pathway Assistant</h3>
                <p className="text-[11px] text-slate-550 line-clamp-3 leading-relaxed">Feasibility check algorithm resolving patient access bottlenecks using secure compliance-approved NLP pipelines.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Patient Identification</span>
                <span className="text-pink-600">92% Ready</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between h-52 hover:border-slate-350 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-pink-650 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">Rare Disease</span>
                  <span className="text-[9px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-250 px-2 py-0.5 rounded">Scheduled</span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs">EHR Diagnostics Copilot</h3>
                <p className="text-[11px] text-slate-550 line-clamp-3 leading-relaxed">Matching local data queries with global clinical specialists to identify rare symptom overlaps.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Field Force Automation</span>
                <span className="text-pink-600">96% Ready</span>
              </div>
            </div>
          </div>
        ) : (
          /* Live DB project cards */
          <div className="grid md:grid-cols-3 gap-6">
            {showcaseProjects.map((proj) => {
              const getShowcasePhaseBadge = (phase: string) => {
                switch (phase) {
                  case 'Scheduled': return 'bg-cyan-50 text-cyan-850 border-cyan-200';
                  case 'Ready': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  case 'Working': return 'bg-amber-50 text-amber-800 border-amber-200';
                  default: return 'bg-slate-50 text-slate-700 border-slate-200';
                }
              };
              return (
                <div key={proj.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between h-52 hover:border-slate-350 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-pink-650 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded truncate max-w-[130px]">
                        {(proj.therapeuticAreas || []).join(', ') || 'General'}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getShowcasePhaseBadge(proj.phase)}`}>
                        {proj.phase}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-850 text-xs leading-snug line-clamp-1">{proj.title}</h3>
                    <p className="text-[11px] text-slate-550 line-clamp-3 leading-relaxed">{proj.problemStatement}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span className="truncate max-w-[150px]" title={(proj.functionalDomains || []).join(', ')}>
                      {(proj.functionalDomains || []).join(' • ') || proj.functionalDomain}
                    </span>
                    <span className="text-pink-600">{proj.readinessScore.toFixed(0)}% Ready</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leadership & Steering Committee Grid */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Executive Steering Committee</h2>
          <p className="text-xs text-slate-555">Sponsored by the CMO organization to oversee portfolio health and deployment compliance.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {leaders.map((leader) => (
            <div 
              key={leader.name}
              onClick={() => setSelectedLeader(leader)}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${leader.color} flex items-center justify-center font-bold text-white text-md shadow-sm`}>
                  {leader.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-slate-855 text-sm group-hover:text-pink-650 transition-colors">{leader.name}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{leader.role}</p>
                </div>
              </div>
              <p className="text-xs text-slate-550 mt-4 leading-relaxed line-clamp-2">
                {leader.focus}
              </p>
              <div className="mt-4 text-[10px] text-pink-650 font-bold flex items-center gap-1">
                <span>View Focus Mandate</span>
                <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leader Detail Modal */}
      {selectedLeader && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#fffaf0] border border-slate-200 p-6 space-y-6 shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => setSelectedLeader(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedLeader.color} flex items-center justify-center font-bold text-white text-lg shadow-sm`}>
                {selectedLeader.avatar}
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900">{selectedLeader.name}</h3>
                <p className="text-xs font-semibold text-pink-500">{selectedLeader.role}</p>
                <p className="text-[10px] text-slate-400">{selectedLeader.dept}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Mandate</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-[#f5f0e0] p-4 rounded-xl border border-slate-200">
                {selectedLeader.focus}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setSelectedLeader(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <a 
                href={`mailto:${selectedLeader.name.toLowerCase().replace('. ', '.').replace(' ', '.')}@company.com?subject=AI Council Inquiry`}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Briefcase size={12} />
                <span>Contact Officer</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
