import DashboardShell from '../components/layout/DashboardShell';
import { ACCOUNTANT_NAVIGATION } from '../constants/navigation';

export default function AccountantLayout({ children }) {
    return (
        <DashboardShell
            navigation={ACCOUNTANT_NAVIGATION}
            homeHref="/fees"
            roleLabel="Accountant"
            headerTitle="Finance Desk"
        >
            {children}
        </DashboardShell>
    );
}
