import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Layers3,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Save,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type RuleForm = {
  serviceName: string;
  serviceCode: string;
  category: string;
  amount: string;
  currency: string;
  billingBasis: string;
  defaultPayer: string;
  scope: string;
  universityId: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  notes: string;
};

type BulkServiceRow = {
  serviceCode: string;
  serviceName: string;
  category: string;
  amount: string;
  billingBasis: string;
  enabled: boolean;
  hasUniversityPrice: boolean;
};

type BulkUniversityForm = {
  universityId: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  notes: string;
};

const EMPTY_FORM: RuleForm = {
  serviceName: '',
  serviceCode: '',
  category: 'PLACEMENT',
  amount: '',
  currency: 'USD',
  billingBasis: 'PER_STUDENT',
  defaultPayer: 'UNIVERSITY',
  scope: 'GLOBAL',
  universityId: '',
  effectiveFrom: '',
  effectiveTo: '',
  status: 'ACTIVE',
  notes: '',
};

const EMPTY_BULK_FORM: BulkUniversityForm = {
  universityId: '',
  currency: 'USD',
  effectiveFrom: '',
  effectiveTo: '',
  status: 'ACTIVE',
  notes: '',
};

const STANDARD_SERVICES: Omit<BulkServiceRow, 'amount' | 'enabled' | 'hasUniversityPrice'>[] = [
  { serviceCode: 'PLACEMENT_FEE', serviceName: 'Placement Fee', category: 'PLACEMENT', billingBasis: 'PER_STUDENT' },
  { serviceCode: 'VISA_PROCESSING', serviceName: 'Visa Processing', category: 'VISA', billingBasis: 'PER_STUDENT' },
  { serviceCode: 'TRANSPORTATION', serviceName: 'Transportation', category: 'TRANSPORTATION', billingBasis: 'PER_TRIP' },
  { serviceCode: 'RESIDENCE', serviceName: 'Residence / Accommodation', category: 'RESIDENCE', billingBasis: 'PER_MONTH' },
  { serviceCode: 'AIRPORT_PICKUP', serviceName: 'Airport Pickup', category: 'AIRPORT_PICKUP', billingBasis: 'PER_TRIP' },
  { serviceCode: 'INSURANCE', serviceName: 'Insurance', category: 'INSURANCE', billingBasis: 'PER_STUDENT' },
  { serviceCode: 'DOCUMENT_PROCESSING', serviceName: 'Document Processing', category: 'DOCUMENT_PROCESSING', billingBasis: 'PER_STUDENT' },
  { serviceCode: 'CERTIFICATION', serviceName: 'Certification', category: 'CERTIFICATION', billingBasis: 'ONE_TIME' },
];

const asArray = (response: any): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  const first = Object.values(data || {}).find((value) => Array.isArray(value));
  return Array.isArray(first) ? (first as RecordObject[]) : [];
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const formatMoney = (amount: any, currency = 'USD') => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return currency + ' ' + value.toFixed(2);
  }
};

const formatLabel = (value?: string) =>
  String(value || '—')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toInputDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const loadAllAdminPages = async (endpoint: string) => {
  const items: RecordObject[] = [];
  let page = 1;
  while (page <= 25) {
    const response = await api.get(endpoint, { params: { page, limit: 100 } });
    items.push(...asArray(response));
    const pagination = response?.data?.pagination;
    if (!pagination?.totalPages || page >= Number(pagination.totalPages)) break;
    page += 1;
  }
  return items;
};

export const FinancePricingPage: React.FC = () => {
  const [rules, setRules] = useState<RecordObject[]>([]);
  const [universities, setUniversities] = useState<RecordObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecordObject | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [bulkForm, setBulkForm] = useState<BulkUniversityForm>(EMPTY_BULK_FORM);
  const [bulkRows, setBulkRows] = useState<BulkServiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [payerFilter, setPayerFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ruleResponse, nextUniversities] = await Promise.all([
        api.get('/finance/pricing'),
        loadAllAdminPages('/admin/universities'),
      ]);
      setRules(asArray(ruleResponse));
      setUniversities(nextUniversities);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load service pricing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (payerFilter && rule.defaultPayer !== payerFilter) return false;
      if (scopeFilter && rule.scope !== scopeFilter) return false;
      if (statusFilter && rule.status !== statusFilter) return false;
      if (!query) return true;
      return [
        rule.serviceName,
        rule.serviceCode,
        rule.category,
        rule.billingBasis,
        rule.defaultPayer,
        rule.universityId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [rules, search, payerFilter, scopeFilter, statusFilter]);

  const buildBulkRows = (universityId: string): BulkServiceRow[] => {
    const byCode = new Map<string, RecordObject>();
    const categories = new Set<string>();

    rules
      .filter((rule) => rule.scope === 'GLOBAL')
      .forEach((rule) => {
        const code = String(rule.serviceCode || '').trim().toUpperCase();
        if (!code) return;
        byCode.set(code, rule);
        if (rule.category) categories.add(String(rule.category));
      });

    rules.forEach((rule) => {
      const code = String(rule.serviceCode || '').trim().toUpperCase();
      if (!code || byCode.has(code)) return;
      byCode.set(code, rule);
      if (rule.category) categories.add(String(rule.category));
    });

    STANDARD_SERVICES.forEach((service) => {
      if (!categories.has(service.category) && !byCode.has(service.serviceCode)) {
        byCode.set(service.serviceCode, service);
      }
    });

    return Array.from(byCode.entries())
      .map(([serviceCode, template]) => {
        const universityRule = universityId
          ? rules.find(
              (rule) =>
                rule.scope === 'UNIVERSITY' &&
                rule.defaultPayer === 'UNIVERSITY' &&
                asId(rule.universityId) === universityId &&
                String(rule.serviceCode || '').toUpperCase() === serviceCode
            )
          : null;

        const globalRule = rules.find(
          (rule) =>
            rule.scope === 'GLOBAL' &&
            rule.defaultPayer === 'UNIVERSITY' &&
            String(rule.serviceCode || '').toUpperCase() === serviceCode
        );

        const source = universityRule || globalRule || template;

        return {
          serviceCode,
          serviceName: source.serviceName || template.serviceName || formatLabel(serviceCode),
          category: source.category || template.category || 'OTHER',
          amount:
            universityRule?.amount != null
              ? String(universityRule.amount)
              : globalRule?.amount != null
                ? String(globalRule.amount)
                : '',
          billingBasis: source.billingBasis || template.billingBasis || 'PER_STUDENT',
          enabled: true,
          hasUniversityPrice: Boolean(universityRule),
        };
      })
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  };

  const openBulkUniversity = () => {
    setHeaderMenuOpen(false);
    setError('');
    setSuccess('');
    setBulkForm(EMPTY_BULK_FORM);
    setBulkRows(buildBulkRows(''));
    setBulkModalOpen(true);
  };

  const selectBulkUniversity = (universityId: string) => {
    setBulkForm((current) => ({ ...current, universityId }));
    setBulkRows(buildBulkRows(universityId));
  };

  const updateBulkRow = (serviceCode: string, changes: Partial<BulkServiceRow>) => {
    setBulkRows((current) =>
      current.map((row) => (row.serviceCode === serviceCode ? { ...row, ...changes } : row))
    );
  };

  const saveBulkUniversity = async () => {
    const selectedServices = bulkRows.filter((row) => row.enabled);
    if (
      !bulkForm.universityId ||
      !selectedServices.length ||
      selectedServices.some((row) => !row.amount || Number(row.amount) <= 0)
    ) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/pricing/university-bulk', {
        universityId: bulkForm.universityId,
        currency: bulkForm.currency,
        effectiveFrom: bulkForm.effectiveFrom || null,
        effectiveTo: bulkForm.effectiveTo || null,
        status: bulkForm.status,
        notes: bulkForm.notes.trim() || undefined,
        services: selectedServices.map((row) => ({
          serviceCode: row.serviceCode,
          serviceName: row.serviceName,
          category: row.category,
          amount: Number(row.amount),
          billingBasis: row.billingBasis,
        })),
      });

      const university = universities.find((item) => asId(item) === bulkForm.universityId);
      setBulkModalOpen(false);
      setBulkForm(EMPTY_BULK_FORM);
      setBulkRows([]);
      await load();
      setSuccess(
        `Saved ${selectedServices.length} service price${selectedServices.length === 1 ? '' : 's'} for ${university?.name || 'the university'}.`
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to save the university service price list.'
      );
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setHeaderMenuOpen(false);
    setModalOpen(true);
  };

  const openEdit = (rule: RecordObject) => {
    setRowMenuId(null);
    setEditing(rule);
    setForm({
      serviceName: rule.serviceName || '',
      serviceCode: rule.serviceCode || '',
      category: rule.category || 'PLACEMENT',
      amount: String(rule.amount ?? ''),
      currency: rule.currency || 'USD',
      billingBasis: rule.billingBasis || 'PER_STUDENT',
      defaultPayer: rule.defaultPayer || 'UNIVERSITY',
      scope: rule.scope || 'GLOBAL',
      universityId: asId(rule.universityId),
      effectiveFrom: toInputDate(rule.effectiveFrom),
      effectiveTo: toInputDate(rule.effectiveTo),
      status: rule.status || 'ACTIVE',
      notes: rule.notes || '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (
      !form.serviceName.trim() ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      (form.scope === 'UNIVERSITY' && !form.universityId)
    ) return;

    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      amount: Number(form.amount),
      serviceCode: form.serviceCode.trim() || undefined,
      universityId: form.scope === 'UNIVERSITY' ? form.universityId : null,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editing) await api.patch('/finance/pricing/' + asId(editing), payload);
      else await api.post('/finance/pricing', payload);

      const wasEditing = Boolean(editing);
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
      setSuccess(wasEditing ? 'Pricing rule updated successfully.' : 'Pricing rule created successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save pricing rule.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (rule: RecordObject) => {
    setRowMenuId(null);
    const nextStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSaving(true);
    setError('');
    try {
      await api.patch('/finance/pricing/' + asId(rule) + '/status', { status: nextStatus });
      await load();
      setSuccess('Pricing rule ' + (nextStatus === 'ACTIVE' ? 'activated.' : 'deactivated.'));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to change pricing status.');
    } finally {
      setSaving(false);
    }
  };

  const universityRuleCount = rules.filter((rule) => rule.scope === 'UNIVERSITY').length;
  const activeCount = rules.filter((rule) => rule.status === 'ACTIVE').length;
  const serviceCount = new Set(rules.map((rule) => rule.serviceCode)).size;

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-visible rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-cyan-50 to-blue-50 p-5 shadow-sm sm:p-6">
        <div className="pr-14">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-700">
            <Settings2 className="h-4 w-4" />
            Finance Configuration
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Service Pricing & Fee Rules
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Set the price, billing basis and default payer for every AZAAM service. University-specific prices automatically override global defaults.
          </p>
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Pricing actions"
            onClick={() => setHeaderMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {headerMenuOpen && (
            <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={openBulkUniversity}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-teal-700 hover:bg-teal-50"
              >
                <Building2 className="h-4 w-4" />
                Price All Services for University
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                New Single Pricing Rule
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Layers3 className="h-5 w-5" />} label="Services" value={loading ? '—' : String(serviceCount)} />
        <StatCard icon={<CircleDollarSign className="h-5 w-5" />} label="Pricing Rules" value={loading ? '—' : String(rules.length)} />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="University Overrides" value={loading ? '—' : String(universityRuleCount)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Active Rules" value={loading ? '—' : String(activeCount)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px_170px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service, code or university..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>
          <FilterSelect value={payerFilter} onChange={setPayerFilter} placeholder="All Payers" options={[['UNIVERSITY', 'University'], ['STUDENT', 'Student'], ['ORGANIZATION', 'Organization']]} />
          <FilterSelect value={scopeFilter} onChange={setScopeFilter} placeholder="All Scopes" options={[['GLOBAL', 'Global Default'], ['UNIVERSITY', 'University Specific']]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']]} />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setPayerFilter('');
              setScopeFilter('');
              setStatusFilter('');
            }}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <h2 className="text-sm font-black text-slate-950">Pricing Rules ({filtered.length})</h2>
          <p className="mt-1 text-xs text-slate-500">
            Keep global defaults simple, then add university-specific overrides only where agreements differ.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading pricing rules...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <CircleDollarSign className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No pricing rules found</p>
            <p className="mt-1 text-xs text-slate-500">Create the first service rule from the three-dot menu above.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1180px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Service</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Payer</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Billing Basis</th>
                    <th className="px-4 py-3.5">Scope</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((rule) => (
                    <tr key={asId(rule)} className="transition hover:bg-cyan-50/40">
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900">{rule.serviceName}</div>
                        <div className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">{rule.serviceCode}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-600">{formatLabel(rule.category)}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{formatLabel(rule.defaultPayer)}</span>
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{formatMoney(rule.amount, rule.currency)}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">{formatLabel(rule.billingBasis)}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-700">{rule.scope === 'GLOBAL' ? 'Global Default' : 'University Specific'}</div>
                        {rule.scope === 'UNIVERSITY' && (
                          <div className="mt-0.5 text-[10px] font-semibold text-violet-600">{rule.universityId?.name || 'University'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={'rounded-full px-2.5 py-1 text-[10px] font-black ' + (rule.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {rule.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <button
                            type="button"
                            onClick={() => setRowMenuId((current) => current === asId(rule) ? null : asId(rule))}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {rowMenuId === asId(rule) && (
                            <div className="mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <ActionItem icon={<Edit3 className="h-4 w-4" />} label="Edit Rule" onClick={() => openEdit(rule)} />
                              <ActionItem
                                icon={rule.status === 'ACTIVE' ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                                label={rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                onClick={() => void toggleStatus(rule)}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
              {filtered.map((rule) => (
                <article key={asId(rule)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{rule.serviceName}</h3>
                      <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">{rule.serviceCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRowMenuId((current) => current === asId(rule) ? null : asId(rule))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  {rowMenuId === asId(rule) && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                      <ActionItem icon={<Edit3 className="h-4 w-4" />} label="Edit Rule" onClick={() => openEdit(rule)} />
                      <ActionItem
                        icon={rule.status === 'ACTIVE' ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                        label={rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        onClick={() => void toggleStatus(rule)}
                      />
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MobileInfo label="Price" value={formatMoney(rule.amount, rule.currency)} />
                    <MobileInfo label="Payer" value={formatLabel(rule.defaultPayer)} />
                    <MobileInfo label="Basis" value={formatLabel(rule.billingBasis)} />
                    <MobileInfo label="Scope" value={rule.scope === 'GLOBAL' ? 'Global' : rule.universityId?.name || 'University'} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {bulkModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close university pricing modal"
            onClick={() => !saving && setBulkModalOpen(false)}
          />

          <div className="relative z-10 flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-6xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">
                  University Price List
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                  Price All Services at Once
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                  Select one university, enter the agreed price for each AZAAM service, then save the full price list in one action.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setBulkModalOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <section className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormSelect
                    label="University *"
                    value={bulkForm.universityId}
                    onChange={selectBulkUniversity}
                  >
                    <option value="">Select university</option>
                    {universities.map((university) => (
                      <option key={asId(university)} value={asId(university)}>
                        {university.name}{university.code ? ' (' + university.code + ')' : ''}
                      </option>
                    ))}
                  </FormSelect>

                  <FormSelect
                    label="Currency *"
                    value={bulkForm.currency}
                    onChange={(value) => setBulkForm((current) => ({ ...current, currency: value }))}
                  >
                    <option value="USD">USD</option>
                    <option value="SOS">SOS</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </FormSelect>

                  <Field label="Effective From">
                    <input
                      type="date"
                      value={bulkForm.effectiveFrom}
                      onChange={(event) =>
                        setBulkForm((current) => ({ ...current, effectiveFrom: event.target.value }))
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </Field>

                  <Field label="Effective To">
                    <input
                      type="date"
                      min={bulkForm.effectiveFrom || undefined}
                      value={bulkForm.effectiveTo}
                      onChange={(event) =>
                        setBulkForm((current) => ({ ...current, effectiveTo: event.target.value }))
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <FormSelect
                    label="Status"
                    value={bulkForm.status}
                    onChange={(value) => setBulkForm((current) => ({ ...current, status: value }))}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </FormSelect>

                  <Field label="Agreement / Notes">
                    <input
                      value={bulkForm.notes}
                      onChange={(event) =>
                        setBulkForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional agreement reference or pricing note"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </Field>
                </div>
              </section>

              <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Service Price List</h3>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                      Existing university prices are pre-filled. Global university prices are used as the starting value where available.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBulkRows((current) => current.map((row) => ({ ...row, enabled: true })))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-50"
                    >
                      Select All
                    </button>
                    <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-black text-teal-700">
                      {bulkRows.filter((row) => row.enabled).length} selected
                    </span>
                  </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-white text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="w-14 px-4 py-3 text-center">Use</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="w-48 px-4 py-3">Amount</th>
                        <th className="w-56 px-4 py-3">Billing Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRows.map((row) => (
                        <tr key={row.serviceCode} className={row.enabled ? 'bg-white' : 'bg-slate-50/60 opacity-60'}>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              aria-label={row.enabled ? 'Exclude service' : 'Include service'}
                              onClick={() => updateBulkRow(row.serviceCode, { enabled: !row.enabled })}
                              className={
                                'mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition ' +
                                (row.enabled
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent')
                              }
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-black text-slate-900">{row.serviceName}</div>
                            <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] font-semibold text-slate-400">
                              {row.serviceCode}
                              {row.hasUniversityPrice && (
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 font-sans text-[8px] font-black text-violet-700">
                                  Existing price
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-600">{formatLabel(row.category)}</td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-3 text-[10px] font-black text-slate-400">
                                {bulkForm.currency}
                              </span>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                disabled={!row.enabled}
                                value={row.amount}
                                onChange={(event) =>
                                  updateBulkRow(row.serviceCode, { amount: event.target.value })
                                }
                                placeholder="0.00"
                                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-3 text-sm font-black text-slate-800 outline-none focus:border-teal-500 disabled:bg-slate-100"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              disabled={!row.enabled}
                              value={row.billingBasis}
                              onChange={(event) =>
                                updateBulkRow(row.serviceCode, { billingBasis: event.target.value })
                              }
                              className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 disabled:bg-slate-100"
                            >
                              <option value="PER_STUDENT">Per Student</option>
                              <option value="PER_PLACEMENT">Per Placement</option>
                              <option value="PER_MONTH">Per Month</option>
                              <option value="PER_TRIP">Per Trip</option>
                              <option value="ONE_TIME">One-time</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 p-3 md:hidden">
                  {bulkRows.map((row) => (
                    <article
                      key={row.serviceCode}
                      className={
                        'rounded-2xl border p-3 ' +
                        (row.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60')
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-black text-slate-900">{row.serviceName}</h4>
                          <p className="mt-0.5 text-[9px] font-bold text-slate-500">{formatLabel(row.category)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateBulkRow(row.serviceCode, { enabled: !row.enabled })}
                          className={
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ' +
                            (row.enabled
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-300 bg-white text-transparent')
                          }
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                        <label>
                          <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">Amount ({bulkForm.currency})</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            disabled={!row.enabled}
                            value={row.amount}
                            onChange={(event) => updateBulkRow(row.serviceCode, { amount: event.target.value })}
                            placeholder="0.00"
                            className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-teal-500"
                          />
                        </label>
                        <label>
                          <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">Billing Basis</span>
                          <select
                            disabled={!row.enabled}
                            value={row.billingBasis}
                            onChange={(event) =>
                              updateBulkRow(row.serviceCode, { billingBasis: event.target.value })
                            }
                            className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                          >
                            <option value="PER_STUDENT">Per Student</option>
                            <option value="PER_PLACEMENT">Per Placement</option>
                            <option value="PER_MONTH">Per Month</option>
                            <option value="PER_TRIP">Per Trip</option>
                            <option value="ONE_TIME">One-time</option>
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[10px] font-semibold text-slate-500">
                Payer: <span className="font-black text-slate-700">University</span>. Saving updates existing prices and creates missing ones.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setBulkModalOpen(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    saving ||
                    !bulkForm.universityId ||
                    !bulkRows.some((row) => row.enabled) ||
                    bulkRows.some(
                      (row) => row.enabled && (!row.amount || Number(row.amount) <= 0)
                    )
                  }
                  onClick={() => void saveBulkUniversity()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving
                    ? 'Saving Price List...'
                    : `Save ${bulkRows.filter((row) => row.enabled).length} Service Prices`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close pricing modal" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Service Pricing</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{editing ? 'Edit Pricing Rule' : 'New Pricing Rule'}</h2>
              </div>
              <button type="button" onClick={() => !saving && setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
              <Field label="Service Name *">
                <input value={form.serviceName} onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))} placeholder="e.g. Placement Fee" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>
              <Field label="Service Code">
                <input value={form.serviceCode} onChange={(event) => setForm((current) => ({ ...current, serviceCode: event.target.value.toUpperCase() }))} placeholder="Auto from service name" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>

              <FormSelect label="Category *" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                <option value="PLACEMENT">Placement</option>
                <option value="VISA">Visa Processing</option>
                <option value="TRANSPORTATION">Transportation</option>
                <option value="RESIDENCE">Residence / Accommodation</option>
                <option value="AIRPORT_PICKUP">Airport Pickup</option>
                <option value="INSURANCE">Insurance</option>
                <option value="DOCUMENT_PROCESSING">Document Processing</option>
                <option value="CERTIFICATION">Certification</option>
                <option value="OTHER">Other</option>
              </FormSelect>

              <FormSelect label="Default Payer *" value={form.defaultPayer} onChange={(value) => setForm((current) => ({ ...current, defaultPayer: value }))}>
                <option value="UNIVERSITY">University</option>
                <option value="STUDENT">Student</option>
                <option value="ORGANIZATION">Organization</option>
              </FormSelect>

              <Field label="Amount *">
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>

              <FormSelect label="Currency *" value={form.currency} onChange={(value) => setForm((current) => ({ ...current, currency: value }))}>
                <option value="USD">USD</option><option value="SOS">SOS</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
              </FormSelect>

              <FormSelect label="Billing Basis *" value={form.billingBasis} onChange={(value) => setForm((current) => ({ ...current, billingBasis: value }))}>
                <option value="PER_STUDENT">Per Student</option><option value="PER_PLACEMENT">Per Placement</option><option value="PER_MONTH">Per Month</option><option value="PER_TRIP">Per Trip</option><option value="ONE_TIME">One-time</option>
              </FormSelect>

              <FormSelect label="Pricing Scope *" value={form.scope} onChange={(value) => setForm((current) => ({ ...current, scope: value, universityId: value === 'GLOBAL' ? '' : current.universityId }))}>
                <option value="GLOBAL">Global Default</option><option value="UNIVERSITY">Specific University</option>
              </FormSelect>

              {form.scope === 'UNIVERSITY' && (
                <FormSelect label="University *" value={form.universityId} onChange={(value) => setForm((current) => ({ ...current, universityId: value }))}>
                  <option value="">Select university</option>
                  {universities.map((university) => (
                    <option key={asId(university)} value={asId(university)}>
                      {university.name}{university.code ? ' (' + university.code + ')' : ''}
                    </option>
                  ))}
                </FormSelect>
              )}

              <FormSelect label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </FormSelect>

              <Field label="Effective From">
                <input type="date" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>
              <Field label="Effective To">
                <input type="date" min={form.effectiveFrom || undefined} value={form.effectiveTo} onChange={(event) => setForm((current) => ({ ...current, effectiveTo: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>

              <Field label="Notes" wide>
                <textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional agreement or pricing notes" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500" />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={saving || !form.serviceName.trim() || !form.amount || Number(form.amount) <= 0 || (form.scope === 'UNIVERSITY' && !form.universityId)}
                onClick={() => void save()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white disabled:opacity-40"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</div>
    <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{label}</p>
  </article>
);

const ActionItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-slate-700 hover:bg-slate-100">
    <span className="text-teal-600">{icon}</span>{label}
  </button>
);

const MobileInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 truncate text-xs font-black text-slate-800">{value}</div>
  </div>
);

const FilterSelect: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string; options: [string, string][] }> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white">
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
  </div>
);

const FormSelect: React.FC<{ label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
  <label>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
    <div className="relative mt-1">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);

const Field: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide = false }) => (
  <label className={wide ? 'sm:col-span-2' : ''}>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);
