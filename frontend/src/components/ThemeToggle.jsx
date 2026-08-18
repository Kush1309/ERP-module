import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.884.884a1 1 0 01-1.414 1.415l-.884-.884a1 1 0 010-1.415zM16 10a1 1 0 011 1h1a1 1 0 110-2h-1a1 1 0 01-1 1zm-4.22 4.22a1 1 0 010 1.415l-.884.884a1 1 0 01-1.415-1.414l.884-.884a1 1 0 011.415 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-4.22a1 1 0 010-1.415l-.884-.884a1 1 0 01-1.415 1.414l.884.884a1 1 0 011.415 0zM4 10a1 1 0 01-1-1H2a1 1 0 110 2h1a1 1 0 011-1zm4.22-4.22a1 1 0 011.415 0l.884-.884a1 1 0 011.414 1.415l-.884.884a1 1 0 01-1.415 0zM10 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
}

export default ThemeToggle;
