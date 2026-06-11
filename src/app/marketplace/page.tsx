'use client';

import React, { useState, useEffect } from 'react';
import { usePersona } from '@/components/ClientWrapper';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Activity, 
  Plus, 
  Layers 
} from 'lucide-react';
import Link from 'next/link';
import ProjectDetailModal, { Project, getPhaseBadgeColor } from '@/components/ProjectDetailModal';

export default function MarketplacePage() {
  const { currentPersona } = usePersona();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load projects:', err);
        setLoading(false);
      });
  };

  // Fetch projects from local db
  useEffect(() => {
    fetchProjects();
  }, []);

  const defaultDomains = ['Omnichannel Intelligence', 'Campaign Measurement Intelligence', 'Patient Identification', 'Field Force Automation'];
  const domains = ['All', ...Array.from(new Set([...defaultDomains, ...projects.flatMap(p => p.functionalDomains || (p.functionalDomain ? [p.functionalDomain] : []))]))];
  const areas = ['All', 'Oncology', 'Vaccines', 'Rare Diseases', 'Inflammation & Immunology', 'Internal Medicine'];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.problemStatement.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = domainFilter === 'All' || 
                          (p.functionalDomains && p.functionalDomains.includes(domainFilter)) || 
                          p.functionalDomain === domainFilter;
    const matchesArea = areaFilter === 'All' || (p.therapeuticAreas && p.therapeuticAreas.includes(areaFilter));
    return matchesSearch && matchesDomain && matchesArea;
  });


  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">AI Project Marketplace</h1>
          <p className="text-slate-550 text-sm mt-1">Discover, collaborate, and deploy validated Pfizer commercial sales & marketing AI assets.</p>
        </div>
        
        <Link 
            href="/intake"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center gap-1.5 self-start shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Submit New Concept</span>
          </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/30 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by project title or problem keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-[#0a0a0a] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        {/* Domain Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 hidden sm:inline" />
          <select 
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 focus:outline-none"
          >
            {domains.map(d => <option key={d} value={d}>{d === 'All' ? 'All Domains' : d}</option>)}
          </select>
        </div>

        {/* Therapeutic Area Filter */}
        <div>
          <select 
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 focus:outline-none"
          >
            {areas.map(a => <option key={a} value={a}>{a === 'All' ? 'All Areas' : a}</option>)}
          </select>
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="py-20 text-center text-slate-505">
          <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs">Loading portfolio database...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-[#f5f0e0]/10">
          <Layers size={32} className="mx-auto text-slate-400 mb-4" />
          <h3 className="font-bold text-slate-800 text-md">No AI Projects Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try relaxing your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg cursor-pointer transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-pink-650 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 truncate max-w-[70%]">
                    {(p.therapeuticAreas || []).join(', ')}
                  </span>
                  
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border shrink-0 ${getPhaseBadgeColor(p.phase)}`}>
                    {p.phase}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-md group-hover:text-pink-500 transition-colors line-clamp-1">{p.title}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-1" title={(p.functionalDomains || []).join(', ')}>
                    {(p.functionalDomains || []).join(' • ') || p.functionalDomain}
                  </p>
                </div>

                <p className="text-xs text-slate-655 leading-relaxed line-clamp-3">
                  {p.problemStatement}
                </p>
              </div>

              {/* Cards footer */}
              <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DollarSign size={13} className="text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-750">
                    ${(p.financialRoi / 1000).toFixed(0)}k <span className="font-normal text-slate-400">annual ROI</span>
                  </span>
                </div>

                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                  <span className="bg-pink-50 border border-pink-100 text-pink-650 px-2 py-0.5 rounded font-extrabold text-[9px] shrink-0" title="Aggregate Agent Idea Score">
                    Score: {p.ideaScore !== undefined ? p.ideaScore.toFixed(0) : 70}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Activity size={12} className="text-pink-500" />
                    <span>{p.readinessScore.toFixed(0)}% Ready</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Dossier Modal */}
      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} onRefresh={fetchProjects} />
    </div>
  );
}
