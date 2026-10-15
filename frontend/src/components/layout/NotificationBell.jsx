import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationApi } from '../../services/moduleApi';

const POLL_MS = 60000;

const timeAgo = (value) => {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(value).toLocaleDateString();
};

// Header bell with unread badge and a short dropdown of recent notifications
export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [error, setError] = useState('');
    const containerRef = useRef(null);
    const navigate = useNavigate();

    const load = useCallback(async () => {
        try {
            const data = await notificationApi.list({ limit: 6 });
            setItems(data?.notifications || []);
            setUnread(data?.unreadCount || 0);
            setError('');
        } catch {
            setError('Unable to load notifications');
        }
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(load, POLL_MS);
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const openItem = async (item) => {
        setOpen(false);
        if (!item.isRead) {
            await notificationApi.markRead(item._id).catch(() => null);
            load();
        }
        if (item.link) navigate(item.link);
    };

    const markAll = async () => {
        await notificationApi.markAllRead().catch(() => null);
        load();
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => { setOpen((v) => !v); if (!open) load(); }}
                className="relative p-1 text-ink-500 transition-colors hover:text-brand-600"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                        <span className="text-sm font-semibold text-ink-900">Notifications</span>
                        {unread > 0 && <button type="button" onClick={markAll} className="text-xs font-semibold text-brand-700 hover:text-brand-800">Mark all read</button>}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-ink-100">
                        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : items.length === 0 ? (
                            <p className="p-6 text-center text-sm text-ink-500">You're all caught up.</p>
                        ) : items.map((item) => (
                            <button key={item._id} type="button" onClick={() => openItem(item)} className={`block w-full px-4 py-3 text-left hover:bg-brand-50 ${item.isRead ? '' : 'bg-brand-50/40'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`text-sm ${item.isRead ? 'text-ink-700' : 'font-semibold text-ink-900'}`}>{item.title}</span>
                                    {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                                </div>
                                {item.message && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{item.message}</p>}
                                <p className="mt-1 text-[11px] text-ink-400">{timeAgo(item.createdAt)}</p>
                            </button>
                        ))}
                    </div>
                    <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-ink-100 px-4 py-3 text-center text-sm font-medium text-brand-700 hover:bg-ink-50">
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
