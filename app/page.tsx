import { PortfolioApp } from "@/components/portfolio/portfolio-app";
import { getPublishedProjects } from "@/lib/projects";

export default function Home() {
  return <PortfolioApp projects={getPublishedProjects()} />;
}
