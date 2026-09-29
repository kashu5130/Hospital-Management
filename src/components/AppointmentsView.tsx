import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Calendar,
  Stethoscope,
  Trash2,
  Edit3
} from 'lucide-react';
import { Appointment, Patient, Doctor, AppointmentStatus } from '../types/hospital';
import { Timestamp } from 'firebase/firestore';

interface AppointmentsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  searchTerm: string;
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  onUpdateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id'>>) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  initialPatientForBooking?: Patient | null;
  initialDoctorForBooking?: Doctor | null;
  onClearInitialBookingTargets?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  patients,
  doctors,
  searchTerm,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  initialPatientForBooking,
  initialDoctorForBooking,
  onClearInitialBookingTargets,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | AppointmentStatus>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Upcoming' | 'Past'>('All');
  const [isModalOpen, setIsModalOpen] = useState(
    Boolean(initialPatientForBooking || initialDoctorForBooking)
  );
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientId: initialPatientForBooking?.id || (patients[0]?.id ?? ''),
    doctorId: initialDoctorForBooking?.id || (doctors[0]?.id ?? ''),
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    status: 'Pending' as AppointmentStatus,
  });

  const openAddModal = () => {
    setEditingAppointment(null);
    setFormData({
      patientId: initialPatientForBooking?.id || (patients[0]?.id ?? ''),
      doctorId: initialDoctorForBooking?.id || (doctors[0]?.id ?? ''),
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:00',
      status: 'Pending',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (appt: Appointment) => {
    setEditingAppointment(appt);
    const dateObj = appt.appointmentDate ? appt.appointmentDate.toDate() : new Date();
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toTimeString().slice(0, 5);

    setFormData({
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      status: appt.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      return;
    }

    const patient = patients.find((p) => p.id === formData.patientId);
    const doctor = doctors.find((d) => d.id === formData.doctorId);

    if (!patient || !doctor) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}:00`);
      const appointmentTimestamp = Timestamp.fromDate(dateTime);

      if (editingAppointment) {
        await onUpdateAppointment(editingAppointment.id, {
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          appointmentDate: appointmentTimestamp,
          status: formData.status,
        });
      } else {
        await onAddAppointment({
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          appointmentDate: appointmentTimestamp,
          status: formData.status,
        });
      }
      setIsModalOpen(false);
      onClearInitialBookingTargets?.();
    } catch (err) {
      console.error('Save appointment failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;

    let matchesDate = true;
    if (appt.appointmentDate) {
      const apptDate = appt.appointmentDate.toDate();
      if (dateFilter === 'Today') {
        matchesDate = apptDate >= todayStart && apptDate <= todayEnd;
      } else if (dateFilter === 'Upcoming') {
        matchesDate = apptDate > todayEnd;
      } else if (dateFilter === 'Past') {
        matchesDate = apptDate < todayStart;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div
        className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 space-y-4 transition-colors"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F9F7F2] dark:bg-slate-800/80 rounded-xl border border-[#EAE6DF] dark:border-slate-700 overflow-x-auto w-full sm:w-auto">
            {(['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#5A7865] dark:bg-emerald-600 text-white shadow-xs'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Book Appointment Button */}
          <button
            onClick={openAddModal}
            disabled={patients.length === 0 || doctors.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            title={
              patients.length === 0 || doctors.length === 0
                ? 'Please add at least 1 patient and 1 doctor first'
                : 'Schedule appointment'
            }
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Date Filter Badges */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
          <span className="text-[#64748B] dark:text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" /> Date Frame:
          </span>
          {(['All', 'Today', 'Upcoming', 'Past'] as const).map((df) => (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                dateFilter === df
                  ? 'bg-[#2D3748] dark:bg-slate-700 text-white'
                  : 'bg-[#F5F2EB] dark:bg-slate-800 text-[#4A5568] dark:text-slate-300 hover:bg-[#EAE6DF] dark:hover:bg-slate-700'
              }`}
            >
              {df}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div
        className="bg-white dark:bg-[#141D2B] rounded-2xl border border-[#EAE6DF] dark:border-slate-800 overflow-hidden transition-colors"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="p-4 sm:p-5 border-b border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">Scheduled Encounters</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </p>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7] dark:bg-slate-900/30">
            <CalendarDays className="w-10 h-10 text-[#94A3B8] dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#2D3748] dark:text-slate-200">No appointments found</h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-sm mx-auto px-4">
              {patients.length === 0 || doctors.length === 0
                ? 'Ensure patients and doctors are registered before booking appointments.'
                : 'No consultations match the current filter criteria.'}
            </p>
            {patients.length > 0 && doctors.length > 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-[#5A7865] dark:bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-[#4A6553] cursor-pointer"
              >
                Schedule Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F5F2EB] dark:divide-slate-800">
            {filteredAppointments.map((appt) => {
              const dateObj = appt.appointmentDate ? appt.appointmentDate.toDate() : null;
              const dateStr = dateObj
                ? dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Date Pending';
              const timeStr = dateObj
                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={appt.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#FDFBF7] dark:hover:bg-slate-850/50 transition-colors"
                >
                  {/* Left: Patient, Doctor, Date info */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EEF3EF] dark:bg-emerald-950 border border-[#D5E2D9] dark:border-emerald-800/40 text-[#5A7865] dark:text-emerald-400 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-[#2D3748] dark:text-slate-200 mt-0.5">{timeStr}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">
                          {appt.patientName}
                        </h4>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#64748B] dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-[#4A5568] dark:text-slate-300">
                          <Stethoscope className="w-3.5 h-3.5 text-[#5A7865] dark:text-emerald-400" />
                          {appt.doctorName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Status Actions & Edit/Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {appt.status === 'Pending' && (
                      <button
                        onClick={() => onUpdateAppointment(appt.id, { status: 'Confirmed' })}
                        className="px-3 py-1.5 bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status === 'Confirmed' && (
                      <button
                        onClick={() => onUpdateAppointment(appt.id, { status: 'Completed' })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                    {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                      <button
                        onClick={() => onUpdateAppointment(appt.id, { status: 'Cancelled' })}
                        className="px-3 py-1.5 bg-[#F5F2EB] dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 text-[#64748B] dark:text-slate-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-2 border-l border-[#EAE6DF] dark:border-slate-800 pl-2">
                      <button
                        onClick={() => openEditModal(appt)}
                        className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Reschedule / Edit appointment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(appt)}
                        className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book / Edit Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base sm:text-lg font-bold text-[#2D3748] dark:text-slate-100">
              {editingAppointment ? 'Reschedule Appointment' : 'Book Clinical Appointment'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Connect patient with attending physician.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                >
                  <option value="" disabled>-- Select Admitted Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.diagnosis.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                  Attending Doctor *
                </label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                >
                  <option value="" disabled>-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} - {d.specialization} {!d.isAvailable ? '(On Leave)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                  Initial Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE4] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onClearInitialBookingTargets?.();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Booking...' : editingAppointment ? 'Update Schedule' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-sm w-full p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">Delete Appointment?</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">
              Remove consultation between <strong>{deleteCandidate.patientName}</strong> and{' '}
              <strong>{deleteCandidate.doctorName}</strong>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteAppointment(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Delete Encounter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
