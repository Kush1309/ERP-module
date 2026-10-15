import DashboardShell from '../components/layout/DashboardShell';
import { LIBRARIAN_NAVIGATION } from '../constants/navigation';

export default function LibrarianLayout({ children }) {
    return (
        <DashboardShell
            navigation={LIBRARIAN_NAVIGATION}
            homeHref="/library"
            roleLabel="Librarian"
            headerTitle="Library Desk"
        >
            {children}
        </DashboardShell>
    );
}
