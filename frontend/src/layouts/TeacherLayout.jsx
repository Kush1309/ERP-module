import DashboardShell from '../components/layout/DashboardShell';
import { TEACHER_NAVIGATION } from '../constants/navigation';

export default function TeacherLayout({ children }) {
    return (
        <DashboardShell
            navigation={TEACHER_NAVIGATION}
            homeHref="/teacher"
            roleLabel="Teacher"
            headerTitle="Teacher Dashboard"
        >
            {children}
        </DashboardShell>
    );
}
