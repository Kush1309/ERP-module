import Modal from '../Modal';
import Button from '../Button';
import { useState } from 'react';

export default function CredentialsModal({ isOpen, data, onDone }) {
    const [copied, setCopied] = useState(false);

    if (!data?.credentials) return null; // Ensure there are credentials to show

    const { studentId, loginId } = data.student || {};
    const { temporaryPassword } = data.credentials;

    const handleCopy = async () => {
        try {
            const textToCopy = `Student ID: ${studentId}\nLogin ID: ${loginId}\nTemporary Password: ${temporaryPassword}`;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { }} title="Student Created Successfully">
            <div className="space-y-4">
                <p className="text-sm text-ink-600">
                    Please secure these credentials. The temporary password will not be displayed again.
                </p>

                <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
                    <div className="mb-2 flex items-center justify-between border-b border-brand-200 pb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Student ID</span>
                        <span className="font-mono text-sm font-medium text-ink-900">{studentId}</span>
                    </div>
                    <div className="mb-2 flex items-center justify-between border-b border-brand-200 pb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Login ID</span>
                        <span className="font-mono text-sm font-medium text-ink-900">{loginId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Temp Password</span>
                        <span className="font-mono text-sm font-medium text-ink-900">{temporaryPassword}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy Credentials'}
                    </Button>
                    <Button type="button" onClick={onDone}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
