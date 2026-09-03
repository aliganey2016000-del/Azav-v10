import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, Eye, Terminal, Filter, Calendar } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AuditLogItem, PaginationMeta } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { Modal } from '../../components/admin/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';

export const AuditLogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const actionParam = searchParams.get('action') || '';
  const entityParam = searchParams.get('entityType') || '';

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getAuditLogs({
        page: pageParam,
        limit: 20,
        search: searchParam,
        action: actionParam,
        entityType: entityParam,
      });
      setLogs(res.logs || []);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: (res.logs || []).length,
          totalPages: Math.ceil((res.logs || []).length / 20) || 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, actionParam, entityParam]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const updateQueryParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Logs & Activity Trail"
        description="Immutable record of administrative operations, security events, and entity modifications."
      />

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchInput
          value={searchParam}
          onChange={(val) => updateQueryParam('search', val)}
          placeholder="Search by action, email, or entity ID..."
        />

        <div className="flex items-center gap-3">
          <select
            value={entityParam}
            onChange={(e) => updateQueryParam('entityType', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Entities</option>
            <option value="USER">USER</option>
            <option value="UNIVERSITY">UNIVERSITY</option>
            <option value="ORGANIZATION">ORGANIZATION</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="APPLICATION">APPLICATION</option>
            <option value="PLACEMENT">PLACEMENT</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Fetching security logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAuditLogs} />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs recorded" description="System audit records will appear here as administrative actions occur." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity Type</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorId?._id}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-teal-700">{log.entityType}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        title="View Full Metadata"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{log.actorEmail}</h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[9px] font-extrabold bg-slate-50 text-slate-700 border border-slate-200">
                    {log.action}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-150/50 pt-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Entity</span>
                    <span className="font-bold text-teal-800">{log.entityType}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">IP Address</span>
                    <span className="font-mono text-slate-600 text-[11px]">{log.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-150/30">
                  <button
                    onClick={() => {
                      setSelectedLog(log);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 font-bold text-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Metadata Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination meta={pagination} onPageChange={(p) => updateQueryParam('page', p.toString())} />
        </div>
      )}

      {/* Log Metadata Modal */}
      {selectedLog && modalOpen && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Audit Record Inspector" maxWidth="lg">
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-900 text-teal-400 rounded-xl overflow-x-auto space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>ACTION: {selectedLog.action}</span>
                <span>ENTITY: {selectedLog.entityType}</span>
              </div>
              <div className="text-slate-300">
                <span>Actor Email: </span>
                <span className="text-white font-bold">{selectedLog.actorEmail}</span>
              </div>
              <div className="text-slate-300">
                <span>Timestamp: </span>
                <span className="text-white">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              <div className="text-slate-300">
                <span>IP Address: </span>
                <span className="text-white">{selectedLog.ipAddress || 'Unknown'}</span>
              </div>
              <div className="pt-2 text-slate-400 font-sans font-semibold text-[11px] border-t border-slate-800">
                Event Metadata Payload:
              </div>
              <pre className="text-[11px] text-teal-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
