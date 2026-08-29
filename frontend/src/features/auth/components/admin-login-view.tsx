import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/stores/auth.store";

type Screen = "login" | "forgot" | "sent" | "reset" | "success";

export function AdminLoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((auth) => auth.user);
  const login = useAuthStore((auth) => auth.login);
  const [screen, setScreen] = useState<Screen>("login");
  const [form, setForm] = useState({ email: "", password: "", showPw: false, remember: false });
  const [resetEmail, setResetEmail] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirm: "", showPw: false });
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  function handleLogin() {
    if (!form.email || !form.password) { setState("error"); return; }
    setState("loading");
    setTimeout(() => {
      if (form.password === "password" || form.password.length >= 4) {
        login(form.email);
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from ?? "/admin", { replace: true });
      } else {
        setState("error");
      }
    }, 1200);
  }

  function handleForgot() {
    setState("loading");
    setTimeout(() => { setState("idle"); setScreen("sent"); }, 1000);
  }

  function handleReset() {
    setState("loading");
    setTimeout(() => { setState("idle"); setScreen("success"); }, 1000);
  }

  if (user) return <Navigate replace to="/admin" />;

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <div className="w-full max-w-[440px]">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/logo.png" alt="PLASCHEMA" className="w-14 h-14 object-contain" />
          <span className="text-foreground text-[20px] font-semibold tracking-[-0.4px]">PLASCHEMA</span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[16px] shadow-[0px_4px_8px_-5px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] p-8">

          {/* ── LOGIN ── */}
          {screen === "login" && (
            <>
              <div className="mb-6">
                <h1 className="text-foreground text-[22px] font-semibold tracking-[-0.44px]">Welcome back</h1>
                <p className="text-muted-foreground text-sm mt-1">Sign in to access the enrollment management dashboard.</p>
              </div>

              {state === "error" && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5 mb-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5" /><path d="M8 5V8M8 11H8.01" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <p className="text-red-600 text-xs font-medium">Incorrect email or password. Please try again.</p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setState("idle"); }}
                    className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-sm font-semibold">Password</label>
                    <button onClick={() => setScreen("forgot")} className="text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={form.showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => { setForm({ ...form, password: e.target.value }); setState("idle"); }}
                      className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all pr-12"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button onClick={() => setForm({ ...form, showPw: !form.showPw })} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        {form.showPw
                          ? <><path d="M3 10C4.9 6.8 7.2 5 10 5C12.8 5 15.1 6.8 17 10C15.1 13.2 12.8 15 10 15C7.2 15 4.9 13.2 3 10Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 3L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
                          : <><path d="M3 10C4.9 6.8 7.2 5 10 5C12.8 5 15.1 6.8 17 10C15.1 13.2 12.8 15 10 15C7.2 15 4.9 13.2 3 10Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    className="w-4 h-4 rounded border-border accent-[#9FE870]"
                  />
                  <span className="text-muted-foreground text-sm">Remember me</span>
                </label>
              </div>

              <button
                onClick={handleLogin}
                disabled={state === "loading"}
                className="mt-6 w-full bg-primary rounded-[10px] py-3.5 text-primary-foreground text-sm font-semibold hover:bg-[#8de05c] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
              >
                {state === "loading"
                  ? <><div className="w-4 h-4 border-2 border-[#163300]/30 border-t-[#163300] rounded-full animate-spin" />Signing in…</>
                  : "Sign In"
                }
              </button>

            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {screen === "forgot" && (
            <>
              <button onClick={() => setScreen("login")} className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium hover:text-foreground mb-5 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back to sign in
              </button>
              <div className="mb-6">
                <h1 className="text-foreground text-[22px] font-semibold tracking-[-0.44px]">Forgot your password?</h1>
                <p className="text-muted-foreground text-sm mt-1">Enter your email address and we will send you reset instructions.</p>
              </div>
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-foreground text-sm font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all"
                />
              </div>
              <button
                onClick={handleForgot}
                disabled={!resetEmail || state === "loading"}
                className="w-full bg-primary rounded-[10px] py-3.5 text-primary-foreground text-sm font-semibold hover:bg-[#8de05c] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {state === "loading" ? <><div className="w-4 h-4 border-2 border-[#163300]/30 border-t-[#163300] rounded-full animate-spin" />Sending…</> : "Send Reset Link"}
              </button>
            </>
          )}

          {/* ── EMAIL SENT ── */}
          {screen === "sent" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="24" height="18" rx="3" stroke="#163300" strokeWidth="2" /><path d="M4 11L16 19L28 11" stroke="#163300" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <div className="text-center">
                <p className="text-foreground text-[18px] font-semibold">Check your email</p>
                <p className="text-muted-foreground text-sm mt-1">{"We've sent password reset instructions to"}</p>
                <p className="text-foreground text-sm font-semibold mt-0.5">{resetEmail}</p>
              </div>
              <button
                onClick={() => setScreen("reset")}
                className="mt-2 w-full bg-primary rounded-[10px] py-3.5 text-primary-foreground text-sm font-semibold hover:bg-[#8de05c] transition-colors"
              >
                Set New Password
              </button>
              <button onClick={() => setScreen("login")} className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                Back to sign in
              </button>
            </div>
          )}

          {/* ── RESET PASSWORD ── */}
          {screen === "reset" && (
            <>
              <div className="mb-6">
                <h1 className="text-foreground text-[22px] font-semibold tracking-[-0.44px]">Set new password</h1>
                <p className="text-muted-foreground text-sm mt-1">Your new password must be at least 8 characters.</p>
              </div>
              <div className="flex flex-col gap-4 mb-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold">New Password</label>
                  <div className="relative">
                    <input
                      type={resetForm.showPw ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetForm.password}
                      onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                      className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all pr-12"
                    />
                    <button onClick={() => setResetForm({ ...resetForm, showPw: !resetForm.showPw })} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10C4.9 6.8 7.2 5 10 5C12.8 5 15.1 6.8 17 10C15.1 13.2 12.8 15 10 15C7.2 15 4.9 13.2 3 10Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold">Confirm New Password</label>
                  <input
                    type={resetForm.showPw ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={resetForm.confirm}
                    onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                    className="w-full border border-border rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all"
                  />
                </div>
                {resetForm.password && (
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "At least 8 characters", ok: resetForm.password.length >= 8 },
                      { label: "Contains a number", ok: /\d/.test(resetForm.password) },
                      { label: "Passwords match", ok: resetForm.password === resetForm.confirm && resetForm.confirm.length > 0 },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${ok ? "bg-primary" : "bg-[#e5e5e5]"}`}>
                          {ok && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#163300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span className={`text-xs ${ok ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                disabled={resetForm.password.length < 8 || resetForm.password !== resetForm.confirm || state === "loading"}
                className="w-full bg-primary rounded-[10px] py-3.5 text-primary-foreground text-sm font-semibold hover:bg-[#8de05c] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {state === "loading" ? <><div className="w-4 h-4 border-2 border-[#163300]/30 border-t-[#163300] rounded-full animate-spin" />Saving…</> : "Reset Password"}
              </button>
            </>
          )}

          {/* ── SUCCESS ── */}
          {screen === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#9FE870" /><path d="M10 16L14 20L22 12" stroke="#163300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="text-center">
                <p className="text-foreground text-[18px] font-semibold">Password reset successful</p>
                <p className="text-muted-foreground text-sm mt-1">You can now sign in with your new password.</p>
              </div>
              <button
                onClick={() => setScreen("login")}
                className="mt-2 w-full bg-primary rounded-[10px] py-3.5 text-primary-foreground text-sm font-semibold hover:bg-[#8de05c] transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Plateau State Community Health Insurance Authority
        </p>
      </div>
    </div>
  );
}
