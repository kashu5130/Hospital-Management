import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  Eye,
  FileText,
  CreditCard,
  Building,
  UserCheck
} from 'lucide-react';
import { Billing, Patient, PaymentStatus } from '../types/hospital';
import { Timestamp } from 'firebase/firestore';

interface BillingViewProps {
  billings: Billing[];
  patients: Patient[];
  searchTerm: string;
  onAddBilling: (billing: Omit<Billing, 'id'>) => Promise<void>;
  onUpdateBilling: (id: string, updates: Partial<Omit<Billing, 'id'>>) => Promise<void>;
  onDeleteBilling: (id: string) => Promise<void>;
  initialPatientForBilling?: Patient | null;
  onClearInitialBillingTarget?: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  billings,
  patients,
  searchTerm,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling,
  initialPatientForBilling,
  onClearInitialBillingTarget,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialPatientForBilling));
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Billing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState(
    initialPatientForBilling?.id || (patients[0]?.id ?? '')
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  // Itemized line items builder
  const [lineItems, setLineItems] = useState([
    { description: 'Physician Consultation & Evaluation', amount: 250 },
    { description: 'Clinical Diagnostics & Vitals Panel', amount: 180 },
  ]);

  const totalCalculatedAmount = lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 100 }]);
  };

  const updateLineItem = (index: number, field: 'description' | 'amount', value: any) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? Number(value) : value,
    };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setPatientId(initialPatientForBilling?.id || (patients[0]?.id ?? ''));
    setPaymentStatus('Pending');
    setBillingDate(new Date().toISOString().split('T')[0]);
    setLineItems([
      { description: 'General Inpatient Care / Consultation', amount: 350 },
      { description: 'Standard Diagnostic Laboratory Battery', amount: 150 },
    ]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || totalCalculatedAmount <= 0) {
      return;
    }

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;

    setIsSubmitting(true);
    try {
      const dateObj = new Date(billingDate);
      const billingTimestamp = Timestamp.fromDate(dateObj);

      await onAddBilling({
        patientId: patient.id,
        patientName: patient.fullName,
        totalAmount: Number(totalCalculatedAmount.toFixed(2)),
        paymentStatus,
        billingDate: billingTimestamp,
      });

      setIsModalOpen(false);
      onClearInitialBillingTarget?.();
    } catch (err) {
      console.error('Save billing failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial aggregates
  const totalBilled = billings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalPaid = billings
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalPending = totalBilled - totalPaid;

  const filteredBillings = billings.filter((b) => {
    const matchesSearch = b.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF]"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2D3748] mt-2">
            ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-[#64748B] mt-1 block">{billings.length} total invoices issued</span>
        </div>

        <div
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF]"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Settled Collections
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-2">
            ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            {billings.filter((b) => b.paymentStatus === 'Paid').length} paid accounts
          </span>
        </div>

        <div
          className="bg-white rounded-2xl p-5 border border-[#EAE6DF]"
          style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Pending Receivables
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-2">
            ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-amber-700 font-medium mt-1 block">
            {billings.filter((b) => b.paymentStatus === 'Pending').length} awaiting settlement
          </span>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-1.5 p-1 bg-[#F9F7F2] rounded-xl border border-[#EAE6DF] w-full sm:w-auto">
          {(['All', 'Paid', 'Pending'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#5A7865] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#2D3748]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={openAddModal}
          disabled={patients.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#5A7865] hover:bg-[#4A6553] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
          title={patients.length === 0 ? 'Register a patient first' : 'Create new bill'}
        >
          <Plus className="w-4 h-4" />
          <span>Generate Itemized Bill</span>
        </button>
      </div>

      {/* Billing Ledger Table */}
      <div
        className="bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)' }}
      >
        <div className="p-5 border-b border-[#F0ECE4] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#2D3748] text-base">Invoicing Ledger</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Showing {filteredBillings.length} of {billings.length} billing statements
            </p>
          </div>
        </div>

        {filteredBillings.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7]">
            <Receipt className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#2D3748]">No invoices recorded</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Generate an itemized invoice for an admitted patient or load sample clinical records.
            </p>
            {patients.length > 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-[#5A7865] text-white text-xs font-semibold rounded-xl hover:bg-[#4A6553]"
              >
                Create Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FDFBF7] text-[#64748B] text-xs font-semibold border-b border-[#EAE6DF]">
                <tr>
                  <th className="py-3.5 px-5">Invoice Reference</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Billing Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2EB]">
                {filteredBillings.map((bill) => {
                  const billDate = bill.billingDate ? bill.billingDate.toDate() : null;
                  return (
                    <tr key={bill.id} className="hover:bg-[#FDFBF7]/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#EEF3EF] text-[#5A7865] flex items-center justify-center font-mono font-bold text-xs">
                            INV
                          </div>
                          <div>
                            <span className="font-mono font-semibold text-xs text-[#2D3748]">
                              #{bill.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-bold text-[#2D3748]">
                        {bill.patientName}
                      </td>

                      <td className="py-4 px-4 text-xs text-[#64748B]">
                        {billDate ? billDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>

                      <td className="py-4 px-4 text-sm font-bold text-[#2D3748]">
                        ${Number(bill.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            bill.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {bill.paymentStatus === 'Pending' && (
                            <button
                              onClick={() => onUpdateBilling(bill.id, { paymentStatus: 'Paid' })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                              title="Mark as paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInvoice(bill)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#5A7865] hover:bg-[#EEF3EF] transition-colors"
                            title="View receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(bill)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete invoice"
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

      {/* Generate Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EAE6DF] shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#2D3748]">Generate Patient Invoice</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Itemize clinical charges and issue billing statement.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                >
                  <option value="" disabled>-- Select Admitted Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.diagnosis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">
                    Initial Settlement Status *
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE6DF] text-sm focus:border-[#5A7865] focus:outline-hidden bg-[#FDFBF7]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Itemized charges table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">
                    Itemized Clinical Services
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs text-[#5A7865] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Charge Item
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FDFBF7] focus:border-[#5A7865] focus:outline-hidden"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                          className="w-full pl-6 pr-2 py-2 text-xs rounded-xl border border-[#EAE6DF] bg-[#FDFBF7] focus:border-[#5A7865] focus:outline-hidden font-bold"
                        />
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1.5 text-[#94A3B8] hover:text-red-600 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total amount preview */}
                <div className="mt-3 p-3 rounded-xl bg-[#F5F2EB] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4A5568]">Total Billed Amount:</span>
                  <span className="text-base font-extrabold text-[#2D3748]">
                    ${totalCalculatedAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE4]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onClearInitialBillingTarget?.();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F5F2EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalCalculatedAmount <= 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#5A7865] hover:bg-[#4A6553] shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Billing Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice / Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#EAE6DF] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5A7865] text-white flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#2D3748]">CarePulse Medical Center</h4>
                  <p className="text-[10px] text-[#64748B]">Official Clinical Receipt</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-xs text-[#94A3B8] hover:text-[#2D3748] p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-[#64748B] block">Billed To:</span>
                  <span className="font-bold text-sm text-[#2D3748] block mt-0.5">
                    {selectedInvoice.patientName}
                  </span>
                  <span className="text-[11px] text-[#64748B]">Patient ID: {selectedInvoice.patientId.slice(0, 10)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block">Invoice Reference:</span>
                  <span className="font-mono font-bold text-[#2D3748] block mt-0.5">
                    INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Date: {selectedInvoice.billingDate?.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                  selectedInvoice.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <span>Payment Settlement Status</span>
                <span>{selectedInvoice.paymentStatus.toUpperCase()}</span>
              </div>

              {/* Summary line */}
              <div className="py-4 border-y border-[#F0ECE4] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#2D3748] block">Clinical Inpatient & Diagnostic Care</span>
                  <span className="text-[11px] text-[#64748B]">Authorized Encounter Services</span>
                </div>
                <span className="text-base font-bold text-[#2D3748]">
                  ${Number(selectedInvoice.totalAmount).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold text-[#2D3748]">
                <span>Total Amount Due / Paid:</span>
                <span>${Number(selectedInvoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0ECE4] flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A5568] bg-[#F5F2EB] hover:bg-[#EAE6DF] flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5A7865] hover:bg-[#4A6553]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#EAE6DF] shadow-2xl">
            <h3 className="text-base font-bold text-red-600">Delete Invoice?</h3>
            <p className="text-xs text-[#64748B] mt-2">
              Are you sure you want to delete invoice <strong>INV-{deleteCandidate.id.slice(0, 6)}</strong> for{' '}
              <strong>{deleteCandidate.patientName}</strong>?
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
                  await onDeleteBilling(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Delete Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
