import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-surface font-body text-on-surface">
      {/* LEFT COLUMN: AUTHENTICATION (55%) */}
      <section className="w-full md:w-[55%] bg-surface-container-lowest flex flex-col p-8 md:p-16">
        {/* Brand Anchor */}
        <div className="flex items-center gap-1.5 mb-24">
          <span className="font-headline font-extrabold text-[20px] text-on-background tracking-tight">
            PS-CRM
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
        </div>

        {/* Login Content */}
        <div className="max-w-[400px] w-full mx-auto my-auto">
          <header className="mb-10">
            <h1 className="font-headline font-bold text-[32px] text-on-background leading-tight mb-3">
              Welcome back
            </h1>
            <p className="text-[16px] text-on-surface-variant font-normal">
              Track your civic complaints across Delhi
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                className="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-transparent border-0 border-b border-outline-variant/30 focus:ring-0 focus:border-primary transition-all duration-300 px-4 text-[16px] placeholder:text-outline/50"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                className="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-transparent border-0 border-b border-outline-variant/30 focus:ring-0 focus:border-primary transition-all duration-300 px-4 text-[16px] placeholder:text-outline/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error-container/50 rounded-lg">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="text-sm font-medium text-on-error-container">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-container hover:bg-primary transition-all duration-200 rounded-lg flex items-center justify-center gap-2 text-on-primary-container hover:text-on-primary font-bold group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              {!loading && (
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-container-lowest px-4 text-outline font-medium tracking-widest">
                or
              </span>
            </div>
          </div>

          <Link
            to="/map"
            className="w-full h-12 border border-outline-variant/30 hover:bg-surface-container-low transition-colors rounded-lg flex items-center justify-center gap-2 text-on-surface font-semibold group"
          >
            <span>Explore Public Dashboard</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              trending_up
            </span>
          </Link>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            New user?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Footer */}
          <footer className="mt-24 flex items-center gap-2 text-[12px] text-outline/60 font-medium">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <span>Secured by Bhashini · Delhi Municipal Services</span>
          </footer>
        </div>
      </section>

      {/* RIGHT COLUMN: VISUAL CONTEXT (45%) */}
      <section className="hidden md:flex md:w-[45%] bg-[#f0f9ff] relative overflow-hidden flex-col items-center justify-center p-12 bg-delhi-pattern">
        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Skyline Placeholder */}
          <div className="w-full aspect-video mb-12 flex items-end justify-center">
            <div className="w-full h-full flex items-center justify-center opacity-40">
              <span className="material-symbols-outlined text-primary text-[120px]">
                location_city
              </span>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="font-headline font-bold text-[28px] text-on-background mb-2">
              PS-CRM
            </h2>
            <p className="text-[14px] text-primary font-medium tracking-wide">
              Smart Civic Intelligence for Delhi
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                </div>
                <span className="text-[14px] font-semibold text-on-surface">Resolved Cases</span>
              </div>
              <span className="font-mono text-lg font-bold text-tertiary">12,400+</span>
            </div>
            <div className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">speed</span>
                </div>
                <span className="text-[14px] font-semibold text-on-surface">Average SLA</span>
              </div>
              <span className="font-mono text-lg font-bold text-secondary">41-Day</span>
            </div>
            <div className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,102,138,0.04)] border border-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                </div>
                <span className="text-[14px] font-semibold text-on-surface">Integrated Depts.</span>
              </div>
              <span className="font-mono text-lg font-bold text-primary">6</span>
            </div>
          </div>
        </div>

        {/* Atmospheric Depth Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-container/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-secondary-container/5 rounded-full blur-[120px]" />
      </section>
    </main>
  );
}
