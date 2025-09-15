import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, User } from "lucide-react";
import { toast } from "react-hot-toast";

import CodeBlockSimple from "./CodeBlockSimple";
import Source from "./Source";
import WebSearchResults from "./WebSearchResults";
import ChatBox from "./ChatBox";

function ChatArea({ messages, loading, onSendMessage, setSearchType }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scrolls to the bottom of the chat on new messages or loading status change
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const hasStarted = messages.length > 0;

  return (
    <div
      className={`w-full ${
        hasStarted
          ? "flex-1 overflow-y-auto no-scrollbar"
          : "h-full flex flex-col items-center justify-center p-4"
      }`}
    >
      {/* Welcome screen for new chats */}
      {!hasStarted && !loading && (
        <>
          <div className="flex flex-col items-center text-center text-gray-400 mb-8">
            <Sparkles className="w-14 h-14 mb-4 text-gray-500" />
            <h1 className="text-2xl font-medium text-gray-300">
              How can I help you today?
            </h1>
          </div>
          <ChatBox
            onSendMessage={onSendMessage}
            loading={loading}
            setSearchType={setSearchType}
          />
        </>
      )}

      {/* Renders the list of messages */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-8">
        {hasStarted &&
          messages.map((msg, idx) => {
            const isAI = msg.role === "ai";

            if (isAI) {
              // AI Message Structure
              return (
                <div key={idx} className="flex gap-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-y-2 w-full">
                    <p className="font-semibold text-white">Brainly</p>
                    {msg.content && (
                      <div className="text-gray-200 font-sans text-base leading-relaxed tracking-wide whitespace-pre-wrap">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{ code: CodeBlockSimple }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Toolbar for AI actions */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="p-1.5 rounded-md text-gray-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        aria-label="Copy response"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    {/* Doc Search sources */}
                    {msg.searchType === "Doc Search" &&
                      msg.sources?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 self-start mt-1">
                          {msg.sources.map((src, i) => (
                            <Source key={i} source={src} index={i + 1} />
                          ))}
                        </div>
                      )}

                    {/* Web Search results */}
                    {msg.searchType === "Web Search" && msg.results && (
                      <div className="mt-2">
                        <WebSearchResults results={msg.results} />
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // User Message Structure
            return (
              <div key={idx} className="flex gap-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col gap-y-2 w-full pt-1">
                  <p className="font-semibold text-white">You</p>
                  {msg.content && (
                    <div className="text-gray-300 font-sans text-base leading-relaxed tracking-wide whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {/* Loading indicator with the new structure */}
        {loading && (
          <div className="flex gap-x-4 animate-pulse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col gap-y-2 w-full">
              <p className="font-semibold text-white">Brainly</p>
              <div className="bg-zinc-800 h-5 w-24 rounded-md" />
            </div>
          </div>
        )}

        {/* This empty div is the target for auto-scrolling */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}

export default ChatArea;
