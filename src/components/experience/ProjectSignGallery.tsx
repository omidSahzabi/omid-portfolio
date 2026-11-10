import { projectWork } from "@/lib/portfolio";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { ProjectSignContent } from "../SignContent";
import { WorldSign } from "./WorldSign";

// Forward travel is -Z, so the cat's right is +X. The existing restaurant
// wall is centered at X=6.4, thickness .28: its room-facing surface is X=6.26.
// Two spaced pairs sit below its 2.6-unit top, clear of the -16.2 doorway.
const wallZ = [-5.2, -8, -11.8, -14.5];

export function ProjectSignGallery({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group name="restaurant-project-gallery">{projectWork.map((project, index) => <WorldSign key={project.id} name={`project-sign-${project.id}`} state={state} position={[6.245, 1.95, wallZ[index]]} rotation={-Math.PI / 2} width={1.6} height={0.92} from={0.13} to={0.425} poster>
    <ProjectSignContent project={project} index={index} />
  </WorldSign>)}</group>;
}
