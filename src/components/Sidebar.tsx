import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogIn,
  LogOut,
  Sparkles,
  AlertCircle,
  UserCheck,
  UserPlus,
  X
} from 'lucide-react';
import { ActiveTab, StaffUser, HospitalStaffRole } from '../types/hospital';
import { auth, safeSignInWithGoogle, signOut, ConnectionStatusResult, firebaseConfig } from '../firebase/config';
import { User } from 'firebase/auth';
import { HOSPITAL_STAFF_ROLES } from '../data/staffRoles';
import { getRoleIcon } from './StaffAuthModal';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  counts: {
    patients: number;
    doctors: number;
    appointments: number;
    billing: number;
    staff: number;
  };
  currentUser: User | null;
  currentStaff: StaffUser | null;
  onOpenStaffAuthModal: (mode?: 'login' | 'register', role?: HospitalStaffRole) => void;
  onStaffLogout: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  connectionState: ConnectionStatusResult | null;
  onOpenConnectionModal: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  counts,
  currentStaff,
  onOpenStaffAuthModal,
  onStaffLogout,
  onSeedData,
  isSeeding,
  connectionState,
  onOpenConnectionModal,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [authErrorMessage, setAuthErrorMessage] = React.useState<string | null>(null);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as ActiveTab, label: 'Patients', icon: Users, count: counts.patients },
    { id: 'doctors' as ActiveTab, label: 'Doctors', icon: Stethoscope, count: counts.doctors },
    { id: 'appointments' as ActiveTab, label: 'Appointments', icon: CalendarDays, count: counts.appointments },
    { id: 'billing' as ActiveTab, label: 'Billing', icon: Receipt, count: counts.billing },
    { id: 'staff' as ActiveTab, label: 'Staff Roster', icon: UserCheck, count: counts.staff },
  ];

  const isConnected = connectionState?.isConnected ?? false;

  return (
    <>
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] dark:bg-[#111827] border-r border-[#EAE6DF] dark:border-slate-800 transition-all duration-300 flex flex-col justify-between overflow-y-auto ${
          // Desktop collapsed width vs mobile drawer
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          // Mobile responsive slide-over drawer
          mobileOpen ? 'w-72 translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 w-64'
        }`}
        style={{ boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)' }}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 sm:h-20 flex items-center justify-between px-4 border-b border-[#F0ECE4] dark:border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#5A7865] dark:bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="truncate">
                  <h1 className="font-bold text-lg text-[#2D3748] dark:text-slate-100 tracking-tight leading-none">VitaSpectra</h1>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 font-medium">Hospital Management</p>
                </div>
              )}
            </div>

            {/* Mobile close button (visible on mobile only) */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 shadow-xs border border-transparent dark:border-emerald-800/40'
                      : 'text-[#4A5568] dark:text-slate-300 hover:bg-[#F9F7F2] dark:hover:bg-slate-800/70 hover:text-[#2D3748] dark:hover:text-slate-100'
                  }`}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#5A7865] dark:text-emerald-400' : 'text-[#64748B] dark:text-slate-400'
                    }`}
                  />
                  {(!collapsed || mobileOpen) && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {(!collapsed || mobileOpen) && item.count !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-[#5A7865]/15 dark:bg-emerald-900/40 text-[#5A7865] dark:text-emerald-300'
                          : 'bg-[#F0ECE4] dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme Switcher, Database status & Auth */}
        <div className="p-3 border-t border-[#F0ECE4] dark:border-slate-800 space-y-2.5">
          {/* Dark Mode Switcher inside sidebar */}
          {(!collapsed || mobileOpen) && (
            <div className="p-2.5 rounded-xl bg-[#F9F7F2] dark:bg-slate-850/80 border border-[#EAE6DF] dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                  Theme Appearance
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Hover to switch
                </span>
              </div>
              <ThemeToggle variant="pill" showHoverHint={false} />
            </div>
          )}

          {/* Quick Demo Data Seeder */}
          {(!collapsed || mobileOpen) && counts.patients === 0 && (
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#5A7865]/10 dark:bg-emerald-900/30 text-[#5A7865] dark:text-emerald-400 hover:bg-[#5A7865]/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>{isSeeding ? 'Seeding...' : 'Load Sample Data'}</span>
            </button>
          )}

          {/* Database Connection Pill */}
          <button
            onClick={onOpenConnectionModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left cursor-pointer hover:shadow-xs ${
              isConnected
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
                : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-300'
            } ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
            title="Click to view live connection details"
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
            {(!collapsed || mobileOpen) && (
              <div className="text-xs truncate flex-1">
                <span className="font-bold block leading-tight">
                  {isConnected ? 'Firebase Live' : 'Firebase Offline'}
                </span>
                <span className="text-[10px] opacity-75 truncate block">
                  {firebaseConfig.projectId}
                </span>
              </div>
            )}
          </button>

          {/* Staff User Identity & Authentication */}
          {currentStaff ? (
            <div className="p-2.5 rounded-xl bg-[#F9F7F2] dark:bg-slate-850 border border-[#EAE6DF] dark:border-slate-800 space-y-2">
              <div className={`flex items-center gap-2.5 ${collapsed && !mobileOpen ? 'flex-col' : ''}`}>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${
                    HOSPITAL_STAFF_ROLES[currentStaff.role]?.gradient || 'from-emerald-600 to-teal-600'
                  } shrink-0 shadow-xs relative`}
                >
                  {getRoleIcon(currentStaff.role, 'w-4 h-4')}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      currentStaff.status === 'on_duty' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={currentStaff.status === 'on_duty' ? 'On Duty' : 'On Leave'}
                  />
                </div>

                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#2D3748] dark:text-slate-100 truncate">
                        {currentStaff.fullName}
                      </p>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 text-[#64748B] dark:text-slate-400">
                        {currentStaff.employeeId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold text-[#5A7865] dark:text-emerald-400 truncate">
                        {currentStaff.roleLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {(!collapsed || mobileOpen) && (
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#EAE6DF]/70 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onOpenStaffAuthModal('login');
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 hover:bg-[#EEF3EF] dark:hover:bg-slate-700 hover:text-[#5A7865] dark:hover:text-emerald-400 text-[10px] font-semibold text-[#4A5568] dark:text-slate-300 transition-colors cursor-pointer"
                    title="Switch to another staff member or staff type"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Switch</span>
                  </button>
                  <button
                    onClick={onStaffLogout}
                    className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-semibold text-[#4A5568] dark:text-slate-300 transition-colors cursor-pointer"
                    title="Sign out of current staff session"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onOpenStaffAuthModal('login');
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] dark:hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs ${
                  collapsed && !mobileOpen ? 'justify-center' : 'justify-between'
                }`}
                title="Hospital Staff Login / Register"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  {(!collapsed || mobileOpen) && <span>Staff Sign In</span>}
                </div>
                {(!collapsed || mobileOpen) && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono">
                    7 Roles
                  </span>
                )}
              </button>
              {(!collapsed || mobileOpen) && (
                <button
                  onClick={() => {
                    onOpenStaffAuthModal('register');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#F9F7F2] dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-[#EAE6DF] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:text-[#2D3748] dark:hover:text-slate-100 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                  <span>Register New Staff</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Auth Error Modal */}
      {authErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-[#2D3748] dark:text-slate-100">Google Sign-In Setup</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2 leading-relaxed">
                  {authErrorMessage}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-[#F0ECE4] dark:border-slate-800">
              <button
                onClick={() => setAuthErrorMessage(null)}
                className="px-4 py-2 bg-[#5A7865] hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
