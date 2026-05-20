import React, { useEffect, useMemo, useState } from "react";
import { signIn, signUp } from "../services/auth";
import { theme } from "../theme";

export default function AuthScreen({
  onAuthSuccess,
  onClose,
  initialMode = "login",
  title,
  subtitle,
  description,
}) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password;

  useEffect(() => {
    setMode(initialMode);
    setMsg("");
    setMsgType("info");
  }, [initialMode]);

  const usernameValid = useMemo(() => {
    if (mode !== "register") return true;
    return /^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername);
  }, [mode, cleanUsername]);

  const emailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  }, [cleanEmail]);

  const passwordValid = useMemo(() => {
    return cleanPassword.length >= 6;
  }, [cleanPassword]);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setMsg("");
    setMsgType("info");
  };

  const switchMode = (nextMode) => {
    if (loading) return;
    setMode(nextMode);
    resetForm();
  };

  const setError = (text) => {
    setMsg(text);
    setMsgType("error");
  };

  const setSuccess = (text) => {
    setMsg(text);
    setMsgType("success");
  };

  const validateForm = () => {
    if (mode === "register") {
      if (!cleanUsername) {
        setError("Introduce un nombre de usuario.");
        return false;
      }

      if (!usernameValid) {
        setError(
          "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede usar letras, numeros o guion bajo."
        );
        return false;
      }
    }

    if (!cleanEmail) {
      setError("Introduce tu correo electronico.");
      return false;
    }

    if (!emailValid) {
      setError("El correo electronico no tiene un formato valido.");
      return false;
    }

    if (!cleanPassword) {
      setError("Introduce tu contrasena.");
      return false;
    }

    if (!passwordValid) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("info");

    if (!validateForm()) return;

    try {
      setLoading(true);

      if (mode === "register") {
        const created = await signUp(cleanEmail, cleanPassword, cleanUsername);
        const authData =
          created?.session || created?.user
            ? created
            : await signIn(cleanEmail, cleanPassword);

        if (authData?.session || authData?.user) {
          onAuthSuccess?.({ mode: "register" });
        } else {
          setSuccess(
            "Cuenta creada correctamente. Ahora inicia sesion con tu email y contrasena."
          );
          setMode("login");
          setPassword("");
        }
      } else {
        const data = await signIn(cleanEmail, cleanPassword);

        if (data?.session || data?.user) {
          onAuthSuccess?.({ mode: "login" });
        } else {
          setError("No se pudo iniciar sesion.");
        }
      }
    } catch (error) {
      const text = error?.message || "Ha ocurrido un error.";

      if (text.toLowerCase().includes("invalid login credentials")) {
        setError("Email o contrasena incorrectos.");
      } else if (text.toLowerCase().includes("user already registered")) {
        setError("Ese correo ya esta registrado.");
      } else if (text.toLowerCase().includes("password should be at least")) {
        setError("La contrasena es demasiado corta.");
      } else {
        setError(text);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logo}>*</div>
          <div>
            <div style={styles.title}>ASTRACORP</div>
            <div style={styles.subtitle}>
              {subtitle ||
                (mode === "login"
                  ? "Accede a tu terminal de colono"
                  : "Crea tu cuenta para iniciar tu expedicion")}
            </div>
          </div>

          {onClose && (
            <button type="button" onClick={onClose} style={styles.closeBtn}>
              Cerrar
            </button>
          )}
        </div>

        <div style={styles.gameExplain}>
          {description ||
            "Inicia sesion o crea tu cuenta para entrar en un juego de estrategia economica espacial donde empezaras sin recursos y creceras hasta fundar corporaciones, comerciar y controlar sistemas."}
        </div>

        {title && <div style={styles.modalTitle}>{title}</div>}

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            disabled={loading}
            style={{
              ...styles.tabBtn,
              ...(mode === "login" ? styles.tabBtnActive : {}),
              ...(loading ? styles.disabledBtn : {}),
            }}
          >
            Iniciar sesion
          </button>

          <button
            type="button"
            onClick={() => switchMode("register")}
            disabled={loading}
            style={{
              ...styles.tabBtn,
              ...(mode === "register" ? styles.tabBtnActive : {}),
              ...(loading ? styles.disabledBtn : {}),
            }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <div style={styles.field}>
              <input
                style={{
                  ...styles.input,
                  ...(cleanUsername && !usernameValid ? styles.inputError : {}),
                }}
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
              <div style={styles.hint}>
                3-20 caracteres. Letras, numeros o guion bajo.
              </div>
            </div>
          )}

          <div style={styles.field}>
            <input
              style={{
                ...styles.input,
                ...(cleanEmail && !emailValid ? styles.inputError : {}),
              }}
              type="email"
              placeholder="Correo electronico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <input
              style={{
                ...styles.input,
                ...(cleanPassword && !passwordValid ? styles.inputError : {}),
              }}
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            <div style={styles.hint}>Minimo 6 caracteres.</div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.disabledSubmitBtn : {}),
            }}
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>

        {msg && (
          <div
            style={{
              ...styles.message,
              ...(msgType === "error"
                ? styles.messageError
                : msgType === "success"
                ? styles.messageSuccess
                : {}),
            }}
          >
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: theme.gradients.background,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: 20,
    overflow: "hidden",
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.06,
    backgroundImage:
      "linear-gradient(rgba(34,211,238,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.18) 1px, transparent 1px)",
    backgroundSize: "30px 30px",
  },

  bgGlow1: {
    position: "absolute",
    top: -80,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(168,85,247,0.16)",
    filter: "blur(80px)",
  },

  bgGlow2: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(34,211,238,0.14)",
    filter: "blur(80px)",
  },

  card: {
    position: "relative",
    width: "100%",
    maxWidth: 460,
    background: "rgba(10,15,25,0.96)",
    padding: 30,
    borderRadius: 18,
    border: `1px solid ${theme.colors.borderStrong}`,
    boxShadow: "0 0 40px rgba(0,0,0,0.40)",
    backdropFilter: "blur(14px)",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    justifyContent: "space-between",
  },
  closeBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(255,255,255,0.04)",
    color: theme.colors.textSoft,
    borderRadius: theme.radius.pill,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.bg,
    background: theme.gradients.primary,
    boxShadow: theme.glow.cyanStrong,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 2,
    lineHeight: 1,
    background: theme.gradients.title,
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textMuted,
  },

  gameExplain: {
    marginBottom: 18,
    padding: 12,
    borderRadius: theme.radius.md,
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textSoft,
    fontSize: theme.font.body,
    lineHeight: 1.6,
  },
  modalTitle: {
    marginBottom: 14,
    fontSize: 12,
    color: theme.colors.cyan,
    fontWeight: "bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 18,
  },

  tabBtn: {
    padding: 11,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.panelSoft,
    color: theme.colors.textSoft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 15,
  },

  tabBtnActive: {
    border: "1px solid rgba(34,211,238,0.35)",
    background: "rgba(34,211,238,0.08)",
    color: theme.colors.cyan,
    fontWeight: "bold",
  },

  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  form: {
    display: "grid",
    gap: 12,
  },

  field: {
    display: "grid",
    gap: 6,
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    background: "#020617",
    color: "#fff",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },

  inputError: {
    border: "1px solid rgba(248,113,113,0.55)",
    background: "rgba(127,29,29,0.18)",
  },

  hint: {
    fontSize: 12,
    color: theme.colors.disabled,
    paddingLeft: 2,
  },

  submitBtn: {
    width: "100%",
    padding: 13,
    background: theme.gradients.primary,
    color: theme.colors.bg,
    border: "none",
    borderRadius: theme.radius.sm,
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 15,
    marginTop: 4,
    boxShadow: theme.glow.cyan,
  },

  disabledSubmitBtn: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  message: {
    marginTop: 14,
    padding: 12,
    borderRadius: theme.radius.sm,
    fontSize: 13,
    lineHeight: 1.5,
    background: theme.colors.panel,
    color: theme.colors.textSoft,
    border: `1px solid ${theme.colors.border}`,
  },

  messageError: {
    background: "rgba(127,29,29,0.22)",
    color: "#fecaca",
    border: "1px solid rgba(248,113,113,0.25)",
  },

  messageSuccess: {
    background: "rgba(20,83,45,0.22)",
    color: "#bbf7d0",
    border: "1px solid rgba(74,222,128,0.25)",
  },
};
