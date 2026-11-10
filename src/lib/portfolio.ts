export type PortfolioProject = {
  id: string; title: string; category: string; url: string | null; status: "Live" | "Coming Soon";
  image: { src: string; width: number; height: number; alt: string };
};

export const projectWork: PortfolioProject[] = [
  { id: "dreamservice", title: "DreamService", category: "Software Agency", url: "https://dreamservice.net", status: "Live", image: { src: "/images/dreamservice.net.png", width: 1889, height: 860, alt: "DreamService website with an interactive clock and globe" } },
  { id: "hossein", title: "Hossein Portfolio", category: "Personal Portfolio", url: "https://hosseinseyedzade.dreamservice.net/", status: "Live", image: { src: "/images/hosseinseyedzade.dreamservice.net.png", width: 1891, height: 864, alt: "Hossein’s portfolio with his name and orbiting creative tools" } },
  { id: "daniyal", title: "Daniyal Portfolio", category: "Personal Portfolio", url: "https://daniyalbadrlou.dreamservice.net/", status: "Live", image: { src: "/images/httpshosseinseyedzade.dreamservice.net.png", width: 1892, height: 862, alt: "Daniyal’s purple portfolio with the headline Ideas are everywhere" } },
  { id: "mezon", title: "Mezon Shik Pik", category: "Fashion / Boutique", url: null, status: "Coming Soon", image: { src: "/images/mezonshikpik.png", width: 280, height: 437, alt: "Supplied fashion and sewing project preview" } },
];

export const rotatingSkills = ["React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "Tailwind CSS"];

export function projectAt(progress: number) {
  if (progress < 0.215) return 0;
  if (progress < 0.275) return 1;
  if (progress < 0.335) return 2;
  return 3;
}

// Supplied destinations only. Coming Soon projects have no destination.
export const portfolio = {
  name: "Omid Sahzabi",
  email: "omidpanahiyan5700@gmail.com",
  contactUrl: "mailto:omidpanahiyan5700@gmail.com",
  githubUrl: "https://github.com/omidSahzabi",
  dreamServiceUrl: "https://dreamservice.net",
  projects: projectWork,
  character: {
    // Optional licensed GLB override. The default is our original procedural cat.
    // Enable this override only after obtaining the model AND permission for its use.
    authorized: false,
    modelUrl: null as string | null,
    scale: 1,
    // Model faces +Z with its feet at Y=0. Set an offset for other model conventions.
    yawOffset: 0,
    clips: {
      idle: "Idle", play: "Playing", look: "Look", walk: "Walk", run: "Run",
      turn: "Turn", stop: "Stop", follow: "Follow", enter: "EnterPortal",
    },
  },
};


