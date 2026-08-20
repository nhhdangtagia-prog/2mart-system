import { useState } from "react";
import { Button, Input, Card, CardContent } from "@2mart/ui";
import { AlertCircle } from "lucide-react";
import { useSession } from "../hooks/useSession";

export function LoginPage() {
  const { login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#f0f2f5] font-sans">
      <Card className="w-full max-w-sm shadow-lg border-slate-200">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg mb-3">
              2M
            </div>
            <h1 className="text-xl font-bold text-slate-800">2Mart ERP</h1>
            <p className="text-sm text-slate-500 mt-1">Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tài khoản
              </label>
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: thanhtam"
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!username || !password || isSubmitting}
              className="h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
