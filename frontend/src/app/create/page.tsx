'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  setTitle,
  setDueDate,
  setInstructions,
  updateQuestionType,
  addQuestionType,
  removeQuestionType,
  setUploadedFile,
  setStep,
  resetForm
} from '../../store/slices/assessmentFormSlice';
import {
  startGenerationJob,
  updateJobProgress,
  completeJob,
  failJob,
  clearJobState
} from '../../store/slices/assessmentResultSlice';
import DashboardLayout from '../../components/DashboardLayout';
import io from 'socket.io-client';
import {
  Upload,
  Calendar,
  Plus,
  Trash2,
  Mic,
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react';

export default function CreateAssignment() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Redux Form State
  const formState = useSelector((state: RootState) => state.assessmentForm);
  const { title, dueDate, instructions, questionTypes, uploadedFile, step } = formState;

  // Redux Result/Generation State
  const generationState = useSelector((state: RootState) => state.assessmentResult.generation);
  const { jobId, status: genStatus, progress, message: progressMsg, error: genError } = generationState;

  // Local component states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef<any>(null);

  // Available question type options
  const questionTypeOptions = [
    'Multiple Choice Questions',
    'Short Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'Long Answer Questions',
    'True/False Questions'
  ];

  // Calculate totals
  const totalQuestions = questionTypes.reduce((acc, q) => acc + Number(q.count), 0);
  const totalMarks = questionTypes.reduce((acc, q) => acc + Number(q.count) * Number(q.marks), 0);

  // Initialize/Clean socket connection
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Socket listener hook when jobId is available
  useEffect(() => {
    if (!jobId) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const socket = io(backendUrl, {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket.io server');
      socket.emit('join-job', jobId);
    });

    socket.on('job-progress', (data: any) => {
      dispatch(updateJobProgress({ progress: data.progress, message: data.message }));
    });

    socket.on('job-completed', async (data: any) => {
      // Fetch completed assessment data
      try {
        const res = await fetch(`${backendUrl}/api/assessments/${data.assessmentId}`);
        if (res.ok) {
          const completedData = await res.json();
          dispatch(completeJob(completedData));
          dispatch(resetForm());
          // Wait 1.5 seconds to show completion animation, then redirect
          setTimeout(() => {
            dispatch(clearJobState());
            router.push(`/assessment/${data.assessmentId}`);
          }, 1500);
        }
      } catch (err) {
        console.error('Error fetching completed assessment:', err);
      }
    });

    socket.on('job-failed', (data: any) => {
      dispatch(failJob(data.error || 'AI generation failed.'));
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId, dispatch, router]);

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setActualFile(file);
      dispatch(
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type
        })
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActualFile(file);
      dispatch(
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type
        })
      );
    }
  };

  const triggerBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setActualFile(null);
    dispatch(setUploadedFile(null));
  };

  // Microphone speech input simulator/handler
  const toggleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Safari.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      dispatch(setInstructions(instructions ? `${instructions} ${text}` : text));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Submit and start queue generation
  const handleNextStep = async () => {
    if (step === 1) {
      // Validate form
      if (!title.trim()) {
        setFormError('Please enter an assignment title.');
        return;
      }
      if (!dueDate) {
        setFormError('Please select a due date.');
        return;
      }
      if (questionTypes.length === 0) {
        setFormError('Please add at least one question type.');
        return;
      }
      setFormError(null);

      // Proceed to Step 2
      dispatch(setStep(2));

      // Trigger API POST request
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('dueDate', dueDate);
        formData.append('instructions', instructions);
        formData.append(
          'criteria',
          JSON.stringify({
            questionTypes
          })
        );

        if (actualFile) {
          formData.append('file', actualFile);
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/assessments`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server failed to initialize generation.');
        }

        const resultData = await res.json();
        dispatch(startGenerationJob(resultData.jobId));
      } catch (err: any) {
        dispatch(failJob(err.message || 'Error occurred during submission.'));
      }
    }
  };

  const handleCancelGeneration = () => {
    dispatch(clearJobState());
    dispatch(setStep(1));
  };

  return (
    <DashboardLayout title="Create Assignment" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Assignment</h1>
          <p className="text-sm text-slate-500 font-medium">Set up a new assignment for your students</p>
        </div>

        {/* Form Wizard Progress Indicator */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full bg-slate-800 transition-all duration-300 ${
              step === 1 ? 'w-1/2' : 'w-full'
            }`}
          />
        </div>

        {step === 1 ? (
          /* STEP 1: CONFIGURATION FORM - Matches Screenshot 3.0 & 3.0.1 */
          <div className="space-y-6">
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Assignment Details</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Basic information about your assignment</p>
              </div>

              {/* Editable Assignment Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => dispatch(setTitle(e.target.value))}
                  placeholder="e.g. Quiz on Electricity"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium text-slate-800"
                />
              </div>

              {/* File Uploader Dropzone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reference Materials</label>
                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-slate-50/50"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-slate-500">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Choose a file or drag & drop it here</p>
                    <p className="text-xs text-slate-400 font-medium mt-1 mb-4">PDF, TXT, JPEG, PNG, upto 10MB</p>
                    <button
                      type="button"
                      onClick={triggerBrowseFiles}
                      className="py-2 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Browse Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.jpeg,.png,.jpg"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400 font-medium mt-2 text-center">
                  Upload images or documents of your preferred context materials.
                </p>
              </div>

              {/* Due Date Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => dispatch(setDueDate(e.target.value))}
                    className="w-full pl-4 pr-11 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-semibold text-slate-700 cursor-pointer"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Question Type Config Table */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-700">Question Types Matrix</label>
                </div>

                <div className="space-y-3">
                  {questionTypes.map((qt, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative"
                    >
                      {/* Select Field */}
                      <div className="flex-1">
                        <select
                          value={qt.type}
                          onChange={(e) =>
                            dispatch(updateQuestionType({ index: idx, field: 'type', value: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 font-semibold"
                        >
                          {questionTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Counters Blocks (Quantity and Marks) */}
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        {/* Quantity Counter */}
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            No. of Questions
                          </span>
                          <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden h-9">
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuestionType({
                                    index: idx,
                                    field: 'count',
                                    value: Math.max(1, qt.count - 1)
                                  })
                                )
                              }
                              className="px-3 h-full hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-800">{qt.count}</span>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuestionType({ index: idx, field: 'count', value: qt.count + 1 })
                                )
                              }
                              className="px-3 h-full hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Marks Counter */}
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            Marks each
                          </span>
                          <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden h-9">
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuestionType({
                                    index: idx,
                                    field: 'marks',
                                    value: Math.max(1, qt.marks - 1)
                                  })
                                )
                              }
                              className="px-3 h-full hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-slate-800">{qt.marks}</span>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(
                                  updateQuestionType({ index: idx, field: 'marks', value: qt.marks + 1 })
                                )
                              }
                              className="px-3 h-full hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Delete Row button */}
                        <button
                          type="button"
                          onClick={() => dispatch(removeQuestionType(idx))}
                          className="p-2 mt-4 sm:mt-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => dispatch(addQuestionType())}
                    className="flex items-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question Type</span>
                  </button>

                  <div className="text-right self-end font-semibold text-slate-600 text-sm">
                    <div>Total Questions : <strong className="text-slate-800 font-bold">{totalQuestions}</strong></div>
                    <div>Total Marks : <strong className="text-slate-800 font-bold">{totalMarks}</strong></div>
                  </div>
                </div>
              </div>

              {/* Extra Guidelines Textarea with Speech simulator */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Additional Information (For better output)
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => dispatch(setInstructions(e.target.value))}
                    placeholder="e.g. Generate a question paper for 3 hour exam duration containing simple conceptual diagrams and focusing on electromagnetism..."
                    className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium text-slate-800 resize-none"
                  />
                  <button
                    type="button"
                    onClick={toggleSpeechInput}
                    className={`absolute right-4 bottom-4 p-2 rounded-xl border transition cursor-pointer ${
                      isListening
                        ? 'bg-red-500 border-red-500 text-white animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Step Footer Navigation */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="py-3 px-6 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-slate-100"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: GENERATION SCREEN - Loading Queue Progress */
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center shadow-sm">
              {genStatus === 'pending' || genStatus === 'processing' ? (
                <>
                  <div className="relative mb-6">
                    <Loader2 className="w-16 h-16 text-slate-800 animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
                      {progress}%
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">AI Generation In Progress</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-2 mb-6">
                    {progressMsg || 'Connecting with LLM model and constructing question sections...'}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden mb-8">
                    <div
                      className="h-full bg-slate-800 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : genStatus === 'completed' ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-slate-800">Generation Complete!</h3>
                  <p className="text-slate-500 text-sm mt-2 mb-8">
                    Rendering layouts and redirecting you to your generated question paper.
                  </p>
                </>
              ) : (
                /* Failed Generation State */
                <>
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">AI Generation Failed</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-2 mb-6">
                    {genError || 'An unexpected error occurred during background worker processing.'}
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      className="py-2.5 px-6 border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl text-slate-700 text-sm cursor-pointer"
                    >
                      Back to Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(clearJobState());
                        dispatch(setStep(1));
                        setTimeout(handleNextStep, 200);
                      }}
                      className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-white text-sm cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              )}

              {(genStatus === 'pending' || genStatus === 'processing') && (
                <button
                  type="button"
                  onClick={handleCancelGeneration}
                  className="py-2 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel Generation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
