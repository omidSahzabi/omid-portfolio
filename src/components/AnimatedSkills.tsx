"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { rotatingSkills } from "@/lib/portfolio";

export function AnimatedSkills({ reducedMotion }: { reducedMotion: boolean }) {
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = label.current;
    if (!element) return;
    element.textContent = rotatingSkills[0];
    if (reducedMotion) return;
    let index = 0;
    const timeline = gsap.timeline({ repeat: -1 });
    timeline.to(element, { opacity: 1, duration: 2.5 })
      .to(element, { opacity: 0, y: -4, duration: 0.22, ease: "power2.in" })
      .call(() => { index = (index + 1) % rotatingSkills.length; element.textContent = rotatingSkills[index]; })
      .set(element, { y: 4 })
      .to(element, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" });
    return () => { timeline.kill(); gsap.set(element, { clearProps: "opacity,transform" }); };
  }, [reducedMotion]);
  return <div className="animated-skills" aria-label={`Working with ${rotatingSkills.join(", ")}`}><span className="skills-prefix">WORKING WITH /</span><span ref={label} className="skill-name" aria-hidden="true">React</span><span className="status-dot" aria-hidden="true" /></div>;
}
