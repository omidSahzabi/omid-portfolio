import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, type Group, type Mesh, type PointLight, type Points, type PointsMaterial, type ShaderMaterial } from "three";
import type { NarrativeState } from "@/lib/experience/narrativeTimeline";
import { finaleState } from "@/lib/experience/finaleTimeline";

const vertexShader = "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";
const fragmentShader = `
  varying vec2 vUv;
  uniform float uReveal;
  uniform float uProgress;
  void main(){
    vec2 p=vec2((vUv.x-.5)*4.1,vUv.y*4.6);
    float arch=1.-smoothstep(1.8,1.94,length(vec2(p.x,max(0.,p.y-2.4))));
    vec2 q=vec2(p.x,(p.y-2.15)*.68);
    float r=length(q);
    float depth=exp(-r*r*1.35);
    float rings=pow(.5+.5*sin(r*13.-uProgress*4.),12.)*.075;
    vec3 navy=mix(vec3(.008,.024,.065),vec3(.025,.105,.23),depth);
    vec3 violet=vec3(.13,.045,.28)*exp(-pow(r-1.48,2.)*18.);
    gl_FragColor=vec4(navy+violet+rings*vec3(.09,.12,.2),arch*uReveal*.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const floorShader = `
  varying vec2 vUv; uniform float uReveal;
  void main(){
    float d=length((vUv-.5)*vec2(1.,1.4));
    float a=(1.-smoothstep(.02,.48,d))*.36*uReveal;
    gl_FragColor=vec4(.025,.07,.16,a);
    #include <colorspace_fragment>
  }`;

export function PortalFinale({ state }: { state: React.RefObject<NarrativeState> }) {
  const root = useRef<Group>(null);
  const veil = useRef<Mesh>(null);
  const floor = useRef<Mesh>(null);
  const motes = useRef<Points>(null);
  const light = useRef<PointLight>(null);
  const uniforms = useMemo(() => ({ uReveal: { value: 0 }, uProgress: { value: 0 } }), []);
  const particles = useMemo(() => {
    const data: number[] = [];
    for (let i = 0; i < 36; i++) {
      const x = Math.sin(i * 12.7) * 1.6;
      const y = 0.3 + ((i * 0.618033) % 1) * 3.85;
      if (Math.hypot(x, Math.max(0, y - 2.4)) < 1.75) data.push(x, y, -43.65 + Math.sin(i * 3) * 0.12);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(data, 3));
    return geometry;
  }, []);
  useEffect(() => () => particles.dispose(), [particles]);
  useFrame(() => {
    const finale = finaleState(state.current.progress);
    if (root.current) root.current.visible = finale.atmosphere > 0.0001;
    if (veil.current) {
      const material = veil.current.material as ShaderMaterial;
      material.uniforms.uReveal.value = finale.atmosphere;
      material.uniforms.uProgress.value = finale.progress;
    }
    if (floor.current) (floor.current.material as ShaderMaterial).uniforms.uReveal.value = finale.atmosphere;
    if (motes.current) (motes.current.material as PointsMaterial).opacity = finale.atmosphere * 0.36;
    if (light.current) light.current.intensity = finale.atmosphere * 35;
  });
  return <group ref={root} name="portal-finale-atmosphere" visible={false}>
    <mesh ref={veil} position={[0, 2.3, -43.92]}><planeGeometry args={[4.1, 4.6]} /><shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} /></mesh>
    <mesh ref={floor} position={[0, 0.055, -42.7]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 9]} /><shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={floorShader} transparent depthWrite={false} /></mesh>
    <points ref={motes} geometry={particles}><pointsMaterial color="#b6b4ed" size={0.025} transparent opacity={0} depthWrite={false} /></points>
    <pointLight ref={light} position={[0, 2.2, -42.3]} color="#274d92" intensity={0} distance={8} decay={2} />
  </group>;
}
