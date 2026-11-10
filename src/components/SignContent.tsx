import { portfolio, type PortfolioProject } from "@/lib/portfolio";
import { Arrow } from "./Icons";

export function ContactBoardContent() {
  return <div className="contact-board-content">
    <p className="sign-kicker">FIND ME ONLINE</p>
    <a href={portfolio.contactUrl} className="contact-board-entry"><span>EMAIL</span><strong>{portfolio.email}</strong><Arrow diagonal /></a>
    <a href={portfolio.githubUrl} target="_blank" rel="noopener noreferrer" className="contact-board-entry"><span>GITHUB</span><strong>github.com/omidSahzabi</strong><Arrow diagonal /></a>
    <p className="contact-board-note">~4 years of development · Freelance → Iziran (~2 years, current)</p>
  </div>;
}

export function ProjectSignContent({ project, index }: { project: PortfolioProject; index: number }) {
  const contents = <>
    <div className="project-sign-top"><span>PORTFOLIO WORK / {String(index + 1).padStart(2, "0")}</span><span className={project.url ? "sign-status" : "sign-status coming-soon"}>{project.status}</span></div>
    <div className="project-sign-preview">
      {/* Supplied local screenshots, preserved without cropping or distortion. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={project.image.src} width={project.image.width} height={project.image.height} alt={project.image.alt} decoding="async" loading="lazy" />
    </div>
    <div className="project-sign-caption"><div><h3>{project.title}</h3><p>{project.category}</p></div>{project.url && <Arrow diagonal />}</div>
  </>;
  return project.url ? <a className="project-sign-content" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.title}`}>{contents}</a> : <article className="project-sign-content project-sign-coming" aria-label={`${project.title} — Coming Soon`}>{contents}</article>;
}
