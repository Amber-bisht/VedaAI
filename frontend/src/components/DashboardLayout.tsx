'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  Home,
  Users,
  FileText,
  Wand2,
  FolderHeart,
  Settings,
  Bell,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  Plus
} from 'lucide-react';

export default function DashboardLayout({
  children,
  title = 'Assignment',
  showBackButton = false
}: {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const assessments = useSelector((state: RootState) => state.assessmentResult.assessments);
  
  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'My Groups', icon: Users, href: '#' },
    { name: 'Assignments', icon: FileText, href: '/', badgeCount: assessments.length || 10 },
    { name: 'AI Teacher\'s Toolkit', icon: Wand2, href: '#' },
    { name: 'My Library', icon: FolderHeart, href: '#' }
  ];

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-orange-200">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">VedaAI</span>
        </div>

        <div className="px-4 py-6">
          <Link
            href="/create"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-100 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="py-0.5 px-2.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer mb-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Settings</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                alt="School logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Delhi Public School</p>
              <p className="text-xs text-slate-500 truncate">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full z-50 p-6 border-r border-slate-200 animate-slide-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-lg flex items-center justify-center text-white font-extrabold text-lg">
                  V
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-800">VedaAI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Create Assignment
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
                    className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="py-0.5 px-2 bg-orange-500 text-white text-xs font-bold rounded-full">
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer mb-3">
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Settings</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                    alt="School logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">Delhi Public School</p>
                  <p className="text-xs text-slate-500 truncate font-medium">Bokaro Steel City</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              {showBackButton && (
                <>
                  <Link href="/" className="hover:text-slate-800">
                    Assignment
                  </Link>
                  <span className="text-slate-300">/</span>
                </>
              )}
              <span className="text-slate-800 font-semibold">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full relative transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 cursor-pointer group">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                John Doe
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* Page Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
