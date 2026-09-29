import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  HeartPulse,
  UserCheck,
  Pill,
  FlaskConical,
  Receipt,
  ShieldCheck,
  X,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Briefcase
} from 'lucide-react';
import { HospitalStaffRole, StaffUser, StaffStatus } from '../types/hospital';
import { HOSPITAL_STAFF_ROLES, STAFF_ROLE_LIST, StaffRoleDefinition } from '../data/staffRoles';
import {
  addStaffUser,
  authenticateStaffUser,
  INITIAL_STAFF_MEMBERS
} from '../firebase/firestoreService';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: StaffUser | null;
  onStaffLoginSuccess: (staff: StaffUser) => void;
  initialMode?: 'login' | 'register';
  initialRole?: HospitalStaffRole;
}

export const getRoleIcon = (role: HospitalStaffRole, className: string = 'w-5 h-5') => {
  switch (role) {
    case 'doctor':
      return <Stethoscope className={className} />;
    case 'nurse':
      return <HeartPulse className={className} />;
    case 'receptionist':
      return <UserCheck className={className} />;
    case 'pharmacist':
      return <Pill className={className} />;
    case 'lab_technician':
      return <FlaskConical className={className} />;
    case 'billing':
      return <Receipt className={className} />;
    case 'admin':
      return <ShieldCheck className={className} />;
    default:
      return <UserIcon className={className} />;
  }
};

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  onStaffLoginSuccess,
  initialMode = 'login',
  initialRole = 'doctor',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<HospitalStaffRole>(initialRole);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('password123');
  const [regDepartment, setRegDepartment] = useState<string>('');
  const [regCustomDepartment, setRegCustomDepartment] = useState<string>('');
  const [regEmployeeId, setRegEmployeeId] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regShift, setRegShift] = useState<string>('Morning (08:00 - 16:00)');
  const [regSpecialization, setRegSpecialization] = useState<string>('');

  // Sync mode and role when props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setErrorMsg(null);
      setSuccessMsg(null);
      generateSuggestedBadge(initialRole);
    }
  }, [isOpen, initialMode, initialRole]);

  // Generate suggested employee badge when role changes
  const generateSuggestedBadge = (role: HospitalStaffRole) => {
    const prefix = HOSPITAL_STAFF_ROLES[role]?.suggestedPrefix || 'STF';
    const rand = Math.floor(100 + Math.random() * 900);
    setRegEmployeeId(`${prefix}-${rand}`);
    const defaultDept = HOSPITAL_STAFF_ROLES[role]?.defaultDepartments[0] || 'General';
    setRegDepartment(defaultDept);
  };

  const handleRoleSelect = (role: HospitalStaffRole) => {
    setSelectedRole(role);
    generateSuggestedBadge(role);
    setErrorMsg(null);
  };

  // Quick Instant 1-Click Login for any staff type
  const handleQuickDemoLogin = async (staffSeed: typeof INITIAL_STAFF_MEMBERS[0]) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const authenticated = await authenticateStaffUser(staffSeed.email, staffSeed.password);
      if (authenticated) {
        setSuccessMsg(`Welcome, ${authenticated.fullName}! Signed in as ${authenticated.roleLabel}.`);
        setTimeout(() => {
          onStaffLoginSuccess(authenticated);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      // If user doesn't exist yet in DB, create it on the fly!
      try {
        const id = staffSeed.employeeId.toLowerCase();
        await addStaffUser(staffSeed, id);
        const newStaff: StaffUser = { id, ...staffSeed };
        setSuccessMsg(`Account initialized! Welcome, ${newStaff.fullName}.`);
        setTimeout(() => {
          onStaffLoginSuccess(newStaff);
          onClose();
        }, 600);
      } catch (innerErr: any) {
        setErrorMsg(innerErr?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Standard Login Form Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your work email or employee ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const user = await authenticateStaffUser(loginIdentifier, loginPassword);
      if (user) {
        setSuccessMsg(`Authenticated successfully! Welcome, ${user.fullName}.`);
        setTimeout(() => {
          onStaffLoginSuccess(user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regEmployeeId.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, Employee ID).');
      return;
    }

    const finalDept = regDepartment === 'Other' ? regCustomDepartment.trim() || 'General' : regDepartment;
    const roleDef = HOSPITAL_STAFF_ROLES[selectedRole];

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newStaffPayload: Omit<StaffUser, 'id'> = {
        fullName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        role: selectedRole,
        roleLabel: roleDef.label,
        department: finalDept,
        employeeId: regEmployeeId.trim().toUpperCase(),
        phone: regPhone.trim() || '+1 (555) 000-0000',
        shift: regShift,
        status: 'on_duty',
        password: regPassword || 'password123',
        specialization: regSpecialization.trim() || undefined,
        createdAt: { toDate: () => new Date() },
        lastLoginAt: { toDate: () => new Date() },
      };

      const customId = regEmployeeId.trim().toLowerCase();
      const generatedId = await addStaffUser(newStaffPayload, customId);
      const createdStaff: StaffUser = {
        id: generatedId || customId,
        ...newStaffPayload,
      };

      setSuccessMsg(`Registered successfully as ${roleDef.label}! Logging you in...`);
      setTimeout(() => {
        onStaffLoginSuccess(createdStaff);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check Firebase connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentRoleMeta = HOSPITAL_STAFF_ROLES[selectedRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white dark:bg-[#141D2B] rounded-2xl max-w-2xl w-full border border-[#EAE6DF] dark:border-slate-800 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className={`p-5 sm:p-6 bg-gradient-to-r ${currentRoleMeta.gradient} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-inner">
              {getRoleIcon(selectedRole, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 border border-white/25">
                  Hospital Staff Portal
                </span>
                <span className="text-xs text-white/80">VitaSpectra HMS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {mode === 'login' ? 'Staff Authentication & Access' : 'Register New Hospital Staff'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="flex border-b border-[#F0ECE4] dark:border-slate-800 bg-[#FDFBF7] dark:bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-[#5A7865] dark:border-emerald-500 text-[#2D3748] dark:text-slate-100 bg-white dark:bg-[#141D2B] rounded-t-xl shadow-xs'
                : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Staff Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-[#5A7865] dark:border-emerald-500 text-[#2D3748] dark:text-slate-100 bg-white dark:bg-[#141D2B] rounded-t-xl shadow-xs'
                : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Staff</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-850 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Hospital Staff Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                Select Staff Role Type ({STAFF_ROLE_LIST.length} Roles)
              </label>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400">Saved to Firebase `staff_users`</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAFF_ROLE_LIST.map((roleDef) => {
                const isSelected = selectedRole === roleDef.role;
                return (
                  <button
                    key={roleDef.role}
                    type="button"
                    onClick={() => handleRoleSelect(roleDef.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? `${roleDef.badgeClass} ring-2 ring-offset-1 ring-emerald-500 font-semibold shadow-xs`
                        : 'bg-[#F9F7F2] dark:bg-slate-800/80 border-[#EAE6DF] dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 text-[#4A5568] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                        {getRoleIcon(roleDef.role, 'w-4 h-4')}
                      </div>
                      {isSelected && <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{roleDef.shortTitle}</p>
                      <p className="text-[10px] opacity-75 truncate">{roleDef.suggestedPrefix} Badge</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Quick Summary Box */}
            <div className={`mt-3 p-3 rounded-xl border ${currentRoleMeta.borderClass} ${currentRoleMeta.badgeClass} flex items-start gap-3 text-xs`}>
              <div className="mt-0.5 p-1 rounded-md bg-white/70 dark:bg-slate-900/70">
                {getRoleIcon(selectedRole, 'w-4 h-4')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{currentRoleMeta.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 font-mono font-semibold border">
                    Prefix: {currentRoleMeta.suggestedPrefix}-***
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{currentRoleMeta.description}</p>
              </div>
            </div>
          </div>

          {/* MODE: SIGN IN */}
          {mode === 'login' && (
            <div className="space-y-5">
              {/* Quick 1-Click Instant Login as Current Selected Role */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                      Instant 1-Click Staff Access
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700 font-semibold">
                    Verified Demo Accounts
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-3">
                  Click below to immediately log in with official Firebase credentials as a {currentRoleMeta.shortTitle}:
                </p>

                {(() => {
                  const seed = INITIAL_STAFF_MEMBERS.find((s) => s.role === selectedRole);
                  if (!seed) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(seed)}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:shadow-sm text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          {seed.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2D3748] dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {seed.fullName}
                          </p>
                          <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                            {seed.department} • <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{seed.employeeId}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })()}
              </div>

              {/* Manual Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EAE6DF] dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#141D2B] px-3 text-[#64748B] dark:text-slate-400 font-semibold">Or enter custom staff credentials</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">
                    Staff Work Email or Employee Badge ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. rajesh.sharma@vitaspectra.health or DOC-101"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200">Staff Passcode / Password</label>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">Default: password123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter staff security password"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Authenticating with Firebase...' : `Sign In as ${currentRoleMeta.shortTitle}`}</span>
                </button>
              </form>
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Registering a new <strong>{currentRoleMeta.label}</strong> into VitaSpectra Database.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Full Legal Name *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'Dr. Rajesh Sharma, MD' : 'Pooja Nair, RN'}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Staff Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@vitaspectra.health"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">
                    Hospital Department *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    >
                      {currentRoleMeta.defaultDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                      <option value="Other">Other Department...</option>
                    </select>
                  </div>
                  {regDepartment === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom department name"
                      value={regCustomDepartment}
                      onChange={(e) => setRegCustomDepartment(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl text-[#2D3748] dark:text-slate-100"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200">Employee Badge / License ID *</label>
                    <button
                      type="button"
                      onClick={() => generateSuggestedBadge(selectedRole)}
                      className="text-[10px] text-[#5A7865] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={regEmployeeId}
                    onChange={(e) => setRegEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g. DOC-481"
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Direct Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98201 23456"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Duty Shift Assignment</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <select
                      value={regShift}
                      onChange={(e) => setRegShift(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    >
                      <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                      <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                      <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                      <option value="General (09:00 - 17:00)">General (09:00 - 17:00)</option>
                      <option value="On-Call (Emergency)">On-Call (Emergency)</option>
                    </select>
                  </div>
                </div>

                {selectedRole === 'doctor' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Clinical Specialization</label>
                    <input
                      type="text"
                      value={regSpecialization}
                      onChange={(e) => setRegSpecialization(e.target.value)}
                      placeholder="e.g. Interventional Cardiology, Pediatric Neurology"
                      className="w-full px-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D3748] dark:text-slate-200 mb-1.5">Account Passcode / Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a secure staff passcode"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Registering into Firebase...'
                    : `Complete Registration for ${currentRoleMeta.shortTitle}`}
                </span>
              </button>
            </form>
          )}

          {/* Current Active Staff Bar */}
          {currentStaff && (
            <div className="pt-3 border-t border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Currently active: <strong className="text-[#2D3748] dark:text-slate-200">{currentStaff.fullName}</strong> ({currentStaff.roleLabel})</span>
              </div>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                {currentStaff.employeeId}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
