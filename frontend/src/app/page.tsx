'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setAssessments, removeAssessmentFromState } from '../store/slices/assessmentResultSlice';
import DashboardLayout from '../components/DashboardLayout';
import {
  FileText,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Trash2,
  Eye,
  Plus,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const assessments = useSelector((state: RootState) => state.assessmentResult.assessments);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOption, setFilterOption] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  // Fetch assessments list from Backend
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/assessments`);
        if (!res.ok) {
          throw new Error('Failed to fetch assignments.');
        }
        const data = await res.json();
        dispatch(setAssessments(data));
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unable to connect to the backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [dispatch]);

  // Handle Delete Assessment
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/assessments/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete assignment.');
      }

      dispatch(removeAssessmentFromState(id));
      setActiveMenuId(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting assignment.');
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus and filter dropdown on click outside
  useEffect(() => {
    const closeAll = () => { setActiveMenuId(null); setFilterOpen(false); };
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  // Filter + sort assessments
  const filteredAssessments = assessments
    .filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (filterOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (filterOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (filterOption === 'az') return a.title.localeCompare(b.title);
      if (filterOption === 'za') return b.title.localeCompare(a.title);
      return 0;
    });

  return (
    <DashboardLayout title="Assignment" workspacePadding="pt-1 px-0 pb-0 md:pt-1.5 md:px-0 md:pb-0" workspaceBg="bg-[#DEDEDE]">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          <span className="text-sm text-slate-500 font-medium mt-4">Loading assessments...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            We couldn't connect to the backend server. Make sure the Node.js API server and MongoDB are running.
          </p>
          <Link
            href="/create"
            className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Go to Creation Form
          </Link>
        </div>
      ) : assessments.length === 0 ? (
        /* Empty State - Matching Screenshot 1.0 & 1.1 */
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
          <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
            {/* Custom vector mock based on screenshots */}
            <div className="absolute inset-0 bg-slate-200/50 rounded-full scale-90 blur-xl animate-pulse"></div>
            <div className="relative w-40 h-40 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 transform -rotate-6">
              <div className="w-12 h-2.5 bg-slate-200 rounded-full mb-3 self-start"></div>
              <div className="w-20 h-2 bg-slate-100 rounded-full mb-2 self-start"></div>
              <div className="w-16 h-2 bg-slate-100 rounded-full mb-6 self-start"></div>
              
              {/* Highlight cross */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white border border-slate-100 shadow-lg rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-500 font-sans">&times;</span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">No assignments yet</h2>
          <p className="text-slate-500 text-sm max-w-sm mt-3 leading-relaxed">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
            define marking criteria, and let AI assist with grading.
          </p>

          <Link
            href="/create"
            className="mt-8 py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-slate-200 transform hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Your First Assignment
          </Link>
        </div>
      ) : (
        /* Populated State - Matching Screenshot 2.0 & 2.1 */
        <div className="relative">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-3.5 md:pl-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#4ade80] rounded-full ring-4 ring-[#4ade80]/20 flex-shrink-0"></span>
                  <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-bricolage">Assignments</h1>
                </div>
                <p className="text-sm text-slate-500 font-semibold pl-6 mt-1.5">Manage and create assignments for your classes.</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-[24px] py-2 px-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm border border-slate-100/50">
              {/* Filter By — interactive dropdown trigger */}
              <div className="relative">
                <div
                  onClick={(e) => { e.stopPropagation(); setFilterOpen(!filterOpen); }}
                  className={`flex items-center gap-2 font-semibold text-[14px] cursor-pointer transition duration-200 select-none ${
                    filterOption !== 'newest' ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>
                    {filterOption === 'newest' ? 'Filter By' :
                     filterOption === 'oldest' ? 'Oldest First' :
                     filterOption === 'az' ? 'A → Z' : 'Z → A'}
                  </span>
                  {filterOption !== 'newest' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFilterOption('newest'); }}
                      className="ml-1 w-4 h-4 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 text-[10px] leading-none transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown panel */}
                {filterOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-2 w-[180px] bg-white rounded-2xl shadow-[0_20px_45px_-5px_rgba(0,0,0,0.10),0_5px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50 z-30 py-1.5 overflow-hidden"
                  >
                    {([
                      { key: 'newest', label: 'Newest First' },
                      { key: 'oldest', label: 'Oldest First' },
                      { key: 'az',     label: 'A → Z' },
                      { key: 'za',     label: 'Z → A' },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { setFilterOption(key); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold transition duration-150 cursor-pointer flex items-center justify-between ${
                          filterOption === key
                            ? 'text-slate-800 bg-slate-50'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {label}
                        {filterOption === key && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-5 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition duration-200"
                />
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredAssessments.map((a) => {
                const formatDate = (dateStr: string) => {
                  const d = new Date(dateStr);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                };

                return (
                  <div
                    key={a._id}
                    onClick={() => router.push(`/assessment/${a._id}`)}
                    className="bg-white border border-slate-100/50 hover:border-slate-200/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[24px] p-6.5 transition-all duration-200 cursor-pointer relative flex flex-col justify-between min-h-[160px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] group"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-extrabold text-slate-800 text-2xl tracking-tight leading-snug truncate pr-6 group-hover:text-slate-900 font-bricolage">
                          {a.title}
                        </h3>
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => toggleMenu(a._id, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {/* Dropdown Options */}
                          {activeMenuId === a._id && (
                            <div className="absolute right-0 mt-1.5 w-[190px] bg-white border border-slate-100/80 rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-20 py-1.5 overflow-hidden">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/assessment/${a._id}`);
                                }}
                                className="w-full text-left px-5 py-2.5 hover:bg-slate-50 text-[14px] font-semibold text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                View Assignment
                              </button>
                              <button
                                onClick={(e) => handleDelete(a._id, e)}
                                className="w-full text-left px-5 py-2.5 hover:bg-red-50/60 text-[14px] font-semibold text-red-500 cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clean bottom layout, no top border line, precise font spacing around colons */}
                    <div className="flex items-center justify-between text-[13px] text-slate-400 font-medium mt-6 select-none">
                      <span>
                        Assigned on: <span className="text-slate-600 font-semibold ml-0.5">{formatDate(a.createdAt)}</span>
                      </span>
                      <span>
                        Due: <span className="text-slate-600 font-semibold ml-0.5">{formatDate(a.dueDate)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layout spacer to bypass browser scroll padding bugs */}
            <div className="h-8 flex-shrink-0" />
          </div>

          {/* Centered Floating Action Button at bottom (adjusted for sidebar and margins) */}
          <div className="fixed bottom-10 left-1/2 md:left-[calc(50%+162px)] -translate-x-1/2 z-20">
            <Link
              href="/create"
              className="py-3 px-6 bg-[#0c0c0e] hover:bg-slate-800 text-white rounded-full font-bold text-sm flex items-center gap-2 shadow-xl shadow-slate-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={3} />
              <span>Create Assignment</span>
            </Link>
          </div>

          {/* Bottom scroll fade overlay - Sticky inside card workspace */}
          <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#DEDEDE] to-transparent z-10 rounded-b-[24px]" />
        </div>
      )}
    </DashboardLayout>
  );
}


