import React from 'react';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Patient, Doctor, Appointment, Billing, ActiveTab, StaffUser } from '../types/hospital';

interface DashboardViewProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  billings: Billing[];
  staffUsers?: StaffUser[];
  currentStaff?: StaffUser | null;
  onOpenStaffAuthModal?: (mode?: 'login' | 'register') => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
  onOpenNewDoctor: () => void;
  onOpenNewBilling: () => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  onToggleDoctorAvailability: (id: string, current: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  doctors,
  appointments,
  billings,
  staffUsers = [],
  currentStaff,
  setActiveTab,
  onOpenNewPatient,
  onOpenNewAppointment,
  onOpenNewDoctor,
  onOpenNewBilling,
  onUpdateAppointmentStatus,
  onToggleDoctorAvailability,
}) => {
  // Calculations
  const totalPatients = patients.length;
  const activeDoctors = doctors.filter((d) => d.isAvailable).length;
  const totalDoctors = doctors.length;

  // Today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter((a) => {
    if (!a.appointmentDate) return false;
    const date = a.appointmentDate.toDate();
    return date >= today && date < tomorrow;
  });

  // Financial calculations
  const totalRevenue = billings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const paidRevenue = billings
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  // Recent patients
  const recentPatients = [...patients].slice(0, 5);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#5A7865] via-[#4D6A57] to-[#384C3F] dark:from-emerald-950 dark:via-slate-900 dark:to-slate-950 dark:border dark:border-emerald-800/40 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/15 dark:bg-emerald-500/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Live Clinical Ops
            </span>
            {currentStaff && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>On Duty: <strong>{currentStaff.fullName.split(',')[0]}</strong> ({currentStaff.roleLabel})</span>
                <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-bold">{currentStaff.employeeId}</span>
              </div>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 sm:mt-2 tracking-tight">
            Welcome to VitaSpectra Medical Center
          </h2>
          <p className="text-white/85 text-xs sm:text-sm mt-1 sm:mt-2 leading-relaxed">
            Real-time telemetry and management for admissions, attending physicians, clinical appointments, and patient accounts.
          </p>
          <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 sm:gap-2.5">
            <button
              onClick={onOpenNewPatient}
              className="px-3.5 sm:px-4 py-2 bg-white text-[#5A7865] dark:text-emerald-950 hover:bg-[#FDFBF7] font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              + Register Patient
            </button>
            <button
              onClick={onOpenNewAppointment}
              className="px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all cursor-pointer"
            >
              + Book Appointment
            </button>
            <button
              onClick={onOpenNewBilling}
              className="px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all cursor-pointer"
            >
              + Generate Invoice
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className="px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Roster ({staffUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop shape */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none dark:hidden" />
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Patients */}
        <div
          onClick={() => setActiveTab('patients')}
          className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 hover:border-[#5A7865]/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider truncate">
              Patients
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight">{totalPatients}</span>
            <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 flex items-center justify-between pt-2 sm:pt-3 border-t border-[#F5F2EB] dark:border-slate-800">
            <span className="truncate">Admitted records</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
          </div>
        </div>

        {/* Active Doctors */}
        <div
          onClick={() => setActiveTab('doctors')}
          className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 hover:border-[#5A7865]/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider truncate">
              Doctors
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight">{activeDoctors}</span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-400 font-medium">/ {totalDoctors} staff</span>
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 flex items-center justify-between pt-2 sm:pt-3 border-t border-[#F5F2EB] dark:border-slate-800">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate">
              {totalDoctors > 0 ? `${Math.round((activeDoctors / totalDoctors) * 100)}% On Duty` : 'No doctors'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
          </div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => setActiveTab('appointments')}
          className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 hover:border-[#5A7865]/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider truncate">
              Today's Appts
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight">
              {todayAppointments.length}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-400">Scheduled</span>
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 flex items-center justify-between pt-2 sm:pt-3 border-t border-[#F5F2EB] dark:border-slate-800">
            <span className="truncate">
              {appointments.filter((a) => a.status === 'Confirmed').length} Confirmed
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
          </div>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => setActiveTab('billing')}
          className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 hover:border-[#5A7865]/40 dark:hover:border-emerald-500/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider truncate">
              Revenue
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950/60 text-[#5A7865] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-bold text-[#2D3748] dark:text-slate-100 tracking-tight">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
              {collectionRate}%
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 flex items-center justify-between pt-2 sm:pt-3 border-t border-[#F5F2EB] dark:border-slate-800">
            <span className="truncate">${pendingRevenue.toLocaleString()} pending</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments & Doctors on duty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column (2 Cols): Today's Appointments & Recent Patients */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Today's Appointments Card */}
          <div
            className="bg-white dark:bg-[#141D2B] rounded-2xl p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">Today's Appointments Queue</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Scheduled patient consultations for today
                </p>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-semibold text-[#5A7865] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All ({appointments.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 sm:py-10 bg-[#FDFBF7] dark:bg-slate-900/40 rounded-xl border border-dashed border-[#E0DCD4] dark:border-slate-800">
                <CalendarCheck className="w-8 h-8 text-[#94A3B8] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#2D3748] dark:text-slate-200">No appointments scheduled today</p>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">Book an appointment to populate today's clinical queue</p>
                <button
                  onClick={onOpenNewAppointment}
                  className="mt-3 px-3 py-1.5 bg-[#5A7865] dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-[#4A6553] cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {todayAppointments.map((appt) => {
                  const date = appt.appointmentDate?.toDate();
                  const timeStr = date
                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                  return (
                    <div
                      key={appt.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-[#F0ECE4] dark:border-slate-800 bg-[#FDFBF7] dark:bg-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#5A7865]/30 dark:hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-[#EAE6DF] dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                          <span className="text-[10px] font-bold text-[#2D3748] dark:text-slate-200 mt-0.5">{timeStr}</span>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#2D3748] dark:text-slate-100">{appt.patientName}</h4>
                          <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Stethoscope className="w-3 h-3 text-[#5A7865] dark:text-emerald-400" />
                            {appt.doctorName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            appt.status === 'Confirmed'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : appt.status === 'Completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : appt.status === 'Cancelled'
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {appt.status}
                        </span>

                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'Confirmed')}
                            className="px-2.5 py-1 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] text-white text-xs font-semibold rounded-lg cursor-pointer"
                            title="Confirm appointment"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'Confirmed' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            title="Mark as completed"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Patients Table / Cards */}
          <div
            className="bg-white dark:bg-[#141D2B] rounded-2xl p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">Recent Patient Admissions</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">Latest admitted records in database</p>
              </div>
              <button
                onClick={() => setActiveTab('patients')}
                className="text-xs font-semibold text-[#5A7865] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All ({patients.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentPatients.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748B] dark:text-slate-400">No patients admitted yet.</div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[#F0ECE4] dark:border-slate-800 text-[#64748B] dark:text-slate-400 font-semibold">
                      <th className="pb-3 px-2">Patient Name</th>
                      <th className="pb-3 px-2">Age/Gender</th>
                      <th className="pb-3 px-2">Diagnosis</th>
                      <th className="pb-3 px-2">Admission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F2EB] dark:divide-slate-800">
                    {recentPatients.map((p) => {
                      const admDate = p.admissionDate?.toDate();
                      return (
                        <tr key={p.id} className="hover:bg-[#FDFBF7] dark:hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-2 font-semibold text-[#2D3748] dark:text-slate-200 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#E2ECE5] dark:bg-emerald-950 text-[#5A7865] dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {p.fullName.charAt(0)}
                            </div>
                            <span className="truncate">{p.fullName}</span>
                          </td>
                          <td className="py-3 px-2 text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                            {p.age} yrs • {p.gender}
                          </td>
                          <td className="py-3 px-2 text-[#4A5568] dark:text-slate-300 max-w-[180px] truncate" title={p.diagnosis}>
                            {p.diagnosis}
                          </td>
                          <td className="py-3 px-2 text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                            {admDate ? admDate.toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Doctors on duty & Revenue Stats */}
        <div className="space-y-5 sm:space-y-6">
          {/* Attending Doctors Status */}
          <div
            className="bg-white dark:bg-[#141D2B] rounded-2xl p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">Attending Staff</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">Availability switch</p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="text-xs font-semibold text-[#5A7865] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {doctors.length === 0 ? (
              <p className="text-xs text-[#64748B] dark:text-slate-400 py-4 text-center">No doctors registered yet.</p>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {doctors.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7] dark:bg-slate-850/60 border border-[#F0ECE4] dark:border-slate-800"
                  >
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-[#2D3748] dark:text-slate-100 truncate">{doc.fullName}</h4>
                      <p className="text-[11px] text-[#5A7865] dark:text-emerald-400 font-medium truncate">{doc.specialization}</p>
                    </div>
                    <button
                      onClick={() => onToggleDoctorAvailability(doc.id, doc.isAvailable)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
                        doc.isAvailable
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                      title="Click to toggle availability"
                    >
                      {doc.isAvailable ? 'Available' : 'On Leave'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Collection Progress */}
          <div
            className="bg-white dark:bg-[#141D2B] rounded-2xl p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base mb-1">Financial Settlement</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">Invoiced vs settled revenue</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#2D3748] dark:text-slate-300">Paid Invoices</span>
                  <span className="text-emerald-700 dark:text-emerald-400">${paidRevenue.toLocaleString()} ({collectionRate}%)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F0ECE4] dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A7865] dark:bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#FDFBF7] dark:bg-slate-850/60 border border-[#F0ECE4] dark:border-slate-800">
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Collected</span>
                  <span className="text-sm font-bold text-[#2D3748] dark:text-slate-100 mt-0.5 block">
                    ${paidRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#FDFBF7] dark:bg-slate-850/60 border border-[#F0ECE4] dark:border-slate-800">
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Pending</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-0.5 block">
                    ${pendingRevenue.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('billing')}
                className="w-full py-2 bg-[#F5F2EB] dark:bg-slate-800 hover:bg-[#EAE6DF] dark:hover:bg-slate-750 text-[#4A5568] dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors text-center block cursor-pointer"
              >
                Open Billing Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
