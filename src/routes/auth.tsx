import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/church-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "تسجيل الدخول | كنيسة القديس مارمرقس والبابا أثناسيوس" }],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <ChurchLogo size={220} />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <button
            type="submit"
            disabled={busy}
            className="chip-dark w-full text-xl py-5 disabled:opacity-60"
          >
            {busy ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User ID"
            className="w-full rounded-full bg-paper-2 px-7 py-5 text-center text-lg shadow-soft outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70"
            dir="ltr"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full bg-paper-2 px-7 py-5 text-center text-lg shadow-soft outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70"
            dir="ltr"
          />
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          الحسابات محددة مسبقاً ولا يمكن التسجيل من خارج الكنيسة.
        </p>
      </div>
    </div>
  );
}
