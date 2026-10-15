import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { getConversations, getConversationById, sendMessage, markMessageRead, getContacts, createConversation } from '../../services/messageApi';

const ROLE_LABELS = { ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student', PARENT: 'Parent' };

export default function InboxPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingActive, setLoadingActive] = useState(false);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const myId = user?.id ? String(user.id) : '';

    // New conversation picker
    const [composeOpen, setComposeOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [contactSearch, setContactSearch] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactsError, setContactsError] = useState('');
    const [startingWith, setStartingWith] = useState(null);

    useEffect(() => {
        if (!composeOpen) return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoadingContacts(true);
            setContactsError('');
            try {
                const data = await getContacts(contactSearch.trim());
                if (!cancelled) setContacts(data);
            } catch (err) {
                if (!cancelled) setContactsError(err.response?.data?.message || 'Unable to load contacts');
            } finally {
                if (!cancelled) setLoadingContacts(false);
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [composeOpen, contactSearch]);

    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            setError('');
            const data = await getConversations({ limit: 50 });
            setConversations(data.data?.data || data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const loadConversation = async (id) => {
        try {
            setLoadingActive(true);
            const data = await getConversationById(id);
            const convoData = data.data || data;
            setActiveConversation(convoData);
            setMessages(convoData.messages || []);

            // Mark unread messages as read
            // Mark every unread incoming message as read
            const unread = (convoData.messages || []).filter((m) =>
                String(m.sender) !== myId && !(m.readBy || []).map(String).includes(myId)
            );
            if (unread.length > 0) {
                await Promise.all(unread.map((m) => markMessageRead(m._id).catch(() => null)));
                fetchConversations();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to open conversation');
        } finally {
            setLoadingActive(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            setSending(true);
            const res = await sendMessage(activeConversation._id, newMessage);
            setMessages([...messages, res.data || res]);
            setNewMessage('');
            fetchConversations(); // Update list to put this at top
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getOthers = (participants) => (participants || []).filter((p) => String(p._id) !== myId);

    const getRecipientName = (participants) => {
        const others = getOthers(participants);
        return others.length ? others.map((p) => p.name || p.loginId || 'Unknown').join(', ') : 'Unknown';
    };

    const getRecipientDetail = (participants) => {
        const others = getOthers(participants);
        return others.length === 1 ? (others[0].detail || ROLE_LABELS[others[0].role] || '') : '';
    };

    const startConversation = async (contact) => {
        setStartingWith(contact._id);
        setContactsError('');
        try {
            const res = await createConversation([contact._id]);
            const conversation = res.data || res;
            setComposeOpen(false);
            setContactSearch('');
            await fetchConversations();
            await loadConversation(conversation._id);
        } catch (err) {
            setContactsError(err.response?.data?.message || 'Unable to start conversation');
        } finally {
            setStartingWith(null);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Communication</p>
                    <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Messages</h1>
                    <p className="mt-2 text-sm text-ink-600">Communicate with teachers, students, parents and the school office.</p>
                </div>
                <Button type="button" onClick={() => setComposeOpen(true)} className="whitespace-nowrap">+ New Message</Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex justify-between items-center">
                    <p>{error}</p>
                    <button onClick={() => { setError(''); fetchConversations(); }} className="text-red-700 hover:underline text-sm font-medium">Dismiss / Retry</button>
                </div>
            )}

            <div className="bg-white border border-ink-200 rounded-xl overflow-hidden flex h-[600px] shadow-sm">
                {/* Left Panel */}
                <div className={`w-full md:w-1/3 border-r border-ink-200 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-ink-100 font-medium text-ink-900 bg-ink-50">
                        Inbox
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {loadingConversations ? (
                            <div className="p-4 text-center text-ink-500 text-sm">Loading conversations...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-ink-500 text-sm">
                                No conversations yet.
                                <button type="button" onClick={() => setComposeOpen(true)} className="mt-2 block w-full font-medium text-brand-700 hover:text-brand-800">Start a new message</button>
                            </div>
                        ) : (
                            conversations.map((convo) => {
                                const unread = Boolean(convo.lastMessage) && String(convo.lastMessage.sender) !== myId && !(convo.lastMessage.readBy || []).map(String).includes(myId);
                                return (
                                    <button
                                        key={convo._id}
                                        onClick={() => loadConversation(convo._id)}
                                        className={`w-full text-left p-4 border-b border-ink-100 hover:bg-brand-50 transition-colors focus:outline-none ${activeConversation?._id === convo._id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-ink-900 truncate pr-2">
                                                {getRecipientName(convo.participants)}
                                            </span>
                                            {convo.lastMessageAt && (
                                                <span className="text-xs text-ink-400 whitespace-nowrap">
                                                    {new Date(convo.lastMessageAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm truncate pr-2 ${unread ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>
                                                {convo.lastMessage?.content || 'No messages yet'}
                                            </span>
                                            {unread && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0"></div>}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className={`w-full md:w-2/3 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                    {!activeConversation ? (
                        <div className="flex-1 flex items-center justify-center text-ink-400 text-sm bg-ink-50/30">
                            Select a conversation to start messaging
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-ink-100 bg-white flex items-center shrink-0">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden mr-4 text-ink-500 hover:text-ink-900"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <div className="font-medium text-ink-900">{getRecipientName(activeConversation.participants)}</div>
                                    {getRecipientDetail(activeConversation.participants) && (
                                        <div className="text-xs text-ink-500">{getRecipientDetail(activeConversation.participants)}</div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-4 overflow-y-auto bg-ink-50/50 space-y-4">
                                {loadingActive ? (
                                    <div className="text-center text-ink-500 text-sm py-8">Loading history...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-ink-400 text-sm py-8">No messages yet. Say hello!</div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = String(msg.sender) === myId;
                                        return (
                                            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white border border-ink-200 text-ink-900 rounded-tl-sm shadow-sm'}`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-ink-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Composer */}
                            <div className="p-4 bg-white border-t border-ink-100 shrink-0">
                                <form onSubmit={handleSend} className="flex gap-3">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        className="flex-1 resize-none border border-ink-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none max-h-32 min-h-[44px]"
                                        rows="1"
                                        disabled={sending || loadingActive}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim() || loadingActive}
                                        className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center self-end"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Modal isOpen={composeOpen} onClose={() => { if (!startingWith) setComposeOpen(false); }} title="New Message">
                <div className="space-y-3">
                    <input
                        type="text"
                        autoFocus
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search people by name or login ID..."
                        className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {contactsError && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{contactsError}</div>}
                    <div className="max-h-72 overflow-y-auto rounded-md border border-ink-200 divide-y divide-ink-100">
                        {loadingContacts ? (
                            <p className="p-4 text-center text-sm text-ink-500">Loading contacts...</p>
                        ) : contacts.length === 0 ? (
                            <p className="p-4 text-center text-sm text-ink-500">No people available to message.</p>
                        ) : contacts.map((contact) => (
                            <button
                                key={contact._id}
                                type="button"
                                disabled={!!startingWith}
                                onClick={() => startConversation(contact)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-brand-50 disabled:opacity-60"
                            >
                                <span>
                                    <span className="block text-sm font-medium text-ink-900">{contact.name}</span>
                                    <span className="block text-xs text-ink-500">{contact.detail}</span>
                                </span>
                                <span className="text-xs font-semibold text-brand-700">{startingWith === contact._id ? 'Opening…' : 'Message'}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button type="button" variant="secondary" onClick={() => setComposeOpen(false)} disabled={!!startingWith}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
