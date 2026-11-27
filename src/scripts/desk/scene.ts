// Desk and wall scene (Phase 3 prototype).
// Every object is 3D in place. Click one and it floats out in front of the camera,
// turns slowly, and can be dragged to rotate. Click away, press Esc, or close to return it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { deskObjects, type DeskObject } from '../../data/objects';

// Models resolve by filename, so replacing a file in assets/models/ needs no code change.
const modelUrls = import.meta.glob('/assets/models/*.glb', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

type Item = {
  def: DeskObject;
  root: THREE.Group; // slot transform (animated on float-out)
  spin: THREE.Group; // turntable rotation while presented
  home: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: number };
  lift: THREE.Vector3; // hover offset direction
};

export type DeskOptions = {
  reduced: boolean;
  onSelect: (def: DeskObject | null) => void;
  onHover: (def: DeskObject | null, x: number, y: number) => void;
};

const COLORS = { wall: '#e8e6dc', floor: '#d6d2c4', desk: '#cdbfa6', deskEdge: '#b9aa8f', veil: '#eeede5' };
const REST = { pos: new THREE.Vector3(0, 1.32, 2.95), look: new THREE.Vector3(0, 1.02, -0.5) };
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

  // Light: soft sky fill plus one warm key from the upper left, like a window.
  scene.add(new THREE.HemisphereLight('#fffaf0', '#b7ae9c', 0.9));
  const key = new THREE.DirectionalLight('#fff1dc', 2.3);
  key.position.set(-2.2, 3.6, 2.6);
  key.target.position.set(0, 0.9, -0.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -1.2, near: 0.5, far: 9 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);

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

      // Fit: scale the largest dimension to def.size, then anchor in the slot.
      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.multiplyScalar(def.size / Math.max(size.x, size.y, size.z));
      box = new THREE.Box3().setFromObject(model);
      const c = box.getCenter(new THREE.Vector3());
      if (def.surface === 'desk') model.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
      else model.position.sub(new THREE.Vector3(c.x, c.y, box.min.z));

      const spin = new THREE.Group();
      spin.add(model);
      const root = new THREE.Group();
      root.add(spin);
      root.position.set(...def.position);
      root.rotation.set(...def.rotation);
      root.userData.id = def.id;
      scene.add(root);

      items.push({
        def, root, spin,
        home: { pos: root.position.clone(), quat: root.quaternion.clone(), scale: 1 },
        lift: def.surface === 'desk' ? new THREE.Vector3(0, 0.025, 0) : new THREE.Vector3(0, 0, 0.035),
      });
    }),
  );
  items.sort((a, b) => deskObjects.indexOf(a.def) - deskObjects.indexOf(b.def));

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
  let autoSpin = 0; // 0..1 strength of the idle sway
  let yaw = 0; // drag rotation
  let phase = 0;

  const pick = (e: PointerEvent): Item | null => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(items.map((i) => i.root), true);
    if (!hits.length) return null;
    let o: THREE.Object3D | null = hits[0].object;
    while (o && !o.userData.id) o = o.parent;
    return items.find((i) => i.root === o) ?? null;
  };

  const setHover = (it: Item | null, e?: PointerEvent) => {
    if (it !== hovered) {
      if (hovered) gsap.to(hovered.root.position, { ...vec(hovered.home.pos), duration: dur(0.35), ease: 'power2.out' });
      if (it) gsap.to(it.root.position, { ...vec(it.home.pos.clone().add(it.lift)), duration: dur(0.35), ease: 'power2.out' });
      hovered = it;
      renderer.domElement.style.cursor = it ? 'pointer' : '';
    }
    opts.onHover(it?.def ?? null, e?.clientX ?? 0, e?.clientY ?? 0);
  };

  function vec(v: THREE.Vector3) { return { x: v.x, y: v.y, z: v.z }; }

  // Float out: in front of the camera, left of center (the panel sits on the right).
  function select(it: Item) {
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
    // Face the camera, turned a little for a three-quarter view.
    const quat = camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...it.def.present)));

    // The model's base sits at the root origin; shift so the object's middle lands on target.
    const box = new THREE.Box3().setFromObject(it.spin);
    const mid = box.getCenter(new THREE.Vector3()).sub(it.root.position).multiplyScalar(scale);
    target.sub(mid.applyQuaternion(quat.clone().multiply(it.root.quaternion.clone().invert())));

    veil.visible = true;
    const from = it.root.quaternion.clone();
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(veil.material, { opacity: 0.86, duration: dur(0.6), ease: 'power2.out' }, 0)
      .to(it.root.position, { ...vec(target), duration: dur(1.0), ease: 'power3.inOut' }, 0)
      .to(it.root.scale, { x: scale, y: scale, z: scale, duration: dur(1.0), ease: 'power3.inOut' }, 0)
      .to({ t: 0 }, { t: 1, duration: dur(1.0), ease: 'power3.inOut', onUpdate() { it.root.quaternion.slerpQuaternions(from, quat, this.targets()[0].t); } }, 0);
  }

  function close(then?: () => void) {
    const it = selected;
    if (!it || busy) return;
    busy = true;
    const from = it.root.quaternion.clone();
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
      .to({ t: 0 }, { t: 1, duration: dur(0.9), ease: 'power3.inOut', onUpdate() { it.root.quaternion.slerpQuaternions(from, it.home.quat, this.targets()[0].t); } }, 0.05)
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
    if (!selected && !busy) setHover(pick(e), e);
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
    const it = pick(e);
    if (selected) { if (it !== selected) close(); return; }
    if (it) select(it);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected) close(); });

  // Loop runs only while the desk is on screen.
  const clock = new THREE.Clock();
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    // Camera: gentle mouse sway at rest; held still while an object is presented.
    if (!selected) {
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

  return {
    select: (id: string) => { const it = items.find((i) => i.def.id === id); if (it) select(it); },
    close: () => close(),
    intro,
  };
}
