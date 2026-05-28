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
  const settings = useSelector((state: RootState) => state.settings);

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
    <DashboardLayout
      title="Create New"
      showBackButton={true}
      workspaceBg="bg-[#525252]"
      workspacePadding="pt-4 pb-6 px-6 md:pt-4 md:pb-8 md:px-8"
      sidebarButtonText="AI Teacher's Toolkit"
    >
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
        <div className="w-full space-y-6">
          {/* Dark Bubble Notification Card */}
          <div className="bg-[#272727] rounded-3xl p-6 text-white space-y-4 shadow-lg shadow-slate-950/10 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <p className="text-sm md:text-base font-semibold leading-relaxed font-sans">
                Certainly, {settings.teacherName || 'Lakshya'}! Here are customized Question Paper for your CBSE Grade {assessment.className || settings.className || '8th'} {assessment.subject || settings.subject || 'Science'} classes on the NCERT chapters:
              </p>
            </div>

            {/* Action Buttons inside Bubble */}
            <div className="flex items-center gap-3 w-full md:w-auto z-10">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="py-2.5 px-6 bg-white text-slate-900 hover:bg-slate-50 disabled:bg-slate-100 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition duration-200 cursor-pointer"
              >
                {pdfGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <Download className="w-4 h-4 text-slate-900" />
                )}
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {/* Exam Question Sheet - Printed Layout Mock */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-md space-y-8 select-text font-sans text-slate-800">
            {/* School Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-sans leading-tight">
                {settings.schoolName}, {settings.schoolAddress}
              </h1>
              <p className="text-sm font-bold text-slate-800 font-sans mt-2">
                Subject: {assessment.subject || settings.subject || 'Science'}
              </p>
              <p className="text-sm font-bold text-slate-800 font-sans mt-0.5">
                Class: {assessment.className || settings.className || '8th'}
              </p>
            </div>

            {/* Marks and Time Allowed Bar */}
            <div className="flex justify-between font-sans font-bold text-sm text-slate-800 py-1">
              <span>Time Allowed: 45 minutes</span>
              <span>Maximum Marks: {assessment.criteria.totalMarks}</span>
            </div>

            {/* General Instructions */}
            <div className="text-sm font-bold text-slate-800 font-sans">
              All questions are compulsory unless stated otherwise.
            </div>

            {/* Student Info Fields */}
            <div className="space-y-3 font-sans text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <span>Name:</span>
                <div className="border-b border-slate-400 flex-grow max-w-[280px] h-4"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Roll Number:</span>
                <div className="border-b border-slate-400 flex-grow max-w-[280px] h-4"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Class: {assessment.className || settings.className || '8th'} Section:</span>
                <div className="border-b border-slate-400 flex-grow max-w-[280px] h-4"></div>
              </div>
            </div>

            {/* Sections and Questions */}
            <div className="space-y-8">
              {assessment.sections.map((sec, secIdx) => {
                const colonIdx = sec.title.indexOf(':');
                let sectionName = sec.title;
                let sectionSubtitle = '';
                if (colonIdx !== -1) {
                  sectionName = sec.title.substring(0, colonIdx).trim();
                  sectionSubtitle = sec.title.substring(colonIdx + 1).trim();
                } else {
                  const match = sec.title.match(/^(Section\s+[A-Z])\s+(.*)$/i);
                  if (match) {
                    sectionName = match[1];
                    sectionSubtitle = match[2];
                  }
                }

                return (
                  <div key={secIdx} className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-xl font-bold font-sans text-slate-900 tracking-wide">
                        {sectionName}
                      </h2>
                    </div>

                    {sectionSubtitle && (
                      <div className="text-left font-bold text-slate-800 text-sm font-sans mt-4">
                        {sectionSubtitle}
                      </div>
                    )}
                    {sec.instructions && (
                      <p className="text-left text-xs font-medium italic text-slate-500 font-sans mt-1">
                        {sec.instructions}
                      </p>
                    )}

                    <div className="space-y-4 mt-4">
                      {sec.questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-2">
                          <div className="font-sans text-slate-800 text-sm leading-relaxed">
                            <span className="font-bold mr-1.5">{qIdx + 1}.</span>
                            <span className="mr-1.5 font-medium">[{q.difficulty}]</span>
                            <span className="mr-2">{q.text}</span>
                            <span className="font-bold whitespace-nowrap">
                              [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                            </span>
                          </div>

                          {/* Options list for MCQs */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 font-sans">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-sm text-slate-600 font-sans">
                                  <span className="font-semibold mr-1">
                                    ({String.fromCharCode(97 + optIdx)})
                                  </span>{' '}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* End of paper separator */}
            <div className="font-sans font-bold text-slate-800 text-sm pt-6 select-none">
              End of Question Paper
            </div>

            {/* Answer Key Block */}
            {assessment.answerKey && assessment.answerKey.length > 0 && (
              <div className="border-t-2 border-slate-200 pt-8 space-y-6">
                <h3 className="text-lg font-bold font-sans text-slate-900 border-b border-slate-200 pb-2">
                  Answer Key & Marking Guidelines
                </h3>
                <div className="space-y-4">
                  {assessment.answerKey.map((ans, ansIdx) => (
                    <div key={ansIdx} className="font-sans text-sm">
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
