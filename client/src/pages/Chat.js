import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../services/socket";
import API from "../services/api";
import Settings from "./Settings";


function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [showSettings, setShowSettings] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [darkMode, setDarkMode]         = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [currentUser, setCurrentUser]   = useState(
    () => JSON.parse(localStorage.getItem("user") || "{}")
  );

  const searchInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef        = useRef(null);

  const user = currentUser;

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.body.style.background = darkMode ? "#13131F" : "#F5F5F5";
  }, [darkMode]);

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
          .then((r) => { const last = r.data[r.data.length - 1]; return [u._id, last?.message ?? "No messages"]; })
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
      const res  = await API.post("/messages", newMessage);
      const saved = res.data?.sender ? res.data
        : res.data?.data?.sender    ? res.data.data
        : { ...newMessage, _id: Date.now().toString(), createdAt: new Date().toISOString() };

      setMessages((prev) => [...prev, saved]);
      setLastMessages((prev) => ({ ...prev, [selectedUser._id]: saved.message }));
      socket.emit("send_message", saved);
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

  const handleUserUpdate = (updated) => setCurrentUser(updated);
  const handleAccountDelete = () => {
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
  const myColor = avatarColor(user._id || "");

  const dm = darkMode;
  const t = {
    shell:        { background: dm ? "#13131F" : "#F5F5F5" },
    sidebar:      { background: dm ? "#1A1A2E" : "#FFFFFF", borderRight: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}` },
    sidebarHdr:   { borderBottom: `1px solid ${dm ? "#2A2A3A" : "#F0F0F0"}` },
    title:        { color: dm ? "#E0E0F0" : "#1A1A1A" },
    iconBtn:      { border: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}`, color: dm ? "#AAA" : "#666" },
    searchBar:    { background: dm ? "#13131F" : "#FAFAFA", borderBottom: `1px solid ${dm ? "#2A2A3A" : "#F0F0F0"}` },
    searchInput:  { color: dm ? "#E0E0F0" : "#1A1A1A" },
    chatItem:     (active) => ({ background: active ? (dm ? "#1E2A3A" : "#EBF3FC") : "transparent" }),
    chatName:     { color: dm ? "#E0E0F0" : "#1A1A1A" },
    chatPreview:  { color: dm ? "#666" : "#999" },
    profileFooter:{ borderTop: `1px solid ${dm ? "#2A2A3A" : "#F0F0F0"}`, background: dm ? "#1A1A2E" : "#FFFFFF" },
    main:         { background: dm ? "#13131F" : "#F5F5F5" },
    topbar:       { background: dm ? "#1A1A2E" : "#FFFFFF", borderBottom: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}` },
    topbarName:   { color: dm ? "#E0E0F0" : "#1A1A1A" },
    bubbleMe:     { background: "#185FA5", color: "#fff" },
    bubbleThem:   { background: dm ? "#1E1E2E" : "#FFFFFF", color: dm ? "#E0E0F0" : "#1A1A1A", border: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}` },
    inputBar:     { background: dm ? "#1A1A2E" : "#FFFFFF", borderTop: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}` },
    msgInput:     { background: dm ? "#13131F" : "#F5F5F5", border: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}`, color: dm ? "#E0E0F0" : "#1A1A1A" },
  };

  return (
    <>
      {showSettings && (
        <Settings
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((v) => !v)}
          onClose={() => setShowSettings(false)}
          onUpdate={handleUserUpdate}
          onDelete={handleAccountDelete}
        />
      )}

      <div style={{ ...styles.shell, ...t.shell }}>

        <aside style={{ ...styles.sidebar, ...t.sidebar }}>

          <div style={{ ...styles.sidebarHeader, ...t.sidebarHdr }}>
            <span style={{ ...styles.sidebarTitle, ...t.title }}>Messages</span>
            <button
              style={{ ...styles.iconBtn, ...t.iconBtn, ...(searchOpen ? { background: "#EBF3FC", borderColor: "#185FA5", color: "#185FA5" } : {}) }}
              onClick={() => setSearchOpen((v) => !v)} title="Search"
            >🔍</button>
          </div>

          {searchOpen && (
            <div style={{ ...styles.searchBar, ...t.searchBar }}>
              <span style={{ fontSize: 13, color: "#999", flexShrink: 0 }}>🔍</span>
              <input ref={searchInputRef} style={{ ...styles.searchInput, ...t.searchInput }}
                type="text" placeholder="Search contacts…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)} />
              {searchQuery && (
                <button style={styles.clearBtn} onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          )}

          <div style={styles.chatList}>
            {filteredUsers.length === 0 && (
              <div style={{ ...styles.noResults, color: dm ? "#555" : "#BBB" }}>
                {searchQuery ? `No results for "${searchQuery}"` : "No contacts yet"}
              </div>
            )}
            {filteredUsers.map((u) => {
              const isOnline   = onlineUsers.includes(u._id);
              const isActive   = selectedUser?._id === u._id;
              const { bg, text } = avatarColor(u._id);
              const displayName  = u.name || u.username;

              const renderName = () => {
                if (!searchQuery.trim()) return displayName;
                const idx = displayName.toLowerCase().indexOf(searchQuery.toLowerCase());
                if (idx === -1) return displayName;
                return (<>{displayName.slice(0, idx)}<mark style={styles.highlight}>{displayName.slice(idx, idx + searchQuery.length)}</mark>{displayName.slice(idx + searchQuery.length)}</>);
              };

              return (
                <div key={u._id}
                  style={{ ...styles.chatItem, ...t.chatItem(isActive) }}
                  onClick={() => { setSelectedUser(u); setSearchOpen(false); setSearchQuery(""); }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ ...styles.avatar, background: bg, color: text }}>{getInitials(displayName)}</div>
                    <span style={{ ...styles.statusDot, background: isOnline ? "#1D9E75" : "#C4C4C4" }} />
                  </div>
                  <div style={styles.chatMeta}>
                    <div style={{ ...styles.chatName, ...t.chatName }}>{renderName()}</div>
                    <div style={{ ...styles.chatPreview, ...t.chatPreview }}>{lastMessages[u._id] || "No messages"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={menuRef} style={{ ...styles.profileFooter, ...t.profileFooter }}>
            <div style={styles.profileFooterInner} onClick={() => setShowMenu((v) => !v)}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ ...styles.avatar, width: 36, height: 36, fontSize: 13, background: myColor.bg, color: myColor.text }}>
                  {getInitials(user.name || user.username || "Me")}
                </div>
                <span style={{ ...styles.statusDot, background: "#1D9E75" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: dm ? "#E0E0F0" : "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name || user.username || "Me"}
                </div>
                <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email || ""}
                </div>
              </div>
              <span style={{ fontSize: 16, color: "#CCC", flexShrink: 0 }}>⋯</span>
            </div>

            {showMenu && (
              <div style={{ ...styles.profilePopup, background: dm ? "#1E1E2E" : "#fff", border: `1px solid ${dm ? "#2A2A3A" : "#E8E8E8"}` }}>
                <div style={styles.profilePopupHeader}>
                  <div style={{ ...styles.avatar, width: 44, height: 44, fontSize: 16, background: myColor.bg, color: myColor.text, margin: "0 auto 8px" }}>
                    {getInitials(user.name || user.username || "Me")}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: dm ? "#E0E0F0" : "#1A1A1A", textAlign: "center" }}>{user.name || user.username}</div>
                  <div style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 2 }}>{user.email}</div>
                </div>
                <div style={{ height: 1, background: dm ? "#2A2A3A" : "#F0F0F0", margin: "0 12px" }} />

                <button
                  style={{ ...styles.settingsBtn, color: dm ? "#E0E0F0" : "#1A1A1A", background: "none" }}
                  onClick={() => { setShowMenu(false); setShowSettings(true); }}
                >
                  ⚙ Settings
                </button>

                <div style={{ height: 1, background: dm ? "#2A2A3A" : "#F0F0F0", margin: "0 12px" }} />
                <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
              </div>
            )}
          </div>
        </aside>

\        <div style={{ ...styles.main, ...t.main }}>

          <div style={{ ...styles.topbar, ...t.topbar }}>
            {selectedUser ? (
              <>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ ...styles.avatar, width: 36, height: 36, fontSize: 13, ...avatarColor(selectedUser._id) }}>
                    {getInitials(selectedUser.name || selectedUser.username)}
                  </div>
                  <span style={{ ...styles.statusDot, background: isSelectedOnline ? "#1D9E75" : "#C4C4C4" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...styles.topbarName, ...t.topbarName }}>{selectedUser.name || selectedUser.username}</div>
                  <div style={{ fontSize: 12, marginTop: 1, color: isSelectedOnline ? "#1D9E75" : "#999" }}>
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
                    <div style={{ ...styles.msgAvatar, backgroundColor: avatarColor(selectedUser._id).bg, color: avatarColor(selectedUser._id).text }}>
                      {getInitials(selectedUser.name || selectedUser.username)}
                    </div>
                  )}
                  <div>
                    <div style={{ ...(isMe ? styles.bubbleMe : styles.bubbleThem), ...(isMe ? t.bubbleMe : t.bubbleThem) }}>
                      {msg.message}
                    </div>
                    <div style={{ ...styles.bubbleTime, textAlign: isMe ? "right" : "left" }}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ ...styles.inputBar, ...t.inputBar }}>
            <input style={{ ...styles.msgInput, ...t.msgInput }}
              type="text" placeholder="Type a message…" value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown} disabled={!selectedUser} />
            <button
              style={{ ...styles.sendBtn, opacity: !selectedUser || !message.trim() ? 0.4 : 1 }}
              onClick={sendMessage} disabled={!selectedUser || !message.trim()} title="Send"
            >➤</button>
          </div>
        </div>
      </div>
    </>
  );
}


const styles = {
  shell:          { display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" },
  sidebar:        { width: 260, minWidth: 260, display: "flex", flexDirection: "column", overflow: "hidden" },
  sidebarHeader:  { padding: "20px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  sidebarTitle:   { fontSize: 18, fontWeight: 600 },
  iconBtn:        { width: 32, height: 32, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" },
  searchBar:      { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" },
  searchInput:    { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14 },
  clearBtn:       { background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#BBB", padding: "0 2px", flexShrink: 0 },
  highlight:      { background: "#FEF08A", borderRadius: 2, padding: "0 1px" },
  chatList:       { flex: 1, overflowY: "auto", padding: "8px" },
  noResults:      { textAlign: "center", padding: "32px 16px", fontSize: 13 },
  chatItem:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", marginBottom: 2 },
  avatar:         { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 },
  statusDot:      { position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", border: "2px solid transparent" },
  chatMeta:       { flex: 1, minWidth: 0 },
  chatName:       { fontSize: 14, fontWeight: 500 },
  chatPreview:    { fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 },
  profileFooter:  { position: "relative" },
  profileFooterInner: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", userSelect: "none" },
  profilePopup:   { position: "absolute", bottom: "calc(100% + 6px)", left: 10, right: 10, borderRadius: 12, boxShadow: "0 -4px 20px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" },
  profilePopupHeader: { padding: "16px 16px 12px" },
  settingsBtn:    { display: "block", width: "100%", padding: "11px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, textAlign: "left" },
  logoutBtn:      { display: "block", width: "calc(100% - 24px)", margin: "10px 12px", padding: "9px 0", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "center" },
  main:           { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar:         { padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 },
  topbarName:     { fontSize: 15, fontWeight: 600 },
  messages:       { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 },
  emptyState:     { margin: "auto", textAlign: "center", padding: 24 },
  msgRow:         { display: "flex", alignItems: "flex-end", gap: 8 },
  msgAvatar:      { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 },
  bubbleMe:       { padding: "9px 13px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, maxWidth: 320, wordBreak: "break-word" },
  bubbleThem:     { padding: "9px 13px", borderRadius: "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.5, maxWidth: 320, wordBreak: "break-word" },
  bubbleTime:     { fontSize: 10, color: "#BBB", marginTop: 3 },
  inputBar:       { padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 },
  msgInput:       { flex: 1, borderRadius: 20, padding: "9px 16px", fontSize: 14, outline: "none" },
  sendBtn:        { width: 38, height: 38, borderRadius: "50%", background: "#185FA5", border: "none", color: "#fff", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.15s" },
};