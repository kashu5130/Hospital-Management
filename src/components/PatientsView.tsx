import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Phone,
  FileText,
  UserCheck,
  CalendarPlus,
  Receipt
} from 'lucide-react';
import { Patient, Gender, Appointment, Billing } from '../types/hospital';
import { Timestamp } from 'firebase/firestore';

interface PatientsViewProps {
  patients: Patient[];
  appointments: Appointment[];
  billings: Billing[];
  searchTerm: string;
  onAddPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  onUpdatePatient: (id: string, updates: Partial<Omit<Patient, 'id'>>) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  onBookForPatient: (patient: Patient) => void;
  onBillForPatient: (patient: Patient) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  appointments,
  billings,
  searchTerm,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onBookForPatient,
  onBillForPatient,
}) => {
  const [genderFilter, setGenderFilter] = useState<'All' | Gender>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Female' as Gender,
    phone: '',
    diagnosis: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      fullName: '',
      age: '',
      gender: 'Female',
      phone: '',
      diagnosis: '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    const dateObj = patient.admissionDate ? patient.admissionDate.toDate() : new Date();
    setFormData({
      fullName: patient.fullName,
      age: patient.age.toString(),
      gender: patient.gender,
      phone: patient.phone,
      diagnosis: patient.diagnosis,
      admissionDate: dateObj.toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.age || !formData.phone.trim() || !formData.diagnosis.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const admissionTimestamp = Timestamp.fromDate(new Date(formData.admissionDate));

      if (editingPatient) {
        await onUpdatePatient(editingPatient.id, {
          fullName: formData.fullName.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim(),
          diagnosis: formData.diagnosis.trim(),
          admissionDate: admissionTimestamp,
          createdAt: editingPatient.createdAt || Timestamp.now(),
        });
      } else {
        await onAddPatient({
          fullName: formData.fullName.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim(),
          diagnosis: formData.diagnosis.trim(),
          admissionDate: admissionTimestamp,
          createdAt: Timestamp.now(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Save patient failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        {/* Gender Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F9F7F2] rounded-xl border border-[#EAE6DF] w-full sm:w-auto">
          {(['All', 'Female', 'Male', 'Other'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                genderFilter === g
                  ? 'bg-[#5A7865] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#2D3748]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Add Patient Button */}
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Patients Data Table */}
      <div
        className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="p-5 border-b border-[#F0ECE4] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#2D3748] text-base">Patient Roster</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Showing {filteredPatients.length} of {patients.length} admitted patients
            </p>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7]">
            <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#2D3748]">No patients found</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `No patient records matching "${searchTerm}". Try adjusting your search term.`
                : 'Click "Register New Patient" or "Seed Demo Data" to add clinical patient records.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-[#5A7865] text-white text-xs font-semibold rounded-xl hover:bg-[#4A6553]"
            >
              Register Patient
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FDFBF7] text-[#64748B] text-xs font-semibold border-b border-[#EAE6DF]">
                <tr>
                  <th className="py-3.5 px-5">Patient Details</th>
                  <th className="py-3.5 px-4">Age & Gender</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Primary Diagnosis</th>
                  <th className="py-3.5 px-4">Admission Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EB]">
                {filteredPatients.map((patient) => {
                  const admDate = patient.admissionDate ? patient.admissionDate.toDate() : null;
                  return (
                    <tr key={patient.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EEF3EF] text-[#5A7865] font-bold text-sm flex items-center justify-center shrink-0 border border-[#D5E2D9]">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#2D3748] block leading-tight">
                              {patient.fullName}
                            </span>
                            <span className="text-[11px] text-[#64748B]">ID: {patient.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Age & Gender */}
                      <td className="py-4 px-4 text-xs text-[#2D3748]">
                        <span className="font-medium">{patient.age} yrs</span>
                        <span className="text-[#64748B] block text-[11px]">{patient.gender}</span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 text-xs text-[#4A5568] font-mono">
                        {patient.phone}
                      </td>

                      {/* Diagnosis */}
                      <td className="py-4 px-4">
                        <span
                          className="inline-block max-w-[220px] truncate text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F5F2EB] text-[#4A5568]"
                          title={patient.diagnosis}
                        >
                          {patient.diagnosis}
                        </span>
                      </td>

                      {/* Admission Date */}
                      <td className="py-4 px-4 text-xs text-[#64748B]">
                        {admDate ? admDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#5A7865] hover:bg-[#EEF3EF] transition-colors"
                            title="View patient history & records"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onBookForPatient(patient)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#5A7865] hover:bg-[#EEF3EF] transition-colors"
                            title="Book appointment for patient"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onBillForPatient(patient)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#5A7865] hover:bg-[#EEF3EF] transition-colors"
                            title="Create invoice for patient"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(patient)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2D3748] hover:bg-[#F5F2EB] transition-colors"
                            title="Edit patient"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(patient)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EAE6DF] shadow-2xl">
            <h3 className="text-lg font-bold text-[#2D3748]">
              {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter clinical and demographic details for Firestore sync.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={150}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 42"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Phone Number *
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
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Primary Medical Diagnosis *
                </label>
                <textarea
                  required
                  maxLength={300}
                  rows={3}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="e.g. Hypertensive heart disease, acute bronchitis..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE4]">
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
                  {isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Drawer / Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-[#EAE6DF] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF3EF] text-[#5A7865] font-extrabold text-lg flex items-center justify-center">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2D3748]">{selectedPatient.fullName}</h3>
                  <p className="text-xs text-[#64748B]">
                    {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-[#94A3B8] hover:text-[#2D3748] p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#F0ECE4]">
                <span className="text-xs font-bold text-[#5A7865] uppercase tracking-wider block mb-1">
                  Active Clinical Diagnosis
                </span>
                <p className="text-sm font-medium text-[#2D3748]">{selectedPatient.diagnosis}</p>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Admitted:{' '}
                  {selectedPatient.admissionDate?.toDate().toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>

              {/* Linked Appointments */}
              <div>
                <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider mb-2">
                  Linked Appointments
                </h4>
                {appointments.filter((a) => a.patientId === selectedPatient.id).length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">No appointments booked for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => a.patientId === selectedPatient.id)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F7F2] text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#2D3748]">{a.doctorName}</span>
                            <span className="text-[#64748B] block text-[11px]">
                              {a.appointmentDate?.toDate().toLocaleString()}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#5A7865] border border-[#EAE6DF]">
                            {a.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Linked Invoices */}
              <div>
                <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider mb-2">
                  Linked Billing Records
                </h4>
                {billings.filter((b) => b.patientId === selectedPatient.id).length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">No invoices issued for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {billings
                      .filter((b) => b.patientId === selectedPatient.id)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F7F2] text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#2D3748]">${b.totalAmount.toFixed(2)}</span>
                            <span className="text-[#64748B] block text-[11px]">
                              {b.billingDate?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5A7865] hover:bg-[#4A6553]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#EAE6DF] shadow-2xl">
            <h3 className="text-base font-bold text-red-600">Delete Patient Record?</h3>
            <p className="text-xs text-[#64748B] mt-2">
              Are you sure you want to delete <strong>{deleteCandidate.fullName}</strong> from Firestore? This action cannot be undone.
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
                  await onDeletePatient(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
