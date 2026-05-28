'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setSettings } from '../store/slices/settingsSlice';
import {
  LayoutGrid,
  Users,
  FileText,
  Wand2,
  Clock,
  Settings,
  Bell,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  Plus
} from 'lucide-react';

// Custom high-fidelity Sparkles icon matching the Figma button (two 4-pointed pinched stars)
const SparklesIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={`${className} flex-shrink-0`}
    viewBox="0 0 24 24"
    fill="#FFFFFF"
    style={{ width: '18.31622886657715px', height: '17.316226959228516px' }}
  >
    {/* Large Star (center: 9, 13) */}
    <path d="M9 6Q9 13 2 13Q9 13 9 20Q9 13 16 13Q9 13 9 6Z" />
    {/* Small Star (center: 17, 8) */}
    <path d="M17 4Q17 8 13 8Q17 8 17 12Q17 8 21 8Q17 8 17 4Z" />
  </svg>
);



export default function DashboardLayout({
  children,
  title = 'Assignment',
  showBackButton = false,
  workspaceBg = 'bg-[#f5f6f8]',
  workspacePadding = 'p-6 md:p-8',
  sidebarButtonText = 'Create Assignment',
  hideBottomTab = false
}: {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  workspaceBg?: string;
  workspacePadding?: string;
  sidebarButtonText?: string;
  hideBottomTab?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  // Close notifications on click outside
  useEffect(() => {
    const closeNotifications = () => setNotificationsOpen(false);
    window.addEventListener('click', closeNotifications);
    return () => window.removeEventListener('click', closeNotifications);
  }, []);

  const assessments = useSelector((state: RootState) => state.assessmentResult.assessments);
  const settings = useSelector((state: RootState) => state.settings);

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          dispatch(setSettings(data));
        }
      } catch (err) {
        console.error('Failed to load settings in DashboardLayout:', err);
      }
    };
    fetchSettings();
  }, [dispatch]);
  
  const navItems = [
    { name: 'Home', icon: LayoutGrid, href: '#' },
    { name: 'My Groups', icon: Users, href: '#' },
    { name: 'Assignments', icon: FileText, href: '/', badgeCount: assessments.length },
    { name: 'AI Teacher\'s Toolkit', icon: Wand2, href: '#' },
    { name: 'My Library', icon: Clock, href: '#' }
  ];

  return (
    <div className="flex h-screen bg-[#DEDEDE] overflow-hidden font-sans md:p-5 md:gap-5 justify-center items-center">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-[304px] md:h-full md:max-h-[756px] bg-white rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex-shrink-0 overflow-hidden">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <img
            src="/image%20copy.png"
            alt="VedaAI Logo"
            className="w-10 h-10 object-contain rounded-xl flex-shrink-0"
          />
          <span className="text-2xl font-bold tracking-tight text-slate-800 font-sans">VedaAI</span>
        </div>

        {/* Sidebar Creation Button Container */}
        <div className="px-[14.5px] py-6 flex justify-center flex-shrink-0">
          <Link
            href="/create"
            className="btn-create-assignment cursor-pointer"
          >
            <SparklesIcon className="text-white" />
            <span>{sidebarButtonText}</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="py-0.5 px-2 bg-[#ff5a36] text-white text-xs font-bold rounded-full">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <Link href="/settings" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer mb-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-500">Settings</span>
          </Link>

          <Link href="/settings" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-all duration-200 cursor-pointer">
            <img
              src="/image.png"
              alt={settings.schoolName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate leading-tight">{settings.schoolName}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{settings.schoolAddress}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-[280px] bg-white h-full z-50 p-6 border-r border-slate-200 animate-slide-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/image%20copy.png"
                  alt="VedaAI Logo"
                  className="w-10 h-10 object-contain rounded-xl flex-shrink-0"
                />
                <span className="text-2xl font-bold tracking-tight text-slate-800">VedaAI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 flex justify-center">
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-create-assignment cursor-pointer"
              >
                <SparklesIcon className="text-white" />
                <span>{sidebarButtonText}</span>
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="py-0.5 px-2 bg-[#ff5a36] text-white text-xs font-bold rounded-full">
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100">
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer mb-3">
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">Settings</span>
              </Link>
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-all duration-200 cursor-pointer">
                <img
                  src="/image.png"
                  alt={settings.schoolName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate leading-tight">{settings.schoolName}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{settings.schoolAddress}</p>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col gap-4 md:gap-5 h-full md:h-full md:max-h-[756px]">
        {/* Top Header */}
        <header className="flex-shrink-0 z-10 relative">
          {/* Desktop header — unchanged */}
          <div className="hidden md:flex h-16 bg-white rounded-[24px] items-center justify-between px-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center bg-white text-slate-800 hover:text-black rounded-full hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
              </button>

              <div className="flex items-center gap-2 pl-2">
                {showBackButton ? (
                  <svg
                    className="w-4.5 h-4.5"
                    style={{ color: '#A9A9A9' }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2Q12 12 2 12Q12 12 12 22Q12 12 22 12Q12 12 12 2Z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    style={{ color: '#A9A9A9' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                )}
                <span
                  className="font-bricolage"
                  style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '-0.04em',
                    color: '#A9A9A9',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  {title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                    setUnreadNotifications(false);
                  }}
                  className="w-10 h-10 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-800 rounded-full relative flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  {unreadNotifications && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#ff5a36] rounded-full border-2 border-white"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2.5 w-[320px] bg-white border border-slate-100/50 rounded-2xl shadow-[0_20px_45px_-5px_rgba(0,0,0,0.1),0_5px_15px_-3px_rgba(0,0,0,0.05)] z-30 overflow-hidden"
                    style={{ top: '100%' }}
                  >
                    <div className="p-4 border-b border-slate-100/80 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      <button
                        onClick={() => setUnreadNotifications(false)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-50">
                      <div className="p-4 hover:bg-slate-50 transition duration-200 cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-[#4ade80] rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700 leading-tight">Assessment Generated</p>
                            <p className="text-xs text-slate-500 mt-1 leading-normal">
                              "Quiz on Electricity" has been successfully compiled and is ready for download.
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">Just now</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 transition duration-200 cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-[#ff5a36] rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700 leading-tight">New Submissions</p>
                            <p className="text-xs text-slate-500 mt-1 leading-normal">
                              3 students have submitted "Quiz on Electricity".
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">2 hours ago</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 transition duration-200 cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-[#4ade80] rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700 leading-tight">System Ready</p>
                            <p className="text-xs text-slate-500 mt-1 leading-normal">
                              Connected successfully to VedaAI live servers.
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">1 day ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Pill */}
              <div
                className="bg-slate-50 border border-slate-100 rounded-full px-4 py-1.5 flex items-center gap-3 hover:bg-slate-100 transition-all duration-200 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ffe9e3] flex-shrink-0 flex items-center justify-center">
                  <img
                    src="/image.png"
                    alt={settings.teacherName || 'Teacher'}
                    className="w-8 h-8 object-cover mix-blend-multiply"
                  />
                </div>
                <span className="hidden sm:inline text-sm font-bold text-slate-700 group-hover:text-slate-800 transition-colors">
                  {settings.teacherName || 'Teacher'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Mobile header — floating white pill on dark bg */}
          <div className="md:hidden bg-[#DEDEDE] px-3 pt-3 pb-0">
            <div className="bg-white rounded-[20px] px-4 py-3 flex items-center justify-between shadow-sm">
              {/* Left: VedaAI logo + brand name */}
              <div className="flex items-center gap-2.5">
                <img
                  src="/image%20copy.png"
                  alt="VedaAI Logo"
                  className="w-9 h-9 object-contain rounded-xl flex-shrink-0"
                />
                <span className="text-[18px] font-bold tracking-tight text-slate-800">VedaAI</span>
              </div>

              {/* Right: bell + avatar + chevron */}
              <div className="flex items-center gap-2">
                {/* Bell */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationsOpen(!notificationsOpen);
                      setUnreadNotifications(false);
                    }}
                    className="relative flex items-center justify-center w-8 h-8 cursor-pointer"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unreadNotifications && (
                      <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-[#ff5a36] rounded-full border-2 border-white"></span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-[290px] bg-white border border-slate-100/50 rounded-2xl shadow-[0_20px_45px_-5px_rgba(0,0,0,0.1)] z-30 overflow-hidden"
                      style={{ top: '100%' }}
                    >
                      <div className="p-3.5 border-b border-slate-100/80 flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                        <button onClick={() => setUnreadNotifications(false)} className="text-xs font-semibold text-slate-400 cursor-pointer">Clear all</button>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-50">
                        <div className="p-3.5 hover:bg-slate-50 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-[#4ade80] rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-slate-700 leading-tight">Assessment Generated</p>
                              <p className="text-xs text-slate-500 mt-1">"Quiz on Electricity" is ready for download.</p>
                              <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">Just now</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 hover:bg-slate-50 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-[#ff5a36] rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-slate-700 leading-tight">New Submissions</p>
                              <p className="text-xs text-slate-500 mt-1">3 students submitted "Quiz on Electricity".</p>
                              <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">2 hours ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar + chevron */}
                <div className="flex items-center gap-1 cursor-pointer">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ffe9e3] flex-shrink-0">
                    <img src="/image.png" alt={settings.teacherName || 'Teacher'} className="w-8 h-8 object-cover mix-blend-multiply" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Hamburger — rightmost */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-1 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Workspace */}
        <main className={`flex-1 flex flex-col overflow-y-auto ${workspacePadding} rounded-none md:rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] ${workspaceBg} pb-24 md:pb-0`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {!hideBottomTab && <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pointer-events-none">
        {/* Floating + FAB */}
        <div className="flex justify-end mb-3 pointer-events-auto">
          <Link
            href="/create"
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.15)] cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <Plus className="w-6 h-6 text-[#ff5a36]" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="bg-[#1a1a1a] rounded-[24px] px-2 py-3 flex items-center justify-around pointer-events-auto shadow-[0_-4px_30px_rgba(0,0,0,0.2)]">
          {/* Home */}
          <Link href="#" className="flex flex-col items-center gap-1 px-4 cursor-pointer">
            <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-[11px] font-medium text-slate-400">Home</span>
          </Link>

          {/* Assignments — active */}
          <Link href="/" className="flex flex-col items-center gap-1 px-4 cursor-pointer">
            <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white">Assignments</span>
          </Link>

          {/* Library */}
          <Link href="#" className="flex flex-col items-center gap-1 px-4 cursor-pointer">
            <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span className="text-[11px] font-medium text-slate-400">Library</span>
          </Link>

          {/* AI Toolkit */}
          <Link href="#" className="flex flex-col items-center gap-1 px-4 cursor-pointer">
            <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 6Q9 13 2 13Q9 13 9 20Q9 13 16 13Q9 13 9 6Z" />
              <path d="M17 4Q17 8 13 8Q17 8 17 12Q17 8 21 8Q17 8 17 4Z" />
            </svg>
            <span className="text-[11px] font-medium text-slate-400">AI Toolkit</span>
          </Link>
        </div>
      </div>}
    </div>
  );
}

