import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getConversations, getConversationById, sendMessage, markMessageRead } from '../../services/messageApi';

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
            const unreadCount = convoData.messages?.filter(m =>
                m.sender !== user._id && !m.readBy?.includes(user._id)
            ).length;

            if (unreadCount > 0) {
                // Just mark the latest message read to satisfy read-receipt idempotent condition without spamming logic
                const lastUnread = convoData.messages.findLast(m => m.sender !== user._id && !m.readBy?.includes(user._id));
                if (lastUnread) {
                    await markMessageRead(lastUnread._id).catch(() => { }); // gracefully ignore fail
                }
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

    const getRecipientName = (participants) => {
        const other = participants?.find(p => p._id !== user?._id);
        return other ? `${other.firstName} ${other.lastName}` : 'Unknown';
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-ink-900">Messages</h1>
                    <p className="text-ink-500 mt-1">Communicate securely with school members.</p>
                </div>
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
                            <div className="p-8 text-center text-ink-500 text-sm">No messages yet.</div>
                        ) : (
                            conversations.map((convo) => {
                                const unread = convo.lastMessage?.sender !== user?._id && !convo.lastMessage?.readBy?.includes(user?._id) && convo.lastMessage;
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
                                <div className="font-medium text-ink-900">
                                    {getRecipientName(activeConversation.participants)}
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
                                        const isOwn = msg.sender === user._id;
                                        return (
                                            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white border border-ink-200 text-ink-900 rounded-tl-sm shadow-sm'}`}>
                                                    <p className="text-sm whitespace-pre-wrap word-break">{msg.content}</p>
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
        </div>
    );
}
