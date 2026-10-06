import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Calendar,
  Sparkles,
  Menu,
  UserPlus,
  CalendarPlus,
  Stethoscope,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { ActiveTab, StaffUser } from '../types/hospital';
import { ConnectionStatusResult } from '../firebase/config';
import { getRoleIcon } from './StaffAuthModal';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStaff: StaffUser | null;
  onOpenStaffAuthModal: (mode?: 'login' | 'register') => void;
  onOpenNewPatient: () => void;
  onOpenNewDoctor: () => void;
  onOpenNewAppointment: () => void;
  onOpenNewBilling: () => void;
  onOpenNewStaff: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  connectionState: ConnectionStatusResult | null;
  onOpenConnectionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentStaff,
  onOpenStaffAuthModal,
  onOpenNewPatient,
  onOpenNewDoctor,
  onOpenNewAppointment,
  onOpenNewBilling,
  onOpenNewStaff,
  onSeedData,
  isSeeding,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchTerm,
  setSearchTerm,
  connectionState,
  onOpenConnectionModal,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'patients':
        return 'Patient Management';
      case 'doctors':
        return 'Doctor Directory';
      case 'appointments':
        return 'Appointment Scheduling';
      case 'billing':
        return 'Billing & Invoices';
      case 'staff':
        return 'Hospital Staff & Personnel';
      default:
        return 'Hospital Management';
    }
  };

  const isConnected = connectionState?.isConnected ?? false;

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-[#EAE6DF] dark:border-slate-800 px-3 sm:px-8 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Menu & Section Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800/80 transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h2 className="text-lg sm:text-xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight truncate">
              {formatHeaderTitle()}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:flex">
              <Calendar className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
              <span>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="text-[#CBD5E1] dark:text-slate-600">•</span>
              <Clock className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Global Search, Theme Switcher, Live Status & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile search trigger button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-xl text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 transition-colors"
            title="Search records"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Desktop Search */}
          <div className="relative hidden md:block w-44 lg:w-64">
            <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records, diagnosis..."
              className="w-full pl-10 pr-4 py-2 bg-[#F9F7F2] dark:bg-slate-800/80 border border-[#EAE6DF] dark:border-slate-700 focus:border-[#5A7865] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl text-xs sm:text-sm text-[#2D3748] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400 outline-hidden transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#2D3748] dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* THEME TOGGLE (1-Click button toggle) */}
          <ThemeToggle variant="compact" />

          {/* Live Firebase Connection Badge */}
          <button
            onClick={onOpenConnectionModal}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/50'
            }`}
            title="Click to view Firebase live connection details"
          >
            <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
                </>
              )}
            </div>
            <span className="truncate max-w-[80px] sm:max-w-none">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </button>

          {/* Demo Data Seeder (Desktop) */}
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F2EB] dark:bg-slate-800 hover:bg-[#EAE6DF] dark:hover:bg-slate-700 text-[#4A5568] dark:text-slate-300 text-xs font-semibold border border-[#E0DCD4] dark:border-slate-700 transition-all disabled:opacity-50"
            title="Seed realistic sample data into database"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Populating...' : 'Seed Data'}</span>
          </button>

          {/* Quick Action Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#5A7865] hover:bg-[#4A6553] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-[#EAE6DF] dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewPatient();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] dark:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-xs">Register Patient</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">New admission record</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewAppointment();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] dark:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-xs">Book Appointment</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Doctor consultation</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewDoctor();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] dark:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-xs">Add Doctor</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Directory profile</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewBilling();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] dark:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-xs">Generate Bill</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Itemized patient invoice</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewStaff();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] dark:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-xs">Register Staff Member</span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Doctor, Nurse, Billing, etc.</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Staff Profile Chip */}
          {currentStaff ? (
            <button
              onClick={() => onOpenStaffAuthModal('login')}
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D5E2D9] dark:border-slate-700 hover:border-[#5A7865] dark:hover:border-emerald-500 transition-all shadow-2xs cursor-pointer text-left"
              title="Click to switch hospital staff account or view credentials"
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-[#5A7865] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  {getRoleIcon(currentStaff.role, 'w-3.5 h-3.5')}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-800" />
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-bold text-[#2D3748] dark:text-slate-100 truncate max-w-[110px]">
                  {currentStaff.fullName.split(',')[0]}
                </p>
                <p className="text-[10px] text-[#5A7865] dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                  {currentStaff.roleLabel}
                </p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onOpenStaffAuthModal('login')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#5A7865] dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-[#4A6553] transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Access</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden mt-2.5 pt-2 border-t border-[#EAE6DF] dark:border-slate-800 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records, names, diagnoses..."
              className="w-full pl-9 pr-8 py-2 bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl text-xs text-[#2D3748] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400 outline-hidden"
            />
            <button
              onClick={() => {
                setSearchTerm('');
                setMobileSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#2D3748] dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
