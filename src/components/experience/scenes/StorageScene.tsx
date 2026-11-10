import { useEffect, useMemo } from "react";
import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshStandardMaterial } from "three";
import { Block, DetailBatch, type DetailBlock, TileFloor } from "./Primitives";

const storageDetails: DetailBlock[] = [];
for (const side of [-1, 1]) for (let shelf = 0; shelf < 3; shelf++) for (let row = 0; row < 12; row++) {
  // Consistent shelf-facing labels and a category bar per shelf.
  storageDetails.push({ at: [side * 4.265, 0.62 + shelf * 1.2, -28.8 - row * 0.75], size: [0.02, 0.115, 0.3], color: ["#ac8bc5", "#8e70ab", "#c4a5db"][shelf] });
}
for (const x of [-2.95, 2.95]) {
  for (const y of [0.14, 0.38, 0.62]) storageDetails.push({ at: [x, y, -37.25], size: [1.15, 0.15, 0.82], color: "#604476" });
  for (const dx of [-0.48, 0.48]) storageDetails.push({ at: [x + dx, 0.4, -37.25], size: [0.1, 0.85, 0.86], color: "#7b598f" });
}

function Containers() {
  const boxes = useMemo(() => {
    const mesh = new InstancedMesh(new BoxGeometry(0.65, 0.68, 0.7), new MeshStandardMaterial({ roughness: 0.85 }), 72);
    const matrix = new Matrix4();
    const shades = ["#644285", "#47305f", "#362449", "#7853a0"];
    let i = 0;
    for (const x of [-4.6, 4.6]) for (let shelf = 0; shelf < 3; shelf++) for (let row = 0; row < 12; row++) {
      matrix.makeTranslation(x, 0.6 + shelf * 1.2, -28.8 - row * 0.75);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, new Color(shades[(row + shelf) % shades.length]));
      i++;
    }
    mesh.castShadow = true;
    return mesh;
  }, []);
  useEffect(() => () => { boxes.geometry.dispose(); (boxes.material as MeshStandardMaterial).dispose(); }, [boxes]);
  return <primitive object={boxes} dispose={null} />;
}

export function StorageScene() {
  return <group>
    <TileFloor z={-33.4} length={12} />
    {[-4.6, 4.6].map(x => <group key={x}>
      {[0.2, 1.4, 2.6, 3.8].map(y => <Block key={y} at={[x, y, -33]} size={[1.6, 0.12, 10]} color="#3d2b50" />)}
      {[-28, -33, -38].flatMap(z => [-0.8, 0.8].map(dx => <Block key={`${z}-${dx}`} at={[x + dx, 2, z]} size={[0.085, 4, 0.085]} color="#69478a" />))}
    </group>)}
    <Containers />
    <DetailBatch items={storageDetails} />
    <Block at={[0, 4.8, -33]} size={[0.07, 0.04, 9]} color="#8b5cf6" glow />
  </group>;
}
