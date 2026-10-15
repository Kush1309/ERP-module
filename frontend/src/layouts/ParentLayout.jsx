import DashboardShell from '../components/layout/DashboardShell';
import { PARENT_NAVIGATION } from '../constants/navigation';

export default function ParentLayout({ children }) {
    return (
        <DashboardShell
            navigation={PARENT_NAVIGATION}
            homeHref="/parent"
            roleLabel="Parent"
            headerTitle="Parent Dashboard"
        >
            {children}
        </DashboardShell>
    );
}
