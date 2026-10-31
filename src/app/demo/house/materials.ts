import * as THREE from "three";

export type Part = "building" | "roof" | "glass" | "site";

// The source has no image textures. Small, repeatable surface maps add grain
// without additional network requests or changes to the original GLB.
export function surfaceTexture(kind: "plaster" | "wood" | "roof" | "grass") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(256, 256);
  let seed = 137;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      let value = 220 + (seed / 4294967296 - .5) * 24;
      if (kind === "wood") value = 192 + Math.sin(x * .36 + Math.sin(y * .04)) * 14 + (seed % 13);
      if (kind === "roof") value = x % 64 < 3 ? 125 : 216 + (seed % 12);
      if (kind === "grass") value = 180 + (seed % 65);
      const i = (y * 256 + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "roof" ? 3 : 5, kind === "roof" ? 3 : 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function prepareMaterials(root: THREE.Object3D) {
  const textures = {
    plaster: surfaceTexture("plaster"), wood: surfaceTexture("wood"),
    roof: surfaceTexture("roof"), grass: surfaceTexture("grass"),
  };
  const created = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  const luminous: THREE.MeshStandardMaterial[] = [];
  const parts: { mesh: THREE.Mesh; part: Part; original: THREE.Material | THREE.Material[] }[] = [];
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const names = source.map(m => m.name.toLowerCase());
    let part: Part = "building";
    if (names.some(n => /grass|ground mud|pavement|front concrete|^bricks$/.test(n))) part = "site";
    else if (names.some(n => /roof/.test(n)) || /top2/i.test(object.name + object.parent?.name)) part = "roof";
    else if (names.some(n => /low-dispersion|wp_/.test(n))) part = "glass";
    const materials = source.map(original => {
      if (created.has(original)) return created.get(original)!;
      const name = original.name.toLowerCase();
      const mat = new THREE.MeshStandardMaterial({ color: "#d9d9d1", roughness: .78, side: THREE.DoubleSide });
      mat.name = original.name;
      if (/concrete|lambert|roof bot/.test(name)) {
        mat.color.set("#e1e1d9"); mat.map = textures.plaster; mat.bumpMap = textures.plaster; mat.bumpScale = .015;
      } else if (/wood/.test(name)) {
        mat.color.set("#806148"); mat.map = textures.wood; mat.roughness = .65;
      } else if (/blue clay/.test(name)) {
        mat.color.set("#3a4444"); mat.map = textures.roof; mat.bumpMap = textures.roof; mat.bumpScale = .02; mat.metalness = .35; mat.roughness = .43;
      } else if (/low-dispersion/.test(name)) {
        mat.color.set("#8daeb3"); mat.metalness = .65; mat.roughness = .12; mat.transparent = true; mat.opacity = .42; mat.depthWrite = false;
      } else if (/wp_/.test(name)) {
        mat.color.set("#53635f"); mat.roughness = .9; mat.emissive.set("#ffb65c"); luminous.push(mat);
      } else if (/decorative glass/.test(name)) {
        mat.color.set("#f3dec0"); mat.emissive.set("#ffd29c"); luminous.push(mat);
      } else if (/steel|metal|rubber|foam|material #28/.test(name)) {
        mat.color.set("#303b3b"); mat.metalness = .6; mat.roughness = .4;
      } else if (/grass/.test(name)) {
        mat.color.set("#657d55"); mat.map = textures.grass;
      } else if (/ground mud/.test(name)) {
        mat.color.set("#6a6859"); mat.map = textures.plaster;
      } else if (/marb/.test(name)) {
        mat.color.set("#475154"); mat.roughness = .35;
      } else if (/pavement|bricks|mosaic|front concrete|dry concrete/.test(name)) {
        mat.color.set("#a0a39b"); mat.map = textures.plaster;
      }
      created.set(original, mat);
      return mat;
    });
    object.material = materials.length === 1 ? materials[0] : materials;
    object.castShadow = part !== "site" && part !== "glass";
    object.receiveShadow = true;
    parts.push({ mesh: object, part, original: object.material });
  });
  for (const mat of created.keys()) mat.dispose();
  return { parts, luminous, textures: Object.values(textures) };
}
