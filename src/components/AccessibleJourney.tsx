import { chapters } from "@/lib/experience/narrativeTimeline";
import { projectWork } from "@/lib/portfolio";
import { ContactBoardContent, ProjectSignContent } from "./SignContent";
import { FinaleCTA } from "./experience/FinaleCTA";
import { EntertainOctocatButton } from "./game/EntertainOctocatButton";

// The same chapter sequence when motion/WebGL/JavaScript is unavailable.
// No secondary About/Skills/Projects navigation or standalone portfolio page.
export function AccessibleJourney({ reason, onPlay }: { reason?: string; onPlay?: () => void }) {
  return <main className="accessible-journey" id="journey-beginning">
    <p className="eyebrow">A QUIETER JOURNEY</p>{reason && <p className="journey-mode-note">{reason}</p>}
    <h1>Hey, I’m <span>Omid.</span></h1><p className="accessible-intro">{chapters[0].subtitle}</p>
    {onPlay && <EntertainOctocatButton onClick={onPlay} />}
    <div className="accessible-contact-sign"><ContactBoardContent /></div>
    <ol className="accessible-chapters">{chapters.slice(1).map((chapter, index) => <li key={chapter.id}>
      <p className="eyebrow">{chapter.eyebrow}</p><h2>{chapter.title.replace("\n", " ")}</h2><p>{chapter.subtitle}</p><p className="accessible-skill-line">{chapter.detail}</p>
      {index === 0 && <ol className="accessible-sign-sequence" aria-label="The dining room’s hanging signs">{projectWork.map((project, i) => <li key={project.id}><ProjectSignContent project={project} index={i} /></li>)}</ol>}
    </li>)}</ol>
    <FinaleCTA progress={1.32} alwaysVisible />
  </main>;
}
