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
  Database
} from 'lucide-react';
import { ActiveTab } from '../types/hospital';
import { ConnectionStatusResult } from '../firebase/config';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewPatient: () => void;
  onOpenNewDoctor: () => void;
  onOpenNewAppointment: () => void;
  onOpenNewBilling: () => void;
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
  setActiveTab,
  onOpenNewPatient,
  onOpenNewDoctor,
  onOpenNewAppointment,
  onOpenNewBilling,
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
      default:
        return 'Hospital Management';
    }
  };

  const isConnected = connectionState?.isConnected ?? false;

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/85 backdrop-blur-md border-b border-[#EAE6DF] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Mobile Menu & Section Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-[#64748B] hover:text-[#2D3748] hover:bg-[#F5F2EB]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#2D3748] tracking-tight">{formatHeaderTitle()}</h2>
          <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium hidden sm:flex">
            <Calendar className="w-3.5 h-3.5 text-[#5A7865]" />
            <span>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="text-[#CBD5E1]">•</span>
            <Clock className="w-3.5 h-3.5 text-[#5A7865]" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Global Search, Live Status & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block w-52 lg:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records, diagnosis..."
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F2] border border-[#EAE6DF] focus:border-[#5A7865] focus:bg-[#FFFFFF] rounded-xl text-sm text-[#2D3748] placeholder-[#94A3B8] outline-hidden transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#2D3748]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Firebase Connection Badge: Green if connected, Red if not connected */}
        <button
          onClick={onOpenConnectionModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
          }`}
          title="Click to view Firebase live connection details"
        >
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </>
            )}
          </div>
          <span className="truncate max-w-[130px] sm:max-w-none">
            {isConnected ? 'Firebase Live' : 'Firebase Offline'}
          </span>
          {isConnected && connectionState?.latencyMs !== undefined && connectionState?.latencyMs !== null && (
            <span className="hidden sm:inline text-[10px] opacity-75">
              {connectionState.latencyMs}ms
            </span>
          )}
        </button>

        {/* Demo Data Seeder */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F2EB] hover:bg-[#EAE6DF] text-[#4A5568] text-xs font-semibold border border-[#E0DCD4] transition-all disabled:opacity-50"
          title="Seed realistic sample data into Firestore"
        >
          <Sparkles className={`w-3.5 h-3.5 text-[#5A7865] ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Populating...' : 'Seed Demo Data'}</span>
        </button>

        {/* Quick Action Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#5A7865] hover:bg-[#4A6553] text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#EAE6DF] py-2 z-50">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewPatient();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] hover:bg-[#F5F2EB] text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-xs">Register Patient</span>
                    <span className="text-[11px] text-[#64748B]">New admission record</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewAppointment();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] hover:bg-[#F5F2EB] text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-xs">Book Appointment</span>
                    <span className="text-[11px] text-[#64748B]">Doctor consultation</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewDoctor();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] hover:bg-[#F5F2EB] text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-xs">Add Doctor</span>
                    <span className="text-[11px] text-[#64748B]">Directory profile</span>
                  </div>
                </button>

                <div className="my-1 border-t border-[#F0ECE4]" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewBilling();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3748] hover:bg-[#F5F2EB] text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-xs">Generate Bill</span>
                    <span className="text-[11px] text-[#64748B]">Itemized patient invoice</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
