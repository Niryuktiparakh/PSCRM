import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import PageShell from "../components/PageShell";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      navigate("/submit");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <PageShell title="PSRM Login">
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </PageShell>
  );
}
