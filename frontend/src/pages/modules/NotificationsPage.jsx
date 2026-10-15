import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { notificationApi } from '../../services/moduleApi';
import { PageHeader, LoadingState, ErrorState, EmptyState, PaginationBar, StatusPill, Alert, errorMessage, inputClass } from '../../components/common/ui';

const TYPES = ['ATTENDANCE', 'FEE', 'HOMEWORK', 'RESULT', 'NOTICE', 'LEAVE', 'LIBRARY', 'ADMISSION', 'GENERAL'];
const TONE = { ATTENDANCE: 'amber', FEE: 'blue', HOMEWORK: 'blue', RESULT: 'green', NOTICE: 'gray', LEAVE: 'amber', LIBRARY: 'gray', ADMISSION: 'green', GENERAL: 'gray' };

export default function NotificationsPage() {
    const [state, setState] = useState({ notifications: [], unreadCount: 0, pagination: null });
    const [filters, setFilters] = useState({ type: '', unread: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await notificationApi.list({ page, limit: 20, type: filters.type || undefined, unread: filters.unread || undefined });
            setState({ notifications: data?.notifications || [], unreadCount: data?.unreadCount || 0, pagination: data?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load notifications.'));
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { load(); }, [load]);

    const markRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setState((s) => ({
                ...s,
                unreadCount: Math.max(s.unreadCount - 1, 0),
                notifications: s.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
            }));
        } catch (err) {
            setError(errorMessage(err, 'Unable to update notification.'));
        }
    };

    const markAll = async () => {
        try {
            const result = await notificationApi.markAllRead();
            setNotice(`${result?.updated ?? 0} notification(s) marked as read.`);
            load();
        } catch (err) {
            setError(errorMessage(err, 'Unable to update notifications.'));
        }
    };

    return (
        <div className="mx-auto w-full max-w-4xl">
            <PageHeader
                eyebrow="Inbox"
                title="Notifications"
                description={`${state.unreadCount} unread · alerts about attendance, fees, homework, results, leaves and more.`}
                actions={<Button type="button" variant="secondary" onClick={markAll} disabled={!state.unreadCount}>Mark all as read</Button>}
            />
            {notice && <Alert>{notice}</Alert>}
            <Card className="mb-4 flex flex-col gap-3 sm:flex-row">
                <select aria-label="Filter by type" className={inputClass} value={filters.type} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, type: e.target.value })); }}>
                    <option value="">All types</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
                <select aria-label="Filter by read state" className={inputClass} value={filters.unread} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, unread: e.target.value })); }}>
                    <option value="">Read and unread</option>
                    <option value="true">Unread only</option>
                </select>
            </Card>
            <Card className="overflow-hidden p-0">
                {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : state.notifications.length === 0 ? (
                    <EmptyState title="No notifications" description="You're all caught up." />
                ) : (
                    <ul className="divide-y divide-ink-200">
                        {state.notifications.map((n) => (
                            <li key={n._id} className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${n.isRead ? 'bg-white' : 'bg-brand-50/50'}`}>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusPill value={n.type} tone={TONE[n.type]} />
                                        {!n.isRead && <span className="text-xs font-semibold text-brand-700">New</span>}
                                        <span className="text-xs text-ink-500">{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-ink-900">{n.title}</p>
                                    {n.message && <p className="mt-1 text-sm text-ink-600">{n.message}</p>}
                                </div>
                                <div className="flex shrink-0 gap-3 text-sm">
                                    {n.link && <Link to={n.link} onClick={() => !n.isRead && markRead(n._id)} className="font-medium text-brand-700 hover:text-brand-800">Open</Link>}
                                    {!n.isRead && <button type="button" onClick={() => markRead(n._id)} className="font-medium text-ink-600 hover:text-ink-900">Mark read</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {!loading && !error && <PaginationBar pagination={state.pagination} onPage={setPage} loading={loading} />}
            </Card>
        </div>
    );
}
