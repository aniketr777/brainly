import { useEffect, useMemo, useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Menu, Clock3, Sparkles, History, LayoutGrid, Loader2 } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ChatBox from "@/components/ChatBox";
import ChatHistoryDrawer from "@/components/ChatHistoryDrawer";

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const { getToken } = useAuth();
  const [searchType, setSearchType] = useState("Doc Search");

  const buildHeaders = async () => ({
    Authorization: `Bearer ${await getToken()}`,
  });

  const formatSession = (chat) => ({
    id: chat.chatId,
    title: chat.title || "New Chat",
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    searchType: chat.searchType || "Doc Search",
    messages: (chat.messages || chat.message || []).map((msg) => ({
      role: msg.role === "assistant" ? "ai" : msg.role,
      content: msg.content,
      searchType: msg.searchType || chat.searchType || "Doc Search",
      sources: msg.sources || [],
      results: msg.results || [],
    })),
  });

  const createSessionOnServer = async (title = "New Chat", type = "Doc Search") => {
    const { data } = await axios.post(
      "/api/chats",
      { title, searchType: type },
      { headers: await buildHeaders() }
    );
    return formatSession(data);
  };

  // --- Session helpers ---
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId]
  );

  const messages = activeSession?.messages || [];

  // Load stored sessions from the database on mount
  useEffect(() => {
    const loadSessions = async () => {
      setInitializing(true);
      try {
        const { data } = await axios.get("/api/chats", {
          headers: await buildHeaders(),
        });

        const parsed = (Array.isArray(data) ? data : []).map(formatSession);

        if (parsed.length) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setSearchType(parsed[0].searchType || "Doc Search");
        } else {
          const bootstrap = await createSessionOnServer();
          setSessions([bootstrap]);
          setActiveSessionId(bootstrap.id);
          setSearchType(bootstrap.searchType);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
        toast.error("Unable to load chat history");
      } finally {
        setInitializing(false);
      }
    };

    loadSessions();
  }, [getToken]);

  const upsertSession = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...updater(session) } : session
      )
    );
  };

  const handleSearchTypeChange = async (type) => {
    setSearchType(type);
    if (activeSessionId) {
      upsertSession(activeSessionId, (session) => ({
        searchType: type || session.searchType,
      }));

      try {
        await axios.patch(
          `/api/chats/${activeSessionId}`,
          { searchType: type },
          { headers: await buildHeaders() }
        );
      } catch (error) {
        console.error("Failed to sync search type", error);
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createSessionOnServer("New Chat", searchType || "Doc Search");
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setSearchType(newSession.searchType);
      setHistoryOpen(false);
      return newSession.id;
    } catch (error) {
      console.error("Failed to create chat", error);
      toast.error("Unable to start a new chat");
      return null;
    }
  };

  const handleRename = async (sessionId, title) => {
    try {
      const { data } = await axios.patch(
        `/api/chats/${sessionId}`,
        { title },
        { headers: await buildHeaders() }
      );
      const updated = formatSession(data);
      upsertSession(sessionId, () => ({ title: updated.title, updatedAt: updated.updatedAt }));
    } catch (error) {
      console.error("Failed to rename chat", error);
      toast.error("Unable to rename chat");
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      await axios.delete(`/api/chats/${sessionId}`, { headers: await buildHeaders() });
      const remaining = sessions.filter((session) => session.id !== sessionId);
      setSessions(remaining);

      if (sessionId === activeSessionId) {
        setActiveSessionId(null);
        const nextSession = remaining[0];
        if (nextSession) {
          setActiveSessionId(nextSession.id);
          setSearchType(nextSession.searchType || "Doc Search");
        } else {
          const newId = await handleNewChat();
          if (newId) setActiveSessionId(newId);
        }
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
      toast.error("Unable to delete chat");
    }
  };

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await handleNewChat();
      if (!targetSessionId) return;
    }

    const newUserMessage = { role: "user", content: userMessage, searchType };
    const addUserMessage = (prevMessages = []) => [...prevMessages, newUserMessage];

    let updatedTitle = "New Chat";
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== targetSessionId) return session;
        updatedTitle =
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
      let aiMessage;

      if (searchType === "Doc Search") {
        const { data } = await axios.post(
          "/api/chat",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        aiMessage = {
          role: "ai",
          searchType,
          content: data.answer || "No answer found.",
          sources: data.sources || [],
        };
      } else {
        const { data } = await axios.post(
          "/api/webSearch",
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        aiMessage = {
          role: "ai",
          searchType,
          content: data.answer || "No summary available.",
          results: data.citations || data.sources || [],
        };
      }

      if (aiMessage) {
        setSessions((prev) =>
          prev.map((session) =>
            session.id === targetSessionId
              ? {
                  ...session,
                  updatedAt: Date.now(),
                  messages: [...session.messages, aiMessage],
                }
              : session
          )
        );

        await axios.post(
          `/api/chats/${targetSessionId}/messages`,
          { messages: [newUserMessage, aiMessage], title: updatedTitle, searchType },
          { headers: await buildHeaders() }
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
    <div className="flex h-screen w-full bg-gradient-to-br from-[#090a0e] via-[#0c0e13] to-[#07080c] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 top-20 w-80 h-80 bg-purple-500/10 blur-3xl" />
        <div className="absolute left-20 bottom-0 w-72 h-72 bg-blue-500/10 blur-3xl" />
      </div>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col relative">
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="w-full max-w-5xl mx-auto px-4 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 text-sm text-zinc-200 hover:border-indigo-500/50 hover:text-white"
                >
                  <Menu size={16} />
                  <span>Browse docs</span>
                </button>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/60 bg-indigo-500/15 text-sm text-indigo-100 hover:border-indigo-400 hover:bg-indigo-500/25"
                >
                  <Clock3 size={16} />
                  <span>History</span>
                </button>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-500/50 bg-green-500/10 text-sm text-green-100 hover:border-green-400 hover:bg-green-500/20"
                >
                  <Sparkles size={16} />
                  <span>New chat</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 text-xs text-zinc-300">
                  <History size={16} className="text-indigo-300" />
                  {activeSession?.title || "New Chat"}
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-gradient-to-br from-white/5 via-white/0 to-indigo-500/10 p-4 shadow-xl shadow-indigo-900/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conversation</p>
                    <p className="text-2xl font-semibold text-white line-clamp-1">
                      {activeSession?.title || "New Chat"}
                    </p>
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-300" />
                      <span>{messages.length || 0} messages</span>
                      <span className="text-zinc-700">•</span>
                      <span>{new Date(activeSession?.createdAt || Date.now()).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 text-sm text-indigo-100">
                      <LayoutGrid size={16} />
                      {searchType}
                    </span>
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="px-3 py-2 rounded-xl border border-zinc-800 bg-white/5 text-sm text-zinc-200 hover:border-white/50"
                    >
                      Switch chat
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-white/5 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Active mode</p>
                  <p className="text-lg font-semibold text-white">{searchType}</p>
                  <p className="text-sm text-zinc-400 mt-1">Choose Web or Doc search from the composer.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-white/5 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Last updated</p>
                  <p className="text-lg font-semibold text-white">
                    {activeSession?.updatedAt
                      ? new Date(activeSession.updatedAt).toLocaleTimeString()
                      : "Just now"}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Stay in sync across devices with saved history.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {initializing ? (
              <div className="flex flex-1 items-center justify-center text-zinc-400">
                <Loader2 className="animate-spin mr-2" />
                Loading your conversations...
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
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
