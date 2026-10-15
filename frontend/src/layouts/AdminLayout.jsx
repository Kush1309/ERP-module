import DashboardShell from '../components/layout/DashboardShell';
import { ADMIN_NAVIGATION } from '../constants/navigation';

export default function AdminLayout({ children }) {
    return (
        <DashboardShell
            navigation={ADMIN_NAVIGATION}
            homeHref="/admin"
            roleLabel="Administrator"
            headerTitle="School Management Dashboard"
        >
            {children}
        </DashboardShell>
    );
}
