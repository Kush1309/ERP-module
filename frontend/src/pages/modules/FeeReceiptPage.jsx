import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import { financeApi } from '../../services/moduleApi';
import { LoadingState, ErrorState, errorMessage, formatCurrency, formatDate, formatLabel } from '../../components/common/ui';

// Printable receipt for one recorded payment
export default function FeeReceiptPage() {
    const { recordId, receiptNumber } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setData(await financeApi.receipt(recordId, receiptNumber));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load this receipt.'));
        } finally {
            setLoading(false);
        }
    }, [recordId, receiptNumber]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <LoadingState label="Loading receipt..." />;
    if (error) return <div className="mx-auto max-w-2xl"><ErrorState message={error} onRetry={load} /><div className="text-center"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Go back</Button></div></div>;

    const { school, record, payment } = data;
    const student = record.studentId || {};
    const net = record.amountDue - (record.discount || 0);
    const paidUpTo = (record.payments || []).filter((p) => new Date(p.paidAt) <= new Date(payment.paidAt)).reduce((sum, p) => sum + p.amount, 0);
    const rows = [
        ['Fee', record.feeStructureId?.title || '—'],
        ['Academic year', record.feeStructureId?.academicYear || '—'],
        ['Amount billed', formatCurrency(record.amountDue)],
        ...(record.discount ? [['Concession', `− ${formatCurrency(record.discount)}${record.discountReason ? ` (${record.discountReason})` : ''}`]] : []),
        ['Net payable', formatCurrency(net)],
        ['Paid to date (incl. this receipt)', formatCurrency(paidUpTo)],
        ['Balance after this payment', formatCurrency(Math.max(net - paidUpTo, 0))],
    ];

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-4 flex justify-between print:hidden">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
                <Button type="button" onClick={() => window.print()}>Print / Save as PDF</Button>
            </div>
            <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
                <div className="flex flex-col gap-2 border-b border-ink-200 pb-4 sm:flex-row sm:justify-between">
                    <div>
                        <h1 className="font-display text-xl font-semibold text-ink-900">{school.schoolName}</h1>
                        {school.address && <p className="text-sm text-ink-600">{school.address}</p>}
                        {(school.phone || school.email) && <p className="text-xs text-ink-500">{[school.phone, school.email].filter(Boolean).join(' · ')}</p>}
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Fee Receipt</p>
                        <p className="font-mono text-sm font-medium text-ink-900">{payment.receiptNumber}</p>
                        <p className="text-xs text-ink-500">{new Date(payment.paidAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-ink-200 py-4 text-sm">
                    <p><span className="text-ink-500">Student:</span> <span className="font-medium text-ink-900">{student.firstName} {student.lastName}</span></p>
                    <p><span className="text-ink-500">Class:</span> {student.class}-{student.section}</p>
                    <p><span className="text-ink-500">Admission No.:</span> {student.admissionNumber || '—'}</p>
                    <p><span className="text-ink-500">Due date:</span> {formatDate(record.dueDate)}</p>
                </div>
                <div className="py-4">
                    <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
                        <span className="text-sm font-medium text-ink-700">Amount received</span>
                        <span className="text-2xl font-semibold text-ink-900">{formatCurrency(payment.amount)}</span>
                    </div>
                    <p className="mb-3 text-sm text-ink-700">Mode: <span className="font-medium">{formatLabel(payment.method)}</span>{payment.reference ? ` · Ref: ${payment.reference}` : ''}{payment.note ? ` · ${payment.note}` : ''}</p>
                    <table className="w-full text-sm">
                        <tbody>
                            {rows.map(([k, v]) => <tr key={k} className="border-b border-ink-100"><td className="py-2 text-ink-600">{k}</td><td className="py-2 text-right font-medium text-ink-900">{v}</td></tr>)}
                        </tbody>
                    </table>
                </div>
                <div className="mt-10 flex justify-end"><div className="w-48 border-t border-ink-300 pt-2 text-center text-xs text-ink-600">Authorised signatory</div></div>
                <p className="mt-6 text-[11px] text-ink-400">This receipt records a payment entered by school staff. It is computer generated and valid without a seal.</p>
            </div>
        </div>
    );
}
