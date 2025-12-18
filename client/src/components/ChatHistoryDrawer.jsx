import { useMemo, useState } from "react";
import { Clock3, Sparkles, Trash2, Pencil, X, Search, MessageSquare } from "lucide-react";

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function ChatHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}) {
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const filteredSessions = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const ordered = [...sessions].sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
    );
    if (!term) return ordered;
    return ordered.filter((session) =>
      session.title?.toLowerCase().includes(term) ||
      session.searchType?.toLowerCase().includes(term)
    );
  }, [filter, sessions]);

  const startEditing = (session) => {
    setEditingId(session.id);
    setDraftTitle(session.title || "Untitled chat");
  };

  const handleSave = (sessionId) => {
    const nextTitle = draftTitle.trim() || "Untitled chat";
    onRename(sessionId, nextTitle);
    setEditingId(null);
    setDraftTitle("");
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute left-0 top-0 h-full w-full sm:w-[420px] bg-[#0f1013] border-r border-zinc-800 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex items-start gap-3 border-b border-zinc-800 bg-gradient-to-r from-indigo-500/10 via-transparent to-pink-500/10">
          <div className="p-2 rounded-xl bg-white/5 text-indigo-200">
            <Clock3 size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Chat history</p>
            <p className="text-lg font-semibold text-white">Recall past conversations</p>
            <p className="text-sm text-zinc-400">Switch, rename, or restart any chat with one click.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/5"
            aria-label="Close history drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-800/40"
            >
              <Sparkles size={16} />
              New chat
            </button>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-[#0c0d10] text-sm text-zinc-300">
              <Search size={16} className="text-zinc-500" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search titles or modes"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
            {filteredSessions.length === 0 && (
              <div className="p-4 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-400 text-center">
                No conversations yet. Start a new chat to see it appear here.
              </div>
            )}

            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const messageCount = session.messages?.length || 0;
              const lastUpdated = session.updatedAt || session.createdAt;

              return (
                <div
                  key={session.id}
                  className={`group rounded-xl border transition-colors cursor-pointer ${
                    isActive
                      ? "border-indigo-400/80 bg-indigo-500/10"
                      : "border-zinc-800 bg-[#121319] hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3" onClick={() => onSelect(session.id)}>
                    <div className="p-2 rounded-lg bg-white/5 text-indigo-200">
                      <MessageSquare size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            className="flex-1 bg-[#0c0d10] border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white"
                          />
                          <button
                            onClick={() => handleSave(session.id)}
                            className="px-2 py-1 text-xs rounded-md bg-indigo-500/90 text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">
                              {session.title || "Untitled chat"}
                            </p>
                            <p className="text-xs text-zinc-400 flex items-center gap-2">
                              <span>{formatDate(lastUpdated)}</span>
                              <span className="text-zinc-600">•</span>
                              <span>{messageCount} msgs</span>
                              <span className="text-zinc-600">•</span>
                              <span className="px-2 py-0.5 rounded-full border border-indigo-500/40 text-indigo-100 bg-indigo-500/10">
                                {session.searchType || "Doc Search"}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(session);
                              }}
                              className="p-1 text-zinc-400 hover:text-white"
                              aria-label="Rename chat"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(session.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-red-400"
                              aria-label="Delete chat"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ChatHistoryDrawer;
