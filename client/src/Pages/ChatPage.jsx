import { useEffect, useMemo, useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Menu, Clock3, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ChatBox from "@/components/ChatBox";
import ChatHistoryDrawer from "@/components/ChatHistoryDrawer";

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const { getToken } = useAuth();
  const [searchType, setSearchType] = useState("Doc Search");

  // --- Session helpers ---
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId]
  );

  const messages = activeSession?.messages || [];

  // Load stored sessions on mount
  useEffect(() => {
    const stored = localStorage.getItem("brainly-chat-sessions");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed[0]) {
          setActiveSessionId(parsed[0].id);
          setSearchType(parsed[0].searchType || "Doc Search");
        }
        return;
      } catch (error) {
        console.warn("Failed to parse chat sessions", error);
      }
    }

    const bootstrapSession = {
      id: uuidv4(),
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      searchType: "Doc Search",
    };

    setSessions([bootstrapSession]);
    setActiveSessionId(bootstrapSession.id);
    setSearchType(bootstrapSession.searchType);
  }, []);

  // Persist sessions locally
  useEffect(() => {
    if (sessions.length) {
      localStorage.setItem("brainly-chat-sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const upsertSession = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...updater(session) } : session
      )
    );
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    if (activeSessionId) {
      upsertSession(activeSessionId, (session) => ({
        searchType: type || session.searchType,
      }));
    }
  };

  const handleNewChat = () => {
    const newSession = {
      id: uuidv4(),
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      searchType: "Doc Search",
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSearchType(newSession.searchType);
    setHistoryOpen(false);
    return newSession.id;
  };

  const handleRename = (sessionId, title) => {
    upsertSession(sessionId, () => ({ title, updatedAt: Date.now() }));
  };

  const handleDelete = (sessionId) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));

    if (sessionId === activeSessionId) {
      const remaining = sessions.filter((session) => session.id !== sessionId);
      const nextSession = remaining[0];
      if (nextSession) {
        setActiveSessionId(nextSession.id);
        setSearchType(nextSession.searchType || "Doc Search");
      } else {
        handleNewChat();
      }
    }
  };

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    const targetSessionId = activeSessionId ?? handleNewChat();

    const newUserMessage = { role: "user", content: userMessage };
    const addUserMessage = (prevMessages = []) => [...prevMessages, newUserMessage];

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== targetSessionId) return session;
        const updatedTitle =
          session.messages.length === 0 && userMessage.trim().length
            ? userMessage.trim().slice(0, 60) + (userMessage.length > 60 ? "…" : "")
            : session.title;

        return {
          ...session,
          title: updatedTitle,
          updatedAt: Date.now(),
          messages: addUserMessage(session.messages),
        };
      })
    );
    setLoading(true);

    try {
      const token = await getToken();

      if (searchType === "Doc Search") {
        const { data } = await axios.post(
          "/api/chat",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSessions((prev) =>
          prev.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  updatedAt: Date.now(),
                  messages: [
                    ...session.messages,
                    {
                      role: "ai",
                      searchType,
                      content: data.answer || "No answer found.",
                      sources: data.sources || [],
                    },
                  ],
                }
              : session
          )
        );
      } else {
        const { data } = await axios.post(
          "/api/webSearch",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSessions((prev) =>
          prev.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  updatedAt: Date.now(),
                  messages: [
                    ...session.messages,
                    {
                      role: "ai",
                      searchType,
                      content: data.answer || "No summary available.",
                      results: data.citations || data.sources || [],
                    },
                  ],
                }
              : session
          )
        );
      }
    } catch (err) {
      console.error("API call failed:", err);
      toast.error("Error communicating with the server.");
      setSessions((prev) =>
        prev.map((session) =>
          session.id === targetSessionId
            ? {
                ...session,
                updatedAt: Date.now(),
                messages: [
                  ...session.messages,
                  { role: "ai", content: "⚠️ Something went wrong. Try again." },
                ],
              }
            : session
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const hasStarted = messages.length > 0;

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#0b0c10] via-[#0e1014] to-[#0a0b0f] text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col relative">
        {/* Topbar */}
        <header className="flex items-center p-4 bg-[#0f1013]/70 backdrop-blur-sm h-[64px] border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-300 hover:text-white rounded-full p-2 border border-zinc-800/80 bg-[#16171a]"
              >
                <Menu size={18} />
              </button>
            )}
            <div>
              <p className="text-sm text-zinc-400">Active workspace</p>
              <p className="font-semibold text-white">Brainly Assistant</p>
            </div>
          </div>

          <div className="flex-grow" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-indigo-500/50 bg-indigo-500/10 text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/20 transition"
            >
              <Clock3 size={16} />
              <span className="hidden sm:inline text-sm">History</span>
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="w-full max-w-3xl mx-auto px-4 pt-4 flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-zinc-800 bg-[#101216]/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Current chat</p>
                  <p className="text-lg font-semibold text-white line-clamp-1">
                    {activeSession?.title || "New Chat"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs border border-indigo-500/50 text-indigo-100 bg-indigo-500/10">
                    {searchType}
                  </span>
                  <button
                    onClick={handleNewChat}
                    className="px-3 py-1 text-xs rounded-full border border-zinc-700 hover:border-white/60 bg-white/5 text-white"
                  >
                    Start fresh
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
                <Sparkles size={16} className="text-amber-300" />
                <span>{messages.length || 0} messages logged</span>
                <span className="text-zinc-700">•</span>
                <span>{new Date(activeSession?.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <ChatArea
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            setSearchType={handleSearchTypeChange}
            searchType={searchType}
          />

          {hasStarted && (
            <ChatBox
              onSendMessage={handleSendMessage}
              loading={loading}
              setSearchType={handleSearchTypeChange}
              searchType={searchType}
            />
          )}
        </div>
      </div>

      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={(sessionId) => {
          const session = sessions.find((item) => item.id === sessionId);
          setActiveSessionId(sessionId);
          setSearchType(session?.searchType || "Doc Search");
          setHistoryOpen(false);
        }}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ChatPage;
