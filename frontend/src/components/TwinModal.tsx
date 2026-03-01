import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface TwinModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

function TwinModal({ isOpen, onClose, children, title }: TwinModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="bg-dark-900 rounded-2xl shadow-2xl border border-gray-700 w-full h-full flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-dark-800/50">
                                {title && (
                                    <h2 className="text-xl font-bold text-white">{title}</h2>
                                )}
                                <button
                                    onClick={onClose}
                                    className="ml-auto w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 border border-gray-600 hover:border-gray-500 transition-all flex items-center justify-center group"
                                    aria-label="Close"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content — overflow-hidden so flex children fill height correctly */}
                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default TwinModal;
