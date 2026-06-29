import { useState } from "react";
import API from "../services/api";

export default function Settings({ user, onClose, onUpdate, onDelete, darkMode, onToggleDark }) {
  const [tab, setTab]             = useState("name"); // name | password | delete
  const [name, setName]           = useState(user.name || "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]       = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [deletePwd, setDeletePwd] = useState("");
  const [msg, setMsg]             = useState({ text: "", type: "" }); // type: success | error
  const [loading, setLoading]     = useState(false);

  const flash = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleNameSave = async () => {
    if (!name.trim()) return flash("Name cannot be empty", "error");
    if (name.trim() === user.name) return flash("That's already your name", "error");
    setLoading(true);
    try {
      const res = await API.put("/users/update-name", { userId: user._id, name });
      const updated = { ...user, name: res.data.user.name };
      localStorage.setItem("user", JSON.stringify(updated));
      onUpdate(updated);
      flash("Display name updated!", "success");
    } catch (err) {
      flash(err.response?.data?.message || "Failed to update name", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPwd || !newPwd || !confirmPwd)
      return flash("All fields are required", "error");
    if (newPwd.length < 6)
      return flash("New password must be at least 6 characters", "error");
    if (newPwd !== confirmPwd)
      return flash("New passwords don't match", "error");
    setLoading(true);
    try {
      await API.put("/users/change-password", {
        userId: user._id,
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      flash("Password changed successfully!", "success");
    } catch (err) {
      flash(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePwd) return flash("Enter your password to confirm", "error");
    setLoading(true);
    try {
      await API.delete("/users/delete-account", {
        data: { userId: user._id, password: deletePwd },
      });
      onDelete();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to delete account", "error");
    } finally {
      setLoading(false);
    }
  };

  const dm = darkMode;

  return (
    <div style={overlay}>
      <div style={{ ...modal, background: dm ? "#1E1E2E" : "#fff", color: dm ? "#E0E0F0" : "#1A1A1A" }}>

       
        <div style={modalHeader}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Settings</span>
          <button style={{ ...closeBtn, color: dm ? "#AAA" : "#666" }} onClick={onClose}>✕</button>
        </div>

        
        <div style={{ ...tabRow, borderBottomColor: dm ? "#333" : "#F0F0F0" }}>
          {[
            { key: "name",     label: "Display Name" },
            { key: "password", label: "Password" },
            { key: "delete",   label: "Delete Account" },
          ].map((t) => (
            <button
              key={t.key}
              style={{
                ...tabBtn,
                color: tab === t.key ? "#185FA5" : dm ? "#888" : "#999",
                borderBottomColor: tab === t.key ? "#185FA5" : "transparent",
                fontWeight: tab === t.key ? 600 : 400,
              }}
              onClick={() => { setTab(t.key); setMsg({ text: "", type: "" }); }}
            >
              {t.label}
            </button>
          ))}
        </div>

      
        <div style={{ ...settingRow, borderBottomColor: dm ? "#2A2A3A" : "#F5F5F5" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: dm ? "#888" : "#AAA", marginTop: 2 }}>
              Switch between light and dark theme
            </div>
          </div>
          <div
            style={{ ...toggle, background: dm ? "#185FA5" : "#DDD" }}
            onClick={onToggleDark}
          >
            <div style={{ ...toggleThumb, transform: dm ? "translateX(20px)" : "translateX(2px)" }} />
          </div>
        </div>

        
        {msg.text && (
          <div style={{
            ...flashBox,
            background: msg.type === "success" ? "#F0FDF4" : "#FEF2F2",
            borderColor:  msg.type === "success" ? "#BBF7D0" : "#FECACA",
            color:        msg.type === "success" ? "#15803D" : "#DC2626",
          }}>
            {msg.type === "success" ? "✓ " : "⚠ "}{msg.text}
          </div>
        )}

        
        {tab === "name" && (
          <div style={tabContent}>
            <label style={label(dm)}>New display name</label>
            <input
              style={input(dm)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            />
            <button style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleNameSave} disabled={loading}>
              {loading ? "Saving…" : "Save Name"}
            </button>
          </div>
        )}

        
        {tab === "password" && (
          <div style={tabContent}>
            <label style={label(dm)}>Current password</label>
            <input style={input(dm)} type="password" placeholder="••••••••"
              value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />

            <label style={{ ...label(dm), marginTop: 12 }}>New password</label>
            <input style={input(dm)} type="password" placeholder="Min. 6 characters"
              value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />

            <label style={{ ...label(dm), marginTop: 12 }}>Confirm new password</label>
            <input style={{
                ...input(dm),
                borderColor: confirmPwd && confirmPwd !== newPwd ? "#FECACA" : undefined,
              }}
              type="password" placeholder="Repeat new password"
              value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />

            <button style={{ ...primaryBtn, marginTop: 16, opacity: loading ? 0.7 : 1 }}
              onClick={handlePasswordSave} disabled={loading}>
              {loading ? "Saving…" : "Change Password"}
            </button>
          </div>
        )}

       
        {tab === "delete" && (
          <div style={tabContent}>
            <div style={dangerBox}>
              ⚠ This will permanently delete your account and all your messages. This cannot be undone.
            </div>
            <label style={label(dm)}>Enter your password to confirm</label>
            <input style={input(dm)} type="password" placeholder="Your password"
              value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
            <button style={{ ...dangerBtn, marginTop: 16, opacity: loading ? 0.7 : 1 }}
              onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};
const modal = {
  width: "100%", maxWidth: 440,
  borderRadius: 16,
  boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
  overflow: "hidden",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};
const modalHeader = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "18px 20px 14px",
};
const closeBtn = {
  background: "none", border: "none", fontSize: 18, cursor: "pointer", lineHeight: 1,
};
const tabRow = {
  display: "flex", borderBottom: "1px solid",
  padding: "0 12px",
};
const tabBtn = {
  flex: 1, padding: "10px 4px", background: "none", border: "none",
  borderBottom: "2px solid", cursor: "pointer", fontSize: 13,
  transition: "color 0.15s",
};
const settingRow = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 20px", borderBottom: "1px solid",
};
const toggle = {
  width: 44, height: 24, borderRadius: 12, cursor: "pointer",
  position: "relative", transition: "background 0.25s", flexShrink: 0,
};
const toggleThumb = {
  position: "absolute", top: 2,
  width: 20, height: 20, borderRadius: "50%",
  background: "#fff", transition: "transform 0.25s",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
};
const flashBox = {
  margin: "12px 20px 0",
  padding: "10px 14px",
  borderRadius: 8, border: "1px solid",
  fontSize: 13,
};
const tabContent = {
  padding: "16px 20px 20px",
  display: "flex", flexDirection: "column",
};
const label = (dm) => ({
  fontSize: 13, fontWeight: 500,
  color: dm ? "#AAA" : "#555",
  marginBottom: 6,
});
const input = (dm) => ({
  padding: "10px 12px", fontSize: 14,
  border: `1px solid ${dm ? "#333" : "#E0E0E0"}`,
  borderRadius: 10,
  background: dm ? "#2A2A3A" : "#FAFAFA",
  color: dm ? "#E0E0F0" : "#1A1A1A",
  outline: "none",
});
const primaryBtn = {
  marginTop: 14, padding: "11px",
  background: "#185FA5", color: "#fff",
  border: "none", borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const dangerBox = {
  background: "#FEF2F2", border: "1px solid #FECACA",
  borderRadius: 8, padding: "12px 14px",
  fontSize: 13, color: "#DC2626",
  marginBottom: 14, lineHeight: 1.5,
};
const dangerBtn = {
  padding: "11px",
  background: "#DC2626", color: "#fff",
  border: "none", borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};