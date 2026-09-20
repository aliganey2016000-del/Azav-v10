import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote,
  Ban,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;
export type FinanceMode = 'fees' | 'payments' | 'transactions' | 'settlements' | 'refunds';

type FinancePageProps = {
  mode: FinanceMode;
  readOnly?: boolean;
  titleOverride?: string;
  eyebrowOverride?: string;
  descriptionOverride?: string;
  registerTitleOverride?: string;
  registerDescriptionOverride?: string;
};

type FinanceForm = {
  payerType: string;
  userId: string;
  universityId: string;
  batchId: string;
  organizationId: string;
  invoiceId: string;
  description: string;
  amount: string;
  currency: string;
  status: string;
  invoiceNumber: string;
  reference: string;
  dueDate: string;
  paidAt: string;
  paymentMethod: string;
  notes: string;
};

const CONFIG: Record<FinanceMode, {
  title: string;
  eyebrow: string;
  description: string;
  type: string;
  action: string;
}> = {
  fees: {
    title: 'Fees & Invoices',
    eyebrow: 'Finance · Billing',
    description: 'Create and manage training fees, invoices, balances and due dates.',
    type: 'FEE',
    action: 'New Invoice',
  },
  payments: {
    title: 'Payments',
    eyebrow: 'Finance · Receipts',
    description: 'Record incoming payments and maintain verified payment references.',
    type: 'PAYMENT',
    action: 'Record Payment',
  },
  transactions: {
    title: 'Transactions',
    eyebrow: 'Finance · Ledger',
    description: 'Review the complete financial ledger across fees, payments, refunds and settlements.',
    type: '',
    action: '',
  },
  settlements: {
    title: 'Settlements',
    eyebrow: 'Finance · Partners',
    description: 'Record settlement transfers to hospitals and partner organizations.',
    type: 'SETTLEMENT',
    action: 'Record Settlement',
  },
  refunds: {
    title: 'Refunds',
    eyebrow: 'Finance · Reversals',
    description: 'Review refunds created from original payment records and maintain a clear reversal audit trail.',
    type: 'REFUND',
    action: '',
  },
};

const EMPTY_FORM: FinanceForm = {
  payerType: 'UNIVERSITY',
  userId: '',
  universityId: '',
  batchId: '',
  organizationId: '',
  invoiceId: '',
  description: '',
  amount: '',
  currency: 'USD',
  status: 'PENDING',
  invoiceNumber: '',
  reference: '',
  dueDate: '',
  paidAt: '',
  paymentMethod: '',
  notes: '',
};

const asArray = (response: any, key?: string): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data?.[key])) return data[key];
  return [];
};

const loadAllAdminPages = async (endpoint: string) => {
  const collected: RecordObject[] = [];
  let page = 1;

  while (page <= 25) {
    const response = await api.get(endpoint, { params: { page, limit: 100 } });
    collected.push(...asArray(response));

    const pagination = response?.data?.pagination;
    if (!pagination?.totalPages || page >= Number(pagination.totalPages)) break;
    page += 1;
  }

  return collected;
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const accountName = (record: RecordObject) => {
  const user = record.userId;
  if (!user) return record.universityId?.name || record.organizationId?.name || 'Account';
  if (typeof user === 'string') return user;
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || record.organizationId?.name || 'Account';
};

const accountEmail = (record: RecordObject) => {
  const user = record.userId;
  if (typeof user === 'object' && user?.email) return user.email;
  return record.universityId?.email || record.organizationId?.contactEmail || '';
};

const formatMoney = (amount: any, currency = 'USD') => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(currency || 'USD') + ' ' + value.toFixed(2);
  }
};

const formatDate = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const toInputDate = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const statusClass = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700';
    case 'PARTIAL':
      return 'bg-amber-50 text-amber-700';
    case 'OVERDUE':
      return 'bg-rose-50 text-rose-700';
    case 'REFUNDED':
      return 'bg-violet-50 text-violet-700';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-blue-50 text-blue-700';
  }
};

const typeClass = (type: string) => {
  switch (type) {
    case 'PAYMENT':
      return 'bg-emerald-50 text-emerald-700';
    case 'REFUND':
      return 'bg-rose-50 text-rose-700';
    case 'SETTLEMENT':
      return 'bg-violet-50 text-violet-700';
    default:
      return 'bg-blue-50 text-blue-700';
  }
};

export const AdminFinancePage: React.FC<FinancePageProps> = ({
  mode,
  readOnly = false,
  titleOverride,
  eyebrowOverride,
  descriptionOverride,
  registerTitleOverride,
  registerDescriptionOverride,
}) => {
  const baseConfig = CONFIG[mode];
  const config = {
    ...baseConfig,
    title: titleOverride || baseConfig.title,
    eyebrow: eyebrowOverride || baseConfig.eyebrow,
    description: descriptionOverride || baseConfig.description,
  };

  const isUniversityPaymentsView =
    readOnly && mode === 'payments' && registerTitleOverride === 'Student Payments';
  const isAdminPaymentsView = !readOnly && mode === 'payments';

  const [records, setRecords] = useState<RecordObject[]>([]);
  const [paymentRefundRecords, setPaymentRefundRecords] = useState<RecordObject[]>([]);
  const [users, setUsers] = useState<RecordObject[]>([]);
  const [universities, setUniversities] = useState<RecordObject[]>([]);
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);
  const [invoices, setInvoices] = useState<RecordObject[]>([]);
  const [feeRules, setFeeRules] = useState<RecordObject[]>([]);
  const [pricingProfile, setPricingProfile] = useState<RecordObject | null>(null);
  const [trainingBatches, setTrainingBatches] = useState<RecordObject[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<Array<{ feeRuleId: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [feeRulesLoading, setFeeRulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const feeRuleRequestRef = useRef(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<RecordObject | null>(null);
  const [editing, setEditing] = useState<RecordObject | null>(null);
  const [form, setForm] = useState<FinanceForm>(EMPTY_FORM);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (config.type) params.type = config.type;

      if (isAdminPaymentsView) {
        const [paymentResponse, refundResponse] = await Promise.all([
          api.get('/finance', { params }),
          api.get('/finance', { params: { type: 'REFUND' } }),
        ]);
        setRecords(asArray(paymentResponse));
        setPaymentRefundRecords(asArray(refundResponse));
      } else {
        const response = await api.get('/finance', { params });
        setRecords(asArray(response));
        setPaymentRefundRecords([]);
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load finance records.');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    setReferenceLoading(true);
    try {
      const [nextUsers, nextUniversities, nextOrganizations, invoiceResponse] = await Promise.all([
        loadAllAdminPages('/admin/users'),
        loadAllAdminPages('/admin/universities'),
        loadAllAdminPages('/admin/organizations'),
        api.get('/finance', { params: { type: 'FEE' } }),
      ]);
      setUsers(nextUsers);
      setUniversities(nextUniversities);
      setOrganizations(nextOrganizations);
      setInvoices(asArray(invoiceResponse));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load finance reference data.');
    } finally {
      setReferenceLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, [mode]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (statusFilter && record.status !== statusFilter) return false;
      if (typeFilter && record.type !== typeFilter) return false;

      if ((isUniversityPaymentsView || isAdminPaymentsView) && paymentMethodFilter) {
        if (String(record.paymentMethod || '') !== paymentMethodFilter) return false;
      }

      if ((isUniversityPaymentsView || isAdminPaymentsView) && paymentDateFilter) {
        const value = record.paidAt || record.createdAt;
        const recordDate = value ? new Date(value) : null;
        if (!recordDate || Number.isNaN(recordDate.getTime())) return false;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (paymentDateFilter === 'TODAY' && recordDate < todayStart) return false;

        if (paymentDateFilter === '7_DAYS') {
          const cutoff = new Date(todayStart);
          cutoff.setDate(cutoff.getDate() - 6);
          if (recordDate < cutoff) return false;
        }

        if (paymentDateFilter === '30_DAYS') {
          const cutoff = new Date(todayStart);
          cutoff.setDate(cutoff.getDate() - 29);
          if (recordDate < cutoff) return false;
        }

        if (
          paymentDateFilter === 'THIS_MONTH' &&
          (recordDate.getFullYear() !== now.getFullYear() ||
            recordDate.getMonth() !== now.getMonth())
        ) {
          return false;
        }
      }

      if (!query) return true;

      return [
        accountName(record),
        accountEmail(record),
        record.invoiceNumber,
        record.reference,
        record.description,
        record.organizationId?.name,
        record.invoiceId?.invoiceNumber,
        record.batchId?.batchNumber,
        record.batchId?.name,
        record.paymentMethod,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [
    records,
    search,
    statusFilter,
    typeFilter,
    isUniversityPaymentsView,
    isAdminPaymentsView,
    paymentMethodFilter,
    paymentDateFilter,
  ]);

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [filteredRecords]
  );

  const currencySet = useMemo(
    () => new Set(filteredRecords.map((record) => record.currency || 'USD')),
    [filteredRecords]
  );

  const totalAmountLabel =
    currencySet.size > 1
      ? 'Multiple currencies'
      : formatMoney(totalAmount, Array.from(currencySet)[0] || 'USD');

  const pendingCount = filteredRecords.filter((record) =>
    ['PENDING', 'PARTIAL', 'OVERDUE'].includes(record.status)
  ).length;

  const completedCount = filteredRecords.filter((record) =>
    ['PAID', 'REFUNDED'].includes(record.status)
  ).length;

  const universityPaymentSummary = useMemo(() => {
    const invoiceBalances = new Map<string, { balance: number; currency: string }>();
    const linkedInvoiceIds = new Set<string>();

    filteredRecords.forEach((record) => {
      const invoiceId = asId(record.invoiceId);
      if (!invoiceId) return;

      linkedInvoiceIds.add(invoiceId);
      invoiceBalances.set(invoiceId, {
        balance: Number(record.invoiceBalance || 0),
        currency: String(record.invoiceId?.currency || record.currency || 'USD'),
      });
    });

    const paymentCurrencies = Array.from(
      new Set(filteredRecords.map((record) => String(record.currency || 'USD')))
    );
    const balanceCurrencies = Array.from(
      new Set(Array.from(invoiceBalances.values()).map((item) => item.currency))
    );

    const totalPaid = filteredRecords.reduce(
      (sum, record) => sum + Number(record.amount || 0),
      0
    );
    const remainingBalance = Array.from(invoiceBalances.values()).reduce(
      (sum, item) => sum + Number(item.balance || 0),
      0
    );

    return {
      paymentCount: filteredRecords.length,
      totalPaid,
      totalPaidCurrency: paymentCurrencies.length === 1 ? paymentCurrencies[0] : '',
      remainingBalance,
      remainingCurrency: balanceCurrencies.length === 1 ? balanceCurrencies[0] : '',
      linkedInvoices: linkedInvoiceIds.size,
    };
  }, [filteredRecords]);

  const loadTrainingBatches = async (universityId: string) => {
    if (!universityId) {
      setTrainingBatches([]);
      return;
    }

    setBatchLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/training-batches', {
        params: { universityId },
      });
      setTrainingBatches(asArray(response));
    } catch (requestError: any) {
      setTrainingBatches([]);
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load training batches for this university.'
      );
    } finally {
      setBatchLoading(false);
    }
  };

  const loadPricingProfile = async (payerType: string, universityId?: string) => {
    const requestId = ++feeRuleRequestRef.current;

    if (!payerType) {
      setPricingProfile(null);
      setFeeRules([]);
      setFeeRulesLoading(false);
      return;
    }

    setFeeRulesLoading(true);
    setError('');

    try {
      const params: Record<string, string> = { payer: payerType };
      if (universityId) params.universityId = universityId;

      const response = await api.get('/finance/pricing/profile', { params });
      let profile = response?.data?.data ?? response?.data ?? {};
      let services = Array.isArray(profile?.services) ? profile.services : [];

      // Resilient fallback for university billing. Service Pricing may contain
      // active university rules created before the current pricing-profile
      // resolver. If the strict profile is empty, use the active rules that
      // are visibly assigned to the selected university and let the admin
      // choose the exact pricing rule for this batch.
      if (services.length === 0 && payerType === 'UNIVERSITY' && universityId) {
        const fallbackResponse = await api.get('/finance/pricing', {
          params: {
            payer: payerType,
            status: 'ACTIVE',
            universityId,
          },
        });

        const eligible = asArray(fallbackResponse).filter((rule) => {
          if (rule.status !== 'ACTIVE' || rule.defaultPayer !== payerType) return false;
          if (rule.scope === 'UNIVERSITY') {
            return asId(rule.universityId) === universityId;
          }
          return rule.scope === 'GLOBAL';
        });

        const byServiceCode = new Map<string, RecordObject>();
        eligible
          .filter((rule) => rule.scope === 'GLOBAL')
          .forEach((rule) =>
            byServiceCode.set(String(rule.serviceCode), { ...rule, pricingSource: 'GLOBAL' })
          );
        eligible
          .filter((rule) => rule.scope === 'UNIVERSITY')
          .forEach((rule) =>
            byServiceCode.set(String(rule.serviceCode), { ...rule, pricingSource: 'UNIVERSITY' })
          );

        services = Array.from(byServiceCode.values()).sort((a, b) =>
          String(a.serviceName || '').localeCompare(String(b.serviceName || ''))
        );

        const currencies = Array.from(
          new Set(services.map((rule) => String(rule.currency || 'USD').toUpperCase()))
        );

        profile = {
          ...profile,
          payerType,
          serviceCount: services.length,
          currency: currencies.length === 1 ? currencies[0] : null,
          currencies,
          mixedCurrency: currencies.length > 1,
          services,
        };
      }

      if (requestId === feeRuleRequestRef.current) {
        setPricingProfile(profile);
        setFeeRules(services);
      }
    } catch (requestError: any) {
      if (requestId === feeRuleRequestRef.current) {
        setPricingProfile(null);
        setFeeRules([]);
        setError(
          requestError?.response?.data?.error?.message ||
            'Unable to load the pricing profile for this payer.'
        );
      }
    } finally {
      if (requestId === feeRuleRequestRef.current) {
        setFeeRulesLoading(false);
      }
    }
  };

  const openCreate = async () => {
    const defaultStatus =
      config.type === 'FEE' ? 'PENDING' : config.type === 'REFUND' ? 'REFUNDED' : 'PAID';

    setForm({
      ...EMPTY_FORM,
      status: defaultStatus,
      paidAt: config.type && config.type !== 'FEE' ? toInputDate(new Date()) : '',
    });
    setEditing(null);
    setInvoiceItems([]);
    setTrainingBatches([]);
    setPricingProfile(null);
    setFeeRules([]);
    setHeaderMenuOpen(false);
    setFormOpen(true);
    await loadReferences();

  };

  const openEdit = async (record: RecordObject) => {
    setEditing(record);
    setRowMenuId(null);

    const payerType =
      record.payerType ||
      (record.universityId ? 'UNIVERSITY' : record.organizationId && !record.userId ? 'ORGANIZATION' : 'STUDENT');

    const universityId = asId(record.universityId);

    setForm({
      payerType,
      userId: asId(record.userId),
      universityId,
      batchId: asId(record.batchId),
      organizationId: asId(record.organizationId),
      invoiceId: asId(record.invoiceId),
      description: record.description || '',
      amount: record.amount == null ? '' : String(record.amount),
      currency: record.currency || 'USD',
      status: record.status || 'PENDING',
      invoiceNumber: record.invoiceNumber || '',
      reference: record.reference || '',
      dueDate: toInputDate(record.dueDate),
      paidAt: toInputDate(record.paidAt),
      paymentMethod: record.paymentMethod || '',
      notes: record.notes || '',
    });

    setInvoiceItems(
      Array.isArray(record.lineItems)
        ? record.lineItems
            .filter((item: RecordObject) => asId(item.feeRuleId))
            .map((item: RecordObject) => ({
              feeRuleId: asId(item.feeRuleId),
              quantity: Number(item.quantity || 1),
            }))
        : []
    );

    setFormOpen(true);
    await loadReferences();

    if (record.type === 'FEE') {
      const studentUniversityId =
        payerType === 'STUDENT' && typeof record.userId === 'object'
          ? asId(record.userId?.universityId)
          : '';
      if (payerType === 'UNIVERSITY' && universityId) {
        await loadTrainingBatches(universityId);
      }
      await loadPricingProfile(payerType, universityId || studentUniversityId);
    }
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setInvoiceItems([]);
    setTrainingBatches([]);
    setBatchLoading(false);
    feeRuleRequestRef.current += 1;
    setPricingProfile(null);
    setFeeRules([]);
    setFeeRulesLoading(false);
    setForm(EMPTY_FORM);
  };

  const selectedUser = users.find((item) => asId(item) === form.userId) || null;
  const payerUniversityId =
    form.payerType === 'UNIVERSITY'
      ? form.universityId
      : form.payerType === 'STUDENT'
        ? asId(selectedUser?.universityId)
        : '';

  const feeRuleById = useMemo(
    () => new Map(feeRules.map((rule) => [asId(rule), rule])),
    [feeRules]
  );

  const selectedInvoiceRuleId = invoiceItems[0]?.feeRuleId || '';
  const selectedInvoiceRule = selectedInvoiceRuleId
    ? feeRuleById.get(selectedInvoiceRuleId) || null
    : null;

  const invoiceCurrency =
    invoiceItems.length > 0
      ? feeRuleById.get(invoiceItems[0].feeRuleId)?.currency || form.currency || 'USD'
      : form.currency || 'USD';

  const invoiceTotal = invoiceItems.reduce((sum, item) => {
    const rule = feeRuleById.get(item.feeRuleId);
    return sum + Number(rule?.amount || 0) * Number(item.quantity || 0);
  }, 0);

  const selectedUniversity = universities.find((item) => asId(item) === form.universityId) || null;
  const selectedBatch = trainingBatches.find((item) => asId(item) === form.batchId) || null;
  const selectedOrganization = organizations.find((item) => asId(item) === form.organizationId) || null;
  const selectedPayerName =
    form.payerType === 'UNIVERSITY'
      ? selectedUniversity?.name || ''
      : form.payerType === 'ORGANIZATION'
        ? selectedOrganization?.name || ''
        : selectedUser
          ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email
          : '';

  const invoicePayerValid =
    form.payerType === 'UNIVERSITY'
      ? Boolean(form.universityId)
      : form.payerType === 'ORGANIZATION'
        ? Boolean(form.organizationId)
        : Boolean(form.userId);

  const invoiceBillingContextValid =
    invoicePayerValid &&
    (form.payerType !== 'UNIVERSITY' || Boolean(form.batchId));

  const batchStudentCount = Number(selectedBatch?.studentsCount || 0);

  const quantityForRule = (rule: RecordObject) =>
    form.payerType === 'UNIVERSITY' &&
    rule.billingBasis === 'PER_STUDENT' &&
    batchStudentCount > 0
      ? batchStudentCount
      : 1;

  const toggleInvoiceRule = (feeRuleId: string) => {
    if (!feeRuleId) return;

    setInvoiceItems((current) => {
      const exists = current.some((item) => item.feeRuleId === feeRuleId);
      if (exists) return current.filter((item) => item.feeRuleId !== feeRuleId);

      const rule = feeRuleById.get(feeRuleId);
      if (!rule) return current;

      const activeCurrency =
        current.length > 0
          ? feeRuleById.get(current[0].feeRuleId)?.currency
          : rule.currency;

      if (activeCurrency && rule.currency !== activeCurrency) {
        setError('All services on one invoice must use the same currency.');
        return current;
      }

      return [...current, { feeRuleId, quantity: quantityForRule(rule) }];
    });
  };

  const selectAllInvoiceRules = () => {
    if (!feeRules.length) return;

    const preferredCurrency =
      pricingProfile?.currency ||
      feeRules[0]?.currency ||
      'USD';

    setInvoiceItems(
      feeRules
        .filter((rule) => String(rule.currency || 'USD') === String(preferredCurrency))
        .map((rule) => ({ feeRuleId: asId(rule), quantity: quantityForRule(rule) }))
        .filter((item) => item.feeRuleId)
    );
  };

  const clearInvoiceRules = () => setInvoiceItems([]);

  const isInvoiceRuleSelected = (feeRuleId: string) =>
    invoiceItems.some((item) => item.feeRuleId === feeRuleId);

  const updateInvoiceQuantity = (feeRuleId: string, quantity: number) => {
    const next = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    setInvoiceItems((current) =>
      current.map((item) => (item.feeRuleId === feeRuleId ? { ...item, quantity: next } : item))
    );
  };

  const saveRecord = async () => {
    const recordType = editing?.type || config.type;
    const requiresOrganization = recordType === 'SETTLEMENT';
    const requiresInvoice = recordType === 'PAYMENT';
    const creatingRuleInvoice = recordType === 'FEE' && !editing;

    if (
      !recordType ||
      (creatingRuleInvoice && (!invoiceBillingContextValid || invoiceItems.length === 0 || invoiceTotal <= 0)) ||
      (!creatingRuleInvoice && recordType === 'FEE' && !form.userId && !form.universityId && !form.organizationId) ||
      (requiresOrganization && !form.organizationId) ||
      (requiresInvoice && !form.invoiceId) ||
      (recordType !== 'FEE' && !form.description.trim()) ||
      (!creatingRuleInvoice && form.amount === '')
    ) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editing) {
        let payload: RecordObject;

        if (recordType === 'FEE') {
          payload = {
            description: form.description.trim(),
            amount: Number(form.amount),
            currency: form.currency || 'USD',
            invoiceNumber: form.invoiceNumber.trim() || undefined,
            dueDate: form.dueDate || null,
            notes: form.notes.trim() || undefined,
          };
        } else if (recordType === 'PAYMENT') {
          payload = {
            description: form.description.trim(),
            reference: form.reference.trim() || undefined,
            paidAt: form.paidAt || null,
            paymentMethod: form.paymentMethod || undefined,
            notes: form.notes.trim() || undefined,
          };
        } else if (recordType === 'REFUND') {
          payload = {
            description: form.description.trim(),
            reference: form.reference.trim() || undefined,
            notes: form.notes.trim() || undefined,
          };
        } else {
          payload = {
            organizationId: form.organizationId,
            description: form.description.trim(),
            amount: Number(form.amount),
            currency: form.currency || 'USD',
            status: form.status,
            reference: form.reference.trim() || undefined,
            paidAt: form.paidAt || null,
            paymentMethod: form.paymentMethod || undefined,
            notes: form.notes.trim() || undefined,
          };
        }

        await api.patch('/finance/' + asId(editing), payload);
      } else {
        await api.post('/finance', {
          type: recordType,
          payerType: recordType === 'FEE' ? form.payerType : undefined,
          userId: form.userId || undefined,
          universityId: form.universityId || undefined,
          batchId:
            recordType === 'FEE' && form.payerType === 'UNIVERSITY'
              ? form.batchId || undefined
              : undefined,
          organizationId: form.organizationId || undefined,
          invoiceId: form.invoiceId || undefined,
          lineItems:
            recordType === 'FEE'
              ? invoiceItems.map((item) => ({
                  feeRuleId: item.feeRuleId,
                  quantity: item.quantity,
                }))
              : undefined,
          description:
            recordType === 'FEE'
              ? form.description.trim() || undefined
              : form.description.trim(),
          amount: recordType === 'FEE' ? invoiceTotal : Number(form.amount),
          currency: recordType === 'FEE' ? invoiceCurrency : form.currency || 'USD',
          status: recordType === 'SETTLEMENT' ? form.status : undefined,
          invoiceNumber: form.invoiceNumber.trim() || undefined,
          reference: form.reference.trim() || undefined,
          dueDate: form.dueDate || null,
          paidAt: form.paidAt || null,
          paymentMethod: form.paymentMethod || undefined,
          notes: form.notes.trim() || undefined,
        });
      }

      const wasEditing = Boolean(editing);
      closeForm();
      await loadRecords();
      setSuccess(wasEditing ? 'Finance record updated successfully.' : config.action + ' saved successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save finance record.');
    } finally {
      setSaving(false);
    }
  };

  const refundPayment = async (record: RecordObject) => {
    setRowMenuId(null);
    const raw = window.prompt(
      'Refund amount',
      String(record.amount || '')
    );
    if (raw === null) return;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid refund amount.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/' + asId(record) + '/refund', {
        amount,
        description: 'Refund for ' + (record.description || 'payment'),
      });
      await loadRecords();
      setSuccess('Refund recorded successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to record refund.');
    } finally {
      setSaving(false);
    }
  };

  const voidRecord = async (record: RecordObject) => {
    setRowMenuId(null);
    const reason = window.prompt('Reason for void / cancellation', '');
    if (reason === null) return;
    if (!reason.trim()) {
      setError('A reason is required to void a finance record.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/' + asId(record) + '/void', { reason: reason.trim() });
      await loadRecords();
      setSuccess('Finance record voided successfully. The audit history has been preserved.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to void finance record.');
    } finally {
      setSaving(false);
    }
  };

  const adminPaymentSummary = useMemo(() => {
    const paymentCurrencies = Array.from(
      new Set(filteredRecords.map((record) => String(record.currency || 'USD')))
    );
    const refundCurrencies = Array.from(
      new Set(paymentRefundRecords.map((record) => String(record.currency || 'USD')))
    );

    const totalCollected = filteredRecords
      .filter((record) => record.status !== 'CANCELLED')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    const pendingReview = filteredRecords.filter((record) =>
      ['PENDING', 'PARTIAL', 'OVERDUE'].includes(String(record.status || ''))
    ).length;

    const refundedAmount = paymentRefundRecords
      .filter((record) => record.status !== 'CANCELLED')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    return {
      records: filteredRecords.length,
      totalCollected,
      totalCollectedCurrency: paymentCurrencies.length === 1 ? paymentCurrencies[0] : '',
      pendingReview,
      refundedAmount,
      refundedCurrency: refundCurrencies.length === 1 ? refundCurrencies[0] : '',
    };
  }, [filteredRecords, paymentRefundRecords]);

  const exportPaymentsCsv = () => {
    const headers = [
      'University / Account',
      'Payment Reference',
      'Invoice Number',
      'Status',
      'Amount Paid',
      'Currency',
      'Remaining Balance',
      'Payment Date',
      'Payment Method',
      'Batch',
    ];

    const rows = filteredRecords.map((record) => [
      accountName(record),
      referenceLabel(record),
      record.invoiceId?.invoiceNumber || '',
      record.status || '',
      Number(record.amount || 0).toFixed(2),
      record.currency || 'USD',
      Number(record.invoiceBalance || 0).toFixed(2),
      formatDate(record.paidAt || record.createdAt),
      String(record.paymentMethod || '').replace(/_/g, ' '),
      record.batchId?.batchNumber || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"')
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'azaam-payments-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const referenceLabel = (record: RecordObject) =>
    record.invoiceNumber || record.reference || '—';

  const formType = editing?.type || config.type;
  const selectedInvoice = invoices.find((invoice) => asId(invoice) === form.invoiceId) || null;
  const openInvoices = invoices.filter((invoice) => {
    if (editing && asId(invoice) === form.invoiceId) return true;
    return !['PAID', 'CANCELLED'].includes(invoice.status) && Number(invoice.balance ?? invoice.amount) > 0;
  });

  if (isAdminPaymentsView) {
    const totalCollectedLabel = adminPaymentSummary.totalCollectedCurrency
      ? formatMoney(adminPaymentSummary.totalCollected, adminPaymentSummary.totalCollectedCurrency)
      : adminPaymentSummary.totalCollected > 0
        ? 'Multiple currencies'
        : formatMoney(0, 'USD');

    const refundedLabel = adminPaymentSummary.refundedCurrency
      ? formatMoney(adminPaymentSummary.refundedAmount, adminPaymentSummary.refundedCurrency)
      : adminPaymentSummary.refundedAmount > 0
        ? 'Multiple currencies'
        : formatMoney(0, 'USD');

    return (
      <div className="space-y-5 pb-10">
        <section className="relative border-0 bg-transparent px-1 py-1 shadow-none md:overflow-hidden md:rounded-3xl md:border md:border-slate-200 md:bg-gradient-to-br md:from-white md:via-cyan-50/55 md:to-emerald-50/45 md:p-6 md:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 md:block">
                Finance · Payments
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Payments Register
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Track university payment records, balances and linked invoices.
              </p>
            </div>

            <button
              type="button"
              onClick={exportPaymentsCsv}
              disabled={filteredRecords.length === 0}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-xs font-black text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <AdminPaymentSummaryCard
            icon={<ReceiptText className="h-5 w-5" />}
            label="Records"
            value={loading ? '—' : String(adminPaymentSummary.records)}
            helper="Payment records"
            tone="blue"
          />
          <AdminPaymentSummaryCard
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Total Collected"
            value={loading ? '—' : totalCollectedLabel}
            helper="Received payments"
            tone="green"
          />
          <AdminPaymentSummaryCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Pending Review"
            value={loading ? '—' : String(adminPaymentSummary.pendingReview)}
            helper="Needs attention"
            tone="amber"
          />
          <AdminPaymentSummaryCard
            icon={<RotateCcw className="h-5 w-5" />}
            label="Refunded"
            value={loading ? '—' : refundedLabel}
            helper="Refunds recorded"
            tone="violet"
          />
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by university, reference or invoice number..."
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-[190px_190px_190px_auto]">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                ['PAID', 'Paid'],
                ['PENDING', 'Pending'],
                ['PARTIAL', 'Partial'],
                ['OVERDUE', 'Overdue'],
                ['REFUNDED', 'Refunded'],
                ['CANCELLED', 'Cancelled'],
              ]}
            />
            <FilterSelect
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              placeholder="All Methods"
              options={[
                ['BANK_TRANSFER', 'Bank Transfer'],
                ['MOBILE_MONEY', 'Mobile Money'],
                ['CASH', 'Cash'],
                ['CARD', 'Card'],
                ['OTHER', 'Other'],
              ]}
            />
            <FilterSelect
              value={paymentDateFilter}
              onChange={setPaymentDateFilter}
              placeholder="All Dates"
              options={[
                ['TODAY', 'Today'],
                ['7_DAYS', 'Last 7 Days'],
                ['30_DAYS', 'Last 30 Days'],
                ['THIS_MONTH', 'This Month'],
              ]}
            />
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPaymentMethodFilter('');
                setPaymentDateFilter('');
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
              Reset Filters
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Recent Payments
            </h2>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="hidden sm:inline">Sort by:</span>
              <span className="font-black text-slate-800">Newest</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white py-16 text-sm font-bold text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading payments...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
              <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-black text-slate-700">No payments found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filteredRecords.map((record) => {
                  const invoiceNumber = record.invoiceId?.invoiceNumber || '—';
                  const remainingBalance = Number(record.invoiceBalance || 0);
                  const paymentDate = formatDate(record.paidAt || record.createdAt);
                  const recordId = asId(record);

                  return (
                    <article
                      key={recordId}
                      role="button"
                      tabIndex={0}
                      onClick={() => setViewing(record)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setViewing(record);
                        }
                      }}
                      className="min-w-0 cursor-pointer overflow-visible rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.995] focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                          <Building2 className="h-7 w-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-black text-slate-950">
                            {accountName(record)}
                          </h3>
                          <div className="mt-1 truncate font-mono text-[11px] font-black text-teal-700">
                            {referenceLabel(record)}
                          </div>
                          <div className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                            {invoiceNumber}
                          </div>
                        </div>

                        <div
                          className="relative shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="Payment actions"
                            onClick={() =>
                              setRowMenuId((current) => current === recordId ? null : recordId)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {rowMenuId === recordId && (
                            <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <ActionItem
                                icon={<Eye className="h-4 w-4" />}
                                label="View Details"
                                onClick={() => {
                                  setRowMenuId(null);
                                  setViewing(record);
                                }}
                              />
                              <ActionItem
                                icon={<Pencil className="h-4 w-4" />}
                                label="Edit Record"
                                onClick={() => void openEdit(record)}
                              />
                              {record.status !== 'REFUNDED' && (
                                <ActionItem
                                  icon={<RotateCcw className="h-4 w-4" />}
                                  label="Create Refund"
                                  onClick={() => void refundPayment(record)}
                                />
                              )}
                              {record.status !== 'CANCELLED' && (
                                <ActionItem
                                  danger
                                  icon={<Ban className="h-4 w-4" />}
                                  label="Void / Cancel"
                                  onClick={() => void voidRecord(record)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ' + statusClass(record.status)}>
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {record.status}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {paymentDate}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-emerald-50/70 p-3.5">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <WalletCards className="h-5 w-5" />
                            <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                              Amount Paid
                            </span>
                          </div>
                          <div className="mt-2 text-xl font-black text-emerald-700">
                            {formatMoney(record.amount, record.currency)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-amber-50/80 p-3.5">
                          <div className="flex items-center gap-2 text-amber-700">
                            <CircleDollarSign className="h-5 w-5" />
                            <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                              Remaining
                            </span>
                          </div>
                          <div className="mt-2 text-xl font-black text-amber-700">
                            {formatMoney(remainingBalance, record.invoiceId?.currency || record.currency)}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden space-y-3 md:block">
                {filteredRecords.map((record) => {
                  const invoiceNumber = record.invoiceId?.invoiceNumber || '—';
                  const remainingBalance = Number(record.invoiceBalance || 0);
                  const paymentDate = formatDate(record.paidAt || record.createdAt);

                  return (
                    <article
                      key={asId(record)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setViewing(record)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setViewing(record);
                        }
                      }}
                      className="group relative min-w-0 cursor-pointer overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    >
                      <div className="grid min-w-0 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1.45fr)_auto_minmax(140px,.65fr)_minmax(140px,.65fr)_auto] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950 sm:text-base">
                              {accountName(record)}
                            </h3>
                            <div className="mt-1 truncate font-mono text-[10px] font-black text-teal-700 sm:text-[11px]">
                              {referenceLabel(record)}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                              {invoiceNumber}
                            </div>
                          </div>
                        </div>

                        <span className={'inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ' + statusClass(record.status)}>
                          {record.status}
                        </span>

                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Amount Paid
                          </div>
                          <div className="mt-1 text-sm font-black text-emerald-700">
                            {formatMoney(record.amount, record.currency)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Remaining
                          </div>
                          <div className="mt-1 text-sm font-black text-amber-700">
                            {formatMoney(remainingBalance, record.invoiceId?.currency || record.currency)}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {paymentDate}
                          </span>
                          <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {viewing && (
          <ModalShell
            title="Payment Details"
            eyebrow={referenceLabel(viewing)}
            onClose={() => setViewing(null)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBox label="Account / University" value={accountName(viewing)} />
              <DetailBox label="Status" value={viewing.status || '—'} />
              <DetailBox label="Payment Reference" value={referenceLabel(viewing)} />
              <DetailBox label="Payment Date" value={formatDate(viewing.paidAt || viewing.createdAt)} />
              <DetailBox label="Amount Paid" value={formatMoney(viewing.amount, viewing.currency)} />
              <DetailBox
                label="Remaining Balance"
                value={formatMoney(
                  viewing.invoiceBalance || 0,
                  viewing.invoiceId?.currency || viewing.currency
                )}
              />
              <DetailBox
                label="Linked Invoice"
                value={viewing.invoiceId?.invoiceNumber || '—'}
              />
              <DetailBox
                label="Payment Method"
                value={String(viewing.paymentMethod || 'Not specified').replace(/_/g, ' ')}
              />
              <DetailBox
                label="Batch"
                value={
                  viewing.batchId
                    ? (viewing.batchId?.batchNumber || 'Batch') +
                      (viewing.batchId?.name ? ' · ' + viewing.batchId.name : '')
                    : '—'
                }
              />
              <DetailBox label="Description" value={viewing.description || '—'} />
              <DetailBox label="Created" value={formatDate(viewing.createdAt)} />
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  if (isUniversityPaymentsView) {
    const totalPaidLabel = universityPaymentSummary.totalPaidCurrency
      ? formatMoney(universityPaymentSummary.totalPaid, universityPaymentSummary.totalPaidCurrency)
      : 'Multiple currencies';
    const remainingBalanceLabel = universityPaymentSummary.remainingCurrency
      ? formatMoney(
          universityPaymentSummary.remainingBalance,
          universityPaymentSummary.remainingCurrency
        )
      : universityPaymentSummary.remainingBalance > 0
        ? 'Multiple currencies'
        : formatMoney(0, 'USD');

    return (
      <div className="space-y-5 pb-10">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/55 to-emerald-50/45 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4 pr-14">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">
                University Finance · Payments
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {registerTitleOverride || 'Student Payments'}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                View payments received against your university invoices and track the remaining balance still due.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Refresh payments"
            onClick={() => void loadRecords()}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:text-teal-700 sm:right-6 sm:top-6"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <PaymentSummaryCard
            icon={<ReceiptText className="h-5 w-5" />}
            label="Total Payments"
            value={loading ? '—' : String(universityPaymentSummary.paymentCount)}
            helper="Recorded receipts"
            tone="blue"
          />
          <PaymentSummaryCard
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Total Paid"
            value={loading ? '—' : totalPaidLabel}
            helper="Amount received"
            tone="green"
          />
          <PaymentSummaryCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Remaining Balance"
            value={loading ? '—' : remainingBalanceLabel}
            helper="Outstanding on linked invoices"
            tone="amber"
          />
          <PaymentSummaryCard
            icon={<FileText className="h-5 w-5" />}
            label="Linked Invoices"
            value={loading ? '—' : String(universityPaymentSummary.linkedInvoices)}
            helper="Invoices with payments"
            tone="violet"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, payment reference, batch..."
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-[180px_180px_190px_auto]">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              options={[
                ['PAID', 'Paid'],
                ['REFUNDED', 'Refunded'],
                ['CANCELLED', 'Cancelled'],
              ]}
            />
            <FilterSelect
              value={paymentDateFilter}
              onChange={setPaymentDateFilter}
              placeholder="All Dates"
              options={[
                ['TODAY', 'Today'],
                ['7_DAYS', 'Last 7 Days'],
                ['30_DAYS', 'Last 30 Days'],
                ['THIS_MONTH', 'This Month'],
              ]}
            />
            <FilterSelect
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              placeholder="All Methods"
              options={[
                ['BANK_TRANSFER', 'Bank Transfer'],
                ['MOBILE_MONEY', 'Mobile Money'],
                ['CASH', 'Cash'],
                ['CARD', 'Card'],
                ['OTHER', 'Other'],
              ]}
            />
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPaymentDateFilter('');
                setPaymentMethodFilter('');
              }}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-black text-slate-950">
                Payments ({filteredRecords.length})
              </h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                Tap a payment to view its full details.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white py-16 text-sm font-bold text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading payments...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
              <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-black text-slate-700">No payments found</p>
              <p className="mt-1 text-xs text-slate-500">
                Payment records will appear here when AZAAM records a payment against your invoice.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredRecords.map((record) => {
                const paymentId = asId(record);
                const expanded = expandedPaymentId === paymentId;
                const invoiceAmount = Number(record.invoiceAmount ?? record.invoiceId?.amount ?? 0);
                const remainingBalance = Number(record.invoiceBalance ?? 0);
                const batchLabel = record.batchId
                  ? (record.batchId?.batchNumber || 'Batch') +
                    (record.batchId?.name ? ' · ' + record.batchId.name : '')
                  : '—';
                const invoiceNumber = record.invoiceId?.invoiceNumber || '—';
                const paymentDate = formatDate(record.paidAt || record.createdAt);
                const paymentMethod = String(record.paymentMethod || 'Not specified').replace(/_/g, ' ');

                return (
                  <article
                    key={paymentId}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedPaymentId((current) => (current === paymentId ? null : paymentId))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setExpandedPaymentId((current) =>
                          current === paymentId ? null : paymentId
                        );
                      }
                    }}
                    className={
                      'min-w-0 cursor-pointer overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-teal-500/10 ' +
                      (expanded
                        ? 'border-teal-200 xl:col-span-2'
                        : 'border-slate-200')
                    }
                  >
                    <div className="bg-gradient-to-r from-white via-teal-50/45 to-cyan-50/70 p-4 sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 sm:h-12 sm:w-12">
                          <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 break-words text-sm font-black text-slate-950 sm:text-base">
                              {accountName(record)}
                            </h3>
                            <span className={'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ' + statusClass(record.status)}>
                              {record.status}
                            </span>
                          </div>
                          <div className="mt-1 break-all font-mono text-[10px] font-black text-teal-700 sm:text-[11px]">
                            {referenceLabel(record)}
                          </div>
                          {!expanded && (
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              {invoiceNumber}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!expanded && (
                            <div className="hidden text-right sm:block">
                              <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                Paid
                              </div>
                              <div className="text-sm font-black text-emerald-700">
                                {formatMoney(record.amount, record.currency)}
                              </div>
                            </div>
                          )}
                          <div className={'flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-transform ' + (expanded ? 'rotate-180' : '')}>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {!expanded && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="min-w-0 rounded-xl bg-white/90 p-2.5 shadow-sm">
                            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                              Paid
                            </div>
                            <div className="mt-1 break-words text-xs font-black text-emerald-700 sm:text-sm">
                              {formatMoney(record.amount, record.currency)}
                            </div>
                          </div>
                          <div className="min-w-0 rounded-xl bg-white/90 p-2.5 shadow-sm">
                            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                              Remaining
                            </div>
                            <div className="mt-1 break-words text-xs font-black text-amber-700 sm:text-sm">
                              {formatMoney(remainingBalance, record.invoiceId?.currency || record.currency)}
                            </div>
                          </div>
                          <div className="min-w-0 rounded-xl bg-white/90 p-2.5 shadow-sm">
                            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                              Date
                            </div>
                            <div className="mt-1 break-words text-[10px] font-black leading-4 text-slate-800 sm:text-xs">
                              {paymentDate}
                            </div>
                          </div>
                        </div>
                      )}

                      {expanded && (
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <PaymentMetric
                            label="Invoice Amount"
                            value={formatMoney(invoiceAmount, record.invoiceId?.currency || record.currency)}
                            icon={<FileText className="h-4 w-4" />}
                            tone="blue"
                          />
                          <PaymentMetric
                            label="Amount Paid"
                            value={formatMoney(record.amount, record.currency)}
                            icon={<CreditCard className="h-4 w-4" />}
                            tone="green"
                          />
                          <PaymentMetric
                            label="Remaining"
                            value={formatMoney(remainingBalance, record.invoiceId?.currency || record.currency)}
                            icon={<Clock3 className="h-4 w-4" />}
                            tone="amber"
                          />
                          <PaymentMetric
                            label="Payment Date"
                            value={paymentDate}
                            icon={<CalendarDays className="h-4 w-4" />}
                            tone="violet"
                          />
                        </div>
                      )}
                    </div>

                    {expanded && (
                      <div className="p-4 sm:p-5">
                        <div className="grid gap-x-5 gap-y-3 text-xs sm:grid-cols-2">
                          <PaymentDetailRow label="Invoice" value={invoiceNumber} />
                          <PaymentDetailRow label="Batch" value={batchLabel} />
                          <PaymentDetailRow
                            label="Description"
                            value={record.description || 'Payment received'}
                          />
                        </div>

                      </div>
                    )}

                    {!expanded && (
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-[10px] font-bold text-slate-500 sm:px-5">
                        <span>Tap to expand payment</span>
                        <span className="font-black text-teal-700">View details</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {viewing && (
          <ModalShell
            title="Payment Details"
            eyebrow={referenceLabel(viewing)}
            onClose={() => setViewing(null)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBox label="University" value={accountName(viewing)} />
              <DetailBox label="Status" value={viewing.status || '—'} />
              <DetailBox label="Payment Reference" value={referenceLabel(viewing)} />
              <DetailBox label="Payment Date" value={formatDate(viewing.paidAt || viewing.createdAt)} />
              <DetailBox
                label="Payment Amount"
                value={formatMoney(viewing.amount, viewing.currency)}
              />
              <DetailBox
                label="Invoice Amount"
                value={formatMoney(
                  viewing.invoiceAmount ?? viewing.invoiceId?.amount ?? 0,
                  viewing.invoiceId?.currency || viewing.currency
                )}
              />
              <DetailBox
                label="Remaining Balance"
                value={formatMoney(
                  viewing.invoiceBalance || 0,
                  viewing.invoiceId?.currency || viewing.currency
                )}
              />
              <DetailBox
                label="Linked Invoice"
                value={viewing.invoiceId?.invoiceNumber || '—'}
              />
              <DetailBox
                label="Batch"
                value={
                  viewing.batchId
                    ? (viewing.batchId?.batchNumber || 'Batch') +
                      (viewing.batchId?.name ? ' · ' + viewing.batchId.name : '')
                    : '—'
                }
              />
              <DetailBox label="Description" value={viewing.description || '—'} />
              <DetailBox label="Created" value={formatDate(viewing.createdAt)} />
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="pr-14">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-700">
            {config.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {config.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {config.description}
          </p>
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Finance page actions"
            aria-expanded={headerMenuOpen}
            onClick={() => setHeaderMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {headerMenuOpen && (
            <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              {!readOnly && config.action && (
                <button
                  type="button"
                  onClick={() => void openCreate()}
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-teal-700 hover:bg-teal-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                    <Plus className="h-4 w-4" />
                  </span>
                  {config.action}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  void loadRecords();
                }}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-slate-700 hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <RefreshCw className="h-4 w-4" />
                </span>
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <FinanceStat
          icon={<ReceiptText className="h-5 w-5" />}
          label="Records"
          value={loading ? '—' : String(filteredRecords.length)}
        />
        <FinanceStat
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Total Amount"
          value={loading ? '—' : totalAmountLabel}
        />
        <FinanceStat
          icon={<CalendarDays className="h-5 w-5" />}
          label="Pending / Open"
          value={loading ? '—' : String(pendingCount)}
        />
        <FinanceStat
          icon={<WalletCards className="h-5 w-5" />}
          label="Completed"
          value={loading ? '—' : String(completedCount)}
        />
      </section>

      <section className="max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">
                {registerTitleOverride || (readOnly ? config.title : config.title + ' Register')}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {registerDescriptionOverride ||
                  (readOnly
                    ? 'Read-only live finance records for students associated with your university.'
                    : 'Live finance records with filters, actions and responsive mobile cards.')}
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[620px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search account, invoice, reference..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {mode === 'transactions' ? (
                  <FilterSelect
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="All Types"
                    options={[
                      ['FEE', 'Fees'],
                      ['PAYMENT', 'Payments'],
                      ['REFUND', 'Refunds'],
                      ['SETTLEMENT', 'Settlements'],
                    ]}
                  />
                ) : (
                  <div className="hidden sm:block" />
                )}

                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="All Status"
                  options={[
                    ['PENDING', 'Pending'],
                    ['PARTIAL', 'Partial'],
                    ['OVERDUE', 'Overdue'],
                    ['PAID', 'Paid'],
                    ['REFUNDED', 'Refunded'],
                    ['CANCELLED', 'Cancelled'],
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading finance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No finance records found</p>
            <p className="mt-1 text-xs text-slate-500">
              {readOnly
                ? 'Records will appear automatically when AZAAM records finance activity for your students.'
                : config.action
                  ? 'Use the three-dot menu to create the first record.'
                  : 'Transactions will appear as finance activity is recorded.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Account</th>
                    {mode === 'transactions' && <th className="px-4 py-3.5">Type</th>}
                    <th className="px-4 py-3.5">Reference</th>
                    {mode === 'fees' && <th className="px-4 py-3.5">Batch</th>}
                    <th className="px-4 py-3.5">Amount</th>
                    {mode === 'fees' && <th className="px-4 py-3.5">Balance</th>}
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={asId(record)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setViewing(record)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setViewing(record);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-teal-50/40 focus:bg-teal-50/40 focus:outline-none"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900">{accountName(record)}</div>
                        <div className="mt-0.5 max-w-[180px] truncate text-[10px] font-semibold text-slate-500">
                          {accountEmail(record) || String(record.payerType || 'Finance account').replace(/_/g, ' ')}
                        </div>
                      </td>

                      {mode === 'transactions' && (
                        <td className="px-4 py-3.5">
                          <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' + typeClass(record.type)}>
                            {record.type}
                          </span>
                        </td>
                      )}

                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-teal-700">
                        {referenceLabel(record)}
                      </td>

                      {mode === 'fees' && (
                        <td className="px-4 py-3.5">
                          <div className="max-w-[180px] truncate font-bold text-slate-700">
                            {record.batchId?.batchNumber || '—'}
                          </div>
                          {record.batchId?.name && (
                            <div className="mt-0.5 max-w-[180px] truncate text-[10px] font-semibold text-slate-500">
                              {record.batchId.name}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-black text-slate-900">{formatMoney(record.amount, record.currency)}</div>
                        {record.type === 'FEE' && (
                          <div className="mt-0.5 text-[9px] font-semibold text-slate-500">
                            Paid {formatMoney(record.paidAmount || 0, record.currency)}
                          </div>
                        )}
                      </td>

                      {mode === 'fees' && (
                        <td className="whitespace-nowrap px-4 py-3.5 font-black text-amber-700">
                          {formatMoney(record.balance || 0, record.currency)}
                        </td>
                      )}

                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-600">
                        {formatDate(record.paidAt || record.dueDate || record.createdAt)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' + statusClass(record.status)}>
                          {record.status}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="inline-flex flex-col items-end">
                          <button
                            type="button"
                            aria-label="Finance record actions"
                            onClick={() =>
                              setRowMenuId((current) => current === asId(record) ? null : asId(record))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {rowMenuId === asId(record) && (
                            <div className="mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <ActionItem
                                icon={<Eye className="h-4 w-4" />}
                                label="View Details"
                                onClick={() => {
                                  setRowMenuId(null);
                                  setViewing(record);
                                }}
                              />
                              {!readOnly && (
                                <ActionItem
                                  icon={<Pencil className="h-4 w-4" />}
                                  label="Edit Record"
                                  onClick={() => void openEdit(record)}
                                />
                              )}
                              {!readOnly && record.type === 'PAYMENT' && record.status !== 'REFUNDED' && (
                                <ActionItem
                                  icon={<RotateCcw className="h-4 w-4" />}
                                  label="Create Refund"
                                  onClick={() => void refundPayment(record)}
                                />
                              )}
                              {!readOnly && record.status !== 'CANCELLED' && (
                                <ActionItem
                                  danger
                                  icon={<Ban className="h-4 w-4" />}
                                  label="Void / Cancel"
                                  onClick={() => void voidRecord(record)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid min-w-0 gap-3 p-3 md:hidden">
              {filteredRecords.map((record) => {
                const batchLabel = record.batchId?.batchNumber || '—';
                const payerType = String(
                  record.payerType ||
                    (record.universityId
                      ? 'UNIVERSITY'
                      : record.organizationId && !record.userId
                        ? 'ORGANIZATION'
                        : 'STUDENT')
                ).replace(/_/g, ' ');

                return (
                  <article
                    key={asId(record)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewing(record)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setViewing(record);
                      }
                    }}
                    className="min-w-0 max-w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.995]"
                  >
                    <div className="bg-gradient-to-r from-white via-teal-50/35 to-cyan-50/70 p-4">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 break-words text-base font-black text-slate-950">
                              {accountName(record)}
                            </h3>
                            <span className={'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ' + statusClass(record.status)}>
                              {record.status}
                            </span>
                          </div>

                          <div className="mt-2 break-all font-mono text-[11px] font-black text-teal-700">
                            {referenceLabel(record)}
                          </div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {payerType} · {record.type}
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-label="Finance record actions"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRowMenuId((current) => current === asId(record) ? null : asId(record));
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>

                      {rowMenuId === asId(record) && (
                        <div
                          className="mt-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ActionItem
                            icon={<Eye className="h-4 w-4" />}
                            label="View Details"
                            onClick={() => {
                              setRowMenuId(null);
                              setViewing(record);
                            }}
                          />
                          {!readOnly && (
                            <ActionItem
                              icon={<Pencil className="h-4 w-4" />}
                              label="Edit Record"
                              onClick={() => void openEdit(record)}
                            />
                          )}
                          {!readOnly && record.type === 'PAYMENT' && record.status !== 'REFUNDED' && (
                            <ActionItem
                              icon={<RotateCcw className="h-4 w-4" />}
                              label="Create Refund"
                              onClick={() => void refundPayment(record)}
                            />
                          )}
                          {!readOnly && record.status !== 'CANCELLED' && (
                            <ActionItem
                              danger
                              icon={<Ban className="h-4 w-4" />}
                              label="Void / Cancel"
                              onClick={() => void voidRecord(record)}
                            />
                          )}
                        </div>
                      )}

                      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-xl bg-white/85 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Amount
                          </div>
                          <div className="mt-1 break-words text-lg font-black text-slate-950">
                            {formatMoney(record.amount, record.currency)}
                          </div>
                        </div>

                        <div className="min-w-0 rounded-xl bg-white/85 p-3">
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            {record.type === 'FEE' ? 'Balance' : 'Date'}
                          </div>
                          <div className={'mt-1 break-words text-sm font-black ' + (record.type === 'FEE' ? 'text-amber-700' : 'text-slate-800')}>
                            {record.type === 'FEE'
                              ? formatMoney(record.balance || 0, record.currency)
                              : formatDate(record.paidAt || record.createdAt)}
                          </div>
                        </div>

                        {record.type === 'FEE' && (
                          <>
                            <MobileInfo label="Batch" value={batchLabel} />
                            <MobileInfo label="Created" value={formatDate(record.createdAt)} />
                          </>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                        <span className="text-[10px] font-bold text-slate-500">
                          Tap card to view full details
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black text-teal-700">
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {viewing && (
        <ModalShell
          title={viewing.type === 'FEE' ? 'Invoice Details' : 'Finance Record Details'}
          eyebrow={viewing.type === 'FEE' ? referenceLabel(viewing) : viewing.type || 'Finance'}
          onClose={() => setViewing(null)}
        >
          {readOnly && (
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">
              This is a read-only university finance view. Financial changes are maintained by AZAAM administration.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBox label="Bill To" value={accountName(viewing)} />
            <DetailBox label="Payer Type" value={String(viewing.payerType || (viewing.universityId ? 'UNIVERSITY' : viewing.organizationId && !viewing.userId ? 'ORGANIZATION' : 'STUDENT')).replace(/_/g, ' ')} />
            <DetailBox label="Email" value={accountEmail(viewing) || '—'} />
            <DetailBox label="Type" value={viewing.type || '—'} />
            <DetailBox label="Status" value={viewing.status || '—'} />
            <DetailBox label="Amount" value={formatMoney(viewing.amount, viewing.currency)} />
            <DetailBox label="Reference" value={referenceLabel(viewing)} />
            <DetailBox label="Linked Invoice" value={viewing.invoiceId?.invoiceNumber || (viewing.type === 'FEE' ? viewing.invoiceNumber : '—')} />
            {viewing.type === 'FEE' && <DetailBox label="Paid Amount" value={formatMoney(viewing.paidAmount || 0, viewing.currency)} />}
            {viewing.type === 'FEE' && <DetailBox label="Balance" value={formatMoney(viewing.balance || 0, viewing.currency)} />}
            <DetailBox label="Description" value={viewing.description || '—'} />
            <DetailBox label="Payment Method" value={(viewing.paymentMethod || '—').replace(/_/g, ' ')} />
            <DetailBox label="Due Date" value={formatDate(viewing.dueDate)} />
            <DetailBox label="Paid Date" value={formatDate(viewing.paidAt)} />
            <DetailBox label="University" value={viewing.universityId?.name || '—'} />
            {viewing.batchId && (
              <DetailBox
                label="Batch"
                value={
                  (viewing.batchId?.batchNumber || 'Batch') +
                  (viewing.batchId?.name ? ' · ' + viewing.batchId.name : '')
                }
              />
            )}
            <DetailBox label="Organization" value={viewing.organizationId?.name || '—'} />
            <DetailBox label="Created" value={formatDate(viewing.createdAt)} />
          </div>

          {viewing.type === 'FEE' && Array.isArray(viewing.lineItems) && viewing.lineItems.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Invoice Services</div>
              <div className="mt-3 space-y-2">
                {viewing.lineItems.map((item: RecordObject, index: number) => (
                  <div key={String(item.feeRuleId || index)} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black text-slate-800">{item.serviceName || 'Service'}</div>
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                        Qty {item.quantity || 1} × {formatMoney(item.unitPrice || 0, viewing.currency)}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-black text-slate-900">
                      {formatMoney(item.amount || 0, viewing.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewing.notes && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Notes</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{viewing.notes}</p>
            </div>
          )}
        </ModalShell>
      )}

      {!readOnly && formOpen && (
        <ModalShell
          title={editing ? 'Edit Finance Record' : config.action}
          eyebrow={editing ? editing.type : config.type || 'Finance'}
          onClose={closeForm}
          wide={formType === 'FEE' && !editing}
          footer={
            <>
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  saving ||
                  referenceLoading ||
                  (formType === 'FEE' && !editing && (!invoiceBillingContextValid || invoiceItems.length === 0 || invoiceTotal <= 0)) ||
                  (formType === 'PAYMENT' && !form.invoiceId) ||
                  (formType === 'SETTLEMENT' && !form.organizationId) ||
                  (formType !== 'FEE' && !form.description.trim()) ||
                  (formType !== 'FEE' && form.amount === '')
                }
                onClick={() => void saveRecord()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                {saving
                  ? 'Saving...'
                  : editing
                    ? 'Save Changes'
                    : formType === 'FEE'
                      ? `Create Invoice · ${formatMoney(invoiceTotal, invoiceCurrency)}`
                      : config.action}
              </button>
            </>
          }
        >
          {referenceLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading accounts...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {formType === 'PAYMENT' && (
                <Select
                  label="Invoice *"
                  value={form.invoiceId}
                  onChange={(value) => {
                    const invoice = invoices.find((item) => asId(item) === value);
                    setForm((current) => ({
                      ...current,
                      invoiceId: value,
                      userId: asId(invoice?.userId),
                      currency: invoice?.currency || current.currency,
                      description: invoice
                        ? 'Payment for ' + (invoice.invoiceNumber || invoice.description || 'invoice')
                        : current.description,
                      amount: invoice?.balance != null ? String(invoice.balance) : current.amount,
                    }));
                  }}
                  disabled={Boolean(editing)}
                >
                  <option value="">Select invoice</option>
                  {openInvoices.map((invoice) => (
                    <option key={asId(invoice)} value={asId(invoice)}>
                      {invoice.invoiceNumber || 'Invoice'} · {accountName(invoice)} · Balance {formatMoney(invoice.balance ?? invoice.amount, invoice.currency)}
                    </option>
                  ))}
                </Select>
              )}

              {formType === 'PAYMENT' && (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Invoice Account</div>
                  <div className="mt-1 text-sm font-black text-slate-800">
                    {selectedInvoice ? accountName(selectedInvoice) : 'Select an invoice'}
                  </div>
                  {selectedInvoice && (
                    <div className="mt-1 text-[10px] font-semibold text-slate-500">
                      Remaining balance: {formatMoney(selectedInvoice.balance ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </div>
                  )}
                </div>
              )}

              {formType === 'FEE' && (
                <>
                  {!editing && (
                    <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700">1. Select University</div>
                        <div className="mt-1 text-xs font-black text-slate-800">Choose the university to bill</div>
                      </div>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">2. Select Batch</div>
                        <div className="mt-1 text-xs font-black text-slate-800">Choose the approved student batch</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-700">3. Select Pricing Rule</div>
                        <div className="mt-1 text-xs font-black text-slate-800">Choose service rule(s) to charge</div>
                      </div>
                      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">4. Review & Create</div>
                        <div className="mt-1 text-xs font-black text-slate-800">Confirm total and create invoice</div>
                      </div>
                    </div>
                  )}

                  <Select
                    label="Bill To / Payer *"
                    value={form.payerType}
                    disabled={Boolean(editing)}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        payerType: value,
                        userId: '',
                        universityId: '',
                        batchId: '',
                        organizationId: '',
                      }));
                      setTrainingBatches([]);
                      setBatchLoading(false);
                      setInvoiceItems([]);
                      feeRuleRequestRef.current += 1;
                      setPricingProfile(null);
                      setFeeRules([]);
                      setFeeRulesLoading(false);
                    }}
                  >
                    <option value="UNIVERSITY">University</option>
                    <option value="STUDENT">Student / Independent Applicant</option>
                    <option value="ORGANIZATION">Organization</option>
                  </Select>

                  {form.payerType === 'UNIVERSITY' && (
                    <>
                      <Select
                        label="University *"
                        value={form.universityId}
                        disabled={Boolean(editing)}
                        onChange={(value) => {
                          setForm((current) => ({
                            ...current,
                            universityId: value,
                            batchId: '',
                          }));
                          setTrainingBatches([]);
                          setInvoiceItems([]);
                          feeRuleRequestRef.current += 1;
                          setPricingProfile(null);
                          setFeeRules([]);
                          setFeeRulesLoading(false);

                          if (value) void loadTrainingBatches(value);
                        }}
                      >
                        <option value="">Select university</option>
                        {universities.map((university) => (
                          <option key={asId(university)} value={asId(university)}>
                            {university.name}{university.code ? ' · ' + university.code : ''}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label="Batch No *"
                        value={form.batchId}
                        disabled={Boolean(editing) || !form.universityId || batchLoading}
                        onChange={(value) => {
                          setForm((current) => ({ ...current, batchId: value }));
                          setInvoiceItems([]);
                          feeRuleRequestRef.current += 1;
                          setPricingProfile(null);
                          setFeeRules([]);
                          setFeeRulesLoading(false);

                          if (value && form.universityId) {
                            void loadPricingProfile('UNIVERSITY', form.universityId);
                          }
                        }}
                      >
                        <option value="">
                          {!form.universityId
                            ? 'Select university first'
                            : batchLoading
                              ? 'Loading batches...'
                              : 'Select approved batch'}
                        </option>
                        {trainingBatches.map((batch) => (
                          <option key={asId(batch)} value={asId(batch)}>
                            {batch.batchNumber} · {batch.name} · {Number(batch.studentsCount || 0)} student(s)
                          </option>
                        ))}
                      </Select>

                      {selectedBatch && (
                        <div className="sm:col-span-2 grid gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 sm:grid-cols-3">
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-wide text-blue-500">Selected Batch</div>
                            <div className="mt-1 text-sm font-black text-slate-900">{selectedBatch.batchNumber}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-500">{selectedBatch.name}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-wide text-blue-500">Students</div>
                            <div className="mt-1 text-sm font-black text-slate-900">{batchStudentCount}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-500">Approved students in this batch</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-wide text-blue-500">Intake Date</div>
                            <div className="mt-1 text-sm font-black text-slate-900">{formatDate(selectedBatch.intakeDate)}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-500">Billing quantity is automatic for Per Student rules</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.payerType === 'STUDENT' && (
                    <Select
                      label="Student / Account *"
                      value={form.userId}
                      disabled={Boolean(editing)}
                      onChange={(value) => {
                        const account = users.find((item) => asId(item) === value);
                        const universityId = asId(account?.universityId);
                        setForm((current) => ({ ...current, userId: value }));
                        setInvoiceItems([]);
                        if (value) void loadPricingProfile('STUDENT', universityId || undefined);
                        else {
                          feeRuleRequestRef.current += 1;
                          setFeeRules([]);
                          setFeeRulesLoading(false);
                        }
                      }}
                    >
                      <option value="">Select student/account</option>
                      {users.map((item) => (
                        <option key={asId(item)} value={asId(item)}>
                          {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email} · {item.email}
                        </option>
                      ))}
                    </Select>
                  )}

                  {form.payerType === 'ORGANIZATION' && (
                    <Select
                      label="Organization *"
                      value={form.organizationId}
                      disabled={Boolean(editing)}
                      onChange={(value) => {
                        setForm((current) => ({ ...current, organizationId: value }));
                        setInvoiceItems([]);
                        if (value) void loadPricingProfile('ORGANIZATION');
                        else {
                          feeRuleRequestRef.current += 1;
                          setFeeRules([]);
                          setFeeRulesLoading(false);
                        }
                      }}
                    >
                      <option value="">Select organization</option>
                      {organizations.map((organization) => (
                        <option key={asId(organization)} value={asId(organization)}>
                          {organization.name}
                        </option>
                      ))}
                    </Select>
                  )}

                  {!editing && form.payerType === 'UNIVERSITY' && (
                    <div className="sm:col-span-2 rounded-3xl border border-cyan-200 bg-white p-4 shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">
                        Pricing Rule
                      </div>
                      <div className="mt-1 text-sm font-black text-slate-900">
                        {selectedUniversity?.name || 'Selected university'} · {selectedBatch?.batchNumber || 'Select batch'}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        Choose one pricing rule for this batch. Per Student rules automatically use the approved student count.
                      </p>

                      <label className="mt-4 block">
                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                          University Pricing Rule *
                        </span>
                        <select
                          value={selectedInvoiceRuleId}
                          disabled={!form.batchId || feeRulesLoading}
                          onChange={(event) => {
                            const value = event.target.value;
                            const rule = feeRuleById.get(value);
                            setInvoiceItems(
                              value && rule
                                ? [{ feeRuleId: value, quantity: quantityForRule(rule) }]
                                : []
                            );
                          }}
                          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <option value="">
                            {!form.batchId
                              ? 'Select batch first'
                              : feeRulesLoading
                                ? 'Loading university pricing...'
                                : feeRules.length
                                  ? 'Select pricing rule'
                                  : 'No active university pricing found'}
                          </option>
                          {feeRules.map((rule) => (
                            <option key={asId(rule)} value={asId(rule)}>
                              {rule.serviceName} · {formatMoney(rule.amount, rule.currency)} · {String(rule.billingBasis || '').replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedInvoiceRule && (
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">Unit Price</div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              {formatMoney(selectedInvoiceRule.amount, selectedInvoiceRule.currency)}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">Billing Basis</div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              {String(selectedInvoiceRule.billingBasis || '').replace(/_/g, ' ')}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">Billing Qty</div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              {quantityForRule(selectedInvoiceRule)}
                            </div>
                          </div>
                          <div className="rounded-xl bg-teal-50 p-3">
                            <div className="text-[9px] font-black uppercase tracking-wide text-teal-600">Total</div>
                            <div className="mt-1 text-sm font-black text-teal-800">
                              {formatMoney(invoiceTotal, selectedInvoiceRule.currency)}
                            </div>
                          </div>
                        </div>
                      )}

                      {!feeRulesLoading && form.batchId && feeRules.length === 0 && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                          No active university pricing was found. Check Finance → Service Pricing for this university.
                        </div>
                      )}
                    </div>
                  )}

                  {!editing && form.payerType !== 'UNIVERSITY' && (
                    <div className="sm:col-span-2 overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">
                            Service Price List
                          </div>
                          <div className="mt-1 text-base font-black text-slate-950">
                            {form.payerType === 'UNIVERSITY'
                              ? selectedBatch
                                ? selectedPayerName + ' · ' + selectedBatch.batchNumber
                                : selectedPayerName || 'Select university and batch'
                              : selectedPayerName || 'Select a payer to load services'}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-slate-600">
                            {pricingProfile?.serviceCount
                              ? `${pricingProfile.serviceCount} active services · ${pricingProfile.currency || pricingProfile.currencies?.join(', ') || 'Currency varies'} · Pricing snapshot will be saved on the invoice`
                              : 'All applicable services will appear here automatically.'}
                          </p>
                        </div>

                        {feeRules.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={selectAllInvoiceRules}
                              className="min-h-9 rounded-xl border border-teal-200 bg-white px-3 text-[10px] font-black text-teal-700 hover:bg-teal-50"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={clearInvoiceRules}
                              className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 hover:bg-slate-50"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>

                      {!invoicePayerValid ? (
                        <div className="m-4 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/40 p-6 text-center">
                          <Building2 className="mx-auto h-8 w-8 text-cyan-500" />
                          <div className="mt-2 text-sm font-black text-slate-800">Choose the payer first</div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Select the university before billing its services.
                          </p>
                        </div>
                      ) : form.payerType === 'UNIVERSITY' && !form.batchId ? (
                        <div className="m-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                          <Users className="mx-auto h-8 w-8 text-blue-500" />
                          <div className="mt-2 text-sm font-black text-slate-800">Select the Batch No</div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Pricing rules will load only after the batch is selected, so the invoice is linked to the correct group of students.
                          </p>
                        </div>
                      ) : feeRulesLoading ? (
                        <div className="flex items-center justify-center gap-2 p-8 text-sm font-bold text-cyan-800">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading pricing profile...
                        </div>
                      ) : feeRules.length === 0 ? (
                        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                          No active services were found for this payer. Open Finance → Service Pricing and confirm the payer, university and effective dates.
                        </div>
                      ) : (
                        <>
                          <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[900px] text-left text-xs">
                              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                <tr>
                                  <th className="w-16 px-4 py-3 text-center">Use</th>
                                  <th className="px-4 py-3">Service</th>
                                  <th className="px-4 py-3">Unit Price</th>
                                  <th className="px-4 py-3">Billing Basis</th>
                                  <th className="w-28 px-4 py-3">Qty</th>
                                  <th className="px-4 py-3 text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {feeRules.map((rule) => {
                                  const ruleId = asId(rule);
                                  const selected = isInvoiceRuleSelected(ruleId);
                                  const item = invoiceItems.find((entry) => entry.feeRuleId === ruleId);
                                  const automaticBatchQuantity =
                                    form.payerType === 'UNIVERSITY' &&
                                    rule.billingBasis === 'PER_STUDENT' &&
                                    batchStudentCount > 0;
                                  const quantity = Number(
                                    item?.quantity || quantityForRule(rule)
                                  );
                                  const lineTotal = Number(rule.amount || 0) * quantity;

                                  return (
                                    <tr key={ruleId} className={selected ? 'bg-cyan-50/45' : 'bg-white hover:bg-slate-50'}>
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          type="button"
                                          aria-label={selected ? 'Remove service from invoice' : 'Add service to invoice'}
                                          onClick={() => toggleInvoiceRule(ruleId)}
                                          className={
                                            'mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition ' +
                                            (selected
                                              ? 'border-teal-600 bg-teal-600 text-white'
                                              : 'border-slate-300 bg-white text-transparent hover:border-teal-400')
                                          }
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-black text-slate-900">{rule.serviceName}</div>
                                        <div className="mt-0.5 flex items-center gap-2 text-[9px] font-semibold text-slate-500">
                                          <span>{rule.serviceCode}</span>
                                          <span className={rule.pricingSource === 'UNIVERSITY' ? 'text-violet-600' : 'text-cyan-700'}>
                                            {rule.pricingSource === 'UNIVERSITY' ? 'University Price' : 'Global Price'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 font-black text-slate-900">
                                        {formatMoney(rule.amount, rule.currency)}
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-slate-600">
                                        {String(rule.billingBasis || '').replace(/_/g, ' ')}
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          min="0.01"
                                          step={rule.billingBasis === 'PER_MONTH' ? '1' : '1'}
                                          disabled={!selected || automaticBatchQuantity}
                                          value={selected ? quantity : quantityForRule(rule)}
                                          onChange={(event) => updateInvoiceQuantity(ruleId, Number(event.target.value))}
                                          title={automaticBatchQuantity ? 'Quantity comes from the selected batch student count' : undefined}
                                          className="min-h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-slate-800 outline-none focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="font-black text-slate-900">
                                          {selected ? formatMoney(lineTotal, rule.currency) : '—'}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="grid gap-3 p-3 md:hidden">
                            {feeRules.map((rule) => {
                              const ruleId = asId(rule);
                              const selected = isInvoiceRuleSelected(ruleId);
                              const item = invoiceItems.find((entry) => entry.feeRuleId === ruleId);
                              const automaticBatchQuantity =
                                form.payerType === 'UNIVERSITY' &&
                                rule.billingBasis === 'PER_STUDENT' &&
                                batchStudentCount > 0;
                              const quantity = Number(
                                item?.quantity || quantityForRule(rule)
                              );

                              return (
                                <article
                                  key={ruleId}
                                  className={
                                    'rounded-2xl border p-3 ' +
                                    (selected ? 'border-teal-200 bg-teal-50/50' : 'border-slate-200 bg-white')
                                  }
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="truncate text-xs font-black text-slate-900">{rule.serviceName}</h4>
                                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                                        {formatMoney(rule.amount, rule.currency)} · {String(rule.billingBasis || '').replace(/_/g, ' ')}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleInvoiceRule(ruleId)}
                                      className={
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ' +
                                        (selected
                                          ? 'border-teal-600 bg-teal-600 text-white'
                                          : 'border-slate-300 bg-white text-transparent')
                                      }
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                  </div>

                                  {selected && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                      <label>
                                        <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                          {automaticBatchQuantity ? 'Batch Students' : 'Quantity'}
                                        </span>
                                        <input
                                          type="number"
                                          min="0.01"
                                          step="1"
                                          value={quantity}
                                          disabled={automaticBatchQuantity}
                                          onChange={(event) => updateInvoiceQuantity(ruleId, Number(event.target.value))}
                                          className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                      </label>
                                      <div className="rounded-xl bg-white p-2">
                                        <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">Line Total</div>
                                        <div className="mt-1 text-xs font-black text-slate-900">
                                          {formatMoney(Number(rule.amount || 0) * quantity, rule.currency)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>

                          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-950 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-[10px] font-semibold text-slate-300">
                              {invoiceItems.length} service{invoiceItems.length === 1 ? '' : 's'} selected
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Invoice Total</span>
                              <span className="text-xl font-black">{formatMoney(invoiceTotal, invoiceCurrency)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
               </>
              )}

              {formType === 'SETTLEMENT' && (
                <Select
                  label="Beneficiary Organization *"
                  value={form.organizationId}
                  onChange={(value) => setForm((current) => ({ ...current, organizationId: value }))}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </Select>
              )}

              {formType === 'FEE' && !editing && (
                <div className="sm:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">4. Review & Create Invoice</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">
                    {form.payerType === 'UNIVERSITY' && selectedBatch
                      ? `${selectedBatch.batchNumber} · ${batchStudentCount} student(s). Confirm the selected pricing rule(s), total and due date.`
                      : 'Confirm the total, invoice number, due date and notes. Service prices are copied into the invoice as a permanent snapshot.'}
                  </div>
                </div>
              )}

              {formType === 'FEE' && !editing ? (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Amount</div>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    {invoiceItems.length ? formatMoney(invoiceTotal, invoiceCurrency) : 'Calculated from services'}
                  </div>
                </div>
              ) : (
                <label>
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Amount *</span>
                  <input
                    type="number"
                    min="0.01"
                    max={formType === 'PAYMENT' && selectedInvoice ? Number(selectedInvoice.balance ?? selectedInvoice.amount) : undefined}
                    step="0.01"
                    value={form.amount}
                    disabled={Boolean(editing && ['PAYMENT', 'REFUND'].includes(formType))}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
              )}

              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  {formType === 'FEE' ? 'Description (optional)' : 'Description *'}
                </span>
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Clinical training fee, payment, settlement or refund reason"
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </label>

              {formType === 'FEE' && !editing ? (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Currency</div>
                  <div className="mt-1 text-sm font-black text-slate-900">
                    {invoiceItems.length ? invoiceCurrency : 'From service pricing'}
                  </div>
                </div>
              ) : (
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={(value) => setForm((current) => ({ ...current, currency: value }))}
                  disabled={['PAYMENT', 'REFUND'].includes(formType)}
                >
                  <option value="USD">USD</option>
                  <option value="SOS">SOS</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              )}

              {formType === 'SETTLEMENT' ? (
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </Select>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Status</div>
                  <div className="mt-1 text-sm font-black text-slate-800">
                    {formType === 'FEE' ? 'Calculated automatically' : form.status}
                  </div>
                  {formType === 'FEE' && (
                    <div className="mt-1 text-[10px] font-semibold text-slate-500">
                      Based on invoice balance and due date
                    </div>
                  )}
                </div>
              )}

              {formType === 'FEE' && (
                <>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Invoice Number</span>
                    <input
                      value={form.invoiceNumber}
                      onChange={(event) => setForm((current) => ({ ...current, invoiceNumber: event.target.value }))}
                      placeholder="Auto-generated if blank"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Due Date</span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                </>
              )}

              {formType !== 'FEE' && (
                <>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Reference</span>
                    <input
                      value={form.reference}
                      onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                      placeholder="Auto-generated if blank"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Transaction Date</span>
                    <input
                      type="date"
                      value={form.paidAt}
                      onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <Select
                    label="Payment Method"
                    value={form.paymentMethod}
                    onChange={(value) => setForm((current) => ({ ...current, paymentMethod: value }))}
                  >
                    <option value="">Not specified</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </>
              )}

              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional internal finance notes"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </label>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
};

const AdminPaymentSummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}> = ({ icon, label, value, helper, tone }) => {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/75 text-violet-700',
  } as const;

  return (
    <article className={'relative min-w-0 rounded-3xl border p-4 shadow-sm sm:p-5 ' + tones[tone]}>
      <div className="flex items-center gap-3 sm:block">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1 sm:mt-4">
          <div className="break-words text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {value}
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
            {label}
          </div>
          <div className="mt-1 hidden text-[10px] font-semibold text-slate-400 sm:block">
            {helper}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2" />
      </div>
    </article>
  );
};

const PaymentSummaryCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}> = ({ icon, label, value, helper, tone }) => {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/55 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-700',
  } as const;

  return (
    <article className={'min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ' + tones[tone]}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        {icon}
      </div>
      <div className="mt-4 break-words text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </div>
      <div className="mt-1 text-[10px] font-semibold text-slate-400">{helper}</div>
    </article>
  );
};

const PaymentMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}> = ({ icon, label, value, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;

  return (
    <div className="min-w-0 rounded-2xl bg-white/90 p-3 shadow-sm">
      <div className={'flex h-8 w-8 items-center justify-center rounded-xl ' + tones[tone]}>
        {icon}
      </div>
      <div className="mt-2 text-[9px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={
          'mt-1 break-words text-sm font-black leading-5 ' +
          (tone === 'amber' ? 'text-amber-700' : tone === 'green' ? 'text-emerald-700' : 'text-slate-900')
        }
      >
        {value}
      </div>
    </div>
  );
};

const PaymentDetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-slate-100 pb-2 last:border-b-0 sm:grid-cols-[130px_minmax(0,1fr)]">
    <span className="text-[10px] font-bold text-slate-500">{label}</span>
    <span className="min-w-0 break-words text-xs font-black text-slate-800">{value}</span>
  </div>
);

const FinanceStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
      {icon}
    </div>
    <p className="mt-4 truncate text-xl font-black text-slate-950 sm:text-2xl">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{label}</p>
  </article>
);

const ActionItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black transition ' +
      (danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100')
    }
  >
    <span className={danger ? 'text-rose-500' : 'text-teal-600'}>{icon}</span>
    {label}
  </button>
);

const ModalShell: React.FC<{
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ eyebrow, title, onClose, children, footer, wide = false }) => (
  <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    <button type="button" aria-label="Close modal" className="absolute inset-0 cursor-default" onClick={onClose} />
    <div className={'relative z-10 flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl ' + (wide ? 'sm:max-w-6xl' : 'sm:max-w-3xl')}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const DetailBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-words text-sm font-black text-slate-800">{value}</div>
  </div>
);

const MobileInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-xl bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-words text-xs font-black leading-5 text-slate-800">{value}</div>
  </div>
);

const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
  </div>
);

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, value, onChange, children, disabled = false }) => (
  <label>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
    <div className="relative mt-1">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);
