import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Stethoscope,
  HeartPulse,
  UserCheck,
  Pill,
  FlaskConical,
  Receipt,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  LogIn,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  BadgeCheck
} from 'lucide-react';
import { HospitalStaffRole, StaffUser, StaffStatus } from '../types/hospital';
import { HOSPITAL_STAFF_ROLES, STAFF_ROLE_LIST } from '../data/staffRoles';
import { getRoleIcon } from './StaffAuthModal';
import { updateStaffUser } from '../firebase/firestoreService';

interface StaffViewProps {
  staffUsers: StaffUser[];
  currentStaff: StaffUser | null;
  onSelectStaff: (staff: StaffUser) => void;
  onOpenRegisterModal: (role?: HospitalStaffRole) => void;
  onOpenLoginModal: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffUsers,
  currentStaff,
  onSelectStaff,
  onOpenRegisterModal,
  onOpenLoginModal,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [updatingStaffId, setUpdatingStaffId] = useState<string | null>(null);

  // Toggle on_duty vs on_leave in Firebase
  const handleToggleDutyStatus = async (staff: StaffUser) => {
    const newStatus: StaffStatus = staff.status === 'on_duty' ? 'on_leave' : 'on_duty';
    setUpdatingStaffId(staff.id);
    try {
      await updateStaffUser(staff.id, { status: newStatus });
      showToast(
        `${staff.fullName} marked as ${newStatus === 'on_duty' ? 'On Duty' : 'On Leave'} in Firebase.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to update staff status.', 'error');
    } finally {
      setUpdatingStaffId(null);
    }
  };

  // Filter staff
  const filteredStaff = staffUsers.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.roleLabel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'all' || staff.role === selectedRoleFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' || staff.status === selectedStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalStaff = staffUsers.length;
  const onDutyCount = staffUsers.filter((s) => s.status === 'on_duty').length;
  const doctorsCount = staffUsers.filter((s) => s.role === 'doctor').length;
  const nursesCount = staffUsers.filter((s) => s.role === 'nurse').length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5A7865]/10 dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight">
              Hospital Staff & Personnel Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Real-time multi-role staff roster synchronized with Firebase (`staff_users`).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-[#D5E2D9] dark:border-slate-700 text-[#2D3748] dark:text-slate-200 hover:bg-[#F9F7F2] dark:hover:bg-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#5A7865] dark:text-emerald-400" />
            <span>Switch Staff / Sign In</span>
          </button>
          <button
            onClick={() => onOpenRegisterModal('doctor')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141D2B] border border-[#EAE6DF] dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl sm:text-2xl font-bold text-[#2D3748] dark:text-slate-100 mt-0.5">{totalStaff}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141D2B] border border-[#EAE6DF] dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Active On Duty</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{onDutyCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141D2B] border border-[#EAE6DF] dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Physicians</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">{doctorsCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141D2B] border border-[#EAE6DF] dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Clinical Nurses</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">{nursesCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Role Pill Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedRoleFilter === 'all'
              ? 'bg-[#5A7865] dark:bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
          }`}
        >
          All Staff ({totalStaff})
        </button>
        {STAFF_ROLE_LIST.map((roleDef) => {
          const count = staffUsers.filter((s) => s.role === roleDef.role).length;
          const isSelected = selectedRoleFilter === roleDef.role;
          return (
            <button
              key={roleDef.role}
              onClick={() => setSelectedRoleFilter(roleDef.role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? `${roleDef.badgeClass} ring-2 ring-emerald-500 font-bold shadow-xs`
                  : 'bg-white dark:bg-slate-800 border-[#EAE6DF] dark:border-slate-700 text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
              }`}
            >
              {getRoleIcon(roleDef.role, 'w-3.5 h-3.5')}
              <span>{roleDef.shortTitle}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/80 dark:bg-slate-900/80 font-mono font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141D2B] border border-[#EAE6DF] dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, department, ID, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Duty:</span>
          </div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl text-[#2D3748] dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#5A7865]"
          >
            <option value="all">All Statuses</option>
            <option value="on_duty">On Duty 🟢</option>
            <option value="on_leave">On Leave 🟡</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#141D2B] rounded-2xl border border-dashed border-[#D5E2D9] dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#2D3748] dark:text-slate-200">No hospital staff found</h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedRoleFilter !== 'all'
              ? 'Try adjusting your search filters.'
              : 'Register your first staff member to store in Firebase database.'}
          </p>
          <button
            onClick={() => onOpenRegisterModal('doctor')}
            className="px-4 py-2 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Register Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const roleMeta = HOSPITAL_STAFF_ROLES[staff.role] || HOSPITAL_STAFF_ROLES.doctor;
            const isCurrentlyActive = currentStaff?.id === staff.id;
            const isOnDuty = staff.status === 'on_duty';

            return (
              <div
                key={staff.id}
                className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between bg-white dark:bg-[#141D2B] shadow-2xs hover:shadow-sm ${
                  isCurrentlyActive
                    ? 'border-[#5A7865] dark:border-emerald-500 ring-2 ring-[#5A7865]/20 dark:ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-[#EAE6DF] dark:border-slate-800 hover:border-[#D5E2D9] dark:hover:border-slate-700'
                }`}
              >
                {/* Active User Indicator */}
                {isCurrentlyActive && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#5A7865] dark:bg-emerald-600 text-white text-[10px] font-bold tracking-wide shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Active Session</span>
                  </div>
                )}

                <div>
                  {/* Card Header: Avatar & Role badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${roleMeta.gradient} shadow-2xs`}
                      >
                        {getRoleIcon(staff.role, 'w-5 h-5')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2D3748] dark:text-slate-100 tracking-tight line-clamp-1">
                          {staff.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${roleMeta.badgeClass}`}>
                            {roleMeta.shortTitle}
                          </span>
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 font-bold">
                            {staff.employeeId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Duty Status Badge */}
                    <button
                      onClick={() => handleToggleDutyStatus(staff)}
                      disabled={updatingStaffId === staff.id}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                        isOnDuty
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                      }`}
                      title="Click to toggle On Duty / On Leave in Firebase"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{isOnDuty ? 'On Duty' : 'On Leave'}</span>
                    </button>
                  </div>

                  {/* Staff Info Details */}
                  <div className="space-y-1.5 text-xs text-[#64748B] dark:text-slate-400 pt-2 border-t border-[#F0ECE4] dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0" />
                      <span className="truncate">{staff.department}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0" />
                      <span className="truncate">{staff.shift}</span>
                    </div>

                    {staff.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0" />
                        <span className="truncate">{staff.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#A0AEC0] dark:text-slate-500">
                    Firebase ID: {staff.id.substring(0, 8)}...
                  </span>

                  <button
                    onClick={() => {
                      onSelectStaff(staff);
                      showToast(`Switched active session to ${staff.fullName} (${staff.roleLabel}).`, 'success');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCurrentlyActive
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                        : 'bg-[#5A7865]/10 dark:bg-emerald-950/40 text-[#5A7865] dark:text-emerald-400 hover:bg-[#5A7865] hover:text-white dark:hover:bg-emerald-600'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isCurrentlyActive ? 'Current Session' : 'Sign In as Staff'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
