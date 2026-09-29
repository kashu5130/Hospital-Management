import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CalendarPlus,
  Receipt,
  Eye,
  X,
  Phone
} from 'lucide-react';
import { Patient, Appointment, Billing, Gender } from '../types/hospital';
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
      age: String(patient.age),
      gender: patient.gender,
      phone: patient.phone,
      diagnosis: patient.diagnosis,
      admissionDate: dateObj.toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fullName.trim() ||
      !formData.age ||
      !formData.phone.trim() ||
      !formData.diagnosis.trim() ||
      !formData.admissionDate
    ) {
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
    <div className="space-y-5 sm:space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div
        className="bg-white dark:bg-[#141D2B] rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        {/* Gender Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#F9F7F2] dark:bg-slate-800/80 rounded-xl border border-[#EAE6DF] dark:border-slate-700 w-full sm:w-auto">
          {(['All', 'Female', 'Male', 'Other'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                genderFilter === g
                  ? 'bg-[#5A7865] dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Add Patient Button */}
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Patients Data Container */}
      <div
        className="bg-white dark:bg-[#141D2B] rounded-2xl border border-[#EAE6DF] dark:border-slate-800 overflow-hidden transition-colors"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="p-4 sm:p-5 border-b border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#2D3748] dark:text-slate-100 text-sm sm:text-base">Patient Roster</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Showing {filteredPatients.length} of {patients.length} admitted patients
            </p>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7] dark:bg-slate-900/30">
            <Users className="w-10 h-10 text-[#94A3B8] dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#2D3748] dark:text-slate-200">No patients found</h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-sm mx-auto px-4">
              {searchTerm
                ? `No patient records matching "${searchTerm}". Try adjusting your search term.`
                : 'Click "Register New Patient" or "Seed Data" to add clinical patient records.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-[#5A7865] dark:bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-[#4A6553] cursor-pointer"
            >
              Register Patient
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (< md) */}
            <div className="md:hidden divide-y divide-[#F0ECE4] dark:divide-slate-800">
              {filteredPatients.map((patient) => {
                const admDate = patient.admissionDate ? patient.admissionDate.toDate() : null;
                return (
                  <div key={patient.id} className="p-4 space-y-3 hover:bg-[#FDFBF7] dark:hover:bg-slate-850/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950 text-[#5A7865] dark:text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0 border border-[#D5E2D9] dark:border-emerald-800/40">
                          {patient.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#2D3748] dark:text-slate-100">{patient.fullName}</h4>
                          <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                            {patient.age} yrs • {patient.gender}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 bg-[#F5F2EB] dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {admDate ? admDate.toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="text-xs text-[#4A5568] dark:text-slate-300 bg-[#F9F7F2] dark:bg-slate-800/60 p-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700/60">
                      <span className="font-semibold text-[#2D3748] dark:text-slate-200 block text-[11px] mb-0.5">Diagnosis:</span>
                      {patient.diagnosis}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#64748B] dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#5A7865] dark:text-emerald-400" />
                        {patient.phone}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 cursor-pointer"
                          title="View patient history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onBookForPatient(patient)}
                          className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 cursor-pointer"
                          title="Book appointment"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onBillForPatient(patient)}
                          className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 cursor-pointer"
                          title="Create bill"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit patient"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(patient)}
                          className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Delete patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FDFBF7] dark:bg-slate-850/60 text-[#64748B] dark:text-slate-400 text-xs font-semibold border-b border-[#EAE6DF] dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Patient Details</th>
                    <th className="py-3.5 px-4">Age & Gender</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Primary Diagnosis</th>
                    <th className="py-3.5 px-4">Admission Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2EB] dark:divide-slate-800">
                  {filteredPatients.map((patient) => {
                    const admDate = patient.admissionDate ? patient.admissionDate.toDate() : null;
                    return (
                      <tr key={patient.id} className="hover:bg-[#FDFBF7]/80 dark:hover:bg-slate-850/50 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#EEF3EF] dark:bg-emerald-950 text-[#5A7865] dark:text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0 border border-[#D5E2D9] dark:border-emerald-800/40">
                              {patient.fullName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-[#2D3748] dark:text-slate-100 block leading-tight">
                                {patient.fullName}
                              </span>
                              <span className="text-[11px] text-[#64748B] dark:text-slate-400">ID: {patient.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Age & Gender */}
                        <td className="py-4 px-4 text-xs text-[#2D3748] dark:text-slate-200">
                          <span className="font-medium">{patient.age} yrs</span>
                          <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">{patient.gender}</span>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 text-xs text-[#4A5568] dark:text-slate-300 font-mono">
                          {patient.phone}
                        </td>

                        {/* Diagnosis */}
                        <td className="py-4 px-4">
                          <span
                            className="inline-block max-w-[220px] truncate text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F5F2EB] dark:bg-slate-800 text-[#4A5568] dark:text-slate-300"
                            title={patient.diagnosis}
                          >
                            {patient.diagnosis}
                          </span>
                        </td>

                        {/* Admission Date */}
                        <td className="py-4 px-4 text-xs text-[#64748B] dark:text-slate-400">
                          {admDate ? admDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View patient history & records"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onBookForPatient(patient)}
                              className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Book appointment for patient"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onBillForPatient(patient)}
                              className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#5A7865] dark:hover:text-emerald-400 hover:bg-[#EEF3EF] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Create invoice for patient"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(patient)}
                              className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit patient"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(patient)}
                              className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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
          </>
        )}
      </div>

      {/* Add / Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base sm:text-lg font-bold text-[#2D3748] dark:text-slate-100">
              {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Enter clinical and demographic details for database sync.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98701 11223"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3748] dark:text-slate-200 mb-1">
                  Primary Medical Diagnosis *
                </label>
                <textarea
                  required
                  maxLength={300}
                  rows={3}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="e.g. Hypertensive heart disease, acute bronchitis..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] dark:border-slate-700 text-xs sm:text-sm focus:border-[#5A7865] dark:focus:border-emerald-500 focus:outline-hidden bg-[#FDFBF7] dark:bg-slate-800 text-[#2D3748] dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE4] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:bg-[#F5F2EB] dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE4] dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EEF3EF] dark:bg-emerald-950 text-[#5A7865] dark:text-emerald-400 font-extrabold text-lg flex items-center justify-center border border-[#D5E2D9] dark:border-emerald-800/40">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#2D3748] dark:text-slate-100">{selectedPatient.fullName}</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-[#94A3B8] hover:text-[#2D3748] dark:hover:text-slate-200 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FDFBF7] dark:bg-slate-850/60 border border-[#F0ECE4] dark:border-slate-850">
                <span className="text-xs font-bold text-[#5A7865] dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Active Clinical Diagnosis
                </span>
                <p className="text-xs sm:text-sm font-medium text-[#2D3748] dark:text-slate-200">{selectedPatient.diagnosis}</p>
                <span className="text-[11px] text-[#64748B] dark:text-slate-400 block mt-1">
                  Admitted:{' '}
                  {selectedPatient.admissionDate?.toDate().toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>

              {/* Linked Appointments */}
              <div>
                <h4 className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider mb-2">
                  Linked Appointments
                </h4>
                {appointments.filter((a) => a.patientId === selectedPatient.id).length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-slate-400 italic">No appointments booked for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => a.patientId === selectedPatient.id)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F7F2] dark:bg-slate-850 text-xs border border-transparent dark:border-slate-800"
                        >
                          <div>
                            <span className="font-semibold text-[#2D3748] dark:text-slate-200">{a.doctorName}</span>
                            <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">
                              {a.appointmentDate?.toDate().toLocaleString()}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-[#5A7865] dark:text-emerald-400 border border-[#EAE6DF] dark:border-slate-700">
                            {a.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Linked Invoices */}
              <div>
                <h4 className="text-xs font-bold text-[#2D3748] dark:text-slate-200 uppercase tracking-wider mb-2">
                  Linked Billing Records
                </h4>
                {billings.filter((b) => b.patientId === selectedPatient.id).length === 0 ? (
                  <p className="text-xs text-[#64748B] dark:text-slate-400 italic">No invoices issued for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {billings
                      .filter((b) => b.patientId === selectedPatient.id)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F7F2] dark:bg-slate-850 text-xs border border-transparent dark:border-slate-800"
                        >
                          <div>
                            <span className="font-bold text-[#2D3748] dark:text-slate-100">${b.totalAmount.toFixed(2)}</span>
                            <span className="text-[#64748B] dark:text-slate-400 block text-[11px]">
                              {b.billingDate?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5A7865] dark:bg-emerald-600 hover:bg-[#4A6553] cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#141D2B] rounded-2xl max-w-sm w-full p-6 border border-[#EAE6DF] dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">Delete Patient Record?</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2">
              Are you sure you want to delete <strong>{deleteCandidate.fullName}</strong> from the database? This action cannot be undone.
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
                  await onDeletePatient(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs cursor-pointer"
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
