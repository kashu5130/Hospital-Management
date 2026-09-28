import React from 'react';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  PlusCircle,
  Calendar
} from 'lucide-react';
import { Patient, Doctor, Appointment, Billing, ActiveTab } from '../types/hospital';

interface DashboardViewProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  billings: Billing[];
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#5A7865] to-[#43594B] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Live Clinical Ops
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Welcome to CarePulse Medical Center
          </h2>
          <p className="text-white/85 text-sm sm:text-base mt-2 leading-relaxed">
            Real-time telemetry and management for admissions, attending physicians, clinical appointments, and patient accounts.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={onOpenNewPatient}
              className="px-4 py-2 bg-white text-[#5A7865] hover:bg-[#FDFBF7] font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              + Register Patient
            </button>
            <button
              onClick={onOpenNewAppointment}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all"
            >
              + Book Appointment
            </button>
            <button
              onClick={onOpenNewBilling}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur-sm transition-all"
            >
              + Generate Invoice
            </button>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Patients */}
        <div
          onClick={() => setActiveTab('patients')}
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF] hover:border-[#5A7865]/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2D3748] tracking-tight">{totalPatients}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Admitted
            </span>
          </div>
          <div className="mt-3 text-xs text-[#64748B] flex items-center justify-between pt-3 border-t border-[#F5F2EB]">
            <span>Active database records</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Active Doctors */}
        <div
          onClick={() => setActiveTab('doctors')}
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF] hover:border-[#5A7865]/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Active Doctors
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2D3748] tracking-tight">{activeDoctors}</span>
            <span className="text-xs text-[#64748B] font-medium">/ {totalDoctors} on staff</span>
          </div>
          <div className="mt-3 text-xs text-[#64748B] flex items-center justify-between pt-3 border-t border-[#F5F2EB]">
            <span className="text-emerald-700 font-medium">
              {totalDoctors > 0 ? `${Math.round((activeDoctors / totalDoctors) * 100)}% Available` : 'No doctors'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => setActiveTab('appointments')}
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF] hover:border-[#5A7865]/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Today's Schedule
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2D3748] tracking-tight">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-[#64748B]">Consultations</span>
          </div>
          <div className="mt-3 text-xs text-[#64748B] flex items-center justify-between pt-3 border-t border-[#F5F2EB]">
            <span>
              {appointments.filter((a) => a.status === 'Confirmed').length} Confirmed
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => setActiveTab('billing')}
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF] hover:border-[#5A7865]/40 transition-all cursor-pointer group"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2D3748] tracking-tight">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {collectionRate}% Collected
            </span>
          </div>
          <div className="mt-3 text-xs text-[#64748B] flex items-center justify-between pt-3 border-t border-[#F5F2EB]">
            <span>${pendingRevenue.toLocaleString()} pending</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5A7865] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments & Doctors on duty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Appointments & Recent Patients */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments Card */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#EAE6DF]"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[#2D3748] text-base">Today's Appointments Queue</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Scheduled patient consultations for today
                </p>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-semibold text-[#5A7865] hover:underline flex items-center gap-1"
              >
                View All ({appointments.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-10 bg-[#FDFBF7] rounded-xl border border-dashed border-[#E0DCD4]">
                <CalendarCheck className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#2D3748]">No appointments scheduled today</p>
                <p className="text-xs text-[#64748B] mt-1">Book an appointment to populate today's clinical queue</p>
                <button
                  onClick={onOpenNewAppointment}
                  className="mt-3 px-3 py-1.5 bg-[#5A7865] text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-[#4A6553]"
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => {
                  const date = appt.appointmentDate?.toDate();
                  const timeStr = date
                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                  return (
                    <div
                      key={appt.id}
                      className="p-3.5 rounded-xl border border-[#F0ECE4] bg-[#FDFBF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#5A7865]/30 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE6DF] flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#5A7865]" />
                          <span className="text-[10px] font-bold text-[#2D3748] mt-0.5">{timeStr}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#2D3748]">{appt.patientName}</h4>
                          <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                            <Stethoscope className="w-3 h-3 text-[#5A7865]" />
                            {appt.doctorName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            appt.status === 'Confirmed'
                              ? 'bg-blue-50 text-blue-700'
                              : appt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : appt.status === 'Cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {appt.status}
                        </span>

                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'Confirmed')}
                            className="px-2.5 py-1 bg-[#5A7865] hover:bg-[#4A6553] text-white text-xs font-semibold rounded-lg"
                            title="Confirm appointment"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'Confirmed' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
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

          {/* Recent Patients Table */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#EAE6DF]"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[#2D3748] text-base">Recent Patient Admissions</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Latest admitted records in Firestore</p>
              </div>
              <button
                onClick={() => setActiveTab('patients')}
                className="text-xs font-semibold text-[#5A7865] hover:underline flex items-center gap-1"
              >
                View All ({patients.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentPatients.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748B]">No patients admitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F0ECE4] text-[#64748B] font-semibold">
                      <th className="pb-3">Patient Name</th>
                      <th className="pb-3">Age/Gender</th>
                      <th className="pb-3">Diagnosis</th>
                      <th className="pb-3">Admission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F2EB]">
                    {recentPatients.map((p) => {
                      const admDate = p.admissionDate?.toDate();
                      return (
                        <tr key={p.id} className="hover:bg-[#FDFBF7] transition-colors">
                          <td className="py-3 font-semibold text-[#2D3748] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#E2ECE5] text-[#5A7865] font-bold text-xs flex items-center justify-center shrink-0">
                              {p.fullName.charAt(0)}
                            </div>
                            <span className="truncate">{p.fullName}</span>
                          </td>
                          <td className="py-3 text-[#64748B]">
                            {p.age} yrs • {p.gender}
                          </td>
                          <td className="py-3 text-[#4A5568] max-w-[180px] truncate" title={p.diagnosis}>
                            {p.diagnosis}
                          </td>
                          <td className="py-3 text-[#64748B]">
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
        <div className="space-y-6">
          {/* Attending Doctors Status */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#EAE6DF]"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#2D3748] text-base">Attending Staff</h3>
                <p className="text-xs text-[#64748B]">Availability switch</p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="text-xs font-semibold text-[#5A7865] hover:underline"
              >
                Manage
              </button>
            </div>

            {doctors.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">No doctors registered yet.</p>
            ) : (
              <div className="space-y-3">
                {doctors.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7] border border-[#F0ECE4]"
                  >
                    <div className="truncate pr-2">
                      <h4 className="text-xs font-bold text-[#2D3748] truncate">{doc.fullName}</h4>
                      <p className="text-[11px] text-[#5A7865] font-medium">{doc.specialization}</p>
                    </div>
                    <button
                      onClick={() => onToggleDoctorAvailability(doc.id, doc.isAvailable)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
                        doc.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title="Click to toggle availability in Firestore"
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
            className="bg-white rounded-2xl p-6 border border-[#EAE6DF]"
            style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
          >
            <h3 className="font-bold text-[#2D3748] text-base mb-1">Financial Settlement</h3>
            <p className="text-xs text-[#64748B] mb-4">Invoiced vs settled revenue</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#2D3748]">Paid Invoices</span>
                  <span className="text-emerald-700">${paidRevenue.toLocaleString()} ({collectionRate}%)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F0ECE4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5A7865] rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#F0ECE4]">
                  <span className="text-[11px] text-[#64748B] block">Collected</span>
                  <span className="text-sm font-bold text-[#2D3748] mt-0.5 block">
                    ${paidRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#F0ECE4]">
                  <span className="text-[11px] text-[#64748B] block">Pending</span>
                  <span className="text-sm font-bold text-amber-700 mt-0.5 block">
                    ${pendingRevenue.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('billing')}
                className="w-full py-2 bg-[#F5F2EB] hover:bg-[#EAE6DF] text-[#4A5568] text-xs font-semibold rounded-xl transition-colors text-center block"
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
