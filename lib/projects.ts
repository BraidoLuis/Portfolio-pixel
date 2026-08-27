import { fallbackProjects, type Project } from "@/content/portfolio";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fallbackProjects;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error || !data?.length) return fallbackProjects;
  return data as Project[];
}
