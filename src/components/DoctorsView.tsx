import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  CalendarCheck,
  Search,
  Filter,
  Activity
} from 'lucide-react';
import { Doctor, Appointment } from '../types/hospital';

interface DoctorsViewProps {
  doctors: Doctor[];
  appointments: Appointment[];
  searchTerm: string;
  onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  onUpdateDoctor: (id: string, updates: Partial<Omit<Doctor, 'id'>>) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
  onToggleAvailability: (id: string, current: boolean) => Promise<void>;
  onBookForDoctor: (doctor: Doctor) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  appointments,
  searchTerm,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onToggleAvailability,
  onBookForDoctor,
}) => {
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'Available' | 'On Leave'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    phone: '',
    isAvailable: true,
  });

  const specializations = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean))
  );

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      fullName: '',
      specialization: '',
      phone: '',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      phone: doctor.phone,
      isAvailable: doctor.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.specialization.trim() || !formData.phone.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDoctor) {
        await onUpdateDoctor(editingDoctor.id, {
          fullName: formData.fullName.trim(),
          specialization: formData.specialization.trim(),
          phone: formData.phone.trim(),
          isAvailable: formData.isAvailable,
        });
      } else {
        await onAddDoctor({
          fullName: formData.fullName.trim(),
          specialization: formData.specialization.trim(),
          phone: formData.phone.trim(),
          isAvailable: formData.isAvailable,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving doctor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.phone.includes(searchTerm);
    const matchesSpec =
      selectedSpecialization === 'All' || doc.specialization === selectedSpecialization;
    const matchesAvail =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Available' ? doc.isAvailable : !doc.isAvailable);

    return matchesSearch && matchesSpec && matchesAvail;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] space-y-4"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Availability Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F9F7F2] rounded-xl border border-[#EAE6DF] w-full sm:w-auto">
            {(['All', 'Available', 'On Leave'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setAvailabilityFilter(opt)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  availabilityFilter === opt
                    ? 'bg-[#5A7865] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#2D3748]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Add Doctor Button */}
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Attending Doctor</span>
          </button>
        </div>

        {/* Specialization Filter Pills */}
        {specializations.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-[#64748B] font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Department:
            </span>
            <button
              onClick={() => setSelectedSpecialization('All')}
              className={`px-3 py-1 rounded-full shrink-0 font-medium transition-all ${
                selectedSpecialization === 'All'
                  ? 'bg-[#2D3748] text-white'
                  : 'bg-[#F5F2EB] text-[#4A5568] hover:bg-[#EAE6DF]'
              }`}
            >
              All Specialties ({doctors.length})
            </button>
            {specializations.map((spec) => {
              const count = doctors.filter((d) => d.specialization === spec).length;
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialization(spec)}
                  className={`px-3 py-1 rounded-full shrink-0 font-medium transition-all ${
                    selectedSpecialization === spec
                      ? 'bg-[#5A7865] text-white'
                      : 'bg-[#F5F2EB] text-[#4A5568] hover:bg-[#EAE6DF]'
                  }`}
                >
                  {spec} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctors Grid View */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EAE6DF]">
          <Stethoscope className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#2D3748]">No doctors found</h4>
          <p className="text-xs text-[#64748B] mt-1">
            {searchTerm
              ? `No doctors match "${searchTerm}".`
              : 'Add attending medical doctors to populate the staff directory.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-[#5A7865] text-white text-xs font-semibold rounded-xl hover:bg-[#4A6553]"
          >
            Add Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doctor) => {
            const doctorAppointments = appointments.filter((a) => a.doctorId === doctor.id);
            const pendingAppointments = doctorAppointments.filter((a) => a.status === 'Pending').length;

            return (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl p-5 border border-[#EAE6DF] hover:border-[#5A7865]/40 transition-all flex flex-col justify-between"
                style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EEF3EF] text-[#5A7865] font-bold text-base flex items-center justify-center shrink-0 border border-[#D5E2D9]">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2D3748] text-base leading-tight">
                          {doctor.fullName}
                        </h3>
                        <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F2EB] text-[#5A7865]">
                          {doctor.specialization}
                        </span>
                      </div>
                    </div>

                    {/* Quick Availability Badge & Switch */}
                    <button
                      onClick={() => onToggleAvailability(doctor.id, doctor.isAvailable)}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        doctor.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title="Click to toggle availability in Firestore"
                    >
                      {doctor.isAvailable ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Available
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          On Leave
                        </>
                      )}
                    </button>
                  </div>

                  {/* Doctor Info Details */}
                  <div className="mt-4 pt-4 border-t border-[#F5F2EB] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#4A5568]">
                      <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="font-mono">{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#5A7865]" />
                      <span>{doctorAppointments.length} Total Appointments</span>
                      {pendingAppointments > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                          {pendingAppointments} pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between">
                  <button
                    onClick={() => onBookForDoctor(doctor)}
                    disabled={!doctor.isAvailable}
                    className="px-3 py-1.5 bg-[#EEF3EF] hover:bg-[#E2ECE5] text-[#5A7865] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Appt</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(doctor)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2D3748] hover:bg-[#F5F2EB] transition-colors"
                      title="Edit doctor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(doctor)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete doctor"
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

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EAE6DF] shadow-2xl">
            <h3 className="text-lg font-bold text-[#2D3748]">
              {editingDoctor ? 'Edit Doctor Profile' : 'Add Attending Doctor'}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Add medical doctor details to Firestore directory.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Sarah Jenkins, MD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Medical Specialization *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Cardiology, Neurology, Pediatrics, Orthopedics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={30}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-[#5A7865] rounded-sm focus:ring-[#5A7865] accent-[#5A7865]"
                />
                <label htmlFor="isAvailable" className="text-xs font-semibold text-[#2D3748] cursor-pointer">
                  Currently Available & On Duty
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F5F2EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#5A7865] hover:bg-[#4A6553] shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#EAE6DF] shadow-2xl">
            <h3 className="text-base font-bold text-red-600">Delete Doctor Profile?</h3>
            <p className="text-xs text-[#64748B] mt-2">
              Are you sure you want to remove <strong>{deleteCandidate.fullName}</strong> from the hospital directory?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F5F2EB]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteDoctor(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
