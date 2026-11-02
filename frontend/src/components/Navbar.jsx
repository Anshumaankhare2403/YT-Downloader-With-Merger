import React from 'react';
import { Download, History, Settings, PlaySquare, Sun, Moon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeDownloadsCount = 0, isBackendReady = true, theme, toggleTheme }) {
  const navItems = [
    { id: 'home', label: 'Downloader', icon: PlaySquare },
    { id: 'downloads', label: 'Active Downloads', icon: Download, badge: activeDownloadsCount },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F6F4F0]/85 dark:bg-[#09090B]/85 border-b border-[#E4DFD5] dark:border-[#222226] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F6F4F0] border border-[#D5CFBE] dark:border-[#34343A] shadow-md flex items-center justify-center p-0.5">
              <img 
                src="/logo-original.png" 
                alt="YT Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                  YT <span className="font-light text-zinc-500 dark:text-zinc-400">Downloader</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-semibold border border-zinc-300/50 dark:border-zinc-700/50">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Status & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-300/60 dark:border-zinc-800">
              {isBackendReady ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Engine Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Connecting...</span>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/80 hover:bg-zinc-300/70 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all border border-zinc-300/60 dark:border-zinc-700/60 shadow-sm"
              title={theme === 'dark' ? 'Switch to Canvas Light Theme' : 'Switch to Ink Dark Theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
