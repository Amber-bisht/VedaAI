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

  // Close menus on click outside
  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Filter assessments based on search term
  const filteredAssessments = assessments.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Assignments">
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments</h1>
              <p className="text-sm text-slate-500 font-medium">Manage and create assignments for your classes.</p>
            </div>
          </div>

          {/* Filters & Search - Matching screenshot */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition duration-200 cursor-pointer">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Filter By</span>
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition duration-200"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssessments.map((a) => (
              <div
                key={a._id}
                onClick={() => router.push(`/assessment/${a._id}`)}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 transition-all duration-200 cursor-pointer relative flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-slate-800 text-lg leading-snug truncate pr-6">
                      {a.title}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(a._id, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === a._id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5">
                          <button
                            onClick={() => router.push(`/assessment/${a._id}`)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Assignment
                          </button>
                          <button
                            onClick={(e) => handleDelete(a._id, e)}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-semibold text-red-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-500">
                    <span className="py-0.5 px-2 bg-slate-100 rounded-md">
                      {a.criteria.totalQuestions} Questions
                    </span>
                    <span className="py-0.5 px-2 bg-orange-50 text-orange-600 rounded-md">
                      {a.criteria.totalMarks} Marks
                    </span>
                    {a.status !== 'completed' && (
                      <span
                        className={`py-0.5 px-2 rounded-md capitalize font-bold ${
                          a.status === 'processing'
                            ? 'bg-amber-50 text-amber-600'
                            : a.status === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    Assigned on: <strong className="text-slate-700 font-semibold">{new Date(a.createdAt).toLocaleDateString()}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: <strong className="text-slate-700 font-semibold">{new Date(a.dueDate).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Action Button at Bottom Center */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 md:hidden">
            <Link
              href="/create"
              className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Create Assignment</span>
            </Link>
          </div>
          <div className="hidden md:flex justify-center pt-8">
            <Link
              href="/create"
              className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-slate-100 transition duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Create Assignment</span>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
