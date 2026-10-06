import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase,
  Eye,
  EyeOff,
  KeyRound,
  History,
  ShieldAlert,
  HelpCircle,
  Check,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HospitalStaffRole, StaffUser } from '../types/hospital';
import { HOSPITAL_STAFF_ROLES, STAFF_ROLE_LIST } from '../data/staffRoles';
import {
  addStaffUser,
  authenticateStaffUser,
  getStaffUsers,
  logStaffAuditEvent,
  resetStaffPassword,
  INITIAL_STAFF_MEMBERS
} from '../firebase/firestoreService';
import { safeSignInWithGoogle } from '../firebase/config';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: StaffUser | null;
  onStaffLoginSuccess: (staff: StaffUser) => void;
  initialMode?: 'login' | 'register' | 'recovery';
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

// Role permissions matrix for clinical transparency
const PERMISSIONS_MATRIX: {
  module: string;
  doctor: string;
  nurse: string;
  receptionist: string;
  pharmacist: string;
  lab_technician: string;
  billing: string;
  admin: string;
}[] = [
  {
    module: 'Patient Admissions',
    doctor: 'Read / Update Diagnosis',
    nurse: 'Read / Update Vitals',
    receptionist: 'Full Intake & Admission',
    pharmacist: 'Read Only',
    lab_technician: 'Read Only',
    billing: 'Read Demographics',
    admin: 'Full Unrestricted Access',
  },
  {
    module: 'Clinical Appointments',
    doctor: 'Consultation & Status',
    nurse: 'Queue Observation',
    receptionist: 'Schedule / Reschedule',
    pharmacist: 'View Timings',
    lab_technician: 'View Tests Queue',
    billing: 'View for Invoicing',
    admin: 'Full Unrestricted Access',
  },
  {
    module: 'Prescriptions & Pharmacy',
    doctor: 'Issue & Authorize',
    nurse: 'Medication Delivery',
    receptionist: 'None',
    pharmacist: 'Review & Dispense',
    lab_technician: 'None',
    billing: 'Calculate Pharmacy Fees',
    admin: 'Full Unrestricted Access',
  },
  {
    module: 'Billing & Invoices',
    doctor: 'View Fee Schedule',
    nurse: 'None',
    receptionist: 'Basic Fee Collection',
    pharmacist: 'Submit Drug Costs',
    lab_technician: 'Submit Lab Costs',
    billing: 'Full Invoices & Claims',
    admin: 'Full Unrestricted Access',
  },
  {
    module: 'System & Staff Roster',
    doctor: 'View Staff Roster',
    nurse: 'View Duty Roster',
    receptionist: 'Doctor Availability',
    pharmacist: 'View Pharmacy Staff',
    lab_technician: 'View Lab Roster',
    billing: 'View Staff Accounts',
    admin: 'Full User & Roster Mgmt',
  },
];

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  onStaffLoginSuccess,
  initialMode = 'login',
  initialRole = 'doctor',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<HospitalStaffRole>(initialRole);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState<boolean>(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('Hospital@2026');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('Hospital@2026');
  const [regDepartment, setRegDepartment] = useState<string>('');
  const [regCustomDepartment, setRegCustomDepartment] = useState<string>('');
  const [regEmployeeId, setRegEmployeeId] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regShift, setRegShift] = useState<string>('Morning (08:00 - 16:00)');
  const [regSpecialization, setRegSpecialization] = useState<string>('');

  // Password Recovery Form State
  const [recoveryIdentifier, setRecoveryIdentifier] = useState<string>('');
  const [recoveryNewPasscode, setRecoveryNewPasscode] = useState<string>('');
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);

  // Saved recent staff profiles from local storage
  const [recentLogins, setRecentLogins] = useState<
    { id: string; fullName: string; role: HospitalStaffRole; roleLabel: string; employeeId: string; email: string }[]
  >([]);

  // Load recent staff profiles from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vitaspectra_recent_staff_logins');
      if (saved) {
        setRecentLogins(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Sync mode and role when props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
      setErrorMsg(null);
      setSuccessMsg(null);
      setRecoverySuccess(false);
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

  // Save successful login into recent profiles
  const recordRecentLogin = (staff: StaffUser) => {
    try {
      const existing: typeof recentLogins = JSON.parse(
        localStorage.getItem('vitaspectra_recent_staff_logins') || '[]'
      );
      const filtered = existing.filter((item) => item.employeeId !== staff.employeeId);
      const updated = [
        {
          id: staff.id,
          fullName: staff.fullName,
          role: staff.role,
          roleLabel: staff.roleLabel,
          employeeId: staff.employeeId,
          email: staff.email,
        },
        ...filtered,
      ].slice(0, 4);
      localStorage.setItem('vitaspectra_recent_staff_logins', JSON.stringify(updated));
      setRecentLogins(updated);
    } catch {
      // ignore
    }
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = regPassword || '';
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score, label: 'Moderate', color: 'bg-amber-500' };
      case 3:
        return { score, label: 'Strong', color: 'bg-emerald-500' };
      case 4:
        return { score, label: 'Hospital-Grade Secure', color: 'bg-indigo-600' };
      default:
        return { score: 0, label: 'Very Weak', color: 'bg-red-400' };
    }
  }, [regPassword]);

  // Quick Instant 1-Click Login for any staff type
  const handleQuickDemoLogin = async (staffSeed: typeof INITIAL_STAFF_MEMBERS[0]) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const authenticated = await authenticateStaffUser(staffSeed.email, staffSeed.password);
      if (authenticated) {
        recordRecentLogin(authenticated);
        await logStaffAuditEvent({
          action: 'LOGIN_SUCCESS',
          staffId: authenticated.id,
          staffName: authenticated.fullName,
          role: authenticated.role,
          identifier: staffSeed.email,
          status: 'SUCCESS',
          notes: 'Instant 1-click clinical login authenticated',
        });
        setSuccessMsg(`Welcome, ${authenticated.fullName}! Signed in as ${authenticated.roleLabel}.`);
        setTimeout(() => {
          onStaffLoginSuccess(authenticated);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      try {
        const id = staffSeed.employeeId.toLowerCase();
        await addStaffUser(staffSeed, id);
        const newStaff: StaffUser = { id, ...staffSeed };
        recordRecentLogin(newStaff);
        setSuccessMsg(`Account initialized! Welcome, ${newStaff.fullName}.`);
        setTimeout(() => {
          onStaffLoginSuccess(newStaff);
          onClose();
        }, 500);
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
      setErrorMsg('Please enter your work email or employee badge ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const user = await authenticateStaffUser(loginIdentifier, loginPassword);
      if (user) {
        recordRecentLogin(user);
        await logStaffAuditEvent({
          action: 'LOGIN_SUCCESS',
          staffId: user.id,
          staffName: user.fullName,
          role: user.role,
          identifier: loginIdentifier,
          status: 'SUCCESS',
          notes: 'Standard staff credentials authenticated',
        });
        setSuccessMsg(`Authenticated successfully! Welcome, ${user.fullName}.`);
        setTimeout(() => {
          onStaffLoginSuccess(user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      await logStaffAuditEvent({
        action: 'LOGIN_FAILURE',
        identifier: loginIdentifier,
        status: 'FAILURE',
        notes: err?.message || 'Invalid credentials attempt',
      });
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials or use emergency recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regEmployeeId.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, Employee Badge ID).');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    // Password confirmation check
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passcodes do not match. Please verify your confirmation password.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Passcode must be at least 6 characters (8+ recommended for medical security).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Check for duplicates before creation
      const existingStaff = await getStaffUsers();
      const duplicateEmail = existingStaff.find(
        (s) => s.email.toLowerCase() === regEmail.trim().toLowerCase()
      );
      if (duplicateEmail) {
        throw new Error(`An account with email "${regEmail}" already exists. Please sign in instead.`);
      }

      const duplicateBadge = existingStaff.find(
        (s) => s.employeeId.toUpperCase() === regEmployeeId.trim().toUpperCase()
      );
      if (duplicateBadge) {
        throw new Error(
          `Badge ID "${regEmployeeId}" is already assigned to ${duplicateBadge.fullName}. Please generate another badge ID.`
        );
      }

      const finalDept = regDepartment === 'Other' ? regCustomDepartment.trim() || 'General' : regDepartment;
      const roleDef = HOSPITAL_STAFF_ROLES[selectedRole];

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
        password: regPassword,
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

      recordRecentLogin(createdStaff);
      await logStaffAuditEvent({
        action: 'REGISTRATION',
        staffId: createdStaff.id,
        staffName: createdStaff.fullName,
        role: createdStaff.role,
        identifier: createdStaff.email,
        status: 'SUCCESS',
        notes: `New ${createdStaff.roleLabel} registered in system`,
      });

      setSuccessMsg(`Registered successfully as ${roleDef.label}! Logging you in...`);
      setTimeout(() => {
        onStaffLoginSuccess(createdStaff);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Emergency Passcode Reset
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setErrorMsg('Please enter your registered staff email or badge ID.');
      return;
    }
    if (!recoveryNewPasscode.trim() || recoveryNewPasscode.length < 6) {
      setErrorMsg('Please enter a new passcode with at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await resetStaffPassword(recoveryIdentifier, recoveryNewPasscode);
      setRecoverySuccess(true);
      setSuccessMsg(`Passcode reset successful for ${updated.fullName}! You may now sign in.`);
      setLoginIdentifier(updated.employeeId);
      setLoginPassword(recoveryNewPasscode);
      setTimeout(() => {
        setMode('login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not verify staff identity for recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google SSO Medical Sign In
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await safeSignInWithGoogle();
      if (res.success) {
        setSuccessMsg('Google Medical SSO authenticated. Linking hospital session...');
        // Match with staff or create doctor session
        const staff = await getStaffUsers();
        const found = staff[0] || INITIAL_STAFF_MEMBERS[0];
        setTimeout(() => {
          onStaffLoginSuccess({
            id: found.id || 'google_staff_1',
            fullName: 'Clinical Staff (Google SSO)',
            email: 'clinical.staff@vitaspectra.health',
            role: 'doctor',
            roleLabel: 'Doctor / Physician',
            department: 'Outpatient Care',
            employeeId: 'DOC-SSO',
            phone: '+1 (555) 019-2831',
            shift: 'Morning (08:00 - 16:00)',
            status: 'on_duty',
            createdAt: { toDate: () => new Date() },
          });
          onClose();
        }, 600);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google SSO sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentRoleMeta = HOSPITAL_STAFF_ROLES[selectedRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white dark:bg-[#0F1626] rounded-2xl max-w-2xl w-full border border-[#EAE6DF] dark:border-slate-800 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
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
                <span className="text-xs text-white/80">VitaSpectra HMS • HIPAA Secure</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {mode === 'login'
                  ? 'Staff Authentication & Access'
                  : mode === 'register'
                  ? 'Register New Hospital Staff'
                  : 'Emergency Passcode Recovery'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Register vs Emergency Recovery */}
        <div className="flex border-b border-[#F0ECE4] dark:border-slate-800 bg-[#FDFBF7] dark:bg-[#0B101B] px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mode === 'login'
                ? 'border-[#5A7865] dark:border-emerald-500 text-[#1E293B] dark:text-slate-100 bg-white dark:bg-[#0F1626] rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-slate-200'
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
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mode === 'register'
                ? 'border-[#5A7865] dark:border-emerald-500 text-[#1E293B] dark:text-slate-100 bg-white dark:bg-[#0F1626] rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Staff</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('recovery');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              mode === 'recovery'
                ? 'border-[#5A7865] dark:border-emerald-500 text-[#1E293B] dark:text-slate-100 bg-white dark:bg-[#0F1626] rounded-t-xl shadow-2xs'
                : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Emergency Recovery</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="flex-1">{successMsg}</span>
            </div>
          )}

          {/* Quick Terminal Account Chooser (Shared Hospital Workstation) */}
          {recentLogins.length > 0 && mode === 'login' && (
            <div className="p-3.5 rounded-xl bg-[#F9F7F2] dark:bg-[#0B101B] border border-[#EAE6DF] dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                  Terminal Quick-Switch (Recent Staff on this Workstation)
                </span>
                <span className="text-[10px] text-slate-400">1-Tap Fill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLogins.map((rec) => (
                  <button
                    key={rec.employeeId}
                    type="button"
                    onClick={() => {
                      setLoginIdentifier(rec.employeeId);
                      setSelectedRole(rec.role);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-[#E2DDD3] dark:border-slate-700 hover:border-[#5A7865] dark:hover:border-emerald-500 transition-all text-left cursor-pointer shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                      {rec.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {rec.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role Picker (Used in login & registration) */}
          {mode !== 'recovery' && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-[#1E293B] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                  Select Staff Role Type ({STAFF_ROLE_LIST.length} Hospital Roles)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
                  className="text-[11px] font-semibold text-[#5A7865] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  <span>{showPermissionsMatrix ? 'Hide Role Matrix' : 'View Role Permissions'}</span>
                </button>
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
                          ? `${roleDef.badgeClass} ring-2 ring-offset-1 ring-emerald-500 font-semibold shadow-2xs`
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

              {/* Role Permissions Matrix Collapsible */}
              {showPermissionsMatrix && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Role-Based Access Control (RBAC) Clinical Matrix
                    </span>
                    <span className="text-[10px] text-slate-400">HIPAA Safeguards</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                          <th className="text-left py-1 font-semibold">Hospital Module</th>
                          <th className="text-left py-1 font-semibold">Permission for {currentRoleMeta.shortTitle}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {PERMISSIONS_MATRIX.map((perm) => (
                          <tr key={perm.module}>
                            <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">{perm.module}</td>
                            <td className="py-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                              {(perm as any)[selectedRole] || 'Restricted'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE: SIGN IN                                                   */}
          {/* =============================================================== */}
          {mode === 'login' && (
            <div className="space-y-5">
              {/* Quick 1-Click Instant Login */}
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
                  Click below to immediately log in with official credentials as a {currentRoleMeta.shortTitle}:
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
                          <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
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
                    <span className="bg-white dark:bg-[#0F1626] px-3 text-[#64748B] dark:text-slate-400 font-semibold">
                      Or enter custom credentials
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Staff Work Email or Employee Badge ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. rajesh.sharma@vitaspectra.health or DOC-101"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200">
                      Staff Passcode / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('recovery')}
                      className="text-[11px] text-[#5A7865] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Passcode?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter staff security passcode"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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

                {/* Optional Google SSO for Medical Staff */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google Medical SSO</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE: REGISTER                                                  */}
          {/* =============================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Registering a new <strong>{currentRoleMeta.label}</strong> into VitaSpectra Secure Database.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'Dr. Rajesh Sharma, MD' : 'Pooja Nair, RN'}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Staff Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@vitaspectra.health"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Hospital Department *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
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
                      className="mt-2 w-full px-3 py-2 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl text-[#1E293B] dark:text-slate-100"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200">
                      Employee Badge / License ID *
                    </label>
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
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Direct Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98201 23456"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Duty Shift Assignment
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                    <select
                      value={regShift}
                      onChange={(e) => setRegShift(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
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
                    <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                      Clinical Specialization
                    </label>
                    <input
                      type="text"
                      value={regSpecialization}
                      onChange={(e) => setRegSpecialization(e.target.value)}
                      placeholder="e.g. Interventional Cardiology, Pediatric Neurology"
                      className="w-full px-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                    />
                  </div>
                )}

                {/* Password Field with Security Evaluator */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                        Create Account Passcode *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Create secure passcode"
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-[#1E293B] dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                        Confirm Passcode *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-type passcode"
                          className={`w-full pl-9 pr-10 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border rounded-xl focus:outline-hidden focus:ring-2 text-[#1E293B] dark:text-slate-100 ${
                            regConfirmPassword && regPassword !== regConfirmPassword
                              ? 'border-red-400 focus:ring-red-400'
                              : 'border-[#EAE6DF] dark:border-slate-700 focus:ring-[#5A7865]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Security Strength Meter */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Security Strength:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span className={`flex items-center gap-1 ${regPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}`}>
                        <Check className="w-3 h-3" /> 8+ chars
                      </span>
                      <span className={`flex items-center gap-1 ${/[0-9]/.test(regPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                        <Check className="w-3 h-3" /> Numbers
                      </span>
                      <span className={`flex items-center gap-1 ${/[A-Z]/.test(regPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                        <Check className="w-3 h-3" /> Upper/Symbol
                      </span>
                      {regConfirmPassword && (
                        <span className={`ml-auto font-bold ${regPassword === regConfirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                          {regPassword === regConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </span>
                      )}
                    </div>
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

          {/* =============================================================== */}
          {/* MODE: EMERGENCY PASSCODE RECOVERY                               */}
          {/* =============================================================== */}
          {mode === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Emergency Hospital Passcode Recovery</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Authorized clinical personnel can securely reset their access credentials by providing their registered work email or employee badge ID.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                  Registered Work Email or Employee Badge ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                  <input
                    type="text"
                    required
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="e.g. rajesh.sharma@vitaspectra.health or DOC-101"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 text-[#1E293B] dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-slate-200 mb-1.5">
                  New Security Passcode *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-400" />
                  <input
                    type="password"
                    required
                    value={recoveryNewPasscode}
                    onChange={(e) => setRecoveryNewPasscode(e.target.value)}
                    placeholder="Create a new passcode (min. 6 characters)"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F9F7F2] dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#5A7865] dark:focus:ring-emerald-500 text-[#1E293B] dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Resetting...' : 'Verify Identity & Reset Passcode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Current Active Staff Bar */}
          {currentStaff && (
            <div className="pt-3 border-t border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Currently active:{' '}
                  <strong className="text-[#1E293B] dark:text-slate-200">{currentStaff.fullName}</strong> (
                  {currentStaff.roleLabel})
                </span>
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
