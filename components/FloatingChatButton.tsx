"use client";

import { useState } from "react";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Implement actual message sending logic
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Popup */}
      <div
        className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-[350px] max-w-[calc(100vw-3rem)] h-[500px] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-600/20 border border-white/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl">
                👤
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Chat dengan Admin
                </h3>
                <p className="text-blue-100 text-xs">Biasanya membalas dalam beberapa menit</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
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

          {/* Chat Body */}
          <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-3 bg-white/40 backdrop-blur-sm">
            {/* Welcome Message */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-sm">
                A
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-blue-100/50 max-w-[80%]">
                <p className="text-gray-800 text-sm leading-relaxed">
                  Halo! 👋 Ada yang bisa kami bantu?
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  Baru saja
                </span>
              </div>
            </div>

            {/* Empty state - placeholder for future messages */}
            <div className="flex items-center justify-center py-8 opacity-50">
              <p className="text-sm text-gray-600 text-center">
                Mulai percakapan dengan mengirim pesan di bawah
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-md border-t border-white/30">
            <div className="flex gap-2 items-end">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pesan Anda..."
                rows={1}
                className="flex-1 resize-none rounded-xl px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-blue-200/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all text-sm placeholder:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:shadow-none flex-shrink-0"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-110 active:scale-95 transition-all duration-300 ease-out flex items-center justify-center group animate-pulse-slow"
        aria-label="Open chat"
      >
        {isOpen ? (
          <svg
            className="w-7 h-7 transition-transform group-hover:rotate-90 duration-300"
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
        ) : (
          <>
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
              !
            </span>
          </>
        )}
      </button>

      {/* Custom CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}
