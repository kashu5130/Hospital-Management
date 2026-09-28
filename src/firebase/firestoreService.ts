import {
  ref,
  push,
  set,
  update,
  remove,
  get,
  onValue
} from 'firebase/database';
import { rtdb, handleFirestoreError, OperationType } from './config';
import { Patient, Doctor, Appointment, Billing, toDateObject } from '../types/hospital';

// Helper to sanitize dates for Firebase Realtime Database
const serializeDate = (dateVal: any): number => {
  if (!dateVal) return Date.now();
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  if (typeof dateVal === 'number') {
    return dateVal;
  }
  if (dateVal.seconds !== undefined) {
    return dateVal.seconds * 1000;
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
};

// ==================== PATIENTS CRUD ====================
export const getPatients = async (): Promise<Patient[]> => {
  const path = 'patients';
  try {
    const patientsRef = ref(rtdb, path);
    const snapshot = await get(patientsRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
      admissionDate: toDateObject(data[key].admissionDate),
      createdAt: toDateObject(data[key].createdAt),
    })) as Patient[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribePatients = (
  onData: (patients: Patient[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'patients';
  const patientsRef = ref(rtdb, path);

  return onValue(
    patientsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.val();
      const list: Patient[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        admissionDate: toDateObject(data[key].admissionDate),
        createdAt: toDateObject(data[key].createdAt),
      }));
      // Sort newest first
      list.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
};

export const addPatient = async (patient: Omit<Patient, 'id'>): Promise<string> => {
  const path = 'patients';
  try {
    const patientsRef = ref(rtdb, path);
    const newDocRef = push(patientsRef);
    const id = newDocRef.key!;

    await set(newDocRef, {
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      diagnosis: patient.diagnosis,
      admissionDate: serializeDate(patient.admissionDate),
      createdAt: serializeDate(patient.createdAt || Date.now()),
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updatePatient = async (id: string, updates: Partial<Omit<Patient, 'id'>>): Promise<void> => {
  const path = `patients/${id}`;
  try {
    const patientRef = ref(rtdb, path);
    const serializedUpdates: any = { ...updates };
    if (updates.admissionDate) {
      serializedUpdates.admissionDate = serializeDate(updates.admissionDate);
    }
    if (updates.createdAt) {
      serializedUpdates.createdAt = serializeDate(updates.createdAt);
    }
    await update(patientRef, serializedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  const path = `patients/${id}`;
  try {
    const patientRef = ref(rtdb, path);
    await remove(patientRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ==================== DOCTORS CRUD ====================
export const getDoctors = async (): Promise<Doctor[]> => {
  const path = 'doctors';
  try {
    const doctorsRef = ref(rtdb, path);
    const snapshot = await get(doctorsRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    })) as Doctor[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeDoctors = (
  onData: (doctors: Doctor[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'doctors';
  const doctorsRef = ref(rtdb, path);

  return onValue(
    doctorsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.val();
      const list: Doctor[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
};

export const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<string> => {
  const path = 'doctors';
  try {
    const doctorsRef = ref(rtdb, path);
    const newDocRef = push(doctorsRef);
    const id = newDocRef.key!;

    await set(newDocRef, {
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      phone: doctor.phone,
      isAvailable: Boolean(doctor.isAvailable),
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateDoctor = async (id: string, updates: Partial<Omit<Doctor, 'id'>>): Promise<void> => {
  const path = `doctors/${id}`;
  try {
    const doctorRef = ref(rtdb, path);
    await update(doctorRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteDoctor = async (id: string): Promise<void> => {
  const path = `doctors/${id}`;
  try {
    const doctorRef = ref(rtdb, path);
    await remove(doctorRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ==================== APPOINTMENTS CRUD ====================
export const getAppointments = async (): Promise<Appointment[]> => {
  const path = 'appointments';
  try {
    const apptsRef = ref(rtdb, path);
    const snapshot = await get(apptsRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
      appointmentDate: toDateObject(data[key].appointmentDate),
    })) as Appointment[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeAppointments = (
  onData: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'appointments';
  const apptsRef = ref(rtdb, path);

  return onValue(
    apptsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.val();
      const list: Appointment[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        appointmentDate: toDateObject(data[key].appointmentDate),
      }));
      // Sort upcoming first
      list.sort((a, b) => a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<string> => {
  const path = 'appointments';
  try {
    const apptsRef = ref(rtdb, path);
    const newDocRef = push(apptsRef);
    const id = newDocRef.key!;

    await set(newDocRef, {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      appointmentDate: serializeDate(appointment.appointmentDate),
      status: appointment.status,
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateAppointment = async (id: string, updates: Partial<Omit<Appointment, 'id'>>): Promise<void> => {
  const path = `appointments/${id}`;
  try {
    const apptRef = ref(rtdb, path);
    const serializedUpdates: any = { ...updates };
    if (updates.appointmentDate) {
      serializedUpdates.appointmentDate = serializeDate(updates.appointmentDate);
    }
    await update(apptRef, serializedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  const path = `appointments/${id}`;
  try {
    const apptRef = ref(rtdb, path);
    await remove(apptRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ==================== BILLING CRUD ====================
export const getBillings = async (): Promise<Billing[]> => {
  const path = 'billing';
  try {
    const billingRef = ref(rtdb, path);
    const snapshot = await get(billingRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
      billingDate: toDateObject(data[key].billingDate),
    })) as Billing[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeBillings = (
  onData: (billings: Billing[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'billing';
  const billingRef = ref(rtdb, path);

  return onValue(
    billingRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.val();
      const list: Billing[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        billingDate: toDateObject(data[key].billingDate),
      }));
      list.sort((a, b) => b.billingDate.toDate().getTime() - a.billingDate.toDate().getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
};

export const addBilling = async (billing: Omit<Billing, 'id'>): Promise<string> => {
  const path = 'billing';
  try {
    const billingRef = ref(rtdb, path);
    const newDocRef = push(billingRef);
    const id = newDocRef.key!;

    await set(newDocRef, {
      patientId: billing.patientId,
      patientName: billing.patientName,
      totalAmount: billing.totalAmount,
      paymentStatus: billing.paymentStatus,
      billingDate: serializeDate(billing.billingDate),
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateBilling = async (id: string, updates: Partial<Omit<Billing, 'id'>>): Promise<void> => {
  const path = `billing/${id}`;
  try {
    const billRef = ref(rtdb, path);
    const serializedUpdates: any = { ...updates };
    if (updates.billingDate) {
      serializedUpdates.billingDate = serializeDate(updates.billingDate);
    }
    await update(billRef, serializedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteBilling = async (id: string): Promise<void> => {
  const path = `billing/${id}`;
  try {
    const billRef = ref(rtdb, path);
    await remove(billRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ==================== SAMPLE DATA SEEDER ====================
export const seedSampleHospitalData = async (): Promise<{
  patientsCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  billingCount: number;
}> => {
  const now = Date.now();

  // Sample Doctors
  const doctorsData: Omit<Doctor, 'id'>[] = [
    {
      fullName: 'Dr. Sarah Jenkins, MD',
      specialization: 'Cardiology',
      phone: '+1 (555) 234-8901',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Marcus Vance, DO',
      specialization: 'Neurology',
      phone: '+1 (555) 456-7812',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Elena Rostova, MD',
      specialization: 'Pediatrics',
      phone: '+1 (555) 789-0123',
      isAvailable: false,
    },
    {
      fullName: 'Dr. David Chen, MD',
      specialization: 'Orthopedics',
      phone: '+1 (555) 345-6789',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Amara Patel, MD',
      specialization: 'General Medicine',
      phone: '+1 (555) 890-1234',
      isAvailable: true,
    },
  ];

  const doctorIds: string[] = [];
  for (const docItem of doctorsData) {
    const id = await addDoctor(docItem);
    doctorIds.push(id);
  }

  // Sample Patients
  const patientsData: Omit<Patient, 'id'>[] = [
    {
      fullName: 'Eleanor Vance',
      age: 48,
      gender: 'Female',
      phone: '+1 (555) 901-2345',
      diagnosis: 'Hypertensive heart disease & mild arrhythmia',
      admissionDate: toDateObject(now - 3 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 3 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Lucas Ramirez',
      age: 34,
      gender: 'Male',
      phone: '+1 (555) 678-9012',
      diagnosis: 'Acute lumbar strain and disc herniation',
      admissionDate: toDateObject(now - 1 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 1 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Sophia Nguyen',
      age: 9,
      gender: 'Female',
      phone: '+1 (555) 432-1098',
      diagnosis: 'Seasonal bronchial asthma exacerbation',
      admissionDate: toDateObject(now - 5 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 5 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Arthur Pendelton',
      age: 72,
      gender: 'Male',
      phone: '+1 (555) 876-5432',
      diagnosis: 'Post-operative monitoring after hip arthroplasty',
      admissionDate: toDateObject(now - 7 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 7 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Jordan Miller',
      age: 27,
      gender: 'Other',
      phone: '+1 (555) 321-0987',
      diagnosis: 'Chronic migraine with visual aura',
      admissionDate: toDateObject(now - 2 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 2 * 24 * 3600 * 1000),
    },
  ];

  const patientIds: string[] = [];
  for (const patient of patientsData) {
    const id = await addPatient(patient);
    patientIds.push(id);
  }

  // Sample Appointments
  const appointmentsData: Omit<Appointment, 'id'>[] = [
    {
      patientId: patientIds[0],
      patientName: patientsData[0].fullName,
      doctorId: doctorIds[0],
      doctorName: doctorsData[0].fullName,
      appointmentDate: toDateObject(now + 2 * 3600 * 1000),
      status: 'Confirmed',
    },
    {
      patientId: patientIds[1],
      patientName: patientsData[1].fullName,
      doctorId: doctorIds[3],
      doctorName: doctorsData[3].fullName,
      appointmentDate: toDateObject(now + 5 * 3600 * 1000),
      status: 'Pending',
    },
    {
      patientId: patientIds[4],
      patientName: patientsData[4].fullName,
      doctorId: doctorIds[1],
      doctorName: doctorsData[1].fullName,
      appointmentDate: toDateObject(now + 24 * 3600 * 1000),
      status: 'Confirmed',
    },
    {
      patientId: patientIds[3],
      patientName: patientsData[3].fullName,
      doctorId: doctorIds[3],
      doctorName: doctorsData[3].fullName,
      appointmentDate: toDateObject(now - 12 * 3600 * 1000),
      status: 'Completed',
    },
    {
      patientId: patientIds[2],
      patientName: patientsData[2].fullName,
      doctorId: doctorIds[2],
      doctorName: doctorsData[2].fullName,
      appointmentDate: toDateObject(now + 48 * 3600 * 1000),
      status: 'Pending',
    },
  ];

  for (const appt of appointmentsData) {
    await addAppointment(appt);
  }

  // Sample Billing Invoices
  const billingData: Omit<Billing, 'id'>[] = [
    {
      patientId: patientIds[0],
      patientName: patientsData[0].fullName,
      totalAmount: 1450.0,
      paymentStatus: 'Paid',
      billingDate: toDateObject(now - 2 * 24 * 3600 * 1000),
    },
    {
      patientId: patientIds[1],
      patientName: patientsData[1].fullName,
      totalAmount: 820.5,
      paymentStatus: 'Pending',
      billingDate: toDateObject(now - 1 * 24 * 3600 * 1000),
    },
    {
      patientId: patientIds[3],
      patientName: patientsData[3].fullName,
      totalAmount: 4320.0,
      paymentStatus: 'Paid',
      billingDate: toDateObject(now - 6 * 24 * 3600 * 1000),
    },
    {
      patientId: patientIds[2],
      patientName: patientsData[2].fullName,
      totalAmount: 380.0,
      paymentStatus: 'Paid',
      billingDate: toDateObject(now - 4 * 24 * 3600 * 1000),
    },
    {
      patientId: patientIds[4],
      patientName: patientsData[4].fullName,
      totalAmount: 650.0,
      paymentStatus: 'Pending',
      billingDate: toDateObject(now),
    },
  ];

  for (const bill of billingData) {
    await addBilling(bill);
  }

  return {
    patientsCount: patientsData.length,
    doctorsCount: doctorsData.length,
    appointmentsCount: appointmentsData.length,
    billingCount: billingData.length,
  };
};
