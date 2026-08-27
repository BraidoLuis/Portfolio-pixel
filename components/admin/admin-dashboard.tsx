"use client";

import { motion } from "motion/react";
import { Archive, Eye, FilePenLine, LogOut, Plus, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Project, ProjectStatus } from "@/content/portfolio";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  adminActionClass,
  adminPageClass,
  formControlClass,
  formLabelClass,
  paperSurfaceClass,
  pixelButtonClass,
} from "@/lib/ui-styles";

type ProjectDraft = Omit<Project, "technologies" | "features"> & {
  technologiesText: string;
  featuresText: string;
};

const emptyProject: ProjectDraft = {
  id: "",
  slug: "",
  title: "",
  summary: "",
  problem: "",
  solution: "",
  role: "Desenvolvedor Full Stack",
  technologiesText: "",
  featuresText: "",
  live_url: null,
  repository_url: null,
  thumbnail_url: null,
  status: "draft",
  featured: true,
  display_order: 1,
};

export function AdminDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }
    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!admin) {
      setError("Esta conta não possui permissão administrativa.");
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true });
    if (queryError) setError("Não foi possível carregar os projetos.");
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProjects(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadProjects]);

  function editProject(project: Project) {
    setDraft({
      ...project,
      technologiesText: project.technologies.join(", "),
      featuresText: project.features.join("\n"),
    });
    setCover(null);
    setMessage(null);
    setError(null);
  }

  function createProject() {
    setDraft({ ...emptyProject, display_order: projects.length + 1 });
    setCover(null);
    setMessage(null);
    setError(null);
  }

  function updateField<K extends keyof ProjectDraft>(field: K, value: ProjectDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveProject(event: { preventDefault: () => void }, forcedStatus?: ProjectStatus) {
    event.preventDefault();
    if (!draft) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const id = draft.id || crypto.randomUUID();
    let thumbnailUrl = draft.thumbnail_url;
    if (cover) {
      const safeName = cover.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const path = `projects/${id}/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from("project-media").upload(path, cover, { upsert: true });
      if (upload.error) {
        setError("Não foi possível enviar a imagem de capa.");
        setSaving(false);
        return;
      }
      thumbnailUrl = supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
    }

    const payload: Project = {
      id,
      slug: draft.slug || slugify(draft.title),
      title: draft.title,
      summary: draft.summary,
      problem: draft.problem,
      solution: draft.solution,
      role: draft.role,
      technologies: draft.technologiesText.split(",").map((item) => item.trim()).filter(Boolean),
      features: draft.featuresText.split("\n").map((item) => item.trim()).filter(Boolean),
      live_url: draft.live_url || null,
      repository_url: draft.repository_url || null,
      thumbnail_url: thumbnailUrl,
      status: forcedStatus ?? draft.status,
      featured: draft.featured,
      display_order: Number(draft.display_order),
    };

    const result = await supabase.from("projects").upsert(payload);
    if (result.error) setError("Não foi possível salvar o projeto.");
    else {
      setMessage(forcedStatus === "published" ? "Projeto publicado com sucesso." : "Projeto salvo com sucesso.");
      setDraft(null);
      await loadProjects();
    }
    setSaving(false);
  }

  async function archiveProject(project: Project) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("projects").update({ status: "archived" }).eq("id", project.id);
    await loadProjects();
  }

  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace("/admin/login");
  }

  if (!isSupabaseConfigured) {
    return (
      <main className={adminPageClass}>
        <section className={`${paperSurfaceClass} w-[min(540px,94vw)] border-[12px] p-[clamp(1.2rem,4vw,2.3rem)] outline-5 outline-[#52291d]`}>
          <h1 className="mt-0">Admin pronto para o Supabase</h1>
          <p>Configure as variáveis de ambiente para ativar autenticação, banco e upload de capas.</p>
          <a href="/admin/login" className={pixelButtonClass}>Ver tela de login</a>
        </section>
      </main>
    );
  }

  if (loading) return <main className={`${adminPageClass} grid place-items-center font-black text-[#fff3c9]`}>Abrindo o mural de projetos...</main>;

  return (
    <main className={adminPageClass}>
      <header className={`${paperSurfaceClass} mx-auto mb-5 flex max-w-[1320px] items-center justify-between gap-4 border-[6px] p-4 shadow-[inset_0_0_0_3px_#d58a48,0_7px_0_rgba(48,23,14,.45)] max-[720px]:flex-col max-[720px]:items-start`}>
        <div><p className="mb-1 text-xs font-black uppercase text-[#8e502e]">Painel do portfólio</p><h1 className="text-[#65331f]">Mural de projetos</h1></div>
        <div className="flex flex-wrap gap-2.5">
          <button className={adminActionClass} type="button" onClick={createProject}><Plus /> Nova missão</button>
          <button className={adminActionClass} type="button" onClick={signOut}><LogOut /> Sair</button>
        </div>
      </header>

      {error && <p className="mx-auto mb-4 max-w-[1320px] border-[3px] border-[#7b231e] bg-[#f4b9a8] p-3 font-black text-[#7b231e]" role="alert">{error}</p>}
      {message && <p className="mx-auto mb-4 max-w-[1320px] border-[3px] border-[#28552c] bg-[#cfe5aa] p-3 font-black text-[#28552c]" role="status">{message}</p>}

      <section className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4">
        <div className="grid content-start grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 max-[720px]:grid-cols-1">
          {projects.length === 0 ? (
            <div className={`${paperSurfaceClass} p-8 text-center font-black`}>Nenhuma missão registrada. Cadastre seu primeiro projeto.</div>
          ) : projects.map((project) => (
            <motion.article key={project.id} layout className={`${paperSurfaceClass} grid grid-cols-[88px_1fr] gap-3.5 p-3.5`}>
              <div className="grid size-[88px] place-items-center border-[3px] border-[#2d1814] bg-[#4b7151] bg-cover bg-center text-[1.4rem] font-black text-[#fff0bc]" style={project.thumbnail_url ? { backgroundImage: `url(${project.thumbnail_url})` } : undefined}>
                {!project.thumbnail_url && project.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className={statusBadgeClass(project.status)}>{project.status}</span>
                <h2 className="my-1 text-[1.05rem] text-[#643722]">{project.title}</h2>
                <p className="text-[.8rem] leading-[1.4]">{project.summary}</p>
              </div>
              <div className="col-span-full flex flex-wrap gap-2 border-t-2 border-dashed border-[rgba(91,47,27,.35)] pt-3">
                <button className={adminActionClass} type="button" onClick={() => editProject(project)}><FilePenLine /> Editar</button>
                {project.live_url && <a className={adminActionClass} href={project.live_url} target="_blank" rel="noreferrer"><Eye /> Ver</a>}
                <button className={adminActionClass} type="button" onClick={() => archiveProject(project)}><Archive /> Arquivar</button>
              </div>
            </motion.article>
          ))}
        </div>

        {draft && (
          <motion.form
            className="fixed inset-y-4 right-4 z-80 w-[min(660px,calc(100vw-2rem))] overflow-y-auto border-8 border-[#52291d] bg-[#f6d99c] p-5 shadow-[inset_0_0_0_4px_#ffedbd,-12px_0_0_rgba(44,20,12,.28)] max-[720px]:inset-2 max-[720px]:w-[calc(100vw-1rem)]"
            onSubmit={(event) => saveProject(event)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between gap-4 border-b-[3px] border-dashed border-[rgba(91,47,27,.4)] pb-3">
              <div><p className="mb-1 text-xs font-black uppercase text-[#8e502e]">Editor de missão</p><h2 className="text-[#65331f]">{draft.id ? "Editar projeto" : "Novo projeto"}</h2></div>
              <button className="grid size-[38px] place-items-center border-[3px] border-[#2d1814] bg-[#52291d] text-[1.4rem] text-[#fff1c4]" type="button" onClick={() => setDraft(null)} aria-label="Fechar editor">×</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1">
              <label className={formLabelClass}>Título<input className={formControlClass} value={draft.title} onChange={(event) => { updateField("title", event.target.value); if (!draft.id) updateField("slug", slugify(event.target.value)); }} required /></label>
              <label className={formLabelClass}>Slug<input className={formControlClass} value={draft.slug} onChange={(event) => updateField("slug", slugify(event.target.value))} required /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Resumo<textarea className={formControlClass} value={draft.summary} onChange={(event) => updateField("summary", event.target.value)} required rows={3} /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Problema<textarea className={formControlClass} value={draft.problem} onChange={(event) => updateField("problem", event.target.value)} rows={3} /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Solução e participação<textarea className={formControlClass} value={draft.solution} onChange={(event) => updateField("solution", event.target.value)} required rows={4} /></label>
              <label className={formLabelClass}>Função<input className={formControlClass} value={draft.role} onChange={(event) => updateField("role", event.target.value)} /></label>
              <label className={formLabelClass}>Ordem<input className={formControlClass} type="number" min="1" value={draft.display_order} onChange={(event) => updateField("display_order", Number(event.target.value))} /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Tecnologias, separadas por vírgula<input className={formControlClass} value={draft.technologiesText} onChange={(event) => updateField("technologiesText", event.target.value)} /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Funcionalidades, uma por linha<textarea className={formControlClass} value={draft.featuresText} onChange={(event) => updateField("featuresText", event.target.value)} rows={4} /></label>
              <label className={formLabelClass}>Link publicado<input className={formControlClass} type="url" value={draft.live_url ?? ""} onChange={(event) => updateField("live_url", event.target.value)} /></label>
              <label className={formLabelClass}>Repositório<input className={formControlClass} type="url" value={draft.repository_url ?? ""} onChange={(event) => updateField("repository_url", event.target.value)} /></label>
              <label className={`${formLabelClass} col-span-2 max-[720px]:col-span-1`}>Imagem de capa<input className={formControlClass} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCover(event.target.files?.[0] ?? null)} /></label>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2.5">
              <button className={adminActionClass} type="submit" disabled={saving}><Save /> {saving ? "Salvando..." : "Salvar rascunho"}</button>
              <button className={`${adminActionClass} bg-[#4d7541]`} type="button" disabled={saving} onClick={(event) => void saveProject(event, "published")}><Send /> Publicar</button>
            </div>
          </motion.form>
        )}
      </section>
    </main>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function statusBadgeClass(status: ProjectStatus) {
  const statusClass = {
    published: "border-[#396940] bg-[#d6e9b5] text-[#28562e]",
    draft: "border-[#846229] bg-[#f1d88e] text-[#684b20]",
    archived: "border-[#6e443a] bg-[#d6bbb0] text-[#603a31]",
  }[status];
  return `inline-flex border-2 px-1.5 py-0.5 text-[.68rem] font-black uppercase ${statusClass}`;
}
