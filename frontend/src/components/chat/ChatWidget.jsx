import React, { useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useChatStore from '../../store/useChatStore';

const ChatWidget = () => {
    const { isOpen, toggleChat, messages, sendMessage, isLoading } = useChatStore();
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputRef.current.value.trim()) return;

        const message = inputRef.current.value;
        inputRef.current.value = '';
        await sendMessage(message);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <Motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">POS Assistant</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleChat}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                      max-w-[85%] p-3 text-sm rounded-2xl shadow-sm
                      ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none'
                                            }
                    `}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-bl-none border border-zinc-200 dark:border-zinc-700 shadow-sm flex gap-1.5 items-center">
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="relative flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Ask a question..."
                                    className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl text-sm outline-none transition-all placeholder:text-zinc-500 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <Motion.button
                onClick={toggleChat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pointer-events-auto h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-colors relative"
            >
                <MessageCircle className="w-7 h-7" />
                {/* Notification Dot (Optional) */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                )}
            </Motion.button>
        </div>
    );
};

export default ChatWidget;
