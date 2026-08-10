import { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all">
                {title && (
                    <h3 className="mb-4 text-lg font-semibold text-ink-900">
                        {title}
                    </h3>
                )}
                {children}
            </div>
        </div>
    );
}

export default Modal;
