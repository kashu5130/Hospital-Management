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
import { Patient, Doctor, Appointment, Billing, StaffUser, HospitalStaffRole, toDateObject, DateLike } from '../types/hospital';

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
  staffCount: number;
}> => {
  const now = Date.now();

  // Clear existing records for clean Indian names migration
  try {
    await remove(ref(rtdb, 'patients'));
    await remove(ref(rtdb, 'doctors'));
    await remove(ref(rtdb, 'appointments'));
    await remove(ref(rtdb, 'billing'));
    await remove(ref(rtdb, 'staff_users'));
  } catch (e) {
    console.warn('Cleared existing records before seeding:', e);
  }

  // Sample Doctors with Indian names
  const doctorsData: Omit<Doctor, 'id'>[] = [
    {
      fullName: 'Dr. Rajesh Sharma, MD',
      specialization: 'Cardiology',
      phone: '+91 98201 23456',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Priya Venkatesh, MD',
      specialization: 'Neurology',
      phone: '+91 98334 55667',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Arjun Kapoor, MD',
      specialization: 'Pediatrics',
      phone: '+91 98445 66778',
      isAvailable: false,
    },
    {
      fullName: 'Dr. Sunita Sen, MS',
      specialization: 'Orthopedics',
      phone: '+91 98556 77889',
      isAvailable: true,
    },
    {
      fullName: 'Dr. Amit Patel, MD',
      specialization: 'General Medicine',
      phone: '+91 98667 88990',
      isAvailable: true,
    },
  ];

  const doctorIds: string[] = [];
  for (const docItem of doctorsData) {
    const id = await addDoctor(docItem);
    doctorIds.push(id);
  }

  // Sample Patients with Indian names
  const patientsData: Omit<Patient, 'id'>[] = [
    {
      fullName: 'Aarav Sharma',
      age: 48,
      gender: 'Male',
      phone: '+91 98701 11223',
      diagnosis: 'Hypertensive heart disease & mild arrhythmia',
      admissionDate: toDateObject(now - 3 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 3 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Deepak Verma',
      age: 34,
      gender: 'Male',
      phone: '+91 98702 22334',
      diagnosis: 'Acute lumbar strain and disc herniation',
      admissionDate: toDateObject(now - 1 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 1 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Ananya Iyer',
      age: 9,
      gender: 'Female',
      phone: '+91 98703 33445',
      diagnosis: 'Seasonal bronchial asthma exacerbation',
      admissionDate: toDateObject(now - 5 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 5 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Rameshchandra Gupta',
      age: 72,
      gender: 'Male',
      phone: '+91 98704 44556',
      diagnosis: 'Post-operative monitoring after hip arthroplasty',
      admissionDate: toDateObject(now - 7 * 24 * 3600 * 1000),
      createdAt: toDateObject(now - 7 * 24 * 3600 * 1000),
    },
    {
      fullName: 'Kavita Reddy',
      age: 27,
      gender: 'Female',
      phone: '+91 98705 55667',
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

  // Sample Appointments with Indian names
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

  // Sample Billing Invoices with Indian patient names
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

  // Also seed initial staff members for every hospital staff type
  const staff = await seedInitialStaffUsers(true);

  return {
    patientsCount: patientsData.length,
    doctorsCount: doctorsData.length,
    appointmentsCount: appointmentsData.length,
    billingCount: billingData.length,
    staffCount: staff.length,
  };
};

// ==================== HOSPITAL STAFF USERS CRUD ====================
export const getStaffUsers = async (): Promise<StaffUser[]> => {
  const path = 'staff_users';
  try {
    const staffRef = ref(rtdb, path);
    const snapshot = await get(staffRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
      createdAt: toDateObject(data[key].createdAt),
      lastLoginAt: data[key].lastLoginAt ? toDateObject(data[key].lastLoginAt) : undefined,
    })) as StaffUser[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeStaffUsers = (
  onData: (staff: StaffUser[]) => void,
  onError?: (err: Error) => void
) => {
  const path = 'staff_users';
  const staffRef = ref(rtdb, path);

  return onValue(
    staffRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.val();
      const list: StaffUser[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        createdAt: toDateObject(data[key].createdAt),
        lastLoginAt: data[key].lastLoginAt ? toDateObject(data[key].lastLoginAt) : undefined,
      }));
      // Sort newest or by role
      list.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
};

export const addStaffUser = async (
  staff: Omit<StaffUser, 'id'>,
  customId?: string
): Promise<string> => {
  const path = 'staff_users';
  try {
    let targetRef;
    let id: string;

    if (customId) {
      targetRef = ref(rtdb, `${path}/${customId}`);
      id = customId;
    } else {
      const staffRef = ref(rtdb, path);
      targetRef = push(staffRef);
      id = targetRef.key!;
    }

    const payload = {
      fullName: staff.fullName,
      email: staff.email.toLowerCase().trim(),
      role: staff.role,
      roleLabel: staff.roleLabel,
      department: staff.department,
      employeeId: staff.employeeId.toUpperCase().trim(),
      phone: staff.phone,
      shift: staff.shift || 'General (09:00 - 17:00)',
      status: staff.status || 'on_duty',
      password: staff.password || 'password123',
      avatarUrl: staff.avatarUrl || '',
      specialization: staff.specialization || '',
      createdAt: serializeDate(staff.createdAt || Date.now()),
      lastLoginAt: serializeDate(Date.now()),
    };

    await set(targetRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateStaffUser = async (
  id: string,
  updates: Partial<StaffUser>
): Promise<void> => {
  const path = `staff_users/${id}`;
  try {
    const itemRef = ref(rtdb, path);
    const serializedUpdates: any = { ...updates };

    if (updates.email) {
      serializedUpdates.email = updates.email.toLowerCase().trim();
    }
    if (updates.employeeId) {
      serializedUpdates.employeeId = updates.employeeId.toUpperCase().trim();
    }
    if (updates.createdAt) {
      serializedUpdates.createdAt = serializeDate(updates.createdAt);
    }
    if (updates.lastLoginAt) {
      serializedUpdates.lastLoginAt = serializeDate(updates.lastLoginAt);
    }

    await update(itemRef, serializedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteStaffUser = async (id: string): Promise<void> => {
  const path = `staff_users/${id}`;
  try {
    const itemRef = ref(rtdb, path);
    await remove(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Authenticate staff by email or employee ID
export const authenticateStaffUser = async (
  identifier: string,
  password?: string
): Promise<StaffUser | null> => {
  const cleanId = identifier.trim().toLowerCase();
  const staff = await getStaffUsers();

  const found = staff.find(
    (s) =>
      s.email.toLowerCase() === cleanId ||
      s.employeeId.toLowerCase() === cleanId
  );

  if (!found) {
    throw new Error(`No hospital staff record found for "${identifier}". Please check your email or employee badge ID.`);
  }

  if (password && found.password && found.password !== password) {
    throw new Error('Incorrect staff passcode or password. Please try again.');
  }

  // Update last login timestamp in background
  updateStaffUser(found.id, { lastLoginAt: toDateObject(Date.now()), status: 'on_duty' }).catch(() => {});

  return {
    ...found,
    status: 'on_duty',
    lastLoginAt: toDateObject(Date.now()),
  };
};

// Default seed records for every hospital staff type with Indian names
export const INITIAL_STAFF_MEMBERS: Omit<StaffUser, 'id'>[] = [
  {
    fullName: 'Dr. Rajesh Sharma, MD',
    email: 'rajesh.sharma@vitaspectra.health',
    role: 'doctor',
    roleLabel: 'Doctor / Physician',
    department: 'Cardiology',
    employeeId: 'DOC-101',
    phone: '+91 98201 23456',
    shift: 'Morning (08:00 - 16:00)',
    status: 'on_duty',
    specialization: 'Cardiovascular Surgery',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 120 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Pooja Nair, BSN RN',
    email: 'pooja.nair@vitaspectra.health',
    role: 'nurse',
    roleLabel: 'Clinical Nurse',
    department: 'ICU & Critical Care',
    employeeId: 'NUR-204',
    phone: '+91 98312 34567',
    shift: 'Morning (08:00 - 16:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 90 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Rohan Verma',
    email: 'rohan.verma@vitaspectra.health',
    role: 'receptionist',
    roleLabel: 'Receptionist / Front Desk',
    department: 'Main Front Desk',
    employeeId: 'REC-302',
    phone: '+91 98453 45678',
    shift: 'General (09:00 - 17:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 60 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Ananya Deshmukh, M.Pharm',
    email: 'ananya.deshmukh@vitaspectra.health',
    role: 'pharmacist',
    roleLabel: 'Clinical Pharmacist',
    department: 'Central Hospital Pharmacy',
    employeeId: 'PHARM-401',
    phone: '+91 98765 43210',
    shift: 'General (09:00 - 17:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 45 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Dr. Vikram Malhotra, PhD',
    email: 'vikram.malhotra@vitaspectra.health',
    role: 'lab_technician',
    roleLabel: 'Laboratory Technician',
    department: 'Clinical Pathology & Hematology',
    employeeId: 'LAB-502',
    phone: '+91 98111 22334',
    shift: 'Morning (08:00 - 16:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 40 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Suresh Iyer',
    email: 'suresh.iyer@vitaspectra.health',
    role: 'billing',
    roleLabel: 'Billing & Finance Officer',
    department: 'Patient Accounts Office',
    employeeId: 'BILL-601',
    phone: '+91 98920 33445',
    shift: 'General (09:00 - 17:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 30 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
  {
    fullName: 'Sunita Mehra, MHA',
    email: 'sunita.mehra@vitaspectra.health',
    role: 'admin',
    roleLabel: 'Hospital Administrator',
    department: 'Hospital Executive Directorate',
    employeeId: 'ADM-001',
    phone: '+91 98100 99887',
    shift: 'General (09:00 - 17:00)',
    status: 'on_duty',
    password: 'password123',
    createdAt: toDateObject(Date.now() - 150 * 24 * 3600 * 1000),
    lastLoginAt: toDateObject(Date.now()),
  },
];

// Ensure initial staff records exist in Firebase for all staff types
export const seedInitialStaffUsers = async (forceOverwrite: boolean = false): Promise<StaffUser[]> => {
  const existing = await getStaffUsers();
  const hasOldNames = existing.some(
    (s) =>
      s.fullName.includes('Vance') ||
      s.fullName.includes('Rostova') ||
      s.fullName.includes('Kalu') ||
      s.fullName.includes('Bennett')
  );

  if (!forceOverwrite && existing && existing.length > 0 && !hasOldNames) {
    return existing;
  }

  const createdStaff: StaffUser[] = [];
  for (const staff of INITIAL_STAFF_MEMBERS) {
    const id = staff.employeeId.toLowerCase();
    await addStaffUser(staff, id);
    createdStaff.push({ id, ...staff });
  }

  return createdStaff;
};

// ==================== STAFF AUDIT LOGS & EMERGENCY RECOVERY ====================
export interface StaffAuditLog {
  id: string;
  timestamp: DateLike;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'REGISTRATION' | 'PASSWORD_RESET' | 'EMERGENCY_ACCESS' | 'LOGOUT';
  staffId?: string;
  staffName?: string;
  role?: string;
  identifier?: string;
  status: 'SUCCESS' | 'FAILURE';
  notes?: string;
}

export const logStaffAuditEvent = async (
  event: Omit<StaffAuditLog, 'id' | 'timestamp'>
): Promise<string> => {
  const path = 'staff_audit_logs';
  try {
    const logRef = push(ref(rtdb, path));
    const payload = {
      ...event,
      timestamp: serializeDate(Date.now()),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'Browser Terminal',
    };
    await set(logRef, payload);
    return logRef.key!;
  } catch (err) {
    console.warn('Audit log write error:', err);
    return '';
  }
};

export const resetStaffPassword = async (
  identifier: string,
  newPasscode: string
): Promise<StaffUser> => {
  const clean = identifier.trim().toLowerCase();
  const staff = await getStaffUsers();
  const found = staff.find(
    (s) => s.email.toLowerCase() === clean || s.employeeId.toLowerCase() === clean
  );

  if (!found) {
    throw new Error(`No staff member found matching "${identifier}". Please check your email or badge ID.`);
  }

  await updateStaffUser(found.id, { password: newPasscode });
  await logStaffAuditEvent({
    action: 'PASSWORD_RESET',
    staffId: found.id,
    staffName: found.fullName,
    role: found.role,
    identifier,
    status: 'SUCCESS',
    notes: 'Passcode successfully reset via emergency staff workflow',
  });

  return { ...found, password: newPasscode };
};
