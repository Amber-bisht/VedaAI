'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setCurrentAssessment } from '../../../store/slices/assessmentResultSlice';
import { setStep, setTitle, setInstructions, setUploadedFile } from '../../../store/slices/assessmentFormSlice';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  Loader2,
  Check,
  Award
} from 'lucide-react';

export default function AssessmentDetails() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const assessment = useSelector((state: RootState) => state.assessmentResult.currentAssessment);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);

  const id = params?.id as string;

  // Fetch assessment details from backend
  useEffect(() => {
    if (!id) return;

    const fetchAssessment = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/assessments/${id}`);
        if (!res.ok) {
          throw new Error('Failed to load assessment details.');
        }
        const data = await res.json();
        dispatch(setCurrentAssessment(data));
        setPdfDownloadUrl(data.pdfUrl || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error connecting to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, dispatch]);

  // Handle PDF Generation trigger
  const handleDownloadPDF = async () => {
    if (pdfGenerating) return;

    if (pdfDownloadUrl) {
      // If PDF already generated, open/download it directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const downloadLink = pdfDownloadUrl.startsWith('/uploads/')
        ? `${backendUrl}${pdfDownloadUrl}`
        : pdfDownloadUrl;
      window.open(downloadLink, '_blank');
      return;
    }

    setPdfGenerating(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/assessments/${id}/pdf`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF on server.');
      }

      const data = await res.json();
      setPdfDownloadUrl(data.pdfUrl);

      // Trigger download
      const downloadLink = data.pdfUrl.startsWith('/uploads/')
        ? `${backendUrl}${data.pdfUrl}`
        : data.pdfUrl;
      window.open(downloadLink, '_blank');
    } catch (err: any) {
      alert(err.message || 'Error generating PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Handle assessment regeneration
  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate this assignment? This will override the current questions.')) {
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/assessments/${id}/regenerate`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to trigger regeneration.');
      }

      const data = await res.json();
      
      // Load form details into Redux for Step 2 WebSocket listening
      dispatch(setTitle(assessment?.title || ''));
      dispatch(setInstructions(assessment?.instructions || ''));
      dispatch(setStep(2));
      
      // Navigate to /create and let it listen to the new jobId
      router.push(`/create?jobId=${data.jobId}`);
    } catch (err: any) {
      alert(err.message || 'Error triggering regeneration.');
    }
  };

  // Determine subject and class from title for display
  const getSubjectAndClass = () => {
    if (!assessment) return { subject: 'General', classNum: '8th' };
    const titleLower = assessment.title.toLowerCase();
    
    let subject = 'General';
    if (titleLower.includes('electricity') || titleLower.includes('science') || titleLower.includes('physics')) {
      subject = 'Science';
    } else if (titleLower.includes('english') || titleLower.includes('grammar')) {
      subject = 'English';
    } else if (titleLower.includes('math') || titleLower.includes('algebra')) {
      subject = 'Mathematics';
    }

    let classNum = '8th';
    if (titleLower.includes('class 5') || titleLower.includes('5th')) {
      classNum = '5th';
    } else if (titleLower.includes('class 6') || titleLower.includes('6th')) {
      classNum = '6th';
    } else if (titleLower.includes('class 7') || titleLower.includes('7th')) {
      classNum = '7th';
    }

    return { subject, classNum };
  };

  const { subject, classNum } = getSubjectAndClass();

  return (
    <DashboardLayout title="Create New" showBackButton={true}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-slate-800 animate-spin" />
          <span className="text-sm text-slate-500 font-medium mt-4">Loading question paper...</span>
        </div>
      ) : error || !assessment ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Error Loading Assessment</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">{error || 'Assessment not found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Dark Bubble Notification Card - Matching Screenshot 4.0 & 5.0 */}
          <div className="bg-[#1e293b] rounded-3xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-slate-200 relative overflow-hidden">
            <div className="flex-1 space-y-1 z-10">
              <p className="text-sm md:text-base font-semibold leading-relaxed">
                Certainly, Teacher! Here is the customized Question Paper for your CBSE Grade {classNum} {subject} classes on the {assessment.title} chapters:
              </p>
            </div>

            {/* Action Buttons inside Bubble */}
            <div className="flex items-center gap-3 w-full md:w-auto z-10">
              {/* PDF Download Action (adapts mobile/desktop layout like screenshots) */}
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="flex-1 md:flex-none py-3 px-5 bg-white text-slate-800 hover:bg-slate-50 disabled:bg-slate-100 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition duration-200 cursor-pointer"
              >
                {pdfGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                ) : (
                  <Download className="w-4 h-4 text-slate-800" />
                )}
                {/* Desktop has text, mobile has simple download arrow. We support both using responsive classes */}
                <span className="hidden sm:inline">
                  {pdfDownloadUrl ? 'Download as PDF' : 'Generate & Download PDF'}
                </span>
                <span className="sm:hidden">{pdfDownloadUrl ? 'Download' : 'Generate'}</span>
              </button>

              {/* Regenerate Action */}
              <button
                onClick={handleRegenerate}
                className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>

          {/* Exam Question Sheet - Printed Layout Mock - Matching Screenshots 4.x & 5.0 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm space-y-8 select-text">
            {/* School Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl md:text-2xl font-bold font-serif tracking-wide text-slate-900">
                Delhi Public School, Sector-4, Bokaro
              </h1>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                Subject: {subject} &bull; Class: {classNum}
              </p>
            </div>

            {/* Marks and Time Allowed Bar */}
            <div className="flex justify-between border-y border-slate-900 py-2.5 font-serif font-bold text-sm text-slate-800">
              <span>Time Allowed: 45 minutes</span>
              <span>Maximum Marks: {assessment.criteria.totalMarks}</span>
            </div>

            {/* General Instructions */}
            <div className="text-[11px] text-slate-600 font-serif leading-relaxed space-y-0.5 border-b border-dashed border-slate-200 pb-4">
              <p className="font-bold text-slate-800">General Instructions:</p>
              <ul className="list-disc pl-5">
                <li>All questions are compulsory unless stated otherwise.</li>
                <li>Write your credentials clearly in the provided lines.</li>
                <li>Write answers in a clear, legible handwriting.</li>
              </ul>
            </div>

            {/* Student Info Fields (Grid for desktop, stacked for mobile - Screenshot 5.0) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 p-4 rounded-2xl bg-slate-50/50 font-serif text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Name:</span>
                <div className="border-b border-slate-300 flex-grow h-5 min-w-[100px]"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Roll Number:</span>
                <div className="border-b border-slate-300 flex-grow h-5 min-w-[80px]"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Section:</span>
                <div className="border-b border-slate-300 flex-grow h-5 min-w-[60px]"></div>
              </div>
            </div>

            {/* Sections and Questions */}
            <div className="space-y-8">
              {assessment.sections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-4">
                  <div className="text-center">
                    <h2 className="inline-block text-base font-serif font-extrabold border-b border-slate-900 pb-0.5 uppercase tracking-wider text-slate-800">
                      {sec.title}
                    </h2>
                    <p className="text-xs font-serif italic text-slate-500 mt-1">{sec.instructions}</p>
                  </div>

                  <div className="space-y-6">
                    {sec.questions.map((q, qIdx) => {
                      const difficultyColor =
                        q.difficulty === 'Easy'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : q.difficulty === 'Moderate'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200';

                      return (
                        <div key={qIdx} className="space-y-2">
                          <div className="flex justify-between items-start gap-4 font-serif text-slate-800">
                            <span className="text-base leading-relaxed text-justify">
                              <strong className="font-bold mr-1.5">{qIdx + 1}.</strong>
                              <span
                                className={`inline-block py-0.5 px-2 mr-2 border text-[9px] rounded font-bold uppercase tracking-wider ${difficultyColor}`}
                              >
                                {q.difficulty}
                              </span>
                              {q.text}
                            </span>
                            <span className="text-sm font-bold whitespace-nowrap pt-1 text-slate-700">
                              [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                            </span>
                          </div>

                          {/* Options list for MCQs */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 font-serif">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-sm text-slate-600">
                                  <span className="font-semibold mr-1">
                                    ({String.fromCharCode(97 + optIdx)})
                                  </span>{' '}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* End of paper separator */}
            <div className="text-center font-serif font-bold text-slate-400 uppercase tracking-widest pt-6 border-t border-dashed border-slate-200 select-none">
              --- End of Question Paper ---
            </div>

            {/* Answer Key Block - Matches Screenshot 4.0.1 */}
            {assessment.answerKey && assessment.answerKey.length > 0 && (
              <div className="border-t-2 border-slate-200 pt-8 space-y-6">
                <h3 className="text-lg font-bold font-serif text-slate-900 border-b border-slate-200 pb-2">
                  Answer Key & Marking Guidelines
                </h3>
                <div className="space-y-4">
                  {assessment.answerKey.map((ans, ansIdx) => (
                    <div key={ansIdx} className="font-serif text-sm">
                      <p className="font-bold text-slate-800">{ans.questionIndex}:</p>
                      <p className="text-slate-600 pl-4 mt-1 leading-relaxed text-justify">
                        {ans.answerText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
