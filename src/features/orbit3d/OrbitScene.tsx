// src/features/orbit3d/OrbitScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

type OrbitSceneProps = {
  speed?: number;
  accent?: string;
  asteroidCount?: number;
  highlights?: number;
  onSelect?: (info: { id: number; speedKms: number; altitudeKm: number }) => void;
};

const OrbitScene = ({
  speed = 1,
  accent = "#0B3D91",
  asteroidCount = 18,
  highlights = 6,
  onSelect,
}: OrbitSceneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const labelRendererRef = useRef<CSS2DRenderer>();
  const rafRef = useRef<number>();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene / camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.08);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Coloca a Terra inteira à vista, centralizada
    camera.position.set(0, 0.8, 8);

    // Renderers
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(5, 2, 3);
    scene.add(sun);

    // --- STARFIELD (leve) ---
    {
      const starGeo = new THREE.BufferGeometry();
      const starCnt = 1200;
      const positions = new Float32Array(starCnt * 3);
      for (let i = 0; i < starCnt * 3; i++) positions[i] = (Math.random() - 0.5) * 200;
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);
    }

    // ===============================
    // REAL EARTH (texturizada)
    // ===============================
    const tex = new THREE.TextureLoader();
    // Ajuste os nomes conforme seus arquivos:
    const tDay    = tex.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
    const tNight  = tex.load("https://threejs.org/examples/textures/planets/earth_lights_2048.png");
    const tBump   = tex.load("https://threejs.org/examples/textures/planets/earth_normal_2048.jpg");
    const tSpec   = tex.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");
    const tClouds = tex.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png");


    [tDay, tNight].forEach(t => (t.colorSpace = THREE.SRGBColorSpace));
    [tDay, tNight, tBump, tSpec, tClouds].forEach(t => (t.anisotropy = 8));

    // Grupo da Terra para facilitar transformações
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Terra (superfície) – usa Map + Specular + Bump
    const earthGeom = new THREE.SphereGeometry(2.2, 64, 64); // raio 2.2 (ajusta o tamanho na tela)
    const earthMat = new THREE.MeshPhongMaterial({
      map: tDay,
      specularMap: tSpec,
      specular: new THREE.Color(0x111111),
      bumpMap: tBump,
      bumpScale: 0.04,
      shininess: 12,
      emissiveMap: tNight, // luzes noturnas
      emissive: new THREE.Color(0x111111),
      emissiveIntensity: 1.0,
    });
    const earth = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earth);

    // Nuvens (levemente maiores, material transparente)
    const cloudsGeom = new THREE.SphereGeometry(2.23, 64, 64);
    const cloudsMat = new THREE.MeshLambertMaterial({
      map: tClouds,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudsGeom, cloudsMat);
    earthGroup.add(clouds);

    // Atmosfera (glow simples, back side)
    const atmoGeom = new THREE.SphereGeometry(2.28, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmo = new THREE.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmo);

    // Centraliza
    earthGroup.position.set(0, 0.1, 0);

    // ===============================
    // ASTERÓIDES (sem linhas/labels)
    // ===============================
    type A = {
      id: number;
      mesh: THREE.Mesh;
      r: number;
      incX: number;
      incZ: number;
      w: number;
      size: number;
      baseSpeed?: number;
    };

    const asteroids: A[] = [];
    const rockGeo = new THREE.IcosahedronGeometry(0.12, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f2a,
      metalness: 0.15,
      roughness: 0.8,
    });

    // Escolhe quais poderão disparar o HUD
    const selectableIds = new Set<number>();
    while (selectableIds.size < Math.min(highlights, asteroidCount)) {
      selectableIds.add(Math.floor(Math.random() * asteroidCount));
    }

    for (let i = 0; i < asteroidCount; i++) {
      const m = new THREE.Mesh(rockGeo, rockMat.clone());
      (m.material as THREE.MeshStandardMaterial).color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      scene.add(m);

      const r = 3.5 + Math.random() * 3.5; // mais distante da Terra realista
      const incX = (Math.random() - 0.5) * 0.6;
      const incZ = (Math.random() - 0.5) * 0.6;
      const w = 0.25 + Math.random() * 0.5;
      const size = 0.08 + Math.random() * 0.18;
      m.scale.setScalar(size / 0.12);

      const a: A = { id: i, mesh: m, r, incX, incZ, w, size };

      // armazenar uma “velocidade base” para o HUD
      if (selectableIds.has(i)) {
        a.baseSpeed = 15 + Math.random() * 10; // km/s
      }

      asteroids.push(a);
    }

    // Picking (clique nos asteroides)
    const onClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(asteroids.map((a) => a.mesh), false);
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const hit = asteroids.find((a) => a.mesh === mesh);
        if (hit && onSelect) {
          const alt = hit.r * 637; // valor “fake” só para UI
          const spd = hit.baseSpeed ?? 18;
          onSelect({ id: hit.id, speedKms: spd, altitudeKm: alt });
        }
        // flash sutil
        mesh.scale.setScalar((hit?.size ?? 0.12) * 1.35);
        setTimeout(() => mesh.scale.setScalar(hit?.size ?? 0.12), 180);
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    // Animação
    let t0 = performance.now();
    const update = () => {
      const t1 = performance.now();
      const dt = (t1 - t0) / 1000;
      t0 = t1;

      // rotação suave da Terra e nuvens
      earth.rotation.y += 0.05 * dt * speed;
      clouds.rotation.y += 0.07 * dt * speed;

      // asteroides orbitando (sem linhas / sem labels)
      for (const a of asteroids) {
        const t = t1 * 0.001 * (a.w * speed);
        const x = Math.cos(t) * a.r;
        const z = Math.sin(t) * a.r;
        a.mesh.position.set(x, 0, z);
        a.mesh.rotation.x += 0.5 * dt;
        a.mesh.rotation.y += 0.7 * dt;

        a.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), a.incX);
        a.mesh.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), a.incZ);
      }

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    // Resize responsivo
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // cleanup
    return () => {
      cancelAnimationFrame(rafRef.current!);
      renderer.domElement.removeEventListener("click", onClick);
      ro.disconnect();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
      renderer.dispose();
      // dispose de geometrias básicas
      earthGeom.dispose();
      cloudsGeom.dispose();
      atmoGeom.dispose();
      rockGeo.dispose();
      (renderer.info.programs || []).forEach((p: any) => p?.dispose?.());
    };
  }, [speed, accent, asteroidCount, highlights, onSelect]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default OrbitScene;
