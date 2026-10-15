import DashboardShell from '../components/layout/DashboardShell';
import { STUDENT_NAVIGATION } from '../constants/navigation';

export default function StudentLayout({ children }) {
    return (
        <DashboardShell
            navigation={STUDENT_NAVIGATION}
            homeHref="/student/dashboard"
            roleLabel="Student"
            headerTitle="Student Dashboard"
        >
            {children}
        </DashboardShell>
    );
}
