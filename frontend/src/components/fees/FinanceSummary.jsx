import { useCallback, useEffect, useState } from 'react';
import Button from '../Button';
import Card from '../Card';
import { financeApi } from '../../services/moduleApi';
import { DataTable, StatCard, LoadingState, ErrorState, errorMessage, formatCurrency, formatLabel, downloadCsv } from '../common/ui';

// Collection and outstanding-dues summary for administrators and accountants
export default function FinanceSummary() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await financeApi.summary());
        } catch (err) {
            setError(errorMessage(err, 'Unable to load the finance summary.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <LoadingState label="Calculating collections..." />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    const t = data.totals;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Net payable" value={formatCurrency(t.net)} hint={`${t.records} fee record(s)`} />
                <StatCard label="Collected" value={formatCurrency(t.collected)} hint={t.collectionRate === null ? '' : `${t.collectionRate}% collected`} />
                <StatCard label="Outstanding" value={formatCurrency(t.outstanding)} />
                <StatCard label="Overdue" value={formatCurrency(t.overdueAmount)} hint={`${t.overdueCount} record(s) past due`} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Object.entries(data.byStatus).map(([status, count]) => <StatCard key={status} label={formatLabel(status)} value={count} />)}
            </div>
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink-900">Dues by class</h2>
                    <Button type="button" variant="secondary" disabled={!data.byClass.length} onClick={() => downloadCsv('fee-dues-by-class.csv', [{ label: 'Class', key: 'className' }, { label: 'Net payable', key: 'net' }, { label: 'Collected', key: 'collected' }, { label: 'Outstanding', key: 'outstanding' }], data.byClass)}>Export CSV</Button>
                </div>
                <DataTable rows={data.byClass} rowKey="className" emptyTitle="No fee records yet" columns={[
                    { key: 'className', label: 'Class' },
                    { key: 'net', label: 'Net payable', render: (r) => formatCurrency(r.net) },
                    { key: 'collected', label: 'Collected', render: (r) => formatCurrency(r.collected) },
                    { key: 'outstanding', label: 'Outstanding', render: (r) => <span className={r.outstanding > 0 ? 'font-semibold text-red-600' : ''}>{formatCurrency(r.outstanding)}</span> },
                ]} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                    <p className="mb-3 text-sm font-semibold text-ink-900">Collections by month</p>
                    {data.byMonth.length ? <ul className="space-y-1 text-sm">{data.byMonth.map((m) => <li key={m.month} className="flex justify-between"><span className="text-ink-600">{m.month}</span><span className="font-medium">{formatCurrency(m.amount)}</span></li>)}</ul> : <p className="text-sm text-ink-500">No payments recorded.</p>}
                </Card>
                <Card>
                    <p className="mb-3 text-sm font-semibold text-ink-900">Collections by payment method</p>
                    {data.byMethod.length ? <ul className="space-y-1 text-sm">{data.byMethod.map((m) => <li key={m.method} className="flex justify-between"><span className="text-ink-600">{formatLabel(m.method)}</span><span className="font-medium">{formatCurrency(m.amount)}</span></li>)}</ul> : <p className="text-sm text-ink-500">No payments recorded.</p>}
                </Card>
            </div>
        </div>
    );
}
