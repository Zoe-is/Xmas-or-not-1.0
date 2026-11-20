import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getChapterById, getOutfitById } from './chapters';
import { createChapterDioramaModel, createSantaModel } from './models';
import type { ChapterId, SantaOutfitId } from './types';

export type PreviewTarget =
  | { kind: 'chapter'; id: ChapterId }
  | { kind: 'outfit'; id: SantaOutfitId };

const PREVIEW_W = 280;
const PREVIEW_H = 210;
const DEFAULT_CHAPTER_YAW = 0.45;
const DEFAULT_OUTFIT_YAW = 0.35;

class SharedPreviewRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private rootSlot = new THREE.Group();
  private models = new Map<string, THREE.Group>();
  private staticImageCache = new Map<string, HTMLImageElement>();
  private isSoftwareGl = false;

  private ensureInit(): boolean {
    if (this.renderer && this.scene && this.camera) return true;

    const probe = document.createElement('canvas').getContext('webgl2');
    if (probe) {
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } else {
      this.isSoftwareGl = true;
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(PREVIEW_W, PREVIEW_H, false);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.9;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x64748b, 0.9);
    const key = new THREE.DirectionalLight(0xfff4d6, 1.55);
    key.position.set(4, 6, 5);
    const rim = new THREE.DirectionalLight(0x93c5fd, 0.75);
    rim.position.set(-4, 3, -5);
    scene.add(hemi, key, rim, this.rootSlot);

    const camera = new THREE.PerspectiveCamera(36, PREVIEW_W / PREVIEW_H, 0.1, 40);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    return true;
  }

  public getIsSoftwareGl(): boolean {
    this.ensureInit();
    return this.isSoftwareGl;
  }

  private getOrCreateModel(target: PreviewTarget): THREE.Group {
    const key = `${target.kind}:${target.id}`;
    const existing = this.models.get(key);
    if (existing) return existing;

    let group: THREE.Group;
    if (target.kind === 'chapter') {
      const ch = getChapterById(target.id);
      group = createChapterDioramaModel(ch);
      // Center vertically on stage
      group.position.set(0, -1.05, 0);
    } else {
      const outfit = getOutfitById(target.id);
      group = createSantaModel(outfit);
      group.scale.setScalar(1.22);
      group.position.set(0, -1.05, 0);
    }
    this.models.set(key, group);
    return group;
  }

  public getDefaultYaw(target: PreviewTarget): number {
    return target.kind === 'chapter' ? DEFAULT_CHAPTER_YAW : DEFAULT_OUTFIT_YAW;
  }

  private renderToOffscreen(target: PreviewTarget, yaw: number): HTMLCanvasElement | null {
    if (!this.ensureInit() || !this.renderer || !this.scene || !this.camera) {
      return null;
    }

    while (this.rootSlot.children.length > 0) {
      this.rootSlot.remove(this.rootSlot.children[0]);
    }
    const model = this.getOrCreateModel(target);
    this.rootSlot.rotation.set(0, yaw, 0);
    this.rootSlot.add(model);

    if (target.kind === 'chapter') {
      this.camera.position.set(0, 2.25, 5.85);
      this.camera.lookAt(0, 0.28, 0);
    } else {
      this.camera.position.set(0, 0.72, 4.35);
      this.camera.lookAt(0, 0.08, 0);
    }

    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement;
  }

  public drawAngleToCanvas(
    target: PreviewTarget,
    yaw: number,
    destCanvas: HTMLCanvasElement,
  ): void {
    const src = this.renderToOffscreen(target, yaw);
    if (!src) return;
    const ctx = destCanvas.getContext('2d');
    if (!ctx) return;
    if (destCanvas.width !== src.width || destCanvas.height !== src.height) {
      destCanvas.width = src.width;
      destCanvas.height = src.height;
    }
    ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
    ctx.drawImage(src, 0, 0);
  }

  public drawRestingToCanvas(
    target: PreviewTarget,
    destCanvas: HTMLCanvasElement,
  ): void {
    const key = `${target.kind}:${target.id}`;
    const cached = this.staticImageCache.get(key);
    if (cached && cached.complete) {
      const ctx = destCanvas.getContext('2d');
      if (!ctx) return;
      if (destCanvas.width !== cached.width || destCanvas.height !== cached.height) {
        destCanvas.width = cached.width;
        destCanvas.height = cached.height;
      }
      ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
      ctx.drawImage(cached, 0, 0);
      return;
    }

    const src = this.renderToOffscreen(target, this.getDefaultYaw(target));
    if (!src) return;
    const ctx = destCanvas.getContext('2d');
    if (ctx) {
      if (destCanvas.width !== src.width || destCanvas.height !== src.height) {
        destCanvas.width = src.width;
        destCanvas.height = src.height;
      }
      ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
      ctx.drawImage(src, 0, 0);
    }

    const img = new Image();
    img.src = src.toDataURL('image/png');
    img.width = src.width;
    img.height = src.height;
    this.staticImageCache.set(key, img);
  }
}

export const sharedPreviewRenderer = new SharedPreviewRenderer();
