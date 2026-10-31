"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Sun, Sunset, Moon, Eye, Grid2X2, RotateCcw, Play, Pause, Plus, Minus, Maximize, Minimize } from "lucide-react";
import { prepareMaterials, type Part } from "./materials";
import styles from "./house.module.css";

type Light = "day" | "sunset" | "night";
type Settings = { light: Light; wire: boolean; rotate: boolean; roof: boolean; glass: boolean; site: boolean };
type ViewerApi = { reset: () => void; zoom: (factor: number) => void; apply: (settings: Settings) => void };

const LIGHTS = {
  day: { background: "#e8eceb", ground: "#d3dad4", sky: "#d9eafa", sun: "#fff2dd", sunPower: 3, ambient: 1.15, environment: .45, glow: 0, elevation: 18 },
  sunset: { background: "#d9d7d2", ground: "#b9bdb3", sky: "#e0e6ed", sun: "#ffbf80", sunPower: 2.7, ambient: .8, environment: .35, glow: .2, elevation: 7 },
  night: { background: "#20292d", ground: "#323e3c", sky: "#9bbacd", sun: "#b9d7eb", sunPower: .5, ambient: .35, environment: .15, glow: .7, elevation: 18 },
};

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of ([] as THREE.Material[]).concat(object.material)) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export default function ModelViewer() {
  const stageRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);
  const [settings, setSettings] = useState<Settings>({ light: "day", wire: false, rotate: false, roof: true, glass: true, site: true });
  const settingsRef = useRef(settings);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    settingsRef.current = settings;
    apiRef.current?.apply(settings);
  }, [settings]);

  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled);
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const mount = mountRef.current!;
    setReady(false); setError(""); setProgress(0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setError("Не удалось запустить 3D. Проверьте поддержку WebGL в браузере.");
      return;
    }
    let disposed = false;
    let visible = true;
    let loaded = false;
    let model: THREE.Object3D | null = null;
    let prepared: ReturnType<typeof prepareMaterials> | null = null;
    let lightMode: Light = settingsRef.current.light;
    let raf = 0;
    let lastTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(LIGHTS[lightMode].background);
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "3D-модель дома");
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.enablePan = false;
    controls.minPolarAngle = .15;
    controls.maxPolarAngle = Math.PI / 2 - .02;
    controls.autoRotateSpeed = .65;
    controls.target.set(0, 1.7, 0);

    const sky = new THREE.HemisphereLight(LIGHTS.day.sky, "#9b9f8d", 2);
    const sun = new THREE.DirectionalLight(LIGHTS.day.sun, 3.3);
    sun.position.set(-12, 18, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -14;
    sun.shadow.camera.right = sun.shadow.camera.top = 14;
    sun.shadow.camera.far = 90;
    sun.shadow.normalBias = .035;
    sun.shadow.bias = -.00008;
    const bounce = new THREE.DirectionalLight("#c5dbe5", .5);
    bounce.position.set(8, 7, -12);
    scene.add(sky, sun, bounce);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: LIGHTS.day.ground, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.06;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.fog = new THREE.Fog(LIGHTS.day.background, 60, 180);

    const wireMaterial = new THREE.MeshBasicMaterial({ color: "#38584f", wireframe: true });
    const nightLamps: THREE.PointLight[] = [];
    let modelSize = new THREE.Vector3(10, 4, 12);
    const reset = () => {
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const radius = Math.hypot(modelSize.x, modelSize.y, modelSize.z) * .5;
      const limitingFov = Math.atan(Math.tan(halfFov) * Math.min(camera.aspect, 1));
      const distance = radius / Math.sin(limitingFov) * 1.08;
      controls.target.set(0, modelSize.y * .34, 0);
      camera.position.copy(controls.target).add(new THREE.Vector3(-.85, .48, 1).normalize().multiplyScalar(distance));
      controls.minDistance = radius * .65;
      controls.maxDistance = distance * 2.2;
      controls.update();
    };
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      reset();
    };
    const apply = (next: Settings) => {
      lightMode = next.light;
      controls.autoRotate = next.rotate;
      for (const entry of prepared?.parts || []) {
        entry.mesh.visible = entry.part === "building" || next[entry.part];
        entry.mesh.material = next.wire && entry.part !== "site" ? wireMaterial : entry.original;
      }
    };
    apiRef.current = {
      reset,
      apply,
      zoom: factor => {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
    intersection.observe(mount);

    const draco = new DRACOLoader();
    draco.setDecoderPath("/models/draco/");
    draco.setWorkerLimit(2);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    loader.load("/models/exterior-preview.glb", gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      model = gltf.scene;
      prepared = prepareMaterials(model);
      model.updateMatrixWorld(true);
      // Fit the building, not the source's much larger lawn and access road.
      const bounds = new THREE.Box3();
      for (const { mesh, part } of prepared.parts) {
        if (part !== "site") bounds.union(new THREE.Box3().setFromObject(mesh));
      }
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 12 / Math.max(size.x, size.z);
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.scale.setScalar(scale);
      pivot.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      scene.add(pivot);
      pivot.updateMatrixWorld(true);
      modelSize = size.multiplyScalar(scale);
      for (const entry of prepared.parts) {
        const material = ([] as THREE.Material[]).concat(entry.original)[0];
        if (!/Decorative glass/i.test(material.name)) continue;
        const position = new THREE.Box3().setFromObject(entry.mesh).getCenter(new THREE.Vector3());
        const lamp = new THREE.PointLight("#ffd5a2", 0, 4, 2);
        lamp.position.copy(position).add(new THREE.Vector3(0, -.08, .2));
        scene.add(lamp); nightLamps.push(lamp);
      }
      apply(settingsRef.current);
      reset();
      renderer.render(scene, camera);
      loaded = true;
      setProgress(100); setReady(true);
    }, event => {
      if (!disposed && event.total) setProgress(Math.min(95, Math.round(event.loaded / event.total * 95)));
    }, cause => {
      console.error("House preview load failed", cause);
      if (!disposed) setError("Не удалось загрузить модель. Попробуйте ещё раз.");
    });

    const targetBackground = new THREE.Color();
    const targetGround = new THREE.Color();
    const targetSky = new THREE.Color();
    const targetSun = new THREE.Color();
    const animate = (time: number) => {
      raf = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, .05);
      lastTime = time;
      if (!visible || document.hidden || !loaded) return;
      const t = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 5);
      const target = LIGHTS[lightMode];
      (scene.background as THREE.Color).lerp(targetBackground.set(target.background), t);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      floorMaterial.color.lerp(targetGround.set(target.ground), t);
      sky.color.lerp(targetSky.set(target.sky), t);
      sun.color.lerp(targetSun.set(target.sun), t);
      sky.intensity = THREE.MathUtils.lerp(sky.intensity, target.ambient, t);
      sun.intensity = THREE.MathUtils.lerp(sun.intensity, target.sunPower, t);
      sun.position.y = THREE.MathUtils.lerp(sun.position.y, target.elevation, t);
      scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity, target.environment, t);
      for (const mat of prepared?.luminous || []) mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target.glow, t);
      for (const lamp of nightLamps) lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, target.glow * 7, t);
      controls.update(delta);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);
    const lost = (event: Event) => {
      event.preventDefault();
      setError("3D-сеанс прерван. Перезапустите просмотр.");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect(); intersection.disconnect();
      controls.dispose(); draco.dispose();
      apiRef.current = null;
      for (const entry of prepared?.parts || []) entry.mesh.material = entry.original;
      prepared?.textures.forEach(texture => texture.dispose());
      disposeObject(scene); wireMaterial.dispose(); environment.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(previous => ({ ...previous, [key]: value }));
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch { setCanFullscreen(false); }
  };

  return (
    <section ref={stageRef} className={styles.stage} aria-label="Просмотр дома" data-ready={ready}>
      <div ref={mountRef} className={styles.canvas} />
      <div className={styles.topbar}>
        <div className={styles.segment} role="group" aria-label="Отображение модели">
          <button type="button" aria-pressed={!settings.wire} onClick={() => set("wire", false)}><Eye size={16} />Фасад</button>
          <button type="button" aria-pressed={settings.wire} onClick={() => set("wire", true)}><Grid2X2 size={16} />Сетка</button>
        </div>
        <div className={styles.segment} role="group" aria-label="Освещение">
          {([{ value: "day", title: "День", Icon: Sun }, { value: "sunset", title: "Вечер", Icon: Sunset }, { value: "night", title: "Ночь", Icon: Moon }] as const).map(({ value, title, Icon }) => (
            <button type="button" key={value} aria-pressed={settings.light === value} onClick={() => set("light", value)}><Icon size={16} />{title}</button>
          ))}
        </div>
      </div>
      <div className={styles.layers} role="group" aria-label="Части здания">
        {([{ value: "roof", title: "Кровля" }, { value: "glass", title: "Остекление" }, { value: "site", title: "Участок" }] as { value: Exclude<Part, "building">; title: string }[]).map(({ value, title }) => (
          <label key={value}><input type="checkbox" checked={settings[value]} onChange={event => set(value, event.target.checked)} />{title}</label>
        ))}
      </div>
      <div className={styles.bottom}>
        <div className={styles.caption}><p>Тестовая модель</p><h2>Exterior home design</h2></div>
        <div className={styles.tools}>
          <button type="button" title={settings.rotate ? "Остановить облёт" : "Автооблёт"} aria-label={settings.rotate ? "Остановить облёт" : "Автооблёт"} aria-pressed={settings.rotate} onClick={() => set("rotate", !settings.rotate)}>{settings.rotate ? <Pause size={17} /> : <Play size={17} />}</button>
          <button type="button" title="Приблизить" aria-label="Приблизить" onClick={() => apiRef.current?.zoom(.8)}><Plus size={17} /></button>
          <button type="button" title="Отдалить" aria-label="Отдалить" onClick={() => apiRef.current?.zoom(1.25)}><Minus size={17} /></button>
          <button type="button" title="Исходный ракурс" aria-label="Исходный ракурс" onClick={() => apiRef.current?.reset()}><RotateCcw size={17} /></button>
          {canFullscreen && <button type="button" title={fullscreen ? "Свернуть" : "На весь экран"} aria-label={fullscreen ? "Свернуть" : "На весь экран"} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}</button>}
        </div>
      </div>
      {(!ready || error) && <div className={styles.status} role="status" aria-live="polite">
        <p>{error || (progress >= 95 ? "Подготовка модели…" : `Загрузка модели · ${progress}%`)}</p>
        {error ? <button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить</button> : <progress aria-label="Загрузка модели" max={100} value={progress} />}
      </div>}
    </section>
  );
}
