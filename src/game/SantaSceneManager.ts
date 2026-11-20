import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { audioEngine } from './audio';
import { getOutfitById } from './chapters';
import { LEVELS } from './levels';
import {
  applySantaOutfitToModel,
  createCityBackdropProps,
  createCookieModel,
  createElfModel,
  createFakeCookieModel,
  createFrostTrapModel,
  createGoldenCookieModel,
  createHouseModel,
  createIceCreatureModel,
  createKeyModel,
  createLockedGateModel,
  createPortalModel,
  createPresentModel,
  createReindeerModel,
  createSantaModel,
  createSnowballModel,
  createSnowmanModel,
  createStarModel,
} from './models';
import {
  TILE_SIZE,
  createSimState,
  getHudSnapshot,
  stepSimulation,
  tileToWorld,
} from './simulation';
import {
  createBumpNoiseTexture,
  createContactShadowTexture,
  createIceTexture,
  createNightLightRingTexture,
  createSnowCobbleTexture,
  createWallBrickTexture,
} from './textures';
import type {
  GameEvent,
  GameScreenState,
  HudSnapshot,
  InputIntent,
  LevelDefinition,
  SantaOutfitId,
  SimState,
  ThemeMode,
} from './types';

// Pre-allocated scratch math objects (Zero-GC render loop)
const _dummy = new THREE.Object3D();
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _color = new THREE.Color();
const _dayColor = new THREE.Color();
const _nightColor = new THREE.Color();
const _dayFogColor = new THREE.Color();
const _nightFogColor = new THREE.Color();

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
}

export interface SceneCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelComplete: (sim: SimState, level: LevelDefinition) => void;
  onGameOver: (sim: SimState, level: LevelDefinition) => void;
}

export class SantaSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private maxAnisotropy: number;

  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private playerLight: THREE.PointLight;
  private nightLightRing: THREE.Mesh;
  private nightLightRingMat: THREE.MeshBasicMaterial;

  private moonMesh: THREE.Mesh;
  private starField: THREE.InstancedMesh;

  private levelGroup = new THREE.Group();
  private dynamicGroup = new THREE.Group();
  private celebrationGroup = new THREE.Group();

  private santaMesh: THREE.Group;
  private santaShadow: THREE.Mesh;
  private portalMesh: THREE.Group | null = null;

  private collectibleMeshes = new Map<string, THREE.Group>();
  private houseMeshes = new Map<string, THREE.Group>();
  private gateMeshes = new Map<string, THREE.Group>();
  private trapMeshes = new Map<string, THREE.Group>();
  private hazardMeshes = new Map<string, THREE.Group>();
  private fairyBulbsMesh: THREE.InstancedMesh | null = null;
  private fairyBulbMat: THREE.MeshBasicMaterial | null = null;
  private outerGroundMat: THREE.MeshStandardMaterial | null = null;
  private mazeFloorMat: THREE.MeshStandardMaterial | null = null;

  // Pooled Falling Snow
  private snowCount = 220;
  private snowInstanced: THREE.InstancedMesh;
  private snowPositions: Float32Array;
  private snowSpeeds: Float32Array;

  // Pooled Burst Particles
  private burstCount = 72;
  private burstInstanced: THREE.InstancedMesh;
  private burstPool: ParticleSlot[] = [];
  private burstCursor = 0;

  private shadowTex: THREE.CanvasTexture;
  private bumpTex: THREE.CanvasTexture;
  private iceTex: THREE.CanvasTexture;
  private nightRingTex: THREE.CanvasTexture;

  private currentLevel: LevelDefinition = LEVELS[0];
  private currentOutfitId: SantaOutfitId = 'classic_red';
  private sim: SimState;
  private theme: ThemeMode = 'light';
  private screenState: GameScreenState = 'title';
  private celebrationActive = false;

  private keysHeld = new Set<string>();
  private dpadIntent: InputIntent = { moveX: 0, moveZ: 0 };
  private callbacks: SceneCallbacks;

  private frameId = 0;
  private disposed = false;
  private lastTimestamp = 0;
  private elapsedTotal = 0;
  private lastHudPush = 0;
  private resizeObserver: ResizeObserver;
  private celebrationActors: Array<{
    mesh: THREE.Group;
    baseAngle: number;
    radius: number;
    phase: number;
  }> = [];

  constructor(
    container: HTMLElement,
    initialTheme: ThemeMode,
    initialOutfitId: SantaOutfitId,
    callbacks: SceneCallbacks,
  ) {
    this.container = container;
    this.theme = initialTheme;
    this.currentOutfitId = initialOutfitId;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.isSoftwareGl,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.2, 220);

    // Procedural Studio Environment Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm / Cool Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x94a3b8, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4d6, 1.45);
    this.keyLight.position.set(18, 28, 16);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 90;
    const d = 32;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xbae6fd, 0.55);
    this.rimLight.position.set(-16, 14, -18);
    this.scene.add(this.rimLight);

    // Night Mode Player Lantern PointLight (compact radius around Santa)
    this.playerLight = new THREE.PointLight(0xffe4a0, 0, 8.6, 1.75);
    this.playerLight.position.set(0, 2.7, 0);
    this.scene.add(this.playerLight);

    // Night Moon & Starfield
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 18, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3 }),
    );
    this.moonMesh.position.set(-16, 12, -32);
    this.scene.add(this.moonMesh);

    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.starField = new THREE.InstancedMesh(starGeo, starMat, 120);
    this.starField.frustumCulled = false;
    for (let i = 0; i < 120; i++) {
      const angle = (i * 2.399) % (Math.PI * 2);
      const radius = 24 + (i % 7) * 5;
      _dummy.position.set(
        Math.cos(angle) * radius,
        6 + (i % 8) * 1.4,
        Math.sin(angle) * radius - 14,
      );
      _dummy.scale.setScalar(0.6 + (i % 4) * 0.35);
      _dummy.updateMatrix();
      this.starField.setMatrixAt(i, _dummy.matrix);
    }
    this.starField.instanceMatrix.needsUpdate = true;
    this.scene.add(this.starField);

    // Shared textures
    this.shadowTex = createContactShadowTexture();
    this.bumpTex = createBumpNoiseTexture();
    this.iceTex = createIceTexture(this.maxAnisotropy);
    this.nightRingTex = createNightLightRingTexture();

    // Soft circular light ring around Santa during Night Mode
    this.nightLightRingMat = new THREE.MeshBasicMaterial({
      map: this.nightRingTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.nightLightRing = new THREE.Mesh(
      new THREE.PlaneGeometry(9.2, 9.2),
      this.nightLightRingMat,
    );
    this.nightLightRing.rotation.x = -Math.PI / 2;
    this.nightLightRing.position.y = 0.04;
    this.nightLightRing.visible = false;

    // Santa Hero
    this.santaMesh = createSantaModel(getOutfitById(this.currentOutfitId));
    this.santaShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 18),
      new THREE.MeshBasicMaterial({
        map: this.shadowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    this.santaShadow.rotation.x = -Math.PI / 2;
    this.santaShadow.position.y = 0.02;

    this.scene.add(this.levelGroup, this.dynamicGroup, this.celebrationGroup);

    // Pooled Falling Snow
    const snowGeo = new THREE.IcosahedronGeometry(0.11, 0);
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.snowInstanced = new THREE.InstancedMesh(snowGeo, snowMat, this.snowCount);
    this.snowInstanced.frustumCulled = false;
    this.snowPositions = new Float32Array(this.snowCount * 3);
    this.snowSpeeds = new Float32Array(this.snowCount);
    for (let i = 0; i < this.snowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 72;
      this.snowPositions[i * 3 + 1] = Math.random() * 24;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 72;
      this.snowSpeeds[i] = 2.2 + Math.random() * 2.4;
    }
    this.scene.add(this.snowInstanced);

    // Pooled Burst Particles
    const burstGeo = new THREE.OctahedronGeometry(0.15, 0);
    const burstMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.burstInstanced = new THREE.InstancedMesh(burstGeo, burstMat, this.burstCount);
    this.burstInstanced.frustumCulled = false;
    for (let i = 0; i < this.burstCount; i++) {
      this.burstPool.push({
        active: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0,
        color: new THREE.Color(0xffffff),
      });
      this.burstInstanced.setColorAt(i, _color.setHex(0xffffff));
    }
    this.scene.add(this.burstInstanced);

    this.sim = createSimState(LEVELS[0]);
    this.loadLevel(LEVELS[0]);
    this.applyTheme(this.theme);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);

    this.lastTimestamp = performance.now();
    this.tick();
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
  }

  public setOutfit(outfitId: SantaOutfitId): void {
    this.currentOutfitId = outfitId;
    applySantaOutfitToModel(this.santaMesh, getOutfitById(outfitId));
  }

  public loadLevel(level: LevelDefinition): void {
    this.currentLevel = level;
    this.sim = createSimState(level);
    this.celebrationActive = false;
    this.clearGroup(this.celebrationGroup);
    this.celebrationActors = [];

    this.clearGroup(this.levelGroup);
    this.clearGroup(this.dynamicGroup);
    this.collectibleMeshes.clear();
    this.houseMeshes.clear();
    this.gateMeshes.clear();
    this.trapMeshes.clear();
    this.hazardMeshes.clear();
    this.portalMesh = null;
    this.fairyBulbsMesh = null;
    this.fairyBulbMat = null;

    const { rows, cols, tileSize } = this.sim;
    const mazeW = cols * tileSize;
    const mazeD = rows * tileSize;

    // Extended surrounding snowy ground
    this.outerGroundMat = new THREE.MeshStandardMaterial({
      color: 0xcbdcf0,
      roughness: 0.92,
      metalness: 0.02,
      bumpMap: this.bumpTex,
      bumpScale: 0.05,
    });
    const outerGround = new THREE.Mesh(
      new THREE.PlaneGeometry(210, 210),
      this.outerGroundMat,
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.04;
    outerGround.receiveShadow = true;
    this.levelGroup.add(outerGround);

    // Maze Floor Base
    const cobbleTex = createSnowCobbleTexture(
      level.palette.floorLight,
      this.maxAnisotropy,
    );
    cobbleTex.repeat.set(cols * 0.5, rows * 0.5);
    this.mazeFloorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cobbleTex,
      roughness: 0.85,
      metalness: 0.04,
      bumpMap: this.bumpTex,
      bumpScale: 0.03,
    });
    const mazeFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(mazeW, mazeD),
      this.mazeFloorMat,
    );
    mazeFloor.rotation.x = -Math.PI / 2;
    mazeFloor.position.y = 0;
    mazeFloor.receiveShadow = true;
    this.levelGroup.add(mazeFloor);

    // Count walls, secret walls, and ice tiles for InstancedMesh
    const wallCoords: Array<{ x: number; z: number }> = [];
    const secretCoords: Array<{ x: number; z: number }> = [];
    const iceCoords: Array<{ x: number; z: number }> = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = this.sim.tiles[r][c];
        const pos = tileToWorld(r, c, rows, cols, tileSize);
        if (tile === 'wall') wallCoords.push(pos);
        else if (tile === 'secret_wall') secretCoords.push(pos);
        else if (tile === 'ice') iceCoords.push(pos);
      }
    }

    // Solid Maze Walls
    if (wallCoords.length > 0) {
      const wallTex = createWallBrickTexture(
        level.palette.wallPrimary,
        level.palette.wallTrim,
        this.maxAnisotropy,
      );
      const wallGeo = new THREE.BoxGeometry(tileSize * 0.98, 1.02, tileSize * 0.98);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: wallTex,
        roughness: 0.78,
        metalness: 0.06,
      });
      const wallInst = new THREE.InstancedMesh(wallGeo, wallMat, wallCoords.length);
      wallInst.castShadow = true;
      wallInst.receiveShadow = true;

      const capGeo = new THREE.BoxGeometry(tileSize * 1.02, 0.14, tileSize * 1.02);
      const capMat = new THREE.MeshStandardMaterial({
        color: level.palette.snowTint,
        roughness: 0.88,
      });
      const capInst = new THREE.InstancedMesh(capGeo, capMat, wallCoords.length);
      capInst.receiveShadow = true;

      wallCoords.forEach((p, idx) => {
        _dummy.position.set(p.x, 0.51, p.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        wallInst.setMatrixAt(idx, _dummy.matrix);

        _dummy.position.set(p.x, 1.09, p.z);
        _dummy.updateMatrix();
        capInst.setMatrixAt(idx, _dummy.matrix);
      });
      wallInst.instanceMatrix.needsUpdate = true;
      capInst.instanceMatrix.needsUpdate = true;
      wallInst.computeBoundingSphere();
      capInst.computeBoundingSphere();
      this.levelGroup.add(wallInst, capInst);

      // Festive String Light Bulbs
      const bulbColors = [0xff3b3b, 0xfacc15, 0x22c55e, 0x38bdf8];
      const bulbCount = Math.min(wallCoords.length, 52);
      this.fairyBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.fairyBulbsMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        this.fairyBulbMat,
        bulbCount,
      );
      for (let i = 0; i < bulbCount; i++) {
        const wp = wallCoords[Math.floor((i * wallCoords.length) / bulbCount)];
        _dummy.position.set(wp.x, 1.24, wp.z);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        this.fairyBulbsMesh.setMatrixAt(i, _dummy.matrix);
        this.fairyBulbsMesh.setColorAt(i, _color.setHex(bulbColors[i % bulbColors.length]));
      }
      this.fairyBulbsMesh.instanceMatrix.needsUpdate = true;
      if (this.fairyBulbsMesh.instanceColor) {
        this.fairyBulbsMesh.instanceColor.needsUpdate = true;
      }
      this.fairyBulbsMesh.computeBoundingSphere();
      this.levelGroup.add(this.fairyBulbsMesh);
    }

    // Secret Pathway Tiles (walkable frosted hedges)
    if (secretCoords.length > 0) {
      const secretGeo = new THREE.BoxGeometry(tileSize * 0.94, 1.0, tileSize * 0.94);
      const secretMat = new THREE.MeshStandardMaterial({
        color: 0x15803d,
        emissive: 0x10b981,
        emissiveIntensity: 0.16,
        transparent: true,
        opacity: 0.74,
        roughness: 0.65,
      });
      const secretInst = new THREE.InstancedMesh(secretGeo, secretMat, secretCoords.length);
      secretCoords.forEach((p, idx) => {
        _dummy.position.set(p.x, 0.5, p.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        secretInst.setMatrixAt(idx, _dummy.matrix);
      });
      secretInst.instanceMatrix.needsUpdate = true;
      secretInst.computeBoundingSphere();
      this.levelGroup.add(secretInst);
    }

    // Slippery Ice Floor Patches
    if (iceCoords.length > 0) {
      const iceGeo = new THREE.BoxGeometry(tileSize * 0.98, 0.05, tileSize * 0.98);
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.iceTex,
        roughness: 0.12,
        metalness: 0.18,
      });
      const iceInst = new THREE.InstancedMesh(iceGeo, iceMat, iceCoords.length);
      iceInst.receiveShadow = true;
      iceCoords.forEach((p, idx) => {
        _dummy.position.set(p.x, 0.025, p.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        iceInst.setMatrixAt(idx, _dummy.matrix);
      });
      iceInst.instanceMatrix.needsUpdate = true;
      iceInst.computeBoundingSphere();
      this.levelGroup.add(iceInst);
    }

    // Chapter-specific Landmarks & Decorations around perimeter
    const backdrop = createCityBackdropProps(
      level.chapterId,
      mazeW / 2,
      mazeD / 2,
      this.theme === 'dark',
    );
    this.levelGroup.add(backdrop);

    // Houses
    for (const house of this.sim.houses) {
      const mesh = createHouseModel();
      mesh.position.set(house.x, 0, house.z);
      this.dynamicGroup.add(mesh);
      this.houseMeshes.set(house.id, mesh);
    }

    // Gates (Key-locked gates G & Exit Gate E) — auto-oriented perpendicular to corridor walls!
    for (const gate of this.sim.gates) {
      const mesh = createLockedGateModel(tileSize, gate.kind === 'exit_gate');
      mesh.position.set(gate.x, 0, gate.z);

      const leftBlocked =
        gate.col > 0 &&
        (this.sim.tiles[gate.row][gate.col - 1] === 'wall' ||
          this.sim.tiles[gate.row][gate.col - 1] === 'secret_wall');
      const rightBlocked =
        gate.col < cols - 1 &&
        (this.sim.tiles[gate.row][gate.col + 1] === 'wall' ||
          this.sim.tiles[gate.row][gate.col + 1] === 'secret_wall');
      const upBlocked =
        gate.row > 0 &&
        (this.sim.tiles[gate.row - 1][gate.col] === 'wall' ||
          this.sim.tiles[gate.row - 1][gate.col] === 'secret_wall');
      const downBlocked =
        gate.row < rows - 1 &&
        (this.sim.tiles[gate.row + 1][gate.col] === 'wall' ||
          this.sim.tiles[gate.row + 1][gate.col] === 'secret_wall');

      // If walls are on top & bottom (North/South), corridor runs East-West -> rotate gate 90deg to span across N-S
      if ((upBlocked || downBlocked) && !(leftBlocked && rightBlocked)) {
        mesh.rotation.y = Math.PI / 2;
      }

      this.dynamicGroup.add(mesh);
      this.gateMeshes.set(gate.id, mesh);
    }

    // Special Frost Spike Traps
    for (const trap of this.sim.traps) {
      const mesh = createFrostTrapModel(tileSize);
      mesh.position.set(trap.x, 0, trap.z);
      this.dynamicGroup.add(mesh);
      this.trapMeshes.set(trap.id, mesh);
    }

    // Magical Exit Portal
    this.portalMesh = createPortalModel();
    this.portalMesh.position.set(this.sim.portal.x, 0, this.sim.portal.z);
    this.dynamicGroup.add(this.portalMesh);

    // Collectibles
    for (const item of this.sim.collectibles) {
      let mesh: THREE.Group;
      if (item.kind === 'present') mesh = createPresentModel(false);
      else if (item.kind === 'hidden_present') mesh = createPresentModel(true);
      else if (item.kind === 'cookie') mesh = createCookieModel();
      else if (item.kind === 'fake_cookie') mesh = createFakeCookieModel(Boolean(item.hasClue));
      else if (item.kind === 'key') mesh = createKeyModel();
      else if (item.kind === 'golden_cookie') mesh = createGoldenCookieModel();
      else mesh = createStarModel();

      mesh.position.set(item.x, 0, item.z);

      const cShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.42, 12),
        new THREE.MeshBasicMaterial({
          map: this.shadowTex,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      );
      cShadow.rotation.x = -Math.PI / 2;
      cShadow.position.y = 0.02;
      mesh.add(cShadow);

      this.dynamicGroup.add(mesh);
      this.collectibleMeshes.set(item.id, mesh);
    }

    // Enemies / Hazards
    for (const h of this.sim.hazards) {
      const mesh =
        h.kind === 'snowman'
          ? createSnowmanModel()
          : h.kind === 'elf'
            ? createElfModel()
            : h.kind === 'ice_creature'
              ? createIceCreatureModel()
              : createSnowballModel();
      mesh.position.set(h.x, 0, h.z);
      const hShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.58, 14),
        new THREE.MeshBasicMaterial({
          map: this.shadowTex,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      hShadow.rotation.x = -Math.PI / 2;
      hShadow.position.y = 0.02;
      mesh.add(hShadow);
      this.dynamicGroup.add(mesh);
      this.hazardMeshes.set(h.id, mesh);
    }

    // Santa, Shadow & Night Mode Ring
    this.santaMesh.position.set(this.sim.player.x, 0, this.sim.player.z);
    this.santaMesh.rotation.set(0, this.sim.player.facing, 0);
    this.santaShadow.position.set(this.sim.player.x, 0.02, this.sim.player.z);
    this.nightLightRing.position.set(this.sim.player.x, 0.04, this.sim.player.z);
    this.playerLight.position.set(this.sim.player.x, 2.7, this.sim.player.z);
    this.dynamicGroup.add(this.santaMesh, this.santaShadow, this.nightLightRing);

    if (this.screenState === 'title') {
      this.camera.position.set(
        this.sim.player.x - 1.5,
        9.4,
        this.sim.player.z + 10.6,
      );
      this.camera.lookAt(this.sim.player.x - 1.5, 1.0, this.sim.player.z + 0.6);
    } else {
      const isPortrait = this.camera.aspect < 0.85;
      this.camera.fov = isPortrait ? 55 : 46;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(
        this.sim.player.x,
        isPortrait ? 20.5 : 17.6,
        this.sim.player.z + (isPortrait ? 9.8 : 9.2),
      );
      this.camera.lookAt(this.sim.player.x, 0.6, this.sim.player.z - 0.3);
    }

    this.syncEnvironmentLighting();
    audioEngine.setMusicPhase(this.sim.dayNight.phase);
    this.callbacks.onHudUpdate(getHudSnapshot(this.sim, this.currentLevel));
    this.renderer.render(this.scene, this.camera);
  }

  public applyTheme(theme: ThemeMode): void {
    this.theme = theme;
    this.syncEnvironmentLighting();
  }

  /**
   * Smoothly drives 3D lighting from the live 12s Day / 25s Night cycle during gameplay,
   * while keeping Title / Celebration views bright and readable.
   */
  private syncEnvironmentLighting(): void {
    const pal = this.currentLevel.palette;
    const isGameplayCycle =
      this.screenState === 'playing' ||
      this.screenState === 'paused' ||
      this.screenState === 'game-over';

    const nightFactor = isGameplayCycle
      ? Math.max(0, Math.min(1, this.sim.dayNight.nightFactor))
      : this.theme === 'dark'
        ? 0.45
        : 0;

    // Sky & Fog interpolation
    _dayColor.setHex(pal.lightSky);
    _nightColor.setHex(isGameplayCycle ? 0x030612 : pal.darkSky);
    _dayColor.lerp(_nightColor, nightFactor);
    this.scene.background = _dayColor.clone();

    _dayFogColor.setHex(pal.lightFog);
    _nightFogColor.setHex(isGameplayCycle ? 0x040714 : pal.darkFog);
    _dayFogColor.lerp(_nightFogColor, nightFactor);

    const fogDensity = 0.0085 + nightFactor * (isGameplayCycle ? 0.011 : 0.0045);
    if (!(this.scene.fog instanceof THREE.FogExp2)) {
      this.scene.fog = new THREE.FogExp2(_dayFogColor.getHex(), fogDensity);
    } else {
      this.scene.fog.color.copy(_dayFogColor);
      this.scene.fog.density = fogDensity;
    }

    // Scene environment & lights drop very low during Night Mode so only Santa's light ring illuminates clearly
    const envTarget = isGameplayCycle
      ? THREE.MathUtils.lerp(0.88, 0.04, nightFactor)
      : THREE.MathUtils.lerp(0.9, 0.45, nightFactor);
    this.scene.environmentIntensity = envTarget;

    if (this.outerGroundMat) {
      _dayColor.setHex(0x9fbce0);
      _nightColor.setHex(0x060b18);
      this.outerGroundMat.color.copy(_dayColor.lerp(_nightColor, nightFactor));
    }
    if (this.mazeFloorMat) {
      _dayColor.setHex(0xffffff);
      _nightColor.setHex(0x7c8ea8);
      this.mazeFloorMat.color.copy(_dayColor.lerp(_nightColor, nightFactor));
    }

    this.hemiLight.color.setHex(nightFactor > 0.5 ? 0x3b82f6 : 0xdbeafe);
    this.hemiLight.groundColor.setHex(nightFactor > 0.5 ? 0x0f172a : 0x94a3b8);
    this.hemiLight.intensity = THREE.MathUtils.lerp(
      0.78,
      isGameplayCycle ? 0.06 : 0.45,
      nightFactor,
    );

    this.keyLight.color.setHex(nightFactor > 0.5 ? 0x93c5fd : 0xfff4d6);
    this.keyLight.intensity = THREE.MathUtils.lerp(
      1.38,
      isGameplayCycle ? 0.04 : 0.72,
      nightFactor,
    );

    this.rimLight.color.setHex(nightFactor > 0.5 ? 0x6366f1 : 0xbae6fd);
    this.rimLight.intensity = THREE.MathUtils.lerp(
      0.55,
      isGameplayCycle ? 0.05 : 0.45,
      nightFactor,
    );

    // Santa's personal circular Night Light (compact radius with soft glowing edge)
    const lightStrength = isGameplayCycle ? Math.pow(nightFactor, 1.15) : 0;
    this.playerLight.intensity = lightStrength * 5.6;
    this.playerLight.distance = 8.4;
    this.nightLightRing.visible = lightStrength > 0.02;
    this.nightLightRingMat.opacity = lightStrength * 0.85;
    const pulse = 1 + Math.sin(this.elapsedTotal * 3.2) * 0.025;
    this.nightLightRing.scale.setScalar(pulse);

    this.moonMesh.visible = nightFactor > 0.25;
    this.starField.visible = nightFactor > 0.25;

    if (this.fairyBulbMat) {
      this.fairyBulbMat.color.setHex(nightFactor > 0.4 ? 0xffffff : 0xd4d4d8);
    }
  }

  public setScreenState(state: GameScreenState): void {
    this.screenState = state;
    if (state !== 'playing') {
      this.keysHeld.clear();
      this.dpadIntent = { moveX: 0, moveZ: 0 };
    }
    this.syncEnvironmentLighting();
  }

  public triggerVictoryCelebration(): void {
    this.celebrationActive = true;
    this.clearGroup(this.celebrationGroup);
    this.celebrationActors = [];

    const cx = this.sim.player.x;
    const cz = this.sim.player.z;

    for (let i = 0; i < 6; i++) {
      const actor = i < 2 ? createReindeerModel() : createElfModel();
      const angle = (i * Math.PI * 2) / 6;
      const radius = 2.6;
      actor.position.set(cx + Math.cos(angle) * radius, 0, cz + Math.sin(angle) * radius);
      actor.lookAt(cx, 0.5, cz);
      this.celebrationGroup.add(actor);
      this.celebrationActors.push({ mesh: actor, baseAngle: angle, radius, phase: i * 1.1 });
    }

    this.spawnBurst(cx, 1.5, cz, 0xfacc15, 28);
  }

  public setDpadIntent(moveX: number, moveZ: number): void {
    this.dpadIntent.moveX = moveX;
    this.dpadIntent.moveZ = moveZ;
  }

  public restartCurrentLevel(): void {
    this.loadLevel(this.currentLevel);
  }

  public getSim(): SimState {
    return this.sim;
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.85 ? 55 : 46;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.screenState !== 'playing') return;
    const code = e.code;
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'KeyW' ||
      code === 'KeyA' ||
      code === 'KeyS' ||
      code === 'KeyD'
    ) {
      this.keysHeld.add(code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = (): void => {
    this.keysHeld.clear();
    this.dpadIntent = { moveX: 0, moveZ: 0 };
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.keysHeld.clear();
      this.dpadIntent = { moveX: 0, moveZ: 0 };
    }
  };

  private getCurrentInput(): InputIntent {
    let x = this.dpadIntent.moveX;
    let z = this.dpadIntent.moveZ;
    if (this.keysHeld.has('ArrowLeft') || this.keysHeld.has('KeyA')) x -= 1;
    if (this.keysHeld.has('ArrowRight') || this.keysHeld.has('KeyD')) x += 1;
    if (this.keysHeld.has('ArrowUp') || this.keysHeld.has('KeyW')) z -= 1;
    if (this.keysHeld.has('ArrowDown') || this.keysHeld.has('KeyS')) z += 1;
    return { moveX: x, moveZ: z };
  }

  private spawnBurst(
    x: number,
    y: number,
    z: number,
    hexColor: number,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const slot = this.burstPool[this.burstCursor];
      this.burstCursor = (this.burstCursor + 1) % this.burstCount;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 2.0 + Math.random() * 4.5;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = Math.cos(angle) * speed;
      slot.vy = 2.5 + Math.random() * 4.0;
      slot.vz = Math.sin(angle) * speed;
      slot.life = 0;
      slot.maxLife = 0.55 + Math.random() * 0.35;
      slot.scale = 0.9 + Math.random() * 0.7;
      slot.color.setHex(hexColor);
    }
  }

  private handleEvents(events: GameEvent[]): void {
    for (const ev of events) {
      switch (ev.kind) {
        case 'present':
          audioEngine.playPresent();
          this.spawnBurst(ev.x, 0.8, ev.z, 0xf43f5e, 10);
          break;
        case 'hidden_present':
          audioEngine.playStar();
          this.spawnBurst(ev.x, 0.8, ev.z, 0xa855f7, 16);
          break;
        case 'deliver':
          audioEngine.playDeliver();
          this.spawnBurst(ev.x, 1.4, ev.z, 0x22c55e, 18);
          break;
        case 'cookie':
          audioEngine.playCookie();
          this.spawnBurst(ev.x, 0.7, ev.z, 0xfbbf24, 12);
          break;
        case 'heal_tick':
          audioEngine.playHealTick();
          this.spawnBurst(ev.x, 1.1, ev.z, 0x4ade80, 6);
          break;
        case 'fake_cookie':
          audioEngine.playFakeCookie();
          this.spawnBurst(ev.x, 0.9, ev.z, 0xef4444, 18);
          break;
        case 'key':
          audioEngine.playKey();
          this.spawnBurst(ev.x, 0.9, ev.z, 0xfde047, 14);
          break;
        case 'gate_open':
          audioEngine.playGateOpen();
          this.spawnBurst(ev.x, 1.2, ev.z, 0xfacc15, 16);
          break;
        case 'exit_gate_open':
          audioEngine.playGateOpen();
          this.spawnBurst(ev.x, 1.4, ev.z, 0x34d399, 24);
          break;
        case 'star':
          audioEngine.playStar();
          this.spawnBurst(ev.x, 0.9, ev.z, 0xfde047, 14);
          break;
        case 'golden_cookie':
          audioEngine.playGoldenCookie();
          this.spawnBurst(ev.x, 1.1, ev.z, 0xfbbf24, 24);
          break;
        case 'portal_unlock':
          audioEngine.playPortalUnlock();
          this.spawnBurst(ev.x, 1.2, ev.z, 0x34d399, 22);
          break;
        case 'enemy_detect':
          audioEngine.playEnemyDetect();
          break;
        case 'hazard_hit':
        case 'trap_hit':
          audioEngine.playHazardHit();
          this.spawnBurst(ev.x, 0.9, ev.z, 0x7dd3fc, 16);
          break;
        case 'day_start':
          audioEngine.setMusicPhase('day');
          break;
        case 'night_start':
          audioEngine.setMusicPhase('night');
          break;
        case 'game_over':
          audioEngine.playGameOver();
          this.callbacks.onGameOver(this.sim, this.currentLevel);
          break;
        case 'level_complete':
          audioEngine.playVictory();
          this.spawnBurst(ev.x, 1.4, ev.z, 0xfacc15, 26);
          this.callbacks.onLevelComplete(this.sim, this.currentLevel);
          break;
      }
    }
  }

  private updateVisuals(dt: number): void {
    const t = this.elapsedTotal;

    this.syncEnvironmentLighting();

    // Snowfall update
    for (let i = 0; i < this.snowCount; i++) {
      const idx = i * 3;
      this.snowPositions[idx + 1] -= this.snowSpeeds[i] * dt;
      this.snowPositions[idx] += Math.sin(t * 0.9 + i) * 0.55 * dt;
      if (this.snowPositions[idx + 1] < 0) {
        this.snowPositions[idx + 1] = 22 + (i % 5);
      }
      _dummy.position.set(
        this.snowPositions[idx],
        this.snowPositions[idx + 1],
        this.snowPositions[idx + 2],
      );
      _dummy.rotation.set(t + i, t * 0.7, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      this.snowInstanced.setMatrixAt(i, _dummy.matrix);
    }
    this.snowInstanced.instanceMatrix.needsUpdate = true;

    // Burst Particles update
    let anyBurstChanged = false;
    for (let i = 0; i < this.burstCount; i++) {
      const slot = this.burstPool[i];
      if (!slot.active) {
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0.001);
        _dummy.updateMatrix();
        this.burstInstanced.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      anyBurstChanged = true;
      slot.life += dt;
      if (slot.life >= slot.maxLife) {
        slot.active = false;
        continue;
      }
      slot.vy -= 9.5 * dt;
      slot.x += slot.vx * dt;
      slot.y = Math.max(0.1, slot.y + slot.vy * dt);
      slot.z += slot.vz * dt;
      const fade = 1 - slot.life / slot.maxLife;
      _dummy.position.set(slot.x, slot.y, slot.z);
      _dummy.rotation.set(slot.life * 6, slot.life * 4, 0);
      _dummy.scale.setScalar(slot.scale * fade);
      _dummy.updateMatrix();
      this.burstInstanced.setMatrixAt(i, _dummy.matrix);
      this.burstInstanced.setColorAt(i, slot.color);
    }
    this.burstInstanced.instanceMatrix.needsUpdate = true;
    if (anyBurstChanged && this.burstInstanced.instanceColor) {
      this.burstInstanced.instanceColor.needsUpdate = true;
    }

    // Collectibles spin & hover
    for (const item of this.sim.collectibles) {
      const mesh = this.collectibleMeshes.get(item.id);
      if (!mesh) continue;
      mesh.visible = !item.collected;
      if (!item.collected) {
        mesh.rotation.y = t * 1.8 + item.row;
        mesh.position.y = Math.sin(t * 3 + item.col) * 0.1;
      }
    }

    // Houses beacon & delivered icon update
    for (const house of this.sim.houses) {
      const mesh = this.houseMeshes.get(house.id);
      if (!mesh) continue;
      const parts = mesh.userData.parts as {
        beacon: THREE.Mesh;
        beaconMat: THREE.MeshStandardMaterial;
        windowMat: THREE.MeshStandardMaterial;
        deliveredBadge: THREE.Group;
        doorstepGift: THREE.Group;
      };
      if (house.delivered) {
        parts.beacon.visible = false;
        parts.deliveredBadge.visible = true;
        parts.doorstepGift.visible = true;
        parts.deliveredBadge.rotation.y = t * 1.6;
        parts.deliveredBadge.position.y = 2.48 + Math.sin(t * 3.5) * 0.12;
        parts.windowMat.emissiveIntensity = 1.25;
      } else {
        parts.beacon.visible = true;
        parts.deliveredBadge.visible = false;
        parts.doorstepGift.visible = false;
        parts.beacon.rotation.y = t * 2.2;
        parts.beacon.position.y = 2.35 + Math.sin(t * 3.5) * 0.12;
        parts.beaconMat.color.setHex(0xf97316);
        parts.beaconMat.emissive.setHex(0xf97316);
        parts.beaconMat.emissiveIntensity = 0.85;
      }
    }

    // Gates slide open & exit gate padlock turns emerald when unlocked
    for (const gate of this.sim.gates) {
      const mesh = this.gateMeshes.get(gate.id);
      if (!mesh) continue;
      const parts = mesh.userData.parts as {
        slidingDoor: THREE.Group;
        lockMat: THREE.MeshStandardMaterial;
      };
      if (gate.kind === 'exit_gate' && gate.unlocked) {
        parts.lockMat.color.setHex(0x22c55e);
        parts.lockMat.emissive.setHex(0x16a34a);
      }
      parts.slidingDoor.position.y = gate.openProgress * 2.4;
      parts.slidingDoor.visible = gate.openProgress < 0.98;
    }

    // Frost traps telegraph & spike rise
    for (const trap of this.sim.traps) {
      const mesh = this.trapMeshes.get(trap.id);
      if (!mesh) continue;
      const parts = mesh.userData.parts as {
        baseMat: THREE.MeshStandardMaterial;
        spikesGroup: THREE.Group;
      };
      const phase = (this.sim.elapsedTime + trap.phaseOffset) % 4.0;
      const telegraph = !trap.active && phase >= 1.8;
      const targetY = trap.active ? 0.04 : -0.55;
      parts.spikesGroup.position.y +=
        (targetY - parts.spikesGroup.position.y) * Math.min(1, dt * 16);
      parts.baseMat.emissive.setHex(trap.active ? 0xef4444 : telegraph ? 0xf59e0b : 0x0284c7);
      parts.baseMat.emissiveIntensity = trap.active ? 1.2 : telegraph ? 0.85 : 0.25;
    }

    // Portal vortex
    if (this.portalMesh) {
      const parts = this.portalMesh.userData.parts as {
        vortexDisc: THREE.Mesh;
        vortexMat: THREE.MeshStandardMaterial;
        spinRing: THREE.Mesh;
        ringMat: THREE.MeshStandardMaterial;
      };
      parts.spinRing.rotation.z = t * (this.sim.portal.unlocked ? 3.5 : 0.8);
      if (this.sim.portal.unlocked) {
        parts.vortexMat.color.setHex(0x34d399);
        parts.vortexMat.emissive.setHex(0x10b981);
        parts.vortexMat.emissiveIntensity = 1.4;
        parts.ringMat.color.setHex(0xfde047);
        parts.ringMat.emissive.setHex(0xf59e0b);
        parts.ringMat.emissiveIntensity = 1.1;
      } else {
        parts.vortexMat.color.setHex(0x64748b);
        parts.vortexMat.emissive.setHex(0x1e293b);
        parts.vortexMat.emissiveIntensity = 0.4;
        parts.ringMat.color.setHex(0x94a3b8);
        parts.ringMat.emissive.setHex(0x475569);
        parts.ringMat.emissiveIntensity = 0.35;
      }
    }

    // Hazards sync (chasing indicators + animations)
    for (const h of this.sim.hazards) {
      const mesh = this.hazardMeshes.get(h.id);
      if (!mesh) continue;
      mesh.position.set(h.x, 0, h.z);
      mesh.rotation.y = h.facing;

      const hParts = mesh.userData.parts as {
        alertOrb?: THREE.Mesh;
        sphere?: THREE.Mesh;
        shardL?: THREE.Mesh;
        shardR?: THREE.Mesh;
      };
      if (hParts?.alertOrb) {
        hParts.alertOrb.visible = h.alertTimer > 0 || h.aiState === 'chase';
        hParts.alertOrb.rotation.y = t * 5;
      }

      if (h.kind === 'snowball' && hParts?.sphere) {
        hParts.sphere.rotation.x += dt * 6;
      } else if (h.kind === 'ice_creature') {
        mesh.position.y = Math.sin(t * 4.5 + h.x) * 0.14 + 0.14;
        if (hParts?.shardL && hParts?.shardR) {
          hParts.shardL.rotation.y = t * 3;
          hParts.shardR.rotation.y = -t * 3;
        }
      } else {
        mesh.position.y = Math.abs(Math.sin(t * 7 + h.x)) * 0.12;
      }
    }

    // Santa transform + Night Mode light tracking
    const p = this.sim.player;
    this.santaMesh.position.set(p.x, 0, p.z);
    this.santaShadow.position.set(p.x, 0.02, p.z);
    this.nightLightRing.position.set(p.x, 0.04, p.z);
    this.playerLight.position.set(p.x, 2.7, p.z);

    const spinOffset = p.spinTimer > 0 ? p.spinTimer * 18 : 0;
    this.santaMesh.rotation.y = p.facing + spinOffset;

    // Invulnerability blink
    this.santaMesh.visible =
      p.invulnTimer <= 0 || Math.floor(p.invulnTimer * 16) % 2 === 0;

    const parts = this.santaMesh.userData.parts as {
      body: THREE.Group;
      leftLeg: THREE.Group;
      rightLeg: THREE.Group;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
    };
    parts.body.scale.set(p.squashX, p.squashY, p.squashX);

    if (this.celebrationActive) {
      this.santaMesh.position.y = Math.abs(Math.sin(t * 6)) * 0.35;
      parts.leftArm.rotation.z = -1.2 + Math.sin(t * 8) * 0.4;
      parts.rightArm.rotation.z = 1.2 - Math.sin(t * 8) * 0.4;
      for (const act of this.celebrationActors) {
        const a = act.baseAngle + t * 0.65;
        act.mesh.position.set(
          p.x + Math.cos(a) * act.radius,
          Math.abs(Math.sin(t * 5 + act.phase)) * 0.32,
          p.z + Math.sin(a) * act.radius,
        );
        act.mesh.lookAt(p.x, 0.5, p.z);
      }
      if (Math.random() < dt * 2.5) {
        const colors = [0xfacc15, 0xef4444, 0x22c55e, 0x38bdf8];
        this.spawnBurst(
          p.x + (Math.random() - 0.5) * 4,
          2.2 + Math.random() * 1.5,
          p.z + (Math.random() - 0.5) * 4,
          colors[Math.floor(Math.random() * colors.length)],
          10,
        );
      }
    } else if (this.screenState === 'title') {
      this.santaMesh.position.y = 0;
      parts.leftLeg.rotation.x = 0;
      parts.rightLeg.rotation.x = 0;
      parts.leftArm.rotation.z = 0.1;
      parts.rightArm.rotation.z = 2.2 + Math.sin(t * 5.5) * 0.35;
    } else {
      const stride = Math.sin(p.distanceTraveled * 3.8);
      const speedMag = Math.min(1, Math.hypot(p.vx, p.vz) / 5.5);
      parts.leftLeg.rotation.x = stride * 0.65 * speedMag;
      parts.rightLeg.rotation.x = -stride * 0.65 * speedMag;
      parts.leftArm.rotation.x = -stride * 0.5 * speedMag;
      parts.rightArm.rotation.x = stride * 0.5 * speedMag;
      parts.leftArm.rotation.z = 0.08;
      parts.rightArm.rotation.z = -0.08;
      this.santaMesh.position.y = Math.abs(stride) * 0.08 * speedMag;
    }

    // Camera Choreography
    const dampAlpha = 1 - Math.exp(-7.5 * dt);
    if (this.celebrationActive) {
      _camTargetPos.set(p.x + 5.5, 4.6, p.z + 7.5);
      _camLookTarget.set(p.x, 1.2, p.z);
      this.camera.position.lerp(_camTargetPos, dampAlpha);
      this.camera.lookAt(_camLookTarget);
    } else if (
      this.screenState === 'title' ||
      this.screenState === 'level-select' ||
      this.screenState === 'chapter-intro'
    ) {
      const sway = Math.sin(t * 0.45) * 1.4;
      _camTargetPos.set(
        this.sim.player.x - 2.0 + sway,
        9.4 + Math.sin(t * 0.35) * 0.5,
        this.sim.player.z + 11.4,
      );
      _camLookTarget.set(this.sim.player.x - 1.6, 1.0, this.sim.player.z + 0.8);
      this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-4.0 * dt));
      this.camera.lookAt(_camLookTarget);
    } else {
      const isPortrait = this.camera.aspect < 0.85;
      const traumaShake = this.sim.cameraTrauma * this.sim.cameraTrauma;
      const shakeX = traumaShake * Math.sin(t * 47) * 0.45;
      const shakeY = traumaShake * Math.cos(t * 53) * 0.35;

      _camTargetPos.set(
        p.x + shakeX,
        (isPortrait ? 20.5 : 17.6) + shakeY,
        p.z + (isPortrait ? 9.8 : 9.2),
      );
      _camLookTarget.set(p.x, 0.6, p.z - 0.3);
      this.camera.position.lerp(_camTargetPos, dampAlpha);
      this.camera.lookAt(_camLookTarget);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const maxDt = this.isSoftwareGl ? 0.35 : 0.2;
    const clampedTotal = Math.min(Math.max(rawDt, 0.001), maxDt);
    this.elapsedTotal += clampedTotal;

    if (this.screenState === 'playing' && !this.sim.completed && !this.sim.gameOver) {
      let remaining = clampedTotal;
      const input = this.getCurrentInput();
      let anyEvents = false;
      while (remaining > 0.0001 && !this.sim.completed && !this.sim.gameOver) {
        const subDt = Math.min(remaining, 0.04);
        remaining -= subDt;
        const events = stepSimulation(this.sim, subDt, input);
        if (events.length > 0) {
          anyEvents = true;
          this.handleEvents(events);
        }
      }
      if (now - this.lastHudPush >= 100 || anyEvents) {
        this.lastHudPush = now;
        this.callbacks.onHudUpdate(getHudSnapshot(this.sim, this.currentLevel));
      }
    }

    this.updateVisuals(clampedTotal);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
