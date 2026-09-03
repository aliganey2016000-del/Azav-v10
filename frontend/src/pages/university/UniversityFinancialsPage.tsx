import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
  Users,
  Search,
  Filter,
  ExternalLink,
  Receipt,
  UploadCloud,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { RealDataStore, RealInvoice } from '../../services/realDataStore';
import { useAuth } from '../../context/AuthContext';

export const UniversityFinancialsPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<RealInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<RealInvoice | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'breakdown' | 'payment_instructions'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);

  // Add Invoice Form
  const [formData, setFormData] = useState({
    invoiceNumber: `AZM-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
    description: 'Clinical Attachment Cohort Invoicing',
    cohort: 'Fall 2025 - Batch 1',
    studentCount: 10,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '2025-12-31',
    totalAmount: 5000,
    paidAmount: 5000,
    status: 'PAID' as 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE',
  });

  useEffect(() => {
    const loaded = RealDataStore.getInvoices();
    setInvoices(loaded);
    if (loaded.length > 0) {
      setSelectedInvoice(loaded[0]);
    }
  }, []);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceAmount = Math.max(0, formData.totalAmount - formData.paidAmount);
    let derivedStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = formData.status;
    if (balanceAmount === 0) derivedStatus = 'PAID';
    else if (formData.paidAmount > 0) derivedStatus = 'PARTIAL';
    else derivedStatus = 'PENDING';

    const newInvoice: RealInvoice = {
      id: `INV-REAL-${Date.now().toString().slice(-4)}`,
      invoiceNumber: formData.invoiceNumber,
      description: formData.description,
      cohort: formData.cohort,
      studentCount: Number(formData.studentCount) || 1,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      totalAmount: Number(formData.totalAmount) || 0,
      paidAmount: Number(formData.paidAmount) || 0,
      balanceAmount,
      status: derivedStatus,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addInvoice(newInvoice);
    setInvoices(updated);
    setSelectedInvoice(newInvoice);
    setShowAddInvoiceModal(false);
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to remove this invoice?')) {
      const updated = RealDataStore.deleteInvoice(id);
      setInvoices(updated);
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  // Financial Summary Stats
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalSettled = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + curr.balanceAmount, 0);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.cohort.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              Institutional Billing & Accounts
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <Building className="w-3 h-3" />
              {user?.organizationName || 'Faculty of Medicine'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">University Financial Statements</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Institutional billing statements for clinical rotations, hospital placement retainers, international visa
            facilitation, and clinical preceptor stipends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddInvoiceModal(true)}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Real Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
            <p className="text-2xl font-extrabold text-slate-900">${totalBilled.toLocaleString()}</p>
            <span className="text-[11px] text-slate-400">{invoices.length} Invoices issued</span>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid & Settled</span>
            <p className="text-2xl font-extrabold text-emerald-600">${totalSettled.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-700 font-medium">Verified receipts</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
            <p className="text-2xl font-extrabold text-amber-600">${totalOutstanding.toLocaleString()}</p>
            <span className="text-[11px] text-amber-700 font-medium">Balance payable</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Invoices or Statements Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No financial billing records found. Click below to generate an institutional invoice for student clinical training.
            </p>
          </div>
          <button
            onClick={() => setShowAddInvoiceModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Invoice</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invoices List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice number, cohort..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-400 shadow-sm ring-1 ring-sky-400'
                        : 'bg-white border-slate-200 hover:border-sky-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({inv.cohort})</span>
                        </div>
                        <p className="text-xs text-slate-600">{inv.description}</p>
                        <p className="text-[11px] text-slate-400">Issued: {inv.issueDate} • Due: {inv.dueDate}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ${inv.totalAmount.toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(inv.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-1 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoice Detail Preview */}
          <div className="lg:col-span-6">
            {selectedInvoice ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">
                      Official Invoice Statement
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                    <p className="text-xs text-slate-500">{selectedInvoice.description}</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Issued To</span>
                    <p className="font-bold text-slate-900">{user?.organizationName || 'Faculty of Medicine'}</p>
                    <p className="text-slate-500">Bilateral MoU Medical Program</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Service Provider</span>
                    <p className="font-bold text-slate-900">AZAAM Medics Global Network</p>
                    <p className="text-slate-500">accounts@azaammedics.org</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Total Billed Amount</span>
                    <strong className="text-slate-900">${selectedInvoice.totalAmount.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Total Paid Amount</span>
                    <strong className="text-emerald-600">${selectedInvoice.paidAmount.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 font-bold text-sm">
                    <span className="text-slate-900">Balance Remaining</span>
                    <span className="text-amber-600">${selectedInvoice.balanceAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 text-xs">
                Select an invoice to view statement details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Create Real Invoice Statement</h3>
              </div>
              <button
                onClick={() => setShowAddInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cohort Batch *</label>
                  <input
                    type="text"
                    required
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Create Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
