// Desk and wall scene (Phase 3 prototype).
// Every object is 3D in place. Click one and it floats out in front of the camera,
// turns slowly, and can be dragged to rotate. Click away, press Esc, or close to return it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { deskObjects, openSlots, type DeskObject } from '../../data/objects';
import { drawHomeTexture } from '../mac/wallpaper';

// Models resolve by filename, so replacing a file in assets/models/ needs no code change.
const modelUrls = import.meta.glob('/assets/models/*.glb', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

type Item = {
  def: DeskObject;
  root: THREE.Group; // slot position (animated on float-out)
  spin: THREE.Group; // turntable rotation while presented
  orient: THREE.Group; // how the object sits in its slot; straightened when presented
  home: { pos: THREE.Vector3; quat: THREE.Quaternion; orientPos: THREE.Vector3; orientQuat: THREE.Quaternion };
  center: THREE.Vector3; // orient position that centers the upright model on the root
  lift: THREE.Vector3; // hover offset direction
  prop?: THREE.Object3D; // airplane propeller
};

export type DeskOptions = {
  reduced: boolean;
  bannerText: string;
  /** The Mac is entered, not floated out: called when the camera reaches its screen. */
  onMacEntered?: () => void;
  screenLabels: [string, string];
  onSelect: (def: DeskObject | null) => void;
  onHover: (def: DeskObject | null, x: number, y: number) => void;
};

const COLORS = { wall: '#e8e6dc', floor: '#d6d2c4', desk: '#cdbfa6', deskEdge: '#b9aa8f', veil: '#eeede5' };
const REST = { pos: new THREE.Vector3(0, 1.38, 3.3), look: new THREE.Vector3(0, 1.1, -0.5) };
const START = { x: 0, y: 2.1, z: 4.9 };

export async function createDesk(container: HTMLElement, opts: DeskOptions) {
  const dur = (s: number) => (opts.reduced ? 0 : s);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.wall);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 40);
  camera.position.copy(REST.pos);
  camera.lookAt(REST.look);
  scene.add(camera);

  // Room: wall and desk.
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 1 }));
  wall.position.set(0, 1.6, -1);
  wall.receiveShadow = true;
  scene.add(wall);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.045, 1.1), [
    new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: COLORS.desk, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.75 }),
  ]);
  deskTop.position.set(0, 0.76 - 0.0225, -0.45);
  deskTop.receiveShadow = true;
  deskTop.castShadow = true;
  scene.add(deskTop);

  const legMat = new THREE.MeshStandardMaterial({ color: COLORS.deskEdge, roughness: 0.8 });
  for (const [x, z] of [[-1.29, -0.94], [1.29, -0.94], [-1.29, 0.04], [1.29, 0.04]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.715, 0.05), legMat);
    leg.position.set(x, 0.3575, z);
    leg.castShadow = true;
    scene.add(leg);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 2);
  floor.receiveShadow = true;
  scene.add(floor);

  // Light: daylight through a window on the left side of the room.
  // A spotlight projects a window-pane pattern (soft mullion shadows) across the
  // wall and desk; a cool sky fill and a faint front fill keep the shadow side readable.
  scene.add(new THREE.HemisphereLight('#eef2fb', '#b9ae98', 0.75));
  const fill = new THREE.DirectionalLight('#fff6ea', 0.35);
  fill.position.set(1.5, 2.5, 4);
  scene.add(fill);

  const pane = document.createElement('canvas');
  pane.width = pane.height = 512;
  const pg = pane.getContext('2d')!;
  pg.fillStyle = '#000';
  pg.fillRect(0, 0, 512, 512);
  pg.filter = 'blur(7px)';
  pg.fillStyle = '#fff';
  const border = 40, mullion = 22, cols = 2, rows = 3;
  const pw = (512 - border * 2 - mullion * (cols - 1)) / cols;
  const ph = (512 - border * 2 - mullion * (rows - 1)) / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) pg.fillRect(border + c * (pw + mullion), border + r * (ph + mullion), pw, ph);
  }
  const windowTex = new THREE.CanvasTexture(pane);
  windowTex.colorSpace = THREE.SRGBColorSpace;

  const sun = new THREE.SpotLight('#fff1dc', 62, 0, 0.52, 0.2, 2);
  sun.position.set(-3.5, 2.55, -0.15);
  sun.target.position.set(0.55, 0.95, -0.9);
  sun.map = windowTex;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 9;
  scene.add(sun, sun.target);

  // Veil that dims the room behind a presented object. Lives on the camera.
  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: COLORS.veil, transparent: true, opacity: 0, depthWrite: false }),
  );
  veil.position.set(0, 0, -1.9);
  veil.visible = false;
  camera.add(veil);

  // Objects: load, fit to slot, place.
  const loader = new GLTFLoader();
  const items: Item[] = [];
  await Promise.all(
    deskObjects.map(async (def) => {
      const url = modelUrls[`/assets/models/${def.model}`];
      if (!url) {
        console.warn(`[desk] missing assets/models/${def.model}. Run npm run placeholders.`);
        return;
      }
      const gltf = await loader.loadAsync(url);
      const model = gltf.scene;
      model.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });

      // Fit: scale the largest dimension to def.size.
      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.multiplyScalar(def.size / Math.max(size.x, size.y, size.z));
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3()).negate();

      // Orient: how it sits (lying flat, leaning). Order YXZ = tilt first, then yaw.
      const orient = new THREE.Group();
      orient.rotation.set(def.rotation[0], def.rotation[1], def.rotation[2], 'YXZ');
      orient.add(model);
      orient.updateMatrixWorld(true);
      // Anchor in the slot: base on the surface, back on the wall, or centered.
      box = new THREE.Box3().setFromObject(orient);
      const c = box.getCenter(new THREE.Vector3());
      if (def.surface === 'desk' || def.surface === 'floor') orient.position.set(-c.x, -box.min.y, -c.z);
      else if (def.surface === 'wall') orient.position.set(-c.x, -c.y, -box.min.z);
      else orient.position.set(-c.x, -c.y, -c.z);

      const spin = new THREE.Group();
      spin.add(orient);
      const root = new THREE.Group();
      root.add(spin);
      root.position.set(...def.position);
      root.userData.id = def.id;
      scene.add(root);

      items.push({
        def, root, spin, orient,
        home: { pos: root.position.clone(), quat: root.quaternion.clone(), orientPos: orient.position.clone(), orientQuat: orient.quaternion.clone() },
        center,
        lift: def.surface === 'wall' ? new THREE.Vector3(0, 0, 0.035) : new THREE.Vector3(0, 0.025, 0),
        prop: model.getObjectByName('propeller') ?? undefined,
      });
    }),
  );
  items.sort((a, b) => deskObjects.indexOf(a.def) - deskObjects.indexOf(b.def));
  const clickable = items.filter((i) => i.def.clickable !== false);

  // The Mac's screen shows its home screen, lit like a display.
  let macScreen: THREE.Mesh | null = null;
  items.find((i) => i.def.id === 'mac')?.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && (m.material as THREE.Material).name === 'screen') macScreen = m;
  });
  if (macScreen) {
    await document.fonts.ready;
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 640;
    drawHomeTexture(cv.getContext('2d')!, cv.width, cv.height, opts.screenLabels);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.7, envMapIntensity: 0.2 });
    (macScreen as THREE.Mesh).material = mat;
    // Box UVs from Blender: front face spans the full texture after remapping by bounds.
    const g = (macScreen as THREE.Mesh).geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    const sx = bb.max.x - bb.min.x || 1;
    const lenY = bb.max.y - bb.min.y, lenZ = bb.max.z - bb.min.z;
    const vAxis = lenY > lenZ ? 'y' : 'z';
    const sv = Math.max(lenY, lenZ) || 1;
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - bb.min.x) / sx;
      uv[i * 2 + 1] = vAxis === 'y' ? (pos.getY(i) - bb.min.y) / sv : (pos.getZ(i) - bb.min.z) / sv;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }


  // Open slots: masking-tape corners marking a spot saved for something new.
  const tape = new THREE.MeshStandardMaterial({ color: '#e6d9b3', roughness: 0.9 });
  for (const slot of openSlots) {
    const [w, h] = slot.size;
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.022), tape);
      strip.position.set(slot.position[0] + (sx * w) / 2, slot.position[1] + (sy * h) / 2, slot.position[2]);
      strip.rotation.z = sx * sy * Math.PI / 4;
      strip.receiveShadow = true;
      scene.add(strip);
    }
  }

  // Airplane banner: a waving strip towed behind the plane.
  const flyer = items.find((i) => i.def.flight);
  let banner: THREE.Mesh | null = null;
  let bannerBase: Float32Array | null = null;
  if (flyer) {
    await document.fonts.ready;
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 160;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#eeede5';
    g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#2f5d46';
    g.lineWidth = 8;
    g.strokeRect(4, 4, cv.width - 8, cv.height - 8);
    g.fillStyle = '#1d221e';
    g.font = '500 64px "DM Mono", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(opts.bannerText.toUpperCase(), cv.width / 2, cv.height / 2 + 4);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const L = 0.66, H = 0.1;
    const geo = new THREE.PlaneGeometry(L, H, 32, 1);
    geo.rotateY(Math.PI / 2); // lies along the flight direction, faces sideways
    geo.translate(0, 0, -(L / 2 + 0.2));
    // Front and back each get their own texture so the text reads left to right
    // on both halves of the loop.
    const back = tex.clone();
    back.wrapS = THREE.RepeatWrapping;
    back.repeat.x = -1;
    back.needsUpdate = true;
    banner = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.FrontSide, roughness: 0.9 }));
    const bannerBack = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: back, side: THREE.BackSide, roughness: 0.9 }));
    bannerBack.raycast = () => {};
    flyer.root.add(bannerBack);
    banner.castShadow = true;
    banner.raycast = () => {}; // only the plane itself is clickable
    bannerBase = Float32Array.from(geo.attributes.position.array as Float32Array);
    flyer.root.add(banner);
    const rope = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.12), new THREE.Vector3(0, 0, -0.2)]),
      new THREE.LineBasicMaterial({ color: '#1d221e' }),
    );
    rope.raycast = () => {};
    flyer.root.add(rope);
  }

  // Size and render loop. Narrower screens pull the camera back so the desk still fits.
  let backOff = 0;
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    backOff = Math.max(0, 1.85 - w / h) * 1.3;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  // Pointer state.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: Item | null = null;
  let selected: Item | null = null;
  let busy = false;
  let drag: { x: number; y: number; moved: boolean } | null = null;
  const sway = { x: 0, y: 0, tx: 0, ty: 0 };
  let inMac = false; // camera is flying into, sitting at, or leaving the Mac screen
  let autoSpin = 0; // 0..1 strength of the idle sway
  let yaw = 0; // drag rotation
  let phase = 0;

  const pick = (e: PointerEvent): Item | null => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(clickable.map((i) => i.root), true);
    if (!hits.length) return null;
    let o: THREE.Object3D | null = hits[0].object;
    while (o && !o.userData.id) o = o.parent;
    return items.find((i) => i.root === o) ?? null;
  };

  const setHover = (it: Item | null, e?: PointerEvent) => {
    if (it !== hovered) {
      if (hovered && !hovered.def.flight) gsap.to(hovered.root.position, { ...vec(hovered.home.pos), duration: dur(0.35), ease: 'power2.out' });
      if (it && !it.def.flight) gsap.to(it.root.position, { ...vec(it.home.pos.clone().add(it.lift)), duration: dur(0.35), ease: 'power2.out' });
      hovered = it;
      renderer.domElement.style.cursor = it ? 'pointer' : '';
    }
    opts.onHover(it?.def ?? null, e?.clientX ?? 0, e?.clientY ?? 0);
  };

  function vec(v: THREE.Vector3) { return { x: v.x, y: v.y, z: v.z }; }

  // Float out: in front of the camera, left of center (the panel sits on the right).
  function select(it: Item) {
    if (it.def.id === 'mac' && opts.onMacEntered) {
      if (selected) return close(() => enterMac());
      return enterMac();
    }
    if (it.def.link) {
      window.open(it.def.link, '_blank', 'noopener');
      return;
    }
    if (busy || selected === it) return;
    if (selected) return close(() => select(it));
    busy = true;
    setHover(null);
    gsap.killTweensOf(it.root.position);
    it.root.position.copy(it.home.pos);
    selected = it;
    opts.onSelect(it.def);

    const D = 1.3;
    const visH = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const dir = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    const target = camera.position.clone().addScaledVector(dir, D).addScaledVector(right, -visW * 0.16).addScaledVector(up, -visH * 0.02);
    const scale = (visH * 0.56) / it.def.size;
    // Face the camera, turned a little for a three-quarter view. The object is
    // straightened (orient -> upright, centered) so its middle lands on target.
    const quat = camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...it.def.present)));

    veil.visible = true;
    const from = it.root.quaternion.clone();
    const oFrom = it.orient.quaternion.clone();
    const upright = new THREE.Quaternion();
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(veil.material, { opacity: 0.86, duration: dur(0.6), ease: 'power2.out' }, 0)
      .to(it.root.position, { ...vec(target), duration: dur(1.0), ease: 'power3.inOut' }, 0)
      .to(it.root.scale, { x: scale, y: scale, z: scale, duration: dur(1.0), ease: 'power3.inOut' }, 0)
      .to(it.orient.position, { ...vec(it.center), duration: dur(1.0), ease: 'power3.inOut' }, 0)
      .to({ t: 0 }, { t: 1, duration: dur(1.0), ease: 'power3.inOut', onUpdate() {
        const t = this.targets()[0].t;
        it.root.quaternion.slerpQuaternions(from, quat, t);
        it.orient.quaternion.slerpQuaternions(oFrom, upright, t);
      } }, 0);
  }

  function close(then?: () => void) {
    const it = selected;
    if (!it || busy) return;
    busy = true;
    const from = it.root.quaternion.clone();
    const oFrom = it.orient.quaternion.clone();
    const tl = gsap.timeline({
      onComplete: () => {
        busy = false;
        selected = null;
        veil.visible = false;
        it.spin.rotation.set(0, 0, 0);
        opts.onSelect(null);
        then?.();
      },
    });
    tl.to(it.spin.rotation, { x: 0, y: Math.round(it.spin.rotation.y / (Math.PI * 2)) * Math.PI * 2, duration: dur(0.7), ease: 'power2.inOut', onComplete: () => { yaw = 0; phase = 0; autoSpin = 0; } }, 0)
      .to(it.root.position, { ...vec(it.home.pos), duration: dur(0.9), ease: 'power3.inOut' }, 0.05)
      .to(it.root.scale, { x: 1, y: 1, z: 1, duration: dur(0.9), ease: 'power3.inOut' }, 0.05)
      .to(it.orient.position, { ...vec(it.home.orientPos), duration: dur(0.9), ease: 'power3.inOut' }, 0.05)
      .to({ t: 0 }, { t: 1, duration: dur(0.9), ease: 'power3.inOut', onUpdate() {
        const t = this.targets()[0].t;
        it.root.quaternion.slerpQuaternions(from, it.home.quat, t);
        it.orient.quaternion.slerpQuaternions(oFrom, it.home.orientQuat, t);
      } }, 0.05)
      .to(veil.material, { opacity: 0, duration: dur(0.6), ease: 'power2.inOut' }, 0.3);
  }

  const el = renderer.domElement;
  el.style.touchAction = 'none';
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    sway.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    sway.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (drag && selected) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      yaw += dx * 0.01;
      selected.spin.rotation.y = yaw + Math.sin(phase) * 0.55 * Math.max(0, autoSpin);
      selected.spin.rotation.x = THREE.MathUtils.clamp(selected.spin.rotation.x + dy * 0.008, -0.7, 0.7);
      drag.x = e.clientX; drag.y = e.clientY;
      autoSpin = 0;
      return;
    }
    if (!selected && !busy && !inMac) setHover(pick(e), e);
  });
  el.addEventListener('pointerleave', () => { if (!selected) setHover(null); sway.tx = sway.ty = 0; });
  el.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: false };
    if (selected) el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointerup', (e) => {
    const wasDrag = drag?.moved;
    drag = null;
    if (wasDrag) { autoSpin = -1.2; return; } // resume turning after a pause
    if (inMac) return;
    const it = pick(e);
    if (selected) { if (it !== selected) close(); return; }
    if (it) select(it);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected) close(); });

  // Loop runs only while the desk is on screen.
  const clock = new THREE.Clock();
  let flightT = 0;
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    // Camera: gentle mouse sway at rest; held still while an object is presented.
    if (!selected && !inMac) {
      const k = opts.reduced ? 1 : 0.05;
      const amt = opts.reduced ? 0 : 1;
      sway.x += (sway.tx * amt - sway.x) * k;
      sway.y += (sway.ty * amt - sway.y) * k;
      camera.position.set(REST.pos.x + sway.x * 0.12, REST.pos.y - sway.y * 0.05, REST.pos.z + backOff);
      camera.lookAt(REST.look);
    }
    // Presented object: idle sway side to side so the form reads, without turning edge-on.
    if (selected && !busy && !drag && !opts.reduced) {
      autoSpin = Math.min(1, autoSpin + dt * 0.8);
      if (autoSpin > 0) phase += dt * 0.7;
      selected.spin.rotation.y = yaw + Math.sin(phase) * 0.55 * Math.max(0, autoSpin);
    }
    // Toy airplane: loops in front of the wall, banking into the turns.
    if (flyer && flyer.def.flight) {
      const f = flyer.def.flight;
      // Pauses while hovered so it is easy to click.
      flightT += opts.reduced || hovered === flyer ? 0 : dt / f.seconds;
      const a = flightT * Math.PI * 2 + (opts.reduced ? Math.PI * 0.62 : 0);
      const [rx, rz] = f.radius;
      // Dips on the front half of the loop (closer to the camera) so it stays below the menu.
      const dip = 0.24, front = Math.max(0, Math.sin(a));
      const pos = new THREE.Vector3(f.center[0] + Math.cos(a) * rx, f.center[1] + Math.sin(a * 2) * 0.05 - dip * front, f.center[2] + Math.sin(a) * rz);
      const vel = new THREE.Vector3(-Math.sin(a) * rx, Math.cos(a * 2) * 0.1 - dip * (Math.sin(a) > 0 ? Math.cos(a) : 0), Math.cos(a) * rz);
      flyer.root.position.copy(pos);
      flyer.root.lookAt(flyer.root.position.clone().add(vel));
      flyer.root.rotateZ(-Math.cos(a) * 0.25);
      // The propeller node's local X points along the nose.
      if (flyer.prop && !opts.reduced) flyer.prop.rotation.x += dt * 40;
      if (banner && bannerBase && !opts.reduced) {
        const arr = banner.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          const z = bannerBase[i + 2];
          const trail = Math.min(1, Math.max(0, (-z - 0.2) / 0.66));
          arr[i] = bannerBase[i] + Math.sin(z * 14 + clock.elapsedTime * 7) * 0.02 * trail;
        }
        banner.geometry.attributes.position.needsUpdate = true;
        banner.geometry.computeVertexNormals();
      }
    }
    renderer.render(scene, camera);
  };
  const io = new IntersectionObserver(([e]) => renderer.setAnimationLoop(e.isIntersecting ? frame : null));
  io.observe(container);

  // Arrival: the camera settles in from higher and farther back.
  let arrived = false;
  const intro = () => {
    if (arrived || opts.reduced) return;
    arrived = true;
    const rest = REST.pos.clone();
    gsap.fromTo(REST.pos, START, { x: rest.x, y: rest.y, z: rest.z, duration: 1.6, ease: 'power3.out' });
  };

  /** Where the Mac's screen is on the page (for the home screen to grow from). */
  const screenRect = (): DOMRect | null => {
    if (!macScreen) return null;
    const m = macScreen as THREE.Mesh;
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox!;
    const r = renderer.domElement.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
      const p = new THREE.Vector3(x, y, z).applyMatrix4(m.matrixWorld).project(camera);
      const px = r.left + ((p.x + 1) / 2) * r.width, py = r.top + ((1 - p.y) / 2) * r.height;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return new DOMRect(x0, y0, x1 - x0, y1 - y0);
  };

  // Fly the camera into the Mac until its screen fills the view, then hand off to the home screen.
  const view = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  function enterMac() {
    if (!macScreen || inMac || busy) return;
    inMac = true;
    setHover(null);
    const m = macScreen as THREE.Mesh;
    m.updateWorldMatrix(true, false);
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox!;
    const center = bb.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld);
    // Screen normal: average the vertex normals that face the camera.
    const nrm = m.geometry.attributes.normal;
    const toCam = camera.position.clone().sub(center).normalize();
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const n = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let i = 0; i < nrm.count; i++) {
      v.fromBufferAttribute(nrm, i).applyMatrix3(nm).normalize();
      if (v.dot(toCam) > 0.5) n.add(v);
    }
    n.normalize();
    // Distance so the screen's height fills ~92% of the view.
    const size = bb.getSize(new THREE.Vector3()).multiply(new THREE.Vector3().setFromMatrixScale(m.matrixWorld));
    const h = Math.max(size.y, size.z) * 0.9;
    const w = size.x;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const d = Math.max(h / 2 / Math.tan(fov / 2), w / 2 / (Math.tan(fov / 2) * camera.aspect)) * 0.94;
    const toPos = center.clone().addScaledVector(n, d);
    view.pos.copy(camera.position);
    view.look.copy(REST.look);
    const fromPos = camera.position.clone();
    const fromLook = REST.look.clone();
    gsap.to({ t: 0 }, {
      t: 1, duration: dur(1.5), ease: 'power3.inOut',
      onUpdate() {
        const t = this.targets()[0].t;
        camera.position.lerpVectors(fromPos, toPos, t);
        camera.lookAt(new THREE.Vector3().lerpVectors(fromLook, center, t));
      },
      onComplete: () => opts.onMacEntered?.(),
    });
  }
  function exitMac() {
    if (!inMac) return;
    const fromPos = camera.position.clone();
    const fromDir = camera.getWorldDirection(new THREE.Vector3());
    const fromLook = fromPos.clone().addScaledVector(fromDir, 1);
    const toPos = new THREE.Vector3(REST.pos.x, REST.pos.y, REST.pos.z + backOff);
    gsap.to({ t: 0 }, {
      t: 1, duration: dur(1.3), ease: 'power3.inOut',
      onUpdate() {
        const t = this.targets()[0].t;
        camera.position.lerpVectors(fromPos, toPos, t);
        camera.lookAt(new THREE.Vector3().lerpVectors(fromLook, REST.look, t));
      },
      onComplete: () => { inMac = false; sway.x = sway.y = 0; },
    });
  }

  return {
    enterMac,
    exitMac,
    screenRect,
    select: (id: string) => { const it = items.find((i) => i.def.id === id); if (it) select(it); },
    close: () => close(),
    intro,
  };
}
