import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../services/socket";
import API from "../services/api";

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AVATAR_COLORS = [
  { bg: "#B5D4F4", text: "#0C447C" },
  { bg: "#9FE1CB", text: "#085041" },
  { bg: "#F4C0D1", text: "#72243E" },
  { bg: "#FAC775", text: "#633806" },
  { bg: "#CECBF6", text: "#26215C" },
];

function avatarColor(id = "") {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Chat() {
  const [message, setMessage]           = useState("");
  const [messages, setMessages]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [showMenu, setShowMenu]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  const searchInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef        = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myColor = avatarColor(user._id || "");

 
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery("");
  }, [searchOpen]);

  useEffect(() => {
    if (user?._id) socket.emit("join", user._id);
  }, [user._id]);

  
  useEffect(() => {
    const receiveMessage = (data) => {
      const isRelevant =
        selectedUser &&
        ((data.sender === user._id        && data.receiver === selectedUser._id) ||
         (data.sender === selectedUser._id && data.receiver === user._id));

      if (!isRelevant) return;

     
      if (data.sender === user._id) return;

      setMessages((prev) => [...prev, data]);
      setLastMessages((prev) => ({ ...prev, [selectedUser._id]: data.message }));
    };
    const handleOnlineUsers = (list) => setOnlineUsers(list);

    socket.on("receive_message", receiveMessage);
    socket.on("online_users",    handleOnlineUsers);
    return () => {
      socket.off("receive_message", receiveMessage);
      socket.off("online_users",    handleOnlineUsers);
    };
  }, [selectedUser, user._id]);


  useEffect(() => {
    API.get("/users").then((r) => setUsers(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    API.get(`/messages/${user._id}/${selectedUser._id}`)
      .then((r) => setMessages(r.data))
      .catch(console.error);
  }, [selectedUser, user._id]);

  useEffect(() => {
    if (!users.length) return;
    const others = users.filter((u) => u._id !== user._id);
    Promise.all(
      others.map((u) =>
        API.get(`/messages/${user._id}/${u._id}`)
          .then((r) => {
            const last = r.data[r.data.length - 1];
            return [u._id, last?.message ?? "No messages"];
          })
          .catch(() => [u._id, "No messages"])
      )
    ).then((entries) => setLastMessages(Object.fromEntries(entries)));
  }, [users, user._id]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !selectedUser) return;
    const newMessage = { sender: user._id, receiver: selectedUser._id, message: message.trim() };
    setMessage("");
    try {
      const res = await API.post("/messages", newMessage);

      const saved =
        res.data?.sender ? res.data          
        : res.data?.data?.sender ? res.data.data  
        : null;

      if (saved) {
        setMessages((prev) => [...prev, saved]);
        setLastMessages((prev) => ({ ...prev, [selectedUser._id]: saved.message }));
        socket.emit("send_message", saved);
      } else {
        const localMsg = {
          ...newMessage,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, localMsg]);
        setLastMessages((prev) => ({ ...prev, [selectedUser._id]: localMsg.message }));
        socket.emit("send_message", localMsg);
      }
    } catch (err) {
      console.error(err);
      setMessage(newMessage.message);
    }
  }, [message, selectedUser, user._id]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const filteredUsers = users
    .filter((u) => u._id !== user._id)
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      return (u.name || u.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    });

  const isSelectedOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  return (
    <div style={styles.shell}>

      <aside style={styles.sidebar}>

\        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Messages</span>
          <button
            style={{
              ...styles.iconBtn,
              background: searchOpen ? "#EBF3FC" : "none",
              borderColor: searchOpen ? "#185FA5" : "#E8E8E8",
              color:       searchOpen ? "#185FA5" : "#666",
            }}
            onClick={() => setSearchOpen((v) => !v)}
            title="Search contacts"
          >
            🔍
          </button>
        </div>

        {searchOpen && (
          <div style={styles.searchBar}>
            <span style={{ fontSize: 13, color: "#999", flexShrink: 0 }}>🔍</span>
            <input
              ref={searchInputRef}
              style={styles.searchInput}
              type="text"
              placeholder="Search contacts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        )}

        <div style={styles.chatList}>
          {filteredUsers.length === 0 && (
            <div style={styles.noResults}>
              {searchQuery ? `No results for "${searchQuery}"` : "No contacts yet"}
            </div>
          )}

          {filteredUsers.map((u) => {
            const isOnline    = onlineUsers.includes(u._id);
            const isActive    = selectedUser?._id === u._id;
            const { bg, text } = avatarColor(u._id);
            const displayName  = u.name || u.username;

            const renderName = () => {
              if (!searchQuery.trim()) return displayName;
              const idx = displayName.toLowerCase().indexOf(searchQuery.toLowerCase());
              if (idx === -1) return displayName;
              return (
                <>
                  {displayName.slice(0, idx)}
                  <mark style={styles.highlight}>
                    {displayName.slice(idx, idx + searchQuery.length)}
                  </mark>
                  {displayName.slice(idx + searchQuery.length)}
                </>
              );
            };

            return (
              <div
                key={u._id}
                style={{ ...styles.chatItem, background: isActive ? "#EBF3FC" : "transparent" }}
                onClick={() => { setSelectedUser(u); setSearchOpen(false); setSearchQuery(""); }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ ...styles.avatar, background: bg, color: text }}>
                    {getInitials(displayName)}
                  </div>
                  <span style={{ ...styles.statusDot, background: isOnline ? "#1D9E75" : "#C4C4C4" }} />
                </div>
                <div style={styles.chatMeta}>
                  <div style={styles.chatName}>{renderName()}</div>
                  <div style={styles.chatPreview}>{lastMessages[u._id] || "No messages"}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={menuRef} style={styles.profileFooter}>
          <div
            style={styles.profileFooterInner}
            onClick={() => setShowMenu((v) => !v)}
            title="Account"
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ ...styles.avatar, width: 36, height: 36, fontSize: 13, background: myColor.bg, color: myColor.text }}>
                {getInitials(user.name || user.username || "Me")}
              </div>
              <span style={{ ...styles.statusDot, background: "#1D9E75" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name || user.username || "Me"}
              </div>
              <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email || ""}
              </div>
            </div>

            <span style={{ fontSize: 16, color: "#CCC", flexShrink: 0 }}>⋯</span>
          </div>

          {showMenu && (
            <div style={styles.profilePopup}>
              <div style={styles.profilePopupHeader}>
                <div style={{ ...styles.avatar, width: 44, height: 44, fontSize: 16, background: myColor.bg, color: myColor.text, margin: "0 auto 8px" }}>
                  {getInitials(user.name || user.username || "Me")}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A", textAlign: "center" }}>
                  {user.name || user.username}
                </div>
                <div style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 2 }}>
                  {user.email}
                </div>
              </div>
              <div style={styles.profilePopupDivider} />
              <button style={styles.logoutBtn} onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div style={styles.main}>

        <div style={styles.topbar}>
          {selectedUser ? (
            <>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ ...styles.avatar, width: 36, height: 36, fontSize: 13, ...avatarColor(selectedUser._id) }}>
                  {getInitials(selectedUser.name || selectedUser.username)}
                </div>
                <span style={{ ...styles.statusDot, background: isSelectedOnline ? "#1D9E75" : "#C4C4C4" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.topbarName}>
                  {selectedUser.name || selectedUser.username}
                </div>
                <div style={{ ...styles.topbarStatus, color: isSelectedOnline ? "#1D9E75" : "#999" }}>
                  {isSelectedOnline ? "● Online" : "○ Offline"}
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...styles.topbarName, color: "#BBB" }}>Select a conversation</div>
          )}
        </div>

        <div style={styles.messages}>
          {!selectedUser && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 600, color: "#888", marginBottom: 4 }}>No conversation selected</div>
              <div style={{ fontSize: 13, color: "#BBB" }}>Pick someone from the sidebar to start chatting</div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender === user._id;
            return (
              <div key={msg._id ?? i} style={{ ...styles.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                {!isMe && selectedUser && (
                  <div style={{
                    ...styles.msgAvatar,
                    backgroundColor: avatarColor(selectedUser._id).bg,
                    color: avatarColor(selectedUser._id).text,
                  }}>
                    {getInitials(selectedUser.name || selectedUser.username)}
                  </div>
                )}
                <div>
                  <div style={isMe ? styles.bubbleMe : styles.bubbleThem}>{msg.message}</div>
                  <div style={{ ...styles.bubbleTime, textAlign: isMe ? "right" : "left" }}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputBar}>
          <input
            style={styles.msgInput}
            type="text"
            placeholder="Type a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedUser}
          />
          <button
            style={{ ...styles.sendBtn, opacity: !selectedUser || !message.trim() ? 0.4 : 1 }}
            onClick={sendMessage}
            disabled={!selectedUser || !message.trim()}
            title="Send"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}


const styles = {
  shell: {
    display: "flex",
    height: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#F5F5F5",
    overflow: "hidden",
  },

  // ── sidebar ──
  sidebar: {
    width: 260,
    minWidth: 260,
    background: "#FFFFFF",
    borderRight: "1px solid #E8E8E8",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "20px 16px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #F0F0F0",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1A1A1A",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #E8E8E8",
    background: "none",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    transition: "background 0.15s, border-color 0.15s",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: "1px solid #F0F0F0",
    background: "#FAFAFA",
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    color: "#1A1A1A",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: "#BBB",
    padding: "0 2px",
    flexShrink: 0,
  },
  highlight: {
    background: "#FEF08A",
    borderRadius: 2,
    padding: "0 1px",
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  noResults: {
    textAlign: "center",
    padding: "32px 16px",
    fontSize: 13,
    color: "#BBB",
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 8px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background 0.15s",
    marginBottom: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
  },
  statusDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: "50%",
    border: "2px solid #fff",
  },
  chatMeta: { flex: 1, minWidth: 0 },
  chatName: { fontSize: 14, fontWeight: 500, color: "#1A1A1A" },
  chatPreview: {
    fontSize: 12,
    color: "#999",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 2,
  },

  // ── my profile footer ──
  profileFooter: {
    position: "relative",
    borderTop: "1px solid #F0F0F0",
  },
  profileFooterInner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    cursor: "pointer",
    transition: "background 0.15s",
    userSelect: "none",
  },
  profilePopup: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: 10,
    right: 10,
    background: "#fff",
    border: "1px solid #E8E8E8",
    borderRadius: 12,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.10)",
    zIndex: 200,
    overflow: "hidden",
  },
  profilePopupHeader: {
    padding: "16px 16px 12px",
  },
  profilePopupDivider: {
    height: 1,
    background: "#F0F0F0",
    margin: "0 12px",
  },
  logoutBtn: {
    display: "block",
    width: "calc(100% - 24px)",
    margin: "10px 12px",
    padding: "9px 0",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    color: "#DC2626",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
  },

  // ── main ──
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#F5F5F5",
    overflow: "hidden",
  },
  topbar: {
    padding: "14px 18px",
    borderBottom: "1px solid #E8E8E8",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FFFFFF",
  },
  topbarName: { fontSize: 15, fontWeight: 600, color: "#1A1A1A" },
  topbarStatus: { fontSize: 12, marginTop: 1 },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyState: {
    margin: "auto",
    textAlign: "center",
    padding: 24,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
    backgroundColor: "#B5D4F4", // fallback, overridden inline per user
    color: "#0C447C",
  },
  bubbleMe: {
    background: "#185FA5",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: 320,
    wordBreak: "break-word",
  },
  bubbleThem: {
    background: "#FFFFFF",
    color: "#1A1A1A",
    border: "1px solid #E8E8E8",
    padding: "9px 13px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: 320,
    wordBreak: "break-word",
  },
  bubbleTime: { fontSize: 10, color: "#BBB", marginTop: 3 },
  inputBar: {
    padding: "12px 16px",
    borderTop: "1px solid #E8E8E8",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FFFFFF",
  },
  msgInput: {
    flex: 1,
    background: "#F5F5F5",
    border: "1px solid #E8E8E8",
    borderRadius: 20,
    padding: "9px 16px",
    fontSize: 14,
    color: "#1A1A1A",
    outline: "none",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#185FA5",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
};