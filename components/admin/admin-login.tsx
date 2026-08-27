"use client";

import { motion } from "motion/react";
import { KeyRound, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  adminPageClass,
  formControlClass,
  formLabelClass,
  paperSurfaceClass,
  pixelButtonClass,
} from "@/lib/ui-styles";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError("Não foi possível entrar. Verifique o e-mail e a senha.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className={`${adminPageClass} grid place-items-center`}>
      <motion.section
        className={`${paperSurfaceClass} w-[min(540px,94vw)] border-[12px] p-[clamp(1.2rem,4vw,2.3rem)] outline-5 outline-[#52291d] shadow-[inset_0_0_0_4px_#ffedbd,0_12px_0_rgba(44,20,12,.45)]`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="flex items-center gap-4 border-b-[3px] border-dashed border-[rgba(86,44,25,.4)] pb-4">
          <KeyRound className="size-12 text-[#87502d]" aria-hidden="true" />
          <div>
            <p className="mb-1 text-xs font-black uppercase text-[#8e502e]">Área reservada</p>
            <h1 className="text-[#65331f]">Administrador</h1>
          </div>
        </header>

        {!isSupabaseConfigured ? (
          <div className="border-[3px] border-[#7b4327] bg-[#f8dea4] p-5 text-[#633520]">
            <h2 className="mt-0">Supabase ainda não configurado</h2>
            <p>
              Adicione as variáveis do arquivo <code className="bg-[rgba(98,51,29,.14)] px-1 py-0.5">.env.example</code> para liberar o login e o cadastro de projetos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <label className={formLabelClass}>
              E-mail
              <input className={formControlClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className={formLabelClass}>
              Senha
              <input className={formControlClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
            </label>
            {error && <p className="border-[3px] border-[#7b231e] bg-[#f4b9a8] p-3 font-black text-[#7b231e]" role="alert">{error}</p>}
            <button type="submit" className={pixelButtonClass} disabled={loading}>
              <LogIn aria-hidden="true" /> {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </motion.section>
    </main>
  );
}
