import { useEffect, useRef } from "react";
import { projectWork } from "@/lib/portfolio";
import { CloseIcon } from "./Icons";
import { ContactBoardContent, ProjectSignContent } from "./SignContent";

export type SignSelection = "contact" | number;

export function SignReader({ selection, close }: { selection: SignSelection; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; if (element?.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="sign-reader" aria-label={selection === "contact" ? "Contact information board" : `${projectWork[selection].title} hanging sign`} onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="sign-reader-shell"><div className="sign-reader-heading"><span>IN THE WORLD / A CLOSER LOOK</span><button className="icon-button" aria-label="Close sign" onClick={close}><CloseIcon /></button></div>
      {selection === "contact" ? <ContactBoardContent /> : <ProjectSignContent project={projectWork[selection]} index={selection} />}
      <p className="sign-reader-footnote">Close the sign to continue the journey.</p>
    </div>
  </dialog>;
}
