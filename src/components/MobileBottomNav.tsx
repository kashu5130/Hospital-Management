import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { ActiveTab } from '../types/hospital';
import { useTheme } from '../context/ThemeContext';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  counts: {
    patients: number;
    doctors: number;
    appointments: number;
    billing: number;
    staff: number;
  };
  onOpenQuickAction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  counts,
}) => {
  const { isDark, toggleTheme, hoverChangeTheme } = useTheme();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
    { id: 'patients' as ActiveTab, label: 'Patients', icon: Users, count: counts.patients },
    { id: 'doctors' as ActiveTab, label: 'Doctors', icon: Stethoscope, count: counts.doctors },
    { id: 'appointments' as ActiveTab, label: 'Appts', icon: CalendarDays, count: counts.appointments },
    { id: 'billing' as ActiveTab, label: 'Billing', icon: Receipt, count: counts.billing },
    { id: 'staff' as ActiveTab, label: 'Staff', icon: UserCheck, count: counts.staff },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#EAE6DF] dark:border-slate-800 px-2 py-1.5 transition-colors duration-200"
      style={{ boxShadow: '0 -4px 16px -2px rgba(0, 0, 0, 0.06)' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
                isActive
                  ? 'text-[#5A7865] dark:text-emerald-400 font-bold scale-105'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center border shadow-xs ${
                      isActive
                        ? 'bg-[#5A7865] dark:bg-emerald-600 text-white border-white dark:border-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-white dark:border-slate-800'
                    }`}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#5A7865] dark:bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Quick Dark Mode toggle button directly on mobile bottom bar */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[#64748B] dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors cursor-pointer min-w-[44px]"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-amber-300 animate-in spin-in-180 duration-200" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 animate-in spin-in-180 duration-200" />
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </nav>
  );
};
