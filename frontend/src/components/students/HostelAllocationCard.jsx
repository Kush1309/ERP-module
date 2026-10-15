import { useEffect, useState } from 'react';
import Card from '../Card';
import { hostelApi } from '../../services/moduleApi';
import { formatDate, formatLabel, errorMessage } from '../common/ui';

// Student / parent view of current hostel accommodation (renders nothing if none)
export default function HostelAllocationCard() {
    const [allocations, setAllocations] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        hostelApi.mine()
            .then((list) => { if (active) setAllocations(list || []); })
            .catch((err) => { if (active) setError(errorMessage(err, 'Unable to load hostel details.')); });
        return () => { active = false; };
    }, []);

    if (error) return <Card><p className="text-sm text-red-600">{error}</p></Card>;
    if (!allocations.length) return null;
    return (
        <Card>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Hostel</h2>
            <ul className="space-y-3">
                {allocations.map((a) => (
                    <li key={a._id} className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-3">
                        <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Room</p><p className="mt-1 text-ink-900">{a.room?.block} / {a.room?.roomNumber}{a.bedNumber ? ` · Bed ${a.bedNumber}` : ''}</p></div>
                        <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Type</p><p className="mt-1 text-ink-900">{formatLabel(a.room?.type)}</p></div>
                        <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Since</p><p className="mt-1 text-ink-900">{formatDate(a.startDate)}</p></div>
                    </li>
                ))}
            </ul>
        </Card>
    );
}
