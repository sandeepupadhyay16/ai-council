'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Check, 
  Loader2,
  X
} from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  title: string;
  organization: string;
  availability: string;
  email: string;
  teamsId: string;
  competencies: string[];
  similarity?: number;
}

export default function DirectoryPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemantic, setIsSemantic] = useState(false);
  const [orgFilter, setOrgFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Calendar booking state
  const [bookingExpert, setBookingExpert] = useState<Expert | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = () => {
    setLoading(true);
    fetch('/api/experts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExperts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchExperts();
      return;
    }

    if (isSemantic) {
      setIsSearching(true);
      try {
        const res = await fetch('/api/experts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setExperts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Trigger search on toggle
  useEffect(() => {
    if (!isSemantic) {
      fetchExperts();
    }
  }, [isSemantic]);

  // Client-side local filtering (used when semantic search is off)
  const filteredExperts = isSemantic 
    ? experts // Semantic query results from server are already sorted/filtered
    : experts.filter(e => {
        const matchesQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.competencies.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesOrg = orgFilter === 'All' || e.organization === orgFilter;
        const matchesAvail = availFilter === 'All' || e.availability === availFilter;
        return matchesQuery && matchesOrg && matchesAvail;
      });

  const getAvailBadgeColor = (avail: string) => {
    switch (avail) {
      case 'Available': return 'bg-emerald-50 text-emerald-800 border-emerald-250';
      case 'Limited': return 'bg-amber-50 text-amber-800 border-amber-250';
      default: return 'bg-rose-50 text-rose-800 border-rose-250'; // Busy
    }
  };

  // Mock MS Graph Calendar slots
  const mockSlots = [
    "Thursday, June 11 at 10:00 AM - 10:30 AM",
    "Thursday, June 11 at 2:00 PM - 2:30 PM",
    "Friday, June 12 at 11:30 AM - 12:00 PM",
    "Friday, June 12 at 4:30 PM - 5:00 PM"
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-[#0a0a0a]">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Expert Collaboration Directory</h1>
        <p className="text-slate-550 text-sm mt-1">Connect with technical data science talent, ML engineers, and commercial compliance officers.</p>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-[#f5f0e0]/60 backdrop-blur-md flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={isSemantic ? "Enter project requirements to find matching expert skillsets semantically..." : "Search by name, title, or competency tags..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0a0a0a] placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Semantic Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSemantic(!isSemantic)}
              className={`h-10 px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isSemantic 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={14} className={isSemantic ? 'text-pink-400' : 'text-slate-400'} />
              <span>Semantic Match</span>
            </button>
            
            {isSemantic && (
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-[#0a0a0a] hover:bg-[#1f1f1f] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSearching ? <Loader2 size={12} className="animate-spin" /> : null}
                <span>Query DB</span>
              </button>
            )}
          </div>
        </form>

        {/* Traditional filters (only visible when not in semantic mode) */}
        {!isSemantic && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-250">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Organization:</span>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Organizations</option>
                <option value="Global Data Science & AI">Global Data Science & AI</option>
                <option value="Global Commercial Operations">Global Commercial Operations</option>
                <option value="Commercial Compliance & Governance">Commercial Compliance & Governance</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Availability:</span>
              <select
                value={availFilter}
                onChange={(e) => setAvailFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Limited">Limited</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Expert profiles */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-xs">Loading profiles...</p>
        </div>
      ) : filteredExperts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-[#f5f0e0]/20">
          <Filter size={40} className="mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-800 text-lg">No Experts Found</h3>
          <p className="text-slate-500 text-sm mt-1">Try relaxing filters or changing search queries.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((e) => (
            <div 
              key={e.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header availability */}
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getAvailBadgeColor(e.availability)}`}>
                    {e.availability}
                  </span>
                  
                  {e.similarity !== undefined && (
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                      {(e.similarity * 100).toFixed(0)}% Match
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-[#0a0a0a] text-lg leading-tight">{e.name}</h3>
                  <p className="text-xs text-slate-650 font-medium leading-snug">{e.title}</p>
                  <p className="text-[10px] text-slate-450">{e.organization}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {e.competencies.map(tag => (
                    <span 
                      key={tag}
                      className="text-[9px] font-bold text-slate-700 bg-[#f5f0e0] border border-slate-250 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 mt-6 pt-4 grid grid-cols-3 gap-2">
                <a 
                  href={`mailto:${e.email}?subject=Steering Committee AI Proposal Match`}
                  className="h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Mail size={12} />
                  <span>Email</span>
                </a>
                
                <a 
                  href={`msteams://teams.microsoft.com/l/chat/0/0?users=${e.teamsId}`}
                  className="h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <MessageSquare size={12} />
                  <span>Teams</span>
                </a>

                <button 
                  onClick={() => {
                    setBookingExpert(e);
                    setBookingSuccess(false);
                    setSelectedSlot(null);
                  }}
                  className="h-8 rounded-lg bg-[#0a0a0a] hover:bg-[#1f1f1f] text-white text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Calendar size={12} />
                  <span>Book</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal (Simulated Outlook Invite) */}
      {bookingExpert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative animate-fadeIn space-y-6">
            <button 
              onClick={() => setBookingExpert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ff4d8b] flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#0a0a0a]">Microsoft Outlook Scheduling</h3>
                <p className="text-xs text-slate-500">Deep-link Graph API Sandbox</p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs text-center space-y-3">
                <Check size={32} className="mx-auto text-emerald-600" />
                <p className="font-semibold text-sm">Meeting Successfully Scheduled!</p>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  Real-time Outlook event placed on {selectedSlot}. Calendar notification dispatched to {bookingExpert.email}.
                </p>
                <button
                  onClick={() => setBookingExpert(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg mt-2 transition-colors font-medium text-[11px] cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-650 leading-relaxed">
                  Select an available calendar slot from <span className="font-semibold text-[#0a0a0a]">{bookingExpert.name}</span>&apos;s Active Directory schedule:
                </p>
                
                <div className="space-y-2">
                  {mockSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                        selectedSlot === slot 
                          ? 'border-pink-500 bg-pink-50/50 text-[#ff4d8b] font-semibold' 
                          : 'border-slate-200 bg-white text-slate-650 hover:border-slate-350'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2 justify-end">
                  <button 
                    onClick={() => setBookingExpert(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedSlot}
                    onClick={() => setBookingSuccess(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Book 30 Mins
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
