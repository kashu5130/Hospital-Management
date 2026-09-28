import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  checkLiveConnection,
  subscribeRTDBConnection,
  ConnectionStatusResult
} from './firebase/config';
import {
  subscribePatients,
  subscribeDoctors,
  subscribeAppointments,
  subscribeBillings,
  addPatient,
  updatePatient,
  deletePatient,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  addBilling,
  updateBilling,
  deleteBilling,
  seedSampleHospitalData
} from './firebase/firestoreService';
import { Patient, Doctor, Appointment, Billing, ActiveTab } from './types/hospital';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { DoctorsView } from './components/DoctorsView';
import { AppointmentsView } from './components/AppointmentsView';
import { BillingView } from './components/BillingView';
import { ConnectionModal } from './components/ConnectionModal';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Live Firebase Connection State (green if connected, red if not connected)
  const [connectionState, setConnectionState] = useState<ConnectionStatusResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState<boolean>(false);

  // Collections state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pre-fill states for cross-module booking / billing
  const [bookingPatientTarget, setBookingPatientTarget] = useState<Patient | null>(null);
  const [bookingDoctorTarget, setBookingDoctorTarget] = useState<Doctor | null>(null);
  const [billingPatientTarget, setBillingPatientTarget] = useState<Patient | null>(null);

  // Quick Action Modal triggers for Header
  const [triggerNewPatientModal, setTriggerNewPatientModal] = useState<boolean>(false);
  const [triggerNewDoctorModal, setTriggerNewDoctorModal] = useState<boolean>(false);
  const [triggerNewAppointmentModal, setTriggerNewAppointmentModal] = useState<boolean>(false);
  const [triggerNewBillingModal, setTriggerNewBillingModal] = useState<boolean>(false);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Perform live connection probe
  const testLiveConnection = useCallback(async () => {
    setIsTestingConnection(true);
    try {
      const result = await checkLiveConnection();
      setConnectionState(result);
      if (result.isConnected) {
        console.log(`Firebase connected (${result.latencyMs}ms) to project: ${result.projectId}`);
      } else {
        console.warn(`Firebase connection failed: ${result.error}`);
      }
      return result;
    } catch (err: any) {
      const failedResult: ConnectionStatusResult = {
        isConnected: false,
        status: 'disconnected',
        latencyMs: null,
        projectId: 'universal-75bc6',
        authDomain: 'universal-75bc6.firebaseapp.com',
        error: err?.message || String(err),
        lastChecked: new Date(),
      };
      setConnectionState(failedResult);
      return failedResult;
    } finally {
      setIsTestingConnection(false);
    }
  }, []);

  // Initial connection probe & online/offline listeners
  useEffect(() => {
    testLiveConnection();

    // Subscribe to Firebase Realtime Database .info/connected for instant status (green/red)
    const unsubRTDBConn = subscribeRTDBConnection((status) => {
      setConnectionState(status);
    });

    // Periodic live status check every 30 seconds
    const interval = setInterval(testLiveConnection, 30000);

    const handleOnline = () => testLiveConnection();
    const handleOffline = () => {
      setConnectionState((prev) =>
        prev
          ? { ...prev, isConnected: false, status: 'disconnected', error: 'Browser is offline', lastChecked: new Date() }
          : null
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubRTDBConn();
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, [testLiveConnection]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    let loadedCount = 0;
    const checkInitialLoad = () => {
      loadedCount++;
      if (loadedCount >= 4) {
        setIsLoading(false);
      }
    };

    const unsubPatients = subscribePatients(
      (data) => {
        setPatients(data);
        // Successful data subscription confirms live connection
        setConnectionState((prev) =>
          prev ? { ...prev, isConnected: true, status: 'connected' } : null
        );
        checkInitialLoad();
      },
      (err) => {
        console.error('Patient subscription error:', err);
        checkInitialLoad();
      }
    );

    const unsubDoctors = subscribeDoctors(
      (data) => {
        setDoctors(data);
        checkInitialLoad();
      },
      (err) => {
        console.error('Doctor subscription error:', err);
        checkInitialLoad();
      }
    );

    const unsubAppointments = subscribeAppointments(
      (data) => {
        setAppointments(data);
        checkInitialLoad();
      },
      (err) => {
        console.error('Appointments subscription error:', err);
        checkInitialLoad();
      }
    );

    const unsubBillings = subscribeBillings(
      (data) => {
        setBillings(data);
        checkInitialLoad();
      },
      (err) => {
        console.error('Billing subscription error:', err);
        checkInitialLoad();
      }
    );

    return () => {
      unsubPatients();
      unsubDoctors();
      unsubAppointments();
      unsubBillings();
    };
  }, []);

  // Handle Seeding Demo Data
  const handleSeedData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const result = await seedSampleHospitalData();
      showToast(
        `Seeded ${result.patientsCount} patients, ${result.doctorsCount} doctors, ${result.appointmentsCount} appointments, and ${result.billingCount} invoices!`,
        'success'
      );
    } catch (error) {
      console.error('Seeding error:', error);
      showToast('Failed to seed sample hospital data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Cross-module handlers
  const handleBookForPatient = (patient: Patient) => {
    setBookingPatientTarget(patient);
    setBookingDoctorTarget(null);
    setActiveTab('appointments');
  };

  const handleBookForDoctor = (doctor: Doctor) => {
    setBookingDoctorTarget(doctor);
    setBookingPatientTarget(null);
    setActiveTab('appointments');
  };

  const handleBillForPatient = (patient: Patient) => {
    setBillingPatientTarget(patient);
    setActiveTab('billing');
  };

  // Availability toggle
  const handleToggleDoctorAvailability = async (id: string, current: boolean) => {
    try {
      await updateDoctor(id, { isAvailable: !current });
      showToast(`Doctor availability set to ${!current ? 'Available' : 'On Leave'}`);
    } catch (error) {
      showToast('Failed to update doctor availability', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D3748] flex flex-col antialiased">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-50/95 text-red-800 border-red-200'
                : 'bg-blue-50/95 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-[#94A3B8] hover:text-[#2D3748] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Collapsible Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        counts={{
          patients: patients.length,
          doctors: doctors.length,
          appointments: appointments.length,
          billing: billings.length,
        }}
        currentUser={currentUser}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        connectionState={connectionState}
        onOpenConnectionModal={() => setConnectionModalOpen(true)}
      />

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewPatient={() => {
            setActiveTab('patients');
            setTriggerNewPatientModal(true);
          }}
          onOpenNewDoctor={() => {
            setActiveTab('doctors');
            setTriggerNewDoctorModal(true);
          }}
          onOpenNewAppointment={() => {
            setActiveTab('appointments');
            setBookingPatientTarget(null);
            setBookingDoctorTarget(null);
            setTriggerNewAppointmentModal(true);
          }}
          onOpenNewBilling={() => {
            setActiveTab('billing');
            setBillingPatientTarget(null);
            setTriggerNewBillingModal(true);
          }}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          connectionState={connectionState}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
        />

        {/* View Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-3 border-[#5A7865] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#64748B]">Connecting to Firestore database...</p>
            </div>
          ) : (
            <>
              {/* If no data exists anywhere, show quick setup callout */}
              {patients.length === 0 && doctors.length === 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-[#EEF3EF] border border-[#D5E2D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#5A7865] shrink-0" />
                    <div>
                      <span className="font-bold text-[#2D3748] block">Your Firebase project (universal-75bc6) is connected!</span>
                      <span className="text-[#64748B]">
                        Click "Populate Sample Data" to seed realistic clinical hospital records into your Firestore database.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-4 py-2 bg-[#5A7865] hover:bg-[#4A6553] text-white font-semibold rounded-xl whitespace-nowrap shadow-xs disabled:opacity-50"
                  >
                    {isSeeding ? 'Populating...' : 'Populate Sample Data'}
                  </button>
                </div>
              )}

              {/* Tab: Overview Dashboard */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  patients={patients}
                  doctors={doctors}
                  appointments={appointments}
                  billings={billings}
                  setActiveTab={setActiveTab}
                  onOpenNewPatient={() => {
                    setActiveTab('patients');
                    setTriggerNewPatientModal(true);
                  }}
                  onOpenNewAppointment={() => {
                    setActiveTab('appointments');
                    setBookingPatientTarget(null);
                    setBookingDoctorTarget(null);
                    setTriggerNewAppointmentModal(true);
                  }}
                  onOpenNewDoctor={() => {
                    setActiveTab('doctors');
                    setTriggerNewDoctorModal(true);
                  }}
                  onOpenNewBilling={() => {
                    setActiveTab('billing');
                    setBillingPatientTarget(null);
                    setTriggerNewBillingModal(true);
                  }}
                  onUpdateAppointmentStatus={async (id, status) => {
                    await updateAppointment(id, { status });
                    showToast(`Appointment status updated to ${status}`);
                  }}
                  onToggleDoctorAvailability={handleToggleDoctorAvailability}
                />
              )}

              {/* Tab: Patients Management */}
              {activeTab === 'patients' && (
                <PatientsView
                  patients={patients}
                  appointments={appointments}
                  billings={billings}
                  searchTerm={searchTerm}
                  onAddPatient={async (patient) => {
                    await addPatient(patient);
                    showToast(`Patient ${patient.fullName} admitted successfully`);
                  }}
                  onUpdatePatient={async (id, updates) => {
                    await updatePatient(id, updates);
                    showToast('Patient record updated');
                  }}
                  onDeletePatient={async (id) => {
                    await deletePatient(id);
                    showToast('Patient record deleted');
                  }}
                  onBookForPatient={handleBookForPatient}
                  onBillForPatient={handleBillForPatient}
                />
              )}

              {/* Tab: Doctors Directory */}
              {activeTab === 'doctors' && (
                <DoctorsView
                  doctors={doctors}
                  appointments={appointments}
                  searchTerm={searchTerm}
                  onAddDoctor={async (doctor) => {
                    await addDoctor(doctor);
                    showToast(`Doctor ${doctor.fullName} added to directory`);
                  }}
                  onUpdateDoctor={async (id, updates) => {
                    await updateDoctor(id, updates);
                    showToast('Doctor profile updated');
                  }}
                  onDeleteDoctor={async (id) => {
                    await deleteDoctor(id);
                    showToast('Doctor profile removed');
                  }}
                  onToggleAvailability={handleToggleDoctorAvailability}
                  onBookForDoctor={handleBookForDoctor}
                />
              )}

              {/* Tab: Appointments Scheduling */}
              {activeTab === 'appointments' && (
                <AppointmentsView
                  appointments={appointments}
                  patients={patients}
                  doctors={doctors}
                  searchTerm={searchTerm}
                  onAddAppointment={async (appt) => {
                    await addAppointment(appt);
                    showToast('Appointment successfully scheduled');
                  }}
                  onUpdateAppointment={async (id, updates) => {
                    await updateAppointment(id, updates);
                    showToast('Appointment updated');
                  }}
                  onDeleteAppointment={async (id) => {
                    await deleteAppointment(id);
                    showToast('Appointment deleted');
                  }}
                  initialPatientForBooking={bookingPatientTarget}
                  initialDoctorForBooking={bookingDoctorTarget}
                  onClearInitialBookingTargets={() => {
                    setBookingPatientTarget(null);
                    setBookingDoctorTarget(null);
                  }}
                />
              )}

              {/* Tab: Billing & Invoices */}
              {activeTab === 'billing' && (
                <BillingView
                  billings={billings}
                  patients={patients}
                  searchTerm={searchTerm}
                  onAddBilling={async (billing) => {
                    await addBilling(billing);
                    showToast('Invoice generated successfully');
                  }}
                  onUpdateBilling={async (id, updates) => {
                    await updateBilling(id, updates);
                    showToast('Billing statement updated');
                  }}
                  onDeleteBilling={async (id) => {
                    await deleteBilling(id);
                    showToast('Invoice removed');
                  }}
                  initialPatientForBilling={billingPatientTarget}
                  onClearInitialBillingTarget={() => setBillingPatientTarget(null)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Connection Diagnostic Details Modal */}
      <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        connectionState={connectionState}
        isTesting={isTestingConnection}
        onRetest={testLiveConnection}
      />
    </div>
  );
}
