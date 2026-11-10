import { CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, Shape, SphereGeometry, TubeGeometry, Vector2, Vector3 } from "three";

// Original rounded-square head sculpt: fuller cheeks, tapered crown, flattened face.
// Geometry is baked once; no per-frame deformation or downloaded character assets.
export function createCatHead() {
  const geometry = new SphereGeometry(1, 40, 28);
  const vertices = geometry.attributes.position;
  const rounded = (value: number, power: number) => Math.sign(value) * Math.pow(Math.abs(value), power);
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    vertices.setXYZ(i, rounded(x, 0.82) * 0.55 * (1 - y * 0.07), rounded(y, 0.87) * 0.42, rounded(z, 0.83) * 0.39);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createCatBody() {
  return new LatheGeometry([
    [0, 0], [0.2, 0.015], [0.32, 0.1], [0.37, 0.27], [0.35, 0.47], [0.29, 0.66], [0.2, 0.8], [0, 0.85],
  ].map(([x, y]) => new Vector2(x, y)), 32);
}

export function createCatEar() {
  const shape = new Shape();
  shape.moveTo(-0.19, 0);
  shape.quadraticCurveTo(-0.22, 0.21, -0.16, 0.42);
  shape.quadraticCurveTo(-0.14, 0.49, -0.09, 0.43);
  shape.lineTo(0.18, 0.07);
  shape.quadraticCurveTo(0.22, -0.04, -0.19, 0);
  return new ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 10 });
}

export function createAlmondEye() {
  const shape = new Shape();
  shape.moveTo(-0.17, -0.01);
  shape.bezierCurveTo(-0.18, 0.18, 0.1, 0.22, 0.17, 0.06);
  shape.bezierCurveTo(0.21, -0.12, -0.11, -0.17, -0.17, -0.01);
  return new ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.012, curveSegments: 16 });
}

export function createCurledTail() {
  const path = new CatmullRomCurve3([
    [0, 0, 0], [0.2, 0.02, -0.23], [0.53, 0.16, -0.44], [0.67, 0.47, -0.46], [0.52, 0.68, -0.39], [0.35, 0.59, -0.33],
  ].map(([x, y, z]) => new Vector3(x, y, z)));
  const geometry = new TubeGeometry(path, 40, 0.095, 8, false);
  const vertices = geometry.attributes.position;
  const center = new Vector3();
  for (let ring = 0; ring <= 40; ring++) {
    path.getPointAt(ring / 40, center);
    const taper = 1 - Math.pow(ring / 40, 3) * 0.75;
    for (let side = 0; side <= 8; side++) {
      const i = ring * 9 + side;
      vertices.setXYZ(i, center.x + (vertices.getX(i) - center.x) * taper, center.y + (vertices.getY(i) - center.y) * taper, center.z + (vertices.getZ(i) - center.z) * taper);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createSmile(side: number) {
  return new TubeGeometry(new CatmullRomCurve3([new Vector3(0, -0.125, 0.438), new Vector3(side * 0.045, -0.175, 0.443), new Vector3(side * 0.105, -0.15, 0.427)]), 12, 0.009, 5, false);
}
