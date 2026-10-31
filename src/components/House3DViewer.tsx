"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  Compass, 
  Sun, 
  Sunset, 
  Moon, 
  Layers, 
  Eye, 
  RotateCcw, 
  Maximize2,
  Info,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from "lucide-react";

type ViewMode = "exterior" | "structure" | "blueprint";
type LightingMode = "day" | "sunset" | "night";

interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  position: [number, number, number];
  description: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "seismic",
    title: "Монолитный каркас 9 баллов",
    subtitle: "СП 14.13330.2018 Сейсмика Крыма",
    position: [-2.8, 1.8, 2.2],
    description: "Пространственная рамно-связевая система из монолитного железобетона марки B25/B30 с армированием А500С. Гарантирует абсолютную безопасность на оползневых и сейсмических участках ЮБК."
  },
  {
    id: "glazing",
    title: "Панорамное остекление",
    subtitle: "Теплый алюминий и солнцезащита",
    position: [0.5, 1.4, 3.2],
    description: "Размер, профиль и стеклопакет подбираются под проект, бюджет, ветровые нагрузки и ориентацию фасада по солнцу."
  },
  {
    id: "pool",
    title: "Инфинити-бассейн с подогревом",
    subtitle: "Монолитная чаша на скальном основании",
    position: [2.8, 0.4, 3.6],
    description: "Каскадная чаша с переливом в горизонт, интегрированная в общую фундаментную плиту дома с противооползневыми микросваями."
  },
  {
    id: "roof",
    title: "Эксплуатируемая видовая кровля",
    subtitle: "Инверсионная гидроизоляция Технониколь",
    position: [-0.6, 3.8, -0.4],
    description: "Лаунж-терраса с настилом из термоясеня, зоной барбекю и перголой с ветрозащитой до 35 м/с."
  }
];

export default function House3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("exterior");
  const [lightingMode, setLightingMode] = useState<LightingMode>("sunset");
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [loading3D, setLoading3D] = useState(true);
  const [shouldInitialize, setShouldInitialize] = useState(false);
  const invalidateRef = useRef<(() => void) | null>(null);
  const autoRotateWantedRef = useRef(true);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const structureGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldInitialize(true);
      observer.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldInitialize) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    let framingScale = Math.max(1, 1.2 / (width / height));

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(10 * framingScale, 1.5 + 4.5 * framingScale, 12 * framingScale);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Geometry and lights are static during orbit; refresh shadows on mode changes.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
    controls.minDistance = 6;
    controls.maxDistance = 22 * framingScale;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    controls.autoRotate = autoRotateWantedRef.current && !reducedMotion.matches;
    controls.autoRotateSpeed = 1.0;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Build Architectural Scene
    const houseGroup = new THREE.Group();
    const structureGroup = new THREE.Group();
    const lightsGroup = new THREE.Group();

    houseGroupRef.current = houseGroup;
    structureGroupRef.current = structureGroup;
    lightsGroupRef.current = lightsGroup;

    scene.add(houseGroup);
    scene.add(structureGroup);
    scene.add(lightsGroup);

    // Ground / Terrace Platform (Rocky Crimean foundation)
    const groundGeo = new THREE.CylinderGeometry(9.5, 10.5, 0.7, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xd1cbc1,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.35;
    ground.receiveShadow = true;
    houseGroup.add(ground);

    // Grass & Decking accent around the house
    const deckGeo = new THREE.BoxGeometry(8.5, 0.2, 7.5);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x7d664f, // warm thermo-ash wood
      roughness: 0.6,
      metalness: 0.1,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.1;
    deck.receiveShadow = true;
    houseGroup.add(deck);

    // Ground Floor Main Box (White Architectural Concrete & Travertine)
    const groundFloorGeo = new THREE.BoxGeometry(5.8, 2.2, 4.8);
    const wallWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe8ecf2,
      roughness: 0.45,
      metalness: 0.1,
    });
    const groundFloor = new THREE.Mesh(groundFloorGeo, wallWhiteMat);
    groundFloor.position.set(-0.6, 1.2, 0);
    groundFloor.castShadow = true;
    groundFloor.receiveShadow = true;
    houseGroup.add(groundFloor);

    // Accent Wood Siding on First Floor (Crimean Cedar / Thermowood)
    const woodWallGeo = new THREE.BoxGeometry(3.2, 2.22, 4.84);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8a5229,
      roughness: 0.7,
      metalness: 0.05,
    });
    const woodWall = new THREE.Mesh(woodWallGeo, woodMat);
    woodWall.position.set(-1.8, 1.2, 0);
    woodWall.castShadow = true;
    houseGroup.add(woodWall);

    // Cantilever Second Floor (Hi-Tech architectural overhang)
    const upperFloorGeo = new THREE.BoxGeometry(6.4, 2.1, 4.4);
    const graphiteMat = new THREE.MeshStandardMaterial({
      color: 0x687176, // mineral graphite panel
      roughness: 0.35,
      metalness: 0.3,
    });
    const upperFloor = new THREE.Mesh(upperFloorGeo, graphiteMat);
    upperFloor.position.set(0.4, 3.2, 0.2);
    upperFloor.castShadow = true;
    upperFloor.receiveShadow = true;
    houseGroup.add(upperFloor);

    // Panoramic Glass Windows (Reflective & Tinted)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a5f,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      reflectivity: 0.9,
      metalness: 0.1,
    });

    // Lower Panorama
    const lowerGlassGeo = new THREE.BoxGeometry(3.6, 1.7, 0.1);
    const lowerGlass = new THREE.Mesh(lowerGlassGeo, glassMat);
    lowerGlass.position.set(0.6, 1.2, 2.42);
    houseGroup.add(lowerGlass);

    // Upper Panorama
    const upperGlassGeo = new THREE.BoxGeometry(4.2, 1.6, 0.1);
    const upperGlass = new THREE.Mesh(upperGlassGeo, glassMat);
    upperGlass.position.set(0.4, 3.2, 2.42);
    houseGroup.add(upperGlass);

    // Rooftop Terrace Perlite / Glass Balustrade
    const balustradeGeo = new THREE.BoxGeometry(6.3, 0.7, 4.3);
    const balustradeMat = new THREE.MeshPhysicalMaterial({
      color: 0x8ab4f8,
      transmission: 0.92,
      transparent: true,
      roughness: 0.1,
    });
    const balustrade = new THREE.Mesh(balustradeGeo, balustradeMat);
    balustrade.position.set(0.4, 4.4, 0.2);
    houseGroup.add(balustrade);

    // Infinity Swimming Pool
    const poolBorderGeo = new THREE.BoxGeometry(3.4, 0.4, 2.2);
    const poolBorderMat = new THREE.MeshStandardMaterial({
      color: 0x36505d,
      roughness: 0.2,
      metalness: 0.4,
    });
    const poolBorder = new THREE.Mesh(poolBorderGeo, poolBorderMat);
    poolBorder.position.set(2.8, 0.2, 2.2);
    houseGroup.add(poolBorder);

    // Water surface
    const waterGeo = new THREE.PlaneGeometry(3.1, 1.9);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(2.8, 0.38, 2.2);
    houseGroup.add(water);

    // --- STRUCTURE MODE (Monolithic Reinforced Concrete Frame) ---
    // Columns (9 points of seismic resilience)
    const columnGeo = new THREE.BoxGeometry(0.35, 4.5, 0.35);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0xe2b857, // Gold seismic frame
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });

    const columnPositions = [
      [-3.0, 2.2, -2.0],
      [-3.0, 2.2, 2.0],
      [-0.5, 2.2, -2.0],
      [-0.5, 2.2, 2.0],
      [2.2, 2.2, -2.0],
      [2.2, 2.2, 2.0],
      [3.4, 2.2, 0.0],
    ];

    columnPositions.forEach((pos) => {
      const col = new THREE.Mesh(columnGeo, columnMat);
      col.position.set(pos[0], pos[1], pos[2]);
      structureGroup.add(col);
    });

    // Floor slabs & Seismo-Belts (Beams)
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.75,
    });

    const foundationSlab = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 5.6), slabMat);
    foundationSlab.position.set(0, 0.2, 0);
    structureGroup.add(foundationSlab);

    const midSlab = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 5.6), slabMat);
    midSlab.position.set(0.2, 2.3, 0);
    structureGroup.add(midSlab);

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.35, 5.4), slabMat);
    roofSlab.position.set(0.3, 4.3, 0);
    structureGroup.add(roofSlab);

    // By default, hide structure group until toggled
    structureGroup.visible = false;

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    lightsGroup.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(12, 18, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    lightsGroup.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.6);
    fillLight.position.set(-10, 8, -10);
    lightsGroup.add(fillLight);

    // Architectural Night Spotlights inside / under roof
    const nightPoolLight = new THREE.PointLight(0x38bdf8, 3.5, 8);
    nightPoolLight.position.set(2.8, 0.5, 2.2);
    lightsGroup.add(nightPoolLight);

    const interiorWarmLight = new THREE.PointLight(0xfbbf24, 2.5, 9);
    interiorWarmLight.position.set(0, 2.0, 0);
    lightsGroup.add(interiorWarmLight);

    let animationFrameId = 0;
    let visible = false;
    let lastFrameTime = 0;
    const requestRender = () => {
      if (!visible || document.hidden || animationFrameId) return;
      animationFrameId = requestAnimationFrame(animate);
    };
    const animate = (now: number) => {
      animationFrameId = 0;
      if (!visible || document.hidden) return;
      const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 1 / 60;
      lastFrameTime = now;
      const changed = controls.update(delta);
      if (!reducedMotion.matches) water.rotation.z = Math.sin(now * 0.002) * 0.01;
      renderer.render(scene, camera);
      if (!reducedMotion.matches || changed) requestRender();
    };
    const syncVisibility = () => {
      if (visible && !document.hidden) {
        lastFrameTime = 0;
        requestRender();
      } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncVisibility();
    });
    const updateMotion = () => {
      controls.autoRotate = autoRotateWantedRef.current && !reducedMotion.matches;
      requestRender();
    };
    visibilityObserver.observe(container);
    document.addEventListener("visibilitychange", syncVisibility);
    reducedMotion.addEventListener("change", updateMotion);
    controls.addEventListener("change", requestRender);
    invalidateRef.current = requestRender;

    setLoading3D(false);

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      const nextFramingScale = Math.max(1, 1.2 / (w / h));
      camera.position.sub(controls.target).multiplyScalar(nextFramingScale / framingScale).add(controls.target);
      framingScale = nextFramingScale;
      controls.maxDistance = 22 * framingScale;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      reducedMotion.removeEventListener("change", updateMotion);
      cancelAnimationFrame(animationFrameId);
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.add(child.geometry);
        const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
        meshMaterials.forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      sunLight.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      invalidateRef.current = null;
      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
      houseGroupRef.current = null;
      structureGroupRef.current = null;
      lightsGroupRef.current = null;
    };
  }, [shouldInitialize]);

  // Handle View Mode changes (Exterior vs Monolithic Structure)
  useEffect(() => {
    if (!houseGroupRef.current || !structureGroupRef.current) return;

    if (viewMode === "structure") {
      houseGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 0.15;
          child.material.wireframe = false;
        }
      });
      structureGroupRef.current.visible = true;
    } else if (viewMode === "blueprint") {
      houseGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.wireframe = true;
        }
      });
      structureGroupRef.current.visible = true;
    } else {
      // Exterior standard
      houseGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.wireframe = false;
        }
      });
      structureGroupRef.current.visible = false;
    }
    if (rendererRef.current) rendererRef.current.shadowMap.needsUpdate = true;
    invalidateRef.current?.();
  }, [viewMode, shouldInitialize]);

  // Handle Lighting scenario changes (Day, Sunset Crimea, Night Architectural Light)
  useEffect(() => {
    if (!sceneRef.current || !lightsGroupRef.current || !rendererRef.current) return;

    const ambient = lightsGroupRef.current.children[0] as THREE.AmbientLight;
    const sun = lightsGroupRef.current.children[1] as THREE.DirectionalLight;
    const fill = lightsGroupRef.current.children[2] as THREE.DirectionalLight;
    const poolLight = lightsGroupRef.current.children[3] as THREE.PointLight;
    const interiorLight = lightsGroupRef.current.children[4] as THREE.PointLight;

    if (lightingMode === "day") {
      sceneRef.current.background = new THREE.Color(0xe8e6e1);
      ambient.color.setHex(0xffffff);
      ambient.intensity = 1.2;
      sun.color.setHex(0xffffff);
      sun.intensity = 2.4;
      sun.position.set(12, 18, 10);
      fill.intensity = 0.8;
      poolLight.intensity = 0.5;
      interiorLight.intensity = 0.8;
    } else if (lightingMode === "sunset") {
      // Golden Hour South Coast of Crimea
      sceneRef.current.background = new THREE.Color(0xd8d2c8);
      ambient.color.setHex(0xf97316);
      ambient.intensity = 0.7;
      sun.color.setHex(0xfb923c);
      sun.intensity = 3.0;
      sun.position.set(16, 5, 8); // low sunset angle
      fill.color.setHex(0xa855f7);
      fill.intensity = 0.9;
      poolLight.intensity = 2.0;
      interiorLight.intensity = 2.0;
    } else if (lightingMode === "night") {
      // Midnight luxury illumination
      sceneRef.current.background = new THREE.Color(0xc9cbc8);
      ambient.color.setHex(0x1e293b);
      ambient.intensity = 0.3;
      sun.color.setHex(0x38bdf8);
      sun.intensity = 0.4;
      sun.position.set(-10, 15, -10);
      fill.intensity = 0.2;
      poolLight.intensity = 4.5;
      interiorLight.intensity = 4.0;
    }
    rendererRef.current.shadowMap.needsUpdate = true;
    invalidateRef.current?.();
  }, [lightingMode, shouldInitialize]);

  useEffect(() => {
    autoRotateWantedRef.current = isAutoRotate;
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = isAutoRotate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    invalidateRef.current?.();
  }, [isAutoRotate, shouldInitialize]);

  // Toggle Auto-rotate
  const toggleAutoRotate = () => {
    setIsAutoRotate(current => !current);
  };

  // Reset Camera View
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      const scale = Math.max(1, 1.2 / cameraRef.current.aspect);
      cameraRef.current.position.set(10 * scale, 1.5 + 4.5 * scale, 12 * scale);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  };

  return (
    <section id="3d-explorer" className="concrete-section relative py-24 overflow-hidden border-t border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Посмотрите ключевые узлы в 360°
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mt-3">
              Это концепт-модель для объяснения логики дома: каркас, фасад, остекление, кровля и бассейн. Реальную BIM/3D-модель можно подключить после получения проекта клиента.
            </p>
          </div>

          {/* Controls Bar Quick summary */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
            <button
              onClick={toggleAutoRotate}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isAutoRotate ? "bg-[#8E9BA8] text-[#0a0a0a] font-bold shadow-lg shadow-[#8E9BA8]/20" : "text-slate-300 hover:text-white"
              }`}
            >
              {isAutoRotate ? "Автооблет: Вкл" : "Автооблет: Пауза"}
            </button>
            <button
              onClick={resetCamera}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Сбросить ракурс"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-[640px] rounded-3xl overflow-hidden border border-black/10 bg-[#ddd9d1] shadow-2xl shadow-black/15">
          {/* Three.js Canvas mount container */}
          <div ref={containerRef} aria-busy={loading3D} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Top-Left: View Mode Switcher (Exterior / Structure / Wireframe) */}
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:top-6 sm:left-6 z-20 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">
              Режим отображения:
            </span>
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
              <button
                onClick={() => setViewMode("exterior")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "exterior"
                    ? "bg-[#8E9BA8] text-[#0a0a0a] shadow-md shadow-[#8E9BA8]/20 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Фасад</span>
              </button>

              <button
                onClick={() => setViewMode("structure")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "structure"
                    ? "bg-[#8E9BA8] text-[#0a0a0a] shadow-md shadow-[#8E9BA8]/20 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-inherit" />
                <span>Монолит 9 баллов</span>
              </button>

              <button
                onClick={() => setViewMode("blueprint")}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "blueprint"
                    ? "bg-[#8E9BA8] text-[#0a0a0a] shadow-md shadow-[#8E9BA8]/20 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Чертеж (Сетка)</span>
              </button>
            </div>
          </div>

          {/* Top-Right: Crimean Lighting Scenario Switcher */}
          <div className="absolute top-32 right-4 sm:top-6 sm:right-6 z-20 flex flex-col items-end gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pr-1">
              Сценарий света:
            </span>
            <div className="flex gap-1.5 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
              <button
                onClick={() => setLightingMode("day")}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  lightingMode === "day"
                    ? "bg-white text-slate-950 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Солнечный полдень"
              >
                <Sun className="w-4 h-4" />
                <span className="hidden sm:inline">День</span>
              </button>

              <button
                onClick={() => setLightingMode("sunset")}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  lightingMode === "sunset"
                    ? "bg-gradient-to-r from-orange-500 to-[#C8D0D8] text-white font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Закат на ЮБК"
              >
                <Sunset className="w-4 h-4" />
                <span className="hidden sm:inline">Закат</span>
              </button>

              <button
                onClick={() => setLightingMode("night")}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  lightingMode === "night"
                    ? "bg-[#333333] text-white font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Ночная архитектурная подсветка"
              >
                <Moon className="w-4 h-4" />
                <span className="hidden sm:inline">Ночь</span>
              </button>
            </div>
          </div>

          {/* Interactive Hotspots bar at Bottom-Left */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 z-20 max-w-md">
            <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9BA8] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Ключевые узлы надежности:
                </span>
                <span className="text-[10px] text-slate-400">Нажмите для деталей</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {HOTSPOTS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
                    className={`text-left p-2 rounded-xl text-xs transition-all border ${
                      activeHotspot?.id === h.id
                        ? "bg-[#8E9BA8]/20 border-[#8E9BA8] text-white"
                        : "bg-white/5 border-white/5 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-[11px] truncate">{h.title}</div>
                    <div className="text-[9px] text-slate-400 truncate">{h.subtitle}</div>
                  </button>
                ))}
              </div>

              {/* Active Hotspot Modal / Accordion */}
              {activeHotspot && (
                <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white">{activeHotspot.title}</h4>
                    <button
                      onClick={() => setActiveHotspot(null)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeHotspot.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Right Instruction Badge */}
          <div className="hidden sm:block absolute bottom-6 right-6 z-10 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-slate-400">
              Зажмите левую кнопку для вращения • колесико для зума
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
