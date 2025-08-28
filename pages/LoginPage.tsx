// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE, injectCleanTheme } from "../components/hr/Shared";
import { useAuth } from "../auth/AuthContext";

// 서버가 role을 같이 안 줄 수도 있으니 안전하게 기본 경로 함수
function firstPathByRole(role?: string) {
  switch (role) {
    case "manager": return "/manager";
    case "hr": return "/hr";
    case "admin": return "/employee"; // admin은 탭에서 모두 접근 가능
    default: return "/employee";
  }
}

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { user, login } = useAuth(); // login(token: string)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { injectCleanTheme(); }, []);

  // 이미 로그인 상태면 가드가 막기 전에 적절한 곳으로
  useEffect(() => {
    if (user) {
      nav(firstPathByRole(user.role), { replace: true });
    }
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!username.trim() || !password) {
      setErr("아이디/비밀번호를 입력하세요.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      // 서버가 HTML 에러를 반환할 때 JSON 파싱 에러를 막기 위해 방어
      const text = await r.text();
      let j: any = {};
      try { j = JSON.parse(text); } catch { /* HTML 등인 경우 */ }

      if (!r.ok || !j?.ok || !j?.token) {
        throw new Error(j?.error || `로그인 실패 (HTTP ${r.status})`);
      }

      // 1) 컨텍스트에 로그인(토큰 저장 & 사용자정보 초기화 루틴 시작)
      login(j.token);

      // 2) 서버가 role을 응답으로 주면 즉시 이동, 아니면 컨텍스트가 /api/me 등으로 채울 때까지 기본 경로로
      const to = firstPathByRole(j.role);
      const from = loc.state?.from?.pathname as string | undefined;
      nav(from || to, { replace: true });
    } catch (e: any) {
      setErr(e?.message || "로그인 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-wrap mgr">
      <div className="shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <form
          onSubmit={submit}
          style={{
            width: 380, background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 14, padding: 20, boxShadow: "0 6px 18px rgba(0,0,0,.05)",
          }}
        >
          <div className="title" style={{ textAlign: "center", marginBottom: 12 }}>로그인</div>
          <div style={{ display: "grid", gap: 10 }}>
            <input className="inp" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="inp" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "로그인 중…" : "로그인"}
            </button>
            {err && <div className="badge" style={{ borderColor: "#fecaca", color: "#b91c1c" }}>오류: {err}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
