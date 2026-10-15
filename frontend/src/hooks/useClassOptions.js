import { useEffect, useMemo, useState } from 'react';
import { academicApi } from '../services/moduleApi';

// Defaults used until classes are configured under Academic Setup
const DEFAULT_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Class/section options for forms. When the school has configured classes, only active
 * configured class-sections are offered (with strength/capacity); otherwise the legacy lists.
 * `keep` lets an edit form keep showing a record's current value even if it is not configured.
 */
export default function useClassOptions({ keepClass = '', keepSection = '' } = {}) {
    const [list, setList] = useState(null);

    useEffect(() => {
        let active = true;
        academicApi.listClassSections({ status: 'ACTIVE' })
            .then((rows) => { if (active) setList(rows || []); })
            .catch(() => { if (active) setList([]); });
        return () => { active = false; };
    }, []);

    return useMemo(() => {
        const configured = Array.isArray(list) && list.length > 0;
        const classes = configured ? [...new Set(list.map((c) => c.className))] : DEFAULT_CLASSES;
        if (keepClass && !classes.includes(keepClass)) classes.push(keepClass);
        const sectionsFor = (className) => {
            if (!configured) return DEFAULT_SECTIONS.map((s) => ({ value: s, label: s }));
            const options = list
                .filter((c) => c.className === className)
                .map((c) => ({ value: c.section, label: `${c.section} (${c.studentCount}/${c.capacity})`, full: c.studentCount >= c.capacity }));
            if (keepSection && className === keepClass && !options.some((o) => o.value === String(keepSection).toUpperCase())) {
                options.push({ value: keepSection, label: `${keepSection} (current)` });
            }
            return options;
        };
        return { configured, loading: list === null, classes, sectionsFor };
    }, [list, keepClass, keepSection]);
}
