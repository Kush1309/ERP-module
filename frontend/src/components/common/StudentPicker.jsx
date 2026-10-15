import { useEffect, useRef, useState } from 'react';
import { getStudents } from '../../services/studentApi';

const inputClass =
    'w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

const describe = (student) =>
    `${student.firstName} ${student.lastName} · ${student.studentId} · Class ${student.class}-${student.section}`;

/**
 * Admin-only searchable student selector (replaces raw ObjectId text boxes).
 * Calls onChange(studentId, studentObject). Selection is cleared with onChange('', null).
 */
export default function StudentPicker({ value, selected, onChange, id = 'student-picker', placeholder = 'Search by name, student ID or admission no.', required = false, disabled = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [chosen, setChosen] = useState(selected || null);
    const requestRef = useRef(0);

    useEffect(() => {
        setChosen(selected || null);
    }, [selected]);

    useEffect(() => {
        if (!open) return undefined;
        const requestId = ++requestRef.current;
        const timer = setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getStudents({ search: query.trim() || undefined, limit: 20 });
                if (requestId === requestRef.current) {
                    setResults(data?.students || []);
                }
            } catch (err) {
                if (requestId === requestRef.current) {
                    setError(err?.response?.data?.message || 'Unable to search students.');
                }
            } finally {
                if (requestId === requestRef.current) setLoading(false);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [query, open]);

    const select = (student) => {
        setChosen(student);
        setOpen(false);
        setQuery('');
        onChange(student._id, student);
    };

    if (value && chosen) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-md border border-ink-300 bg-ink-50 px-3 py-2 text-sm text-ink-900">
                <span className="truncate">{describe(chosen)}</span>
                {!disabled && (
                    <button type="button" onClick={() => { setChosen(null); onChange('', null); }} className="shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800">
                        Change
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                id={id}
                type="text"
                autoComplete="off"
                value={query}
                disabled={disabled}
                required={required && !value}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                className={inputClass}
            />
            {open && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-ink-200 bg-white shadow-lg">
                    {loading && <p className="px-3 py-2 text-sm text-ink-500">Searching…</p>}
                    {!loading && error && <p className="px-3 py-2 text-sm text-red-600">{error}</p>}
                    {!loading && !error && results.length === 0 && (
                        <p className="px-3 py-2 text-sm text-ink-500">No matching students.</p>
                    )}
                    {!loading && !error && results.map((student) => (
                        <button
                            key={student._id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => select(student)}
                            className="block w-full px-3 py-2 text-left text-sm text-ink-800 hover:bg-brand-50"
                        >
                            {describe(student)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
