import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { ContactBoardContent } from "../SignContent";
import { Block } from "./scenes/Primitives";
import { WorldSign } from "./WorldSign";

export function ContactInformationBoard({ state }: { state: React.RefObject<NarrativeState> }) {
  return <group name="entry-information-wall" position={[-4.3, 0, -0.2]} rotation={[0, -0.55, 0]}>
    <Block at={[0, 1.8, -0.28]} size={[4.6, 3.6, 0.26]} color="#1c1326" />
    <WorldSign name="contact-information-board" state={state} position={[0, 2.05, 0]} width={4.35} height={2.45} from={0} to={0.14}>
      <ContactBoardContent />
    </WorldSign>
  </group>;
}
