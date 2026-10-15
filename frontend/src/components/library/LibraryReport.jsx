import { useCallback, useEffect, useState } from 'react';
import Button from '../Button';
import { libraryExtraApi } from '../../services/moduleApi';
import { DataTable, StatCard, LoadingState, ErrorState, errorMessage, formatCurrency, downloadCsv } from '../common/ui';

// Library summary for administrators and librarians
export default function LibraryReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await libraryExtraApi.report());
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the library report.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    const t = data.totals;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Titles" value={t.titles} hint={`${t.copies} copies · ${t.available} on shelf`} />
                <StatCard label="Books out" value={t.activeIssues} />
                <StatCard label="Overdue" value={t.overdue} />
                <StatCard label="Fines" value={formatCurrency(t.finesPending)} hint={`pending · ${formatCurrency(t.finesCollected)} collected`} />
            </div>
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink-900">Stock by category</h2>
                    <Button type="button" variant="secondary" disabled={!data.byCategory.length} onClick={() => downloadCsv('library-stock.csv', [{ label: 'Category', key: 'category' }, { label: 'Titles', key: 'titles' }, { label: 'Copies', key: 'copies' }, { label: 'Available', key: 'available' }], data.byCategory)}>Export CSV</Button>
                </div>
                <DataTable rows={data.byCategory} rowKey="category" emptyTitle="No books catalogued" columns={[
                    { key: 'category', label: 'Category' }, { key: 'titles', label: 'Titles' }, { key: 'copies', label: 'Copies' }, { key: 'available', label: 'Available' },
                ]} />
            </div>
            <div>
                <h2 className="mb-3 text-lg font-semibold text-ink-900">Most issued</h2>
                <DataTable rows={data.mostIssued} rowKey="title" emptyTitle="No books issued yet" columns={[
                    { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> }, { key: 'author', label: 'Author' }, { key: 'issues', label: 'Times issued' },
                ]} />
            </div>
        </div>
    );
}
