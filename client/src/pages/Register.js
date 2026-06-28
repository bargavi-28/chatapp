import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: "#EF4444", width: "25%" };
    if (p.length < 8) return { label: "Weak", color: "#F97316", width: "50%" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: "Strong", color: "#1D9E75", width: "100%" };
    return { label: "Fair", color: "#EAB308", width: "75%" };
  })();

  return (
    <div style={styles.page}>
      
      <div style={styles.brand}>
        <div style={styles.brandIcon}>💬</div>
        <span style={styles.brandName}>ChatApp</span>
      </div>

      
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>Join and start chatting instantly</p>
        </div>

        <form onSubmit={handleRegister} style={styles.form}>
          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={set("name")}
              autoFocus
            />
          </div>

          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </div>

          
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set("password")}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            
            {strength && (
              <div style={{ marginTop: 6 }}>
                <div style={styles.strengthTrack}>
                  <div style={{ ...styles.strengthFill, width: strength.width, background: strength.color }} />
                </div>
                <span style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

         
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm password</label>
            <input
              style={{
                ...styles.input,
                borderColor: form.confirm && form.confirm !== form.password ? "#FECACA" : "#E0E0E0",
              }}
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set("confirm")}
            />
            {form.confirm && form.confirm !== form.password && (
              <span style={{ fontSize: 12, color: "#DC2626", marginTop: 3 }}>Passwords don't match</span>
            )}
          </div>

          
          {error && (
            <div style={styles.errorBox}>
              <span style={{ marginRight: 6 }}>⚠</span>
              {error}
            </div>
          )}

          
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? <span style={styles.spinner} /> : "Create account"}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>

      <p style={styles.footer}>Secure · Real-time · Private</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #EBF3FC 0%, #F5F5F5 50%, #EDF7F3 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "24px 16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  brandIcon: {
    width: 40,
    height: 40,
    background: "#185FA5",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1A1A1A",
    letterSpacing: "-0.3px",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E8E8E8",
    padding: "36px 40px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1A1A1A",
    margin: 0,
    letterSpacing: "-0.4px",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    margin: "6px 0 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    fontSize: 14,
    border: "1px solid #E0E0E0",
    borderRadius: 10,
    outline: "none",
    color: "#1A1A1A",
    background: "#FAFAFA",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
    color: "#999",
  },
  strengthTrack: {
    height: 4,
    background: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s, background 0.3s",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    marginTop: 4,
    transition: "opacity 0.15s",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0 16px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#EFEFEF",
  },
  dividerText: {
    fontSize: 12,
    color: "#BBB",
    flexShrink: 0,
  },
  loginText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    margin: 0,
  },
  link: {
    color: "#185FA5",
    fontWeight: 600,
    textDecoration: "none",
  },
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: "#BBB",
    letterSpacing: "0.5px",
  },
};