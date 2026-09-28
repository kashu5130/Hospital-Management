# Security Specification - Hospital Management System

## 1. Data Invariants
- `patients`: Must have valid full name (2-100 chars), valid age (0-150), valid gender (Male, Female, Other), valid phone, diagnosis, and valid admission/creation timestamps.
- `doctors`: Must have valid full name (2-100 chars), valid medical specialization, valid phone, and boolean isAvailable flag.
- `appointments`: References valid patient and doctor records, with denormalized names for fast rendering, scheduled timestamp, and valid status enum ('Pending', 'Confirmed', 'Completed', 'Cancelled').
- `billing`: References valid patient record, with denormalized patient name, non-negative total amount, payment status ('Paid', 'Pending'), and billing timestamp.

## 2. The Dirty Dozen Payloads (Boundary & Attack Cases)
1. **Ghost Field Injection (Patient)**: `{ fullName: "John Doe", age: 30, gender: "Male", phone: "123", diagnosis: "Flu", admissionDate: timestamp, createdAt: timestamp, isAdmin: true }` -> Rejected by `hasOnly()`.
2. **Age Underflow**: `{ ...validPatient, age: -5 }` -> Rejected by `age >= 0`.
3. **Invalid Gender Enum**: `{ ...validPatient, gender: "Alien" }` -> Rejected by `gender in ['Male', 'Female', 'Other']`.
4. **Name Too Short / Empty**: `{ ...validPatient, fullName: "A" }` -> Rejected by `size() >= 2`.
5. **Junk Document ID**: Writing to `/patients/INVALID$$ID%%` -> Rejected by `isValidId()`.
6. **Doctor Availability Type Poisoning**: `{ ...validDoctor, isAvailable: "yes" }` -> Rejected by `is bool`.
7. **Appointment Invalid Status**: `{ ...validAppointment, status: "UnknownStatus" }` -> Rejected by `status in [...]`.
8. **Billing Negative Amount**: `{ ...validBilling, totalAmount: -250 }` -> Rejected by `totalAmount >= 0`.
9. **Billing Missing Required Field**: `{ patientId: "123", totalAmount: 100 }` -> Rejected by `hasAll()`.
10. **Timestamp Type Poisoning**: Providing string `"2026-09-28"` instead of Firestore Timestamp -> Rejected by `is timestamp`.
11. **Excessive String Length (Denial of Wallet)**: Patient diagnosis string exceeding 300 characters -> Rejected by `size() <= 300`.
12. **Catch-All Denial**: Accessing unauthorized path `/users/admin` or `/secret_keys/doc` -> Rejected by default deny-all rule.
