import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/chat");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>💬</div>
        <span style={styles.brandName}>ChatApp</span>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to continue chatting</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={styles.label}>Password</label>
            </div>
            <div style={styles.passwordWrap}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
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
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        
        <p style={styles.registerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create one
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
    gap: 18,
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
  registerText: {
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