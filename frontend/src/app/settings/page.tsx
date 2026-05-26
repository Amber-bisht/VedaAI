'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setSettings } from '../../store/slices/settingsSlice';
import DashboardLayout from '../../components/DashboardLayout';
import {
  School,
  MapPin,
  BookOpen,
  GraduationCap,
  Save,
  CheckCircle,
  Loader2,
  ArrowLeft,
  User
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  // Form states
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [subject, setSubject] = useState(settings.subject);
  const [className, setClassName] = useState(settings.className);
  const [teacherName, setTeacherName] = useState(settings.teacherName || 'Lakshya');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if settings loads late
  useEffect(() => {
    setSchoolName(settings.schoolName);
    setSchoolAddress(settings.schoolAddress);
    setSubject(settings.subject);
    setClassName(settings.className);
    setTeacherName(settings.teacherName || 'Lakshya');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const res = await fetch(`${backendUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolName,
          schoolAddress,
          subject,
          className,
          teacherName
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await res.json();
      dispatch(setSettings(data.settings));
      setSavedSuccess(true);
      
      // Auto-hide success checkmark after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Settings" showBackButton={true}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title block */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings & Configurations</h1>
            <p className="text-sm text-slate-500 mt-1">
              Customize the default institutional branding and metadata used across your assessment sheets and PDFs.
            </p>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* School Name input */}
            <div className="space-y-2">
              <label htmlFor="schoolName" className="text-sm font-semibold text-slate-700 block">
                School Name
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <School className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="schoolName"
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  placeholder="e.g. Delhi Public School"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none transition duration-150"
                />
              </div>
            </div>

            {/* School Address Subtext input */}
            <div className="space-y-2">
              <label htmlFor="schoolAddress" className="text-sm font-semibold text-slate-700 block">
                School Address / Location Subtext
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="schoolAddress"
                  id="schoolAddress"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  required
                  placeholder="e.g. Sector-4, Bokaro"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none transition duration-150"
                />
              </div>
              <p className="text-xs text-slate-400 pl-1">
                This appears alongside the school name in the sidebar and the generated PDF headers.
              </p>
            </div>

            {/* Teacher's Name input */}
            <div className="space-y-2">
              <label htmlFor="teacherName" className="text-sm font-semibold text-slate-700 block">
                Teacher's Name / Recipient
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="teacherName"
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                  placeholder="e.g. Lakshya"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none transition duration-150"
                />
              </div>
              <p className="text-xs text-slate-400 pl-1">
                This dynamic name is used in AI greetings on assessment templates (e.g. "Certainly, Lakshya!").
              </p>
            </div>

            {/* Subject and Class Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Default Subject input */}
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold text-slate-700 block">
                  Default Subject
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="e.g. Science"
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Default Class input */}
              <div className="space-y-2">
                <label htmlFor="className" className="text-sm font-semibold text-slate-700 block">
                  Default Class
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="className"
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                    placeholder="e.g. 8th"
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 font-medium text-sm focus:outline-none transition duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto py-3 px-5 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-2xl text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`w-full sm:w-auto py-3.5 px-6 font-bold text-sm rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition duration-200 border-none ${
                  savedSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#272727] hover:bg-[#1a1a1a] text-white disabled:bg-slate-300'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Saving Changes...
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    Save Configurations
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
