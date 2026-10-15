// Department and designation lists for profile forms. This project has no
// department/designation API, so the lists stay empty and HrFields falls back
// to free-text inputs.
const EMPTY_OPTIONS = { departments: [], designations: [], loading: false };

export default function useHrOptions() {
    return EMPTY_OPTIONS;
}
