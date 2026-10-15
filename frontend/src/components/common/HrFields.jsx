import useHrOptions from '../../hooks/useHrOptions';
import { inputClass } from './ui';

/**
 * Department + designation inputs for teacher and staff forms. Uses the configured lists
 * when they exist (keeping a record's current value visible), otherwise free text.
 */
export default function HrFields({ department, designation, onChange, idPrefix = 'hr', labelClass = 'mb-1 block text-sm font-medium text-ink-700', fieldClass = inputClass, category }) {
    const { departments, designations } = useHrOptions();
    const designationOptions = category ? designations.filter((d) => d.category === category || d.title === designation) : designations;

    const select = (id, name, value, options, placeholder) => (
        <select id={id} name={name} className={fieldClass} value={value || ''} onChange={(e) => onChange(name, e.target.value)}>
            <option value="">{placeholder}</option>
            {value && !options.includes(value) && <option value={value}>{value} (current)</option>}
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
    );

    return (
        <>
            <div>
                <label htmlFor={`${idPrefix}-department`} className={labelClass}>Department</label>
                {departments.length
                    ? select(`${idPrefix}-department`, 'department', department, departments.map((d) => d.name), 'Not assigned')
                    : <input id={`${idPrefix}-department`} name="department" className={fieldClass} value={department || ''} onChange={(e) => onChange('department', e.target.value)} />}
            </div>
            <div>
                <label htmlFor={`${idPrefix}-designation`} className={labelClass}>Designation</label>
                {designationOptions.length
                    ? select(`${idPrefix}-designation`, 'designation', designation, designationOptions.map((d) => d.title), 'Not assigned')
                    : <input id={`${idPrefix}-designation`} name="designation" className={fieldClass} value={designation || ''} onChange={(e) => onChange('designation', e.target.value)} />}
            </div>
        </>
    );
}
