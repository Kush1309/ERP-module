/**
 * Small shared building blocks that reproduce the Admin panel's existing
 * patterns (eyebrow + serif title headers, ink-coloured tables, status pills,
 * pagination bar). New module pages compose these instead of re-styling.
 */
import Button from '../Button';
import Card from '../Card';

export const inputClass =
    'w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export function PageHeader({ eyebrow = 'Admin module', title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">{title}</h1>
                {description && <p className="mt-2 text-sm text-ink-600">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
}

export function Tabs({ tabs, active, onChange }) {
    return (
        <div className="mb-6 border-b border-ink-200">
            <nav className="-mb-px flex flex-wrap gap-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onChange(tab.key)}
                        className={`${active === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700'} whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}

const PILL_TONES = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-ink-50 text-ink-700 border-ink-200',
};

export const formatLabel = (value) =>
    value ? String(value).toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : '—';

export function StatusPill({ value, tone }) {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${PILL_TONES[tone] || PILL_TONES.gray}`}>
            {formatLabel(value)}
        </span>
    );
}

export function LoadingState({ label = 'Loading...' }) {
    return (
        <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-ink-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            {label}
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-red-600">{message}</p>
            {onRetry && <Button type="button" variant="secondary" onClick={onRetry}>Retry</Button>}
        </div>
    );
}

export function EmptyState({ title, description }) {
    return (
        <div className="py-14 text-center">
            <p className="text-sm font-medium text-ink-800">{title}</p>
            {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
    );
}

export function Alert({ tone = 'success', children }) {
    const styles = tone === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
    return <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

/**
 * columns: [{ key, label, render?(row), className? }]
 */
export function DataTable({ columns, rows, rowKey = '_id', loading, error, onRetry, emptyTitle = 'No records found', emptyDescription, footer }) {
    return (
        <Card className="overflow-hidden p-0">
            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={onRetry} /> : rows.length === 0 ? (
                <EmptyState title={emptyTitle} description={emptyDescription} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-ink-200">
                        <thead className="bg-ink-50">
                            <tr>
                                {columns.map((c) => (
                                    <th key={c.key} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-600 ${c.className || ''}`}>{c.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-200 bg-white">
                            {rows.map((row, index) => (
                                <tr key={typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? index)} className="hover:bg-ink-50/60">
                                    {columns.map((c) => (
                                        <td key={c.key} className={`px-4 py-3 text-sm text-ink-800 ${c.className || ''}`}>
                                            {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {footer}
        </Card>
    );
}

export function PaginationBar({ pagination, onPage, loading }) {
    if (!pagination) return null;
    const totalPages = Math.max(pagination.totalPages || 1, 1);
    const page = pagination.page || 1;
    return (
        <div className="flex flex-col gap-3 border-t border-ink-200 bg-ink-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-ink-600">Page {page} of {totalPages} · {pagination.total ?? 0} record(s)</div>
            <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" className="!px-3 !py-2" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>Previous</Button>
                <Button type="button" className="!px-3 !py-2" disabled={page >= totalPages || loading} onClick={() => onPage(page + 1)}>Next</Button>
            </div>
        </div>
    );
}

export function Field({ label, htmlFor, required, children, hint }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-700">
                {label}{required && <span className="text-red-500"> *</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
    );
}

export function StatCard({ label, value, hint }) {
    return (
        <Card>
            <p className="text-sm text-ink-600">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </Card>
    );
}

export const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// CSV download of an array of objects (used by reports)
export const downloadCsv = (filename, headers, rows) => {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map((h) => escape(h.label)).join(','), ...rows.map((r) => headers.map((h) => escape(typeof h.value === 'function' ? h.value(r) : r[h.key])).join(','))].join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
