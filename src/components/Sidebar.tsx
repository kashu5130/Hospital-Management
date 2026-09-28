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
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ActiveTab } from '../types/hospital';
import { auth, safeSignInWithGoogle, signOut, ConnectionStatusResult, firebaseConfig } from '../firebase/config';
import { User } from 'firebase/auth';

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
  };
  currentUser: User | null;
  onSeedData: () => void;
  isSeeding: boolean;
  connectionState: ConnectionStatusResult | null;
  onOpenConnectionModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  counts,
  currentUser,
  onSeedData,
  isSeeding,
  connectionState,
  onOpenConnectionModal,
}) => {
  const [authErrorMessage, setAuthErrorMessage] = React.useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as ActiveTab, label: 'Patients', icon: Users, count: counts.patients },
    { id: 'doctors' as ActiveTab, label: 'Doctors', icon: Stethoscope, count: counts.doctors },
    { id: 'appointments' as ActiveTab, label: 'Appointments', icon: CalendarDays, count: counts.appointments },
    { id: 'billing' as ActiveTab, label: 'Billing', icon: Receipt, count: counts.billing },
  ];

  const handleAuth = async () => {
    if (isAuthenticating) return;
    try {
      if (currentUser) {
        await signOut(auth);
      } else {
        setIsAuthenticating(true);
        const res = await safeSignInWithGoogle();
        if (!res.success && res.error) {
          setAuthErrorMessage(res.error);
        }
      }
    } catch (error) {
      console.error('Auth error handled:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const isConnected = connectionState?.isConnected ?? false;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-[#FFFFFF] border-r border-[#EAE6DF] transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{ boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#F0ECE4]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#5A7865] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-bold text-lg text-[#2D3748] tracking-tight leading-none">CarePulse</h1>
                <p className="text-xs text-[#64748B] mt-1 font-medium">Hospital Management</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2D3748] hover:bg-[#F5F2EB] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#EEF3EF] text-[#5A7865] shadow-xs'
                    : 'text-[#4A5568] hover:bg-[#F9F7F2] hover:text-[#2D3748]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#5A7865]' : 'text-[#64748B]'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-[#5A7865]/15 text-[#5A7865]'
                        : 'bg-[#F0ECE4] text-[#64748B]'
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

      {/* Bottom Section: Database status & Auth */}
      <div className="p-3 border-t border-[#F0ECE4] space-y-2">
        {/* Quick Demo Data Seeder */}
        {!collapsed && counts.patients === 0 && (
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#5A7865]/10 text-[#5A7865] hover:bg-[#5A7865]/20 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isSeeding ? 'Seeding...' : 'Load Sample Data'}</span>
          </button>
        )}

        {/* Database Connection Pill: Green if connected, Red if not connected */}
        <button
          onClick={onOpenConnectionModal}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left cursor-pointer hover:shadow-xs ${
            isConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-red-50/70 border-red-200 text-red-900'
          } ${collapsed ? 'justify-center' : ''}`}
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
          {!collapsed && (
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

        {/* User Auth Profile */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-[#F9F7F2] ${
            collapsed ? 'flex-col gap-2' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Staff'}
                className="w-8 h-8 rounded-full border border-white shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#E2ECE5] text-[#5A7865] flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-[#2D3748] truncate">
                  {currentUser?.displayName || 'Hospital Staff'}
                </p>
                <p className="text-[10px] text-[#64748B] truncate">
                  {currentUser?.email || 'Admin Portal'}
                </p>
              </div>
            )}
          </div>

            <button
            onClick={handleAuth}
            disabled={isAuthenticating}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2D3748] hover:bg-[#EAE6DF]/60 transition-colors disabled:opacity-50"
            title={currentUser ? 'Sign out' : 'Sign in with Google'}
          >
            {currentUser ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Auth Error / Setup Guide Modal */}
      {authErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EAE6DF] shadow-2xl relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-[#2D3748]">Google Sign-In Setup</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {authErrorMessage}
                </p>
                <div className="mt-3 p-3 bg-[#FDFBF7] rounded-xl border border-[#F0ECE4] text-[11px] text-[#4A5568] space-y-1">
                  <p className="font-bold text-[#2D3748]">How to enable in Firebase Console:</p>
                  <p>1. Open Firebase Console for <span className="font-mono text-[#5A7865]">{firebaseConfig.projectId}</span></p>
                  <p>2. Go to <strong>Build</strong> → <strong>Authentication</strong> → <strong>Sign-in method</strong></p>
                  <p>3. Click <strong>Add new provider</strong> → Select <strong>Google</strong> → Click <strong>Save</strong></p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-[#F0ECE4]">
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
    </aside>
  );
};
