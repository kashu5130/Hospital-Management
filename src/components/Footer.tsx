import React from 'react';
import {
  ShieldCheck,
  Activity,
  HeartPulse,
  PhoneCall,
  Lock,
  ExternalLink,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
  UserCheck,
  Server,
  Sparkles,
  Wifi,
  ChevronRight,
  Clock,
  LogIn,
  FileCheck2,
  Building2,
  LifeBuoy
} from 'lucide-react';
import { ActiveTab, StaffUser, Patient, Doctor, Appointment, Billing } from '../types/hospital';
import { ConnectionStatusResult } from '../firebase/config';

interface FooterProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStaff: StaffUser | null;
  onOpenStaffAuthModal: (mode?: 'login' | 'register') => void;
  connectionState: ConnectionStatusResult | null;
  onOpenConnectionModal: () => void;
  onSeedSampleData: () => void;
  isSeeding: boolean;
  patientsCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  billingsCount: number;
  staffCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  activeTab,
  setActiveTab,
  currentStaff,
  onOpenStaffAuthModal,
  connectionState,
  onOpenConnectionModal,
  onSeedSampleData,
  isSeeding,
  patientsCount,
  doctorsCount,
  appointmentsCount,
  billingsCount,
  staffCount,
}) => {
  const isOnline = connectionState?.isConnected ?? true;

  return (
    <footer className="mt-auto border-t border-[#EAE6DF] dark:border-slate-800 bg-[#F9F7F2] dark:bg-[#0B101B] transition-colors pb-24 lg:pb-10 select-none">
      {/* Top Emergency & Clinical System Health Banner */}
      <div className="border-b border-[#EAE6DF]/70 dark:border-slate-800/80 bg-white/70 dark:bg-[#0F1626]/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* 24/7 Rapid Emergency Hotline */}
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold uppercase tracking-wider text-[11px]">24/7 Clinical Emergency Hotline:</span>
              <a
                href="tel:18009118482"
                className="font-mono font-bold hover:underline bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60"
              >
                +1 (800) 911-VITA
              </a>
              <span className="hidden md:inline text-slate-400">• Code Blue Dispatch / Trauma Desk</span>
            </div>

            {/* Live Database Sync Telemetry */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenConnectionModal}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F3EFE6] dark:bg-slate-800/80 hover:bg-[#EAE6DF] dark:hover:bg-slate-750 border border-[#E2DDD3] dark:border-slate-700 transition-colors cursor-pointer text-[#475569] dark:text-slate-300"
                title="Click to view live database diagnostics"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'
                  }`}
                />
                <span className="font-semibold text-[11px]">
                  Firebase: {isOnline ? 'Active & Synced' : 'Reconnecting...'}
                </span>
                {connectionState?.latencyMs && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    {connectionState.latencyMs}ms
                  </span>
                )}
              </button>

              {/* Current Active Staff Session status */}
              {currentStaff ? (
                <button
                  type="button"
                  onClick={() => onOpenStaffAuthModal('login')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Signed in staff member"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-[11px] truncate max-w-[130px]">{currentStaff.fullName}</span>
                  <span className="text-[10px] opacity-75">({currentStaff.roleLabel})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenStaffAuthModal('login')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px]">Staff Login / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Column 1: Hospital Brand & Accreditation */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5A7865] dark:bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight text-[#1E293B] dark:text-slate-100 leading-tight">
                  VitaSpectra Healthcare
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                  Next-Gen Clinical & Hospital Management System
                </p>
              </div>
            </div>

            <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed max-w-md">
              Enterprise clinical workstation delivering real-time patient admissions, synchronized doctor schedules,
              automated pharmacy & diagnostic billing, and role-based staff access control.
            </p>

            {/* Certifications & Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/90 border border-[#E2DDD3] dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                HIPAA & HL7 FHIR Compliant
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/90 border border-[#E2DDD3] dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <FileCheck2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                JCI & NABH Accredited
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/90 border border-[#E2DDD3] dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                ISO 27001 Certified
              </span>
            </div>
          </div>

          {/* Column 2: Clinical Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-slate-200 mb-3.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
              Clinical Modules
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { tab: 'dashboard' as ActiveTab, label: 'Overview Dashboard', count: null },
                { tab: 'patients' as ActiveTab, label: 'Patient Admissions', count: patientsCount },
                { tab: 'doctors' as ActiveTab, label: 'Doctor Directory', count: doctorsCount },
                { tab: 'appointments' as ActiveTab, label: 'Clinical Schedules', count: appointmentsCount },
                { tab: 'billing' as ActiveTab, label: 'Billing & Pharmacy', count: billingsCount },
                { tab: 'staff' as ActiveTab, label: 'Staff Roster & Duty', count: staffCount },
              ].map((item) => (
                <li key={item.tab}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    className={`flex items-center justify-between w-full text-left py-1 px-1.5 rounded-md transition-colors cursor-pointer ${
                      activeTab === item.tab
                        ? 'text-[#5A7865] dark:text-emerald-400 font-bold bg-[#EEF3EF] dark:bg-emerald-950/30'
                        : 'text-[#475569] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 opacity-60" />
                      {item.label}
                    </span>
                    {item.count !== null && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Emergency & Hospital Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-slate-200 mb-3.5 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Emergency Services
            </h4>
            <ul className="space-y-2.5 text-xs text-[#475569] dark:text-slate-300">
              <li className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-[#E2DDD3]/80 dark:border-slate-700/80">
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Emergency & Ambulance</p>
                <p className="font-mono text-xs font-semibold mt-0.5">+1 (800) 911-0000</p>
                <p className="text-[10px] text-slate-400">Response time: ~8 mins</p>
              </li>
              <li className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-[#E2DDD3]/80 dark:border-slate-700/80">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">ICU & Bed Triage Helpdesk</p>
                <p className="font-mono text-xs font-semibold mt-0.5">+1 (800) 555-0199</p>
                <p className="text-[10px] text-slate-400">Ext 404 (Ward Incharge)</p>
              </li>
              <li className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-[#E2DDD3]/80 dark:border-slate-700/80">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Central Blood Bank & Pharmacy</p>
                <p className="font-mono text-xs font-semibold mt-0.5">+1 (800) 555-0144</p>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Actions & System Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:text-slate-200 mb-3.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onOpenStaffAuthModal('login')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E2DDD3] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-slate-200 hover:border-[#5A7865] dark:hover:border-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                <span>Staff Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenStaffAuthModal('register')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E2DDD3] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-slate-200 hover:border-[#5A7865] dark:hover:border-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Register New Staff</span>
              </button>

              <button
                type="button"
                onClick={onOpenConnectionModal}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E2DDD3] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-slate-200 hover:border-[#5A7865] dark:hover:border-emerald-500 transition-all cursor-pointer shadow-2xs"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Test Live Connection</span>
              </button>

              <button
                type="button"
                onClick={onSeedSampleData}
                disabled={isSeeding}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5A7865]/10 dark:bg-emerald-950/40 border border-[#5A7865]/30 dark:border-emerald-800 text-xs font-semibold text-[#5A7865] dark:text-emerald-300 hover:bg-[#5A7865]/20 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Seeding Data...' : 'Reset & Populate Demo Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Compliance Safeguards Ribbon */}
        <div className="mt-10 pt-6 border-t border-[#EAE6DF] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748B] dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>© 2026 VitaSpectra Healthcare Systems, Inc. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>Restricted Hospital Workstation</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Lock className="w-3 h-3 text-emerald-500" />
              256-Bit SSL/TLS Encryption
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>HIPAA § 164.312 Audit Logs Enabled</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>v2.4.0 Clinical Build</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
