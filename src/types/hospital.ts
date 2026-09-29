export type Gender = 'Male' | 'Female' | 'Other';
export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending';

export interface DateLike {
  seconds?: number;
  nanoseconds?: number;
  toDate: () => Date;
}

export const toDateObject = (val: any): DateLike => {
  if (!val) {
    const d = new Date();
    return { toDate: () => d };
  }
  if (typeof val.toDate === 'function') {
    return val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return { seconds: Math.floor(val / 1000), toDate: () => d };
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return { seconds: Math.floor(d.getTime() / 1000), toDate: () => d };
  }
  if (val.seconds !== undefined) {
    const d = new Date(val.seconds * 1000 + (val.nanoseconds || 0) / 1000000);
    return { ...val, toDate: () => d };
  }
  const d = new Date(val);
  return { toDate: () => d };
};

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: Gender;
  phone: string;
  diagnosis: string;
  admissionDate: DateLike;
  createdAt: DateLike;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  phone: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: DateLike;
  status: AppointmentStatus;
}

export interface Billing {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  billingDate: DateLike;
}

export type HospitalStaffRole =
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_technician'
  | 'billing'
  | 'admin';

export type StaffStatus = 'on_duty' | 'active' | 'on_leave';

export type StaffShift =
  | 'Morning (08:00 - 16:00)'
  | 'Evening (16:00 - 00:00)'
  | 'Night (00:00 - 08:00)'
  | 'General (09:00 - 17:00)'
  | 'On-Call (Emergency)';

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: HospitalStaffRole;
  roleLabel: string;
  department: string;
  employeeId: string;
  phone: string;
  shift: string;
  status: StaffStatus;
  password?: string;
  avatarUrl?: string;
  specialization?: string;
  createdAt: DateLike;
  lastLoginAt?: DateLike;
}

export type ActiveTab = 'dashboard' | 'patients' | 'doctors' | 'appointments' | 'billing' | 'staff';

