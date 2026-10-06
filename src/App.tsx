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
  subscribeStaffUsers,
  seedInitialStaffUsers,
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
import { Patient, Doctor, Appointment, Billing, StaffUser, HospitalStaffRole, ActiveTab } from './types/hospital';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { DoctorsView } from './components/DoctorsView';
import { AppointmentsView } from './components/AppointmentsView';
import { BillingView } from './components/BillingView';
import { StaffView } from './components/StaffView';
import { StaffAuthModal } from './components/StaffAuthModal';
import { ConnectionModal } from './components/ConnectionModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Footer } from './components/Footer';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  X,
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
  UserCheck
} from 'lucide-react';

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
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Staff User session state (persisted in localStorage)
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('vitaspectra_current_staff');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [staffAuthModalOpen, setStaffAuthModalOpen] = useState<boolean>(false);
  const [staffAuthModalMode, setStaffAuthModalMode] = useState<'login' | 'register'>('login');
  const [staffAuthInitialRole, setStaffAuthInitialRole] = useState<HospitalStaffRole>('doctor');

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

  const handleStaffLoginSuccess = (staff: StaffUser) => {
    setCurrentStaff(staff);
    try {
      localStorage.setItem('vitaspectra_current_staff', JSON.stringify(staff));
    } catch {}
    showToast(`Welcome back, ${staff.fullName}! Active session: ${staff.roleLabel}.`, 'success');
  };

  const handleStaffLogout = () => {
    setCurrentStaff(null);
    try {
      localStorage.removeItem('vitaspectra_current_staff');
    } catch {}
    showToast('Signed out of staff session. You can sign in with any staff type.', 'info');
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

  // Real-time Firestore & Realtime Database Subscriptions
  useEffect(() => {
    let loadedCount = 0;
    const checkInitialLoad = () => {
      loadedCount++;
      if (loadedCount >= 5) {
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

    const unsubStaff = subscribeStaffUsers(
      (data) => {
        setStaffUsers(data);
        // Ensure staff records in Firebase are auto-migrated to Indian names
        seedInitialStaffUsers().catch((e) => console.error('Staff sync error:', e));

        if (data.length > 0) {
          // If no active staff selected in localStorage, default to first on-duty staff member
          setCurrentStaff((prev) => {
            if (!prev) {
              const defaultStaff = data.find((s) => s.role === 'doctor') || data[0];
              try {
                localStorage.setItem('vitaspectra_current_staff', JSON.stringify(defaultStaff));
              } catch {}
              return defaultStaff;
            }
            // Keep current staff synchronized with latest status/details from Firebase
            const updated = data.find((s) => s.id === prev.id);
            return updated || prev;
          });
        }
        checkInitialLoad();
      },
      (err) => {
        console.error('Staff subscription error:', err);
        checkInitialLoad();
      }
    );

    return () => {
      unsubPatients();
      unsubDoctors();
      unsubAppointments();
      unsubBillings();
      unsubStaff();
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
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#090D14] text-[#2D3748] dark:text-[#F8FAFC] flex flex-col antialiased">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-[#0C241B] text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-50/95 dark:bg-[#2A0E14] text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-blue-50/95 dark:bg-[#0E1E36] text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-[#94A3B8] hover:text-[#2D3748] dark:hover:text-slate-200 p-0.5 cursor-pointer"
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
          staff: staffUsers.length,
        }}
        currentUser={currentUser}
        currentStaff={currentStaff}
        onOpenStaffAuthModal={(mode, role) => {
          setStaffAuthModalMode(mode || 'login');
          if (role) setStaffAuthInitialRole(role);
          setStaffAuthModalOpen(true);
        }}
        onStaffLogout={handleStaffLogout}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        connectionState={connectionState}
        onOpenConnectionModal={() => setConnectionModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
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
          currentStaff={currentStaff}
          onOpenStaffAuthModal={(mode) => {
            setStaffAuthModalMode(mode || 'login');
            setStaffAuthModalOpen(true);
          }}
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
          onOpenNewStaff={() => {
            setStaffAuthModalMode('register');
            setStaffAuthModalOpen(true);
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
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-3 border-[#5A7865] dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Connecting to Firebase database...</p>
            </div>
          ) : (
            <>
              {/* If no data exists anywhere, show quick setup callout */}
              {patients.length === 0 && doctors.length === 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-[#EEF3EF] dark:bg-emerald-950/40 border border-[#D5E2D9] dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#5A7865] dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-[#2D3748] dark:text-slate-100 block">Your Firebase project (universal-75bc6) is connected!</span>
                      <span className="text-[#64748B] dark:text-slate-400">
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
                  staffUsers={staffUsers}
                  currentStaff={currentStaff}
                  onOpenStaffAuthModal={(mode) => {
                    setStaffAuthModalMode(mode || 'login');
                    setStaffAuthModalOpen(true);
                  }}
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

              {/* Tab: Staff Roster & Directory */}
              {activeTab === 'staff' && (
                <StaffView
                  staffUsers={staffUsers}
                  currentStaff={currentStaff}
                  onSelectStaff={handleStaffLoginSuccess}
                  onOpenRegisterModal={(role) => {
                    setStaffAuthModalMode('register');
                    if (role) setStaffAuthInitialRole(role);
                    setStaffAuthModalOpen(true);
                  }}
                  onOpenLoginModal={() => {
                    setStaffAuthModalMode('login');
                    setStaffAuthModalOpen(true);
                  }}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Global Hospital Footer */}
        <Footer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentStaff={currentStaff}
          onOpenStaffAuthModal={(mode) => {
            setStaffAuthModalMode(mode || 'login');
            setStaffAuthModalOpen(true);
          }}
          connectionState={connectionState}
          onOpenConnectionModal={() => setConnectionModalOpen(true)}
          onSeedSampleData={handleSeedData}
          isSeeding={isSeeding}
          patientsCount={patients.length}
          doctorsCount={doctors.length}
          appointmentsCount={appointments.length}
          billingsCount={billings.length}
          staffCount={staffUsers.length}
        />

        {/* Mobile Bottom Navigation Bar (1-Tap Tab Switcher on Phones) */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#EAE6DF] dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
          aria-label="Mobile Navigation"
        >
          {[
            { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'patients' as ActiveTab, label: 'Patients', icon: Users, badge: patients.length },
            { id: 'doctors' as ActiveTab, label: 'Doctors', icon: Stethoscope, badge: doctors.length },
            { id: 'appointments' as ActiveTab, label: 'Bookings', icon: CalendarDays, badge: appointments.length },
            { id: 'billing' as ActiveTab, label: 'Billing', icon: Receipt, badge: billings.length },
            { id: 'staff' as ActiveTab, label: 'Staff', icon: UserCheck, badge: staffUsers.length },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
                  isActive
                    ? 'text-[#5A7865] dark:text-emerald-400 font-bold'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#2D3748] dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 text-[9px] font-mono font-bold px-1 rounded-full bg-[#5A7865] dark:bg-emerald-600 text-white min-w-[14px] text-center leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A7865] dark:bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Floating Theme Toggle (1-Click button toggle) */}
      <ThemeToggle variant="floating" />

      {/* Staff Multi-Role Authentication & Registration Modal */}
      <StaffAuthModal
        isOpen={staffAuthModalOpen}
        onClose={() => setStaffAuthModalOpen(false)}
        currentStaff={currentStaff}
        onStaffLoginSuccess={handleStaffLoginSuccess}
        initialMode={staffAuthModalMode}
        initialRole={staffAuthInitialRole}
      />

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
