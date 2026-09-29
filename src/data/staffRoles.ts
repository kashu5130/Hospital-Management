import { HospitalStaffRole } from '../types/hospital';

export interface StaffRoleDefinition {
  role: HospitalStaffRole;
  label: string;
  shortTitle: string;
  description: string;
  badgeClass: string;
  accentColor: string;
  bgLight: string;
  borderClass: string;
  gradient: string;
  defaultDepartments: string[];
  suggestedPrefix: string;
  responsibilities: string[];
}

export const HOSPITAL_STAFF_ROLES: Record<HospitalStaffRole, StaffRoleDefinition> = {
  doctor: {
    role: 'doctor',
    label: 'Doctor / Physician',
    shortTitle: 'Doctor',
    description: 'Diagnoses clinical conditions, conducts consultations, and creates medical treatment plans.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentColor: '#4F46E5',
    bgLight: '#EEF2FF',
    borderClass: 'border-indigo-200',
    gradient: 'from-indigo-600 to-violet-600',
    defaultDepartments: [
      'Cardiology',
      'Neurology',
      'Pediatrics',
      'Orthopedics',
      'General Medicine',
      'Emergency Medicine',
      'Oncology'
    ],
    suggestedPrefix: 'DOC',
    responsibilities: [
      'Conduct patient consultations and diagnosis',
      'Prescribe medications and therapeutic regimens',
      'Manage scheduled outpatient appointments',
      'Review patient medical admission records'
    ]
  },
  nurse: {
    role: 'nurse',
    label: 'Clinical Nurse',
    shortTitle: 'Nurse',
    description: 'Manages bedside patient care, vitals tracking, ward admissions, and clinical monitoring.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: '#E11D48',
    bgLight: '#FFF1F2',
    borderClass: 'border-rose-200',
    gradient: 'from-rose-500 to-pink-600',
    defaultDepartments: [
      'ICU & Critical Care',
      'Emergency Department',
      'Inpatient Ward A',
      'Pediatric Nursing',
      'Post-Operative Recovery'
    ],
    suggestedPrefix: 'NUR',
    responsibilities: [
      'Monitor patient vital signs and recovery',
      'Assist in patient admission and room placement',
      'Coordinate with doctors for urgent care rounds',
      'Administer physician-prescribed treatments'
    ]
  },
  receptionist: {
    role: 'receptionist',
    label: 'Receptionist / Front Desk',
    shortTitle: 'Receptionist',
    description: 'Welcomes patients, conducts registration, manages consultation queues, and books appointments.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    accentColor: '#D97706',
    bgLight: '#FFFBEB',
    borderClass: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
    defaultDepartments: [
      'Main Front Desk',
      'Outpatient Admissions',
      'Patient Registration Desk',
      'Emergency Triage Desk'
    ],
    suggestedPrefix: 'REC',
    responsibilities: [
      'Register incoming hospital patients into database',
      'Schedule appointments with available doctors',
      'Verify patient contact and demographic information',
      'Direct patients to respective clinic departments'
    ]
  },
  pharmacist: {
    role: 'pharmacist',
    label: 'Clinical Pharmacist',
    shortTitle: 'Pharmacist',
    description: 'Dispenses medications, reviews drug safety contraindications, and monitors pharmacy stock.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: '#059669',
    bgLight: '#ECFDF5',
    borderClass: 'border-emerald-200',
    gradient: 'from-emerald-600 to-teal-600',
    defaultDepartments: [
      'Central Hospital Pharmacy',
      'Outpatient Dispensary',
      'Emergency Medication Vault'
    ],
    suggestedPrefix: 'PHARM',
    responsibilities: [
      'Fulfill doctor medication prescriptions',
      'Verify pharmaceutical dosages and contraindications',
      'Manage hospital pharmacy drug inventory',
      'Counsel patients on medication usage'
    ]
  },
  lab_technician: {
    role: 'lab_technician',
    label: 'Laboratory Technician',
    shortTitle: 'Lab Tech',
    description: 'Conducts diagnostic blood tests, pathology workups, and medical imaging evaluations.',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    accentColor: '#0891B2',
    bgLight: '#ECFEFF',
    borderClass: 'border-cyan-200',
    gradient: 'from-cyan-600 to-blue-600',
    defaultDepartments: [
      'Clinical Pathology',
      'Hematology & Blood Bank',
      'Biochemistry Lab',
      'Radiology & Diagnostics'
    ],
    suggestedPrefix: 'LAB',
    responsibilities: [
      'Process diagnostic blood and tissue specimens',
      'Operate pathology and biochemistry analyzers',
      'Publish verified lab diagnostic reports',
      'Maintain specimen custody and laboratory quality'
    ]
  },
  billing: {
    role: 'billing',
    label: 'Billing & Finance Officer',
    shortTitle: 'Billing Officer',
    description: 'Manages patient invoicing, insurance verification, receipts, and revenue reconciliation.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: '#2563EB',
    bgLight: '#EFF6FF',
    borderClass: 'border-blue-200',
    gradient: 'from-blue-600 to-indigo-700',
    defaultDepartments: [
      'Patient Accounts Office',
      'Insurance & Claims Desk',
      'Cashier Desk',
      'Financial Audit Department'
    ],
    suggestedPrefix: 'BILL',
    responsibilities: [
      'Issue and settle clinical invoices and charges',
      'Process private and public health insurance claims',
      'Print official payment receipts for discharge',
      'Audit daily financial collections in Firebase'
    ]
  },
  admin: {
    role: 'admin',
    label: 'Hospital Administrator',
    shortTitle: 'Administrator',
    description: 'Oversees hospital operations, staff credentials, database integrity, and institutional metrics.',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#334155',
    bgLight: '#F8FAFC',
    borderClass: 'border-slate-300',
    gradient: 'from-slate-700 to-slate-900',
    defaultDepartments: [
      'Hospital Executive Directorate',
      'Clinical Operations Office',
      'Human Resources & Compliance',
      'Information Technology'
    ],
    suggestedPrefix: 'ADM',
    responsibilities: [
      'Manage hospital staff accounts and credentials',
      'Oversee database records across all departments',
      'Monitor clinical capacity and emergency readiness',
      'Ensure institutional compliance and healthcare standards'
    ]
  }
};

export const STAFF_ROLE_LIST = Object.values(HOSPITAL_STAFF_ROLES);
