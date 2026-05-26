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
  ArrowLeft
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
  sidebarButtonText = 'Create Assignment'
}: {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  workspaceBg?: string;
  workspacePadding?: string;
  sidebarButtonText?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="flex h-screen bg-[#f5f6f8] overflow-hidden font-sans md:p-5 md:gap-5 justify-center items-center">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-[304px] md:h-full md:max-h-[756px] bg-white rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] border border-slate-100/50 flex-shrink-0 overflow-hidden">
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
        <header className="h-16 bg-white rounded-none md:rounded-[24px] border border-slate-100/50 flex items-center justify-between px-6 flex-shrink-0 z-10 relative shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

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
            <button className="w-10 h-10 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-800 rounded-full relative flex items-center justify-center transition-all duration-200 cursor-pointer">
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#ff5a36] rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Dropdown Container Card */}
            <div 
              className="bg-white border border-slate-100/50 rounded-full px-4 py-1.5 flex items-center gap-3 hover:bg-slate-50 transition-all duration-200 cursor-pointer group"
              style={{ boxShadow: '0px 32px 48px 0px rgba(0, 0, 0, 0.20), 0px 16px 48px 0px rgba(0, 0, 0, 0.12)' }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ffe9e3] flex-shrink-0 flex items-center justify-center">
                <img
                  src="/image.png"
                  alt="John Doe"
                  className="w-8 h-8 object-cover mix-blend-multiply"
                />
              </div>
              <span className="hidden sm:inline text-sm font-bold text-slate-700 group-hover:text-slate-800 transition-colors">
                John Doe
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        </header>

        {/* Page Content Workspace */}
        <main className={`flex-1 overflow-y-auto ${workspacePadding} rounded-none md:rounded-[24px] border border-slate-100/50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] ${workspaceBg}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

