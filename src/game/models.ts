import * as THREE from 'three';
import type { ChapterDefinition, ChapterId, SantaOutfit, SantaOutfitId } from './types';

function createExtrudedStarGeometry(
  outerR: number,
  innerR: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

export function createSantaModel(outfit?: SantaOutfit): THREE.Group {
  const group = new THREE.Group();

  const redSuitMat = new THREE.MeshStandardMaterial({
    color: outfit?.coatColor ?? 0xdc2626,
    roughness: 0.72,
    metalness: 0.05,
  });
  const furTrimMat = new THREE.MeshStandardMaterial({
    color: outfit?.trimColor ?? 0xf8fafc,
    roughness: 0.92,
    metalness: 0.0,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfdcba6,
    roughness: 0.68,
    metalness: 0.0,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.15,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: outfit?.accentColor ?? 0xfbbf24,
    roughness: 0.22,
    metalness: 0.85,
  });
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.8,
    metalness: 0.05,
  });

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.35, 0);
  const leftBoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 4, 8), bootMat);
  leftBoot.position.y = -0.18;
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.35, 0);
  const rightBoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 4, 8), bootMat);
  rightBoot.position.y = -0.18;
  rightBoot.castShadow = true;
  rightLeg.add(rightBoot);

  const body = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.68, 16), redSuitMat);
  torso.position.y = 0.66;
  torso.castShadow = true;
  body.add(torso);

  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.075, 10, 20), furTrimMat);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.35;
  body.add(hem);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.385, 0.11, 18), bootMat);
  belt.position.y = 0.6;
  body.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), goldMat);
  buckle.position.set(0, 0.6, 0.38);
  body.add(buckle);

  const bag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 1), bagMat);
  bag.position.set(0, 0.72, -0.38);
  bag.scale.set(0.95, 1.15, 0.85);
  bag.castShadow = true;
  body.add(bag);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), skinMat);
  head.position.y = 1.18;
  head.castShadow = true;
  body.add(head);

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.36, 12), furTrimMat);
  beard.rotation.x = Math.PI;
  beard.position.set(0, 1.0, 0.17);
  body.add(beard);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.45 }),
  );
  nose.position.set(0, 1.18, 0.25);
  body.add(nose);

  const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.085, 1.24, 0.22);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.085, 1.24, 0.22);
  body.add(eyeL, eyeR);

  const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.065, 10, 18), furTrimMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 1.36;
  body.add(hatBrim);

  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 14), redSuitMat);
  hatCone.position.set(0, 1.56, -0.04);
  hatCone.rotation.x = -0.22;
  hatCone.castShadow = true;
  body.add(hatCone);

  const hatPom = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), furTrimMat);
  hatPom.position.set(0, 1.78, -0.14);
  body.add(hatPom);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.9, 0);
  const lSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.24, 4, 8), redSuitMat);
  lSleeve.position.y = -0.14;
  const lMitten = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), furTrimMat);
  lMitten.position.y = -0.3;
  leftArm.add(lSleeve, lMitten);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.9, 0);
  const rSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.24, 4, 8), redSuitMat);
  rSleeve.position.y = -0.14;
  const rMitten = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), furTrimMat);
  rMitten.position.y = -0.3;
  rightArm.add(rSleeve, rMitten);

  body.add(leftArm, rightArm);

  // Distinct 3D Outfit Accessories (toggled by outfit id)
  const outfitAccessories: Record<SantaOutfitId, THREE.Group> = {
    classic_red: new THREE.Group(),
    frost_royal: new THREE.Group(),
    golden_explorer: new THREE.Group(),
    emerald_elf_king: new THREE.Group(),
    aurora_starlight: new THREE.Group(),
    north_pole_master: new THREE.Group(),
  };

  // Frost Royal: silver-ice epaulets & sapphire brooch
  const sapphireMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
    roughness: 0.15,
    metalness: 0.75,
  });
  for (const sx of [-0.36, 0.36]) {
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.22), goldMat);
    ep.position.set(sx, 0.99, 0);
    ep.rotation.z = sx < 0 ? 0.2 : -0.2;
    outfitAccessories.frost_royal.add(ep);
  }
  const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), sapphireMat);
  brooch.position.set(0, 0.88, 0.36);
  outfitAccessories.frost_royal.add(brooch);

  // Golden Explorer: brass goggles on hat brim & compass pack
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.85,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.4,
  });
  for (const gx of [-0.1, 0.1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 16), brassMat);
    rim.position.set(gx, 1.38, 0.25);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(gx, 1.38, 0.24);
    outfitAccessories.golden_explorer.add(rim, lens);
  }

  // Emerald Elf-King: golden feather plume & royal collar spikes
  const plumeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.65,
  });
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.38, 8), plumeMat);
  feather.position.set(0.19, 1.56, 0.08);
  feather.rotation.z = -0.38;
  feather.rotation.x = -0.2;
  const collarL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), goldMat);
  collarL.position.set(-0.26, 1.06, 0.06);
  collarL.rotation.z = 0.55;
  const collarR = collarL.clone();
  collarR.position.x = 0.26;
  collarR.rotation.z = -0.55;
  outfitAccessories.emerald_elf_king.add(feather, collarL, collarR);

  // Aurora Starlight: floating emerald aurora halo & crystal star emblem
  const auroraMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.6,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.032, 8, 24), auroraMat);
  halo.rotation.x = Math.PI / 2.2;
  halo.position.set(0, 1.88, -0.05);
  const starEmblem = new THREE.Mesh(createExtrudedStarGeometry(0.11, 0.05, 0.04), auroraMat);
  starEmblem.position.set(0, 0.88, 0.36);
  outfitAccessories.aurora_starlight.add(halo, starEmblem);

  // North Pole Master: golden crown on hat & royal shoulder tassels
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.18,
    metalness: 0.88,
  });
  const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 20), crownMat);
  crownBand.rotation.x = Math.PI / 2;
  crownBand.position.set(0, 1.44, 0);
  outfitAccessories.north_pole_master.add(crownBand);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), crownMat);
    spike.position.set(Math.cos(a) * 0.23, 1.52, Math.sin(a) * 0.23);
    outfitAccessories.north_pole_master.add(spike);
  }
  const masterStar = new THREE.Mesh(createExtrudedStarGeometry(0.12, 0.055, 0.04), crownMat);
  masterStar.position.set(0, 0.88, 0.37);
  outfitAccessories.north_pole_master.add(masterStar);

  const activeOutfitId = outfit?.id ?? 'classic_red';
  (Object.keys(outfitAccessories) as SantaOutfitId[]).forEach((id) => {
    outfitAccessories[id].visible = id === activeOutfitId;
    body.add(outfitAccessories[id]);
  });

  group.add(leftLeg, rightLeg, body);

  group.userData.parts = {
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    hatPom,
    bag,
    redSuitMat,
    furTrimMat,
    goldMat,
    outfitAccessories,
  };
  return group;
}

export function applySantaOutfitToModel(santaMesh: THREE.Group, outfit: SantaOutfit): void {
  const parts = santaMesh.userData.parts as {
    redSuitMat?: THREE.MeshStandardMaterial;
    furTrimMat?: THREE.MeshStandardMaterial;
    goldMat?: THREE.MeshStandardMaterial;
    outfitAccessories?: Record<SantaOutfitId, THREE.Group>;
  };
  parts.redSuitMat?.color.setHex(outfit.coatColor);
  parts.furTrimMat?.color.setHex(outfit.trimColor);
  parts.goldMat?.color.setHex(outfit.accentColor);
  if (parts.outfitAccessories) {
    (Object.keys(parts.outfitAccessories) as SantaOutfitId[]).forEach((id) => {
      parts.outfitAccessories![id].visible = id === outfit.id;
    });
  }
}

export function createHouseModel(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.78,
    metalness: 0.02,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.65,
    metalness: 0.05,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.88,
    metalness: 0.0,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.82,
    metalness: 0.05,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.35), wallMat);
  base.position.y = 0.525;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.82, 4), roofMat);
  roof.position.y = 1.44;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const roofSnow = new THREE.Mesh(new THREE.ConeGeometry(1.16, 0.3, 4), snowMat);
  roofSnow.position.y = 1.72;
  roofSnow.rotation.y = Math.PI / 4;
  group.add(roofSnow);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.28), woodMat);
  chimney.position.set(0.4, 1.55, -0.25);
  chimney.castShadow = true;
  group.add(chimney);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.08), woodMat);
  door.position.set(0, 0.31, 0.68);
  group.add(door);

  const wreath = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.035, 8, 14),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }),
  );
  wreath.position.set(0, 0.45, 0.73);
  group.add(wreath);

  const winL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.06), windowMat);
  winL.position.set(-0.44, 0.58, 0.68);
  const winR = winL.clone();
  winR.position.x = 0.44;
  group.add(winL, winR);

  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xf97316,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.5,
  });
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), beaconMat);
  beacon.position.y = 2.35;
  group.add(beacon);

  // Delivered house icon badge (floating emerald medallion + white checkmark + gold rim)
  const deliveredBadge = new THREE.Group();
  deliveredBadge.position.y = 2.48;
  deliveredBadge.visible = false;

  const badgeDiscMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.95,
    roughness: 0.25,
    metalness: 0.2,
  });
  const badgeDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.08, 22),
    badgeDiscMat,
  );
  badgeDisc.rotation.x = Math.PI / 2;
  deliveredBadge.add(badgeDisc);

  const badgeRimMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.6,
  });
  const badgeRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.04, 10, 24),
    badgeRimMat,
  );
  deliveredBadge.add(badgeRim);

  const checkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const checkShort = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.065, 0.13),
    checkMat,
  );
  checkShort.position.set(-0.08, -0.035, 0);
  checkShort.rotation.z = -Math.PI / 4;

  const checkLong = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.065, 0.13),
    checkMat,
  );
  checkLong.position.set(0.06, 0.025, 0);
  checkLong.rotation.z = Math.PI / 4;
  deliveredBadge.add(checkShort, checkLong);
  group.add(deliveredBadge);

  // Delivered present resting by the front porch
  const doorstepGift = createPresentModel(false);
  doorstepGift.scale.setScalar(0.55);
  doorstepGift.position.set(0.42, 0, 0.88);
  doorstepGift.rotation.y = 0.35;
  doorstepGift.visible = false;
  group.add(doorstepGift);

  group.userData.parts = {
    beacon,
    beaconMat,
    windowMat,
    deliveredBadge,
    doorstepGift,
  };
  return group;
}

export function createPresentModel(isHidden: boolean): THREE.Group {
  const group = new THREE.Group();
  const boxColor = isHidden ? 0x9333ea : 0xe11d48;
  const ribbonColor = isHidden ? 0xfde047 : 0x22c55e;

  const boxMat = new THREE.MeshStandardMaterial({
    color: boxColor,
    roughness: 0.42,
    metalness: 0.1,
  });
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: ribbonColor,
    emissive: isHidden ? 0xfacc15 : 0x000000,
    emissiveIntensity: isHidden ? 0.3 : 0,
    roughness: 0.22,
    metalness: 0.55,
  });

  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.58, 0.66), boxMat);
  cube.position.y = 0.34;
  cube.castShadow = true;
  group.add(cube);

  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.14), ribbonMat);
  rib1.position.y = 0.34;
  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.7), ribbonMat);
  rib2.position.y = 0.34;
  group.add(rib1, rib2);

  const bow1 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 8, 14), ribbonMat);
  bow1.position.set(-0.1, 0.68, 0);
  bow1.rotation.z = 0.4;
  const bow2 = bow1.clone();
  bow2.position.x = 0.1;
  bow2.rotation.z = -0.4;
  group.add(bow1, bow2);

  return group;
}

export function createCookieModel(): THREE.Group {
  const group = new THREE.Group();

  const doughMat = new THREE.MeshStandardMaterial({
    color: 0xd99b52,
    roughness: 0.78,
    metalness: 0.02,
  });
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x3f2314,
    roughness: 0.45,
    metalness: 0.05,
  });

  const biscuit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 18), doughMat);
  biscuit.position.y = 0.48;
  biscuit.rotation.x = 0.35;
  biscuit.castShadow = true;
  group.add(biscuit);

  const chipOffsets: Array<[number, number]> = [
    [-0.14, 0.1],
    [0.16, 0.12],
    [0, -0.15],
    [-0.12, -0.12],
    [0.14, -0.08],
  ];
  for (const [cx, cz] of chipOffsets) {
    const chip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), chipMat);
    chip.position.set(cx, 0.07, cz);
    biscuit.add(chip);
  }

  return group;
}

export function createFakeCookieModel(hasClue: boolean): THREE.Group {
  const group = new THREE.Group();

  const doughMat = new THREE.MeshStandardMaterial({
    color: hasClue ? 0xd08c4a : 0xd7974f,
    roughness: 0.78,
    metalness: 0.02,
  });
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x3f2314,
    roughness: 0.45,
    metalness: 0.05,
  });
  const chiliChipMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    emissive: 0xef4444,
    emissiveIntensity: hasClue ? 0.32 : 0.06,
    roughness: 0.4,
  });

  const biscuit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 18), doughMat);
  biscuit.position.y = 0.48;
  biscuit.rotation.x = 0.35;
  biscuit.castShadow = true;
  group.add(biscuit);

  const chipOffsets: Array<[number, number]> = [
    [-0.14, 0.1],
    [0.16, 0.12],
    [0, -0.15],
    [-0.12, -0.12],
    [0.14, -0.08],
  ];
  chipOffsets.forEach(([cx, cz], idx) => {
    const isClueChip = hasClue && idx === 2;
    const chip = new THREE.Mesh(
      new THREE.SphereGeometry(isClueChip ? 0.065 : 0.055, 8, 8),
      isClueChip ? chiliChipMat : chipMat,
    );
    chip.position.set(cx, 0.07, cz);
    biscuit.add(chip);
  });

  return group;
}

export function createGoldenCookieModel(): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.88,
  });

  const starGeo = createExtrudedStarGeometry(0.55, 0.28, 0.16);
  const starMesh = new THREE.Mesh(starGeo, goldMat);
  starMesh.position.y = 0.68;
  starMesh.castShadow = true;
  group.add(starMesh);

  const haloMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.7,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 10, 28), haloMat);
  halo.position.y = 0.68;
  group.add(halo);

  group.userData.parts = { starMesh, halo };
  return group;
}

export function createKeyModel(): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.88,
  });

  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 10, 18), goldMat);
  bow.position.set(0, 0.82, 0);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.52, 10), goldMat);
  shaft.position.set(0, 0.42, 0);
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.06), goldMat);
  tooth1.position.set(0.1, 0.22, 0);
  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.06), goldMat);
  tooth2.position.set(0.08, 0.34, 0);

  group.add(bow, shaft, tooth1, tooth2);
  return group;
}

export function createStarModel(): THREE.Group {
  const group = new THREE.Group();
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.75,
  });
  const geo = createExtrudedStarGeometry(0.42, 0.2, 0.14);
  const mesh = new THREE.Mesh(geo, starMat);
  mesh.position.y = 0.62;
  mesh.castShadow = true;
  group.add(mesh);
  return group;
}

export function createFrostTrapModel(tileSize: number): THREE.Group {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
    roughness: 0.4,
    metalness: 0.4,
  });
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(tileSize * 0.72, 0.06, tileSize * 0.72),
    baseMat,
  );
  base.position.y = 0.03;
  group.add(base);

  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.3,
  });
  const spikesGroup = new THREE.Group();
  const offsets: Array<[number, number]> = [
    [-0.45, -0.45],
    [0.45, -0.45],
    [-0.45, 0.45],
    [0.45, 0.45],
    [0, 0],
  ];
  for (const [sx, sz] of offsets) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 6), spikeMat);
    spike.position.set(sx, 0.32, sz);
    spikesGroup.add(spike);
  }
  spikesGroup.position.y = -0.55;
  group.add(spikesGroup);
  group.userData.parts = { baseMat, spikesGroup };
  return group;
}

export function createLockedGateModel(
  tileSize: number,
  isExitGate = false,
): THREE.Group {
  const group = new THREE.Group();

  const pillarMat = new THREE.MeshStandardMaterial({
    color: isExitGate ? 0xf59e0b : 0xdc2626,
    roughness: 0.35,
    metalness: isExitGate ? 0.6 : 0.15,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
  });
  const barMat = new THREE.MeshStandardMaterial({
    color: isExitGate ? 0x1e293b : 0x334155,
    roughness: 0.3,
    metalness: 0.78,
  });
  const lockMat = new THREE.MeshStandardMaterial({
    color: isExitGate ? 0xef4444 : 0xfbbf24,
    emissive: isExitGate ? 0xdc2626 : 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.75,
  });

  const postOffset = tileSize * 0.44;
  for (const sx of [-postOffset, postOffset]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 2.35, 12), pillarMat);
    post.position.set(sx, 1.17, 0);
    post.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), whiteMat);
    cap.position.set(sx, 2.4, 0);
    group.add(post, cap);
  }

  // Crossbeam header for Exit Gate so it spans the corridor unmistakably
  if (isExitGate) {
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(tileSize * 1.02, 0.28, 0.28),
      pillarMat,
    );
    lintel.position.set(0, 2.28, 0);
    group.add(lintel);
  }

  const slidingDoor = new THREE.Group();
  const doorWidth = tileSize * 0.94;
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.16, 0.18), barMat);
  topRail.position.y = 1.95;
  const botRail = topRail.clone();
  botRail.position.y = 0.22;
  slidingDoor.add(topRail, botRail);

  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.78, 8), barMat);
    bar.position.set(i * (tileSize * 0.13), 1.1, 0);
    slidingDoor.add(bar);
  }

  const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.28), lockMat);
  padlock.position.set(0, 1.1, 0);
  slidingDoor.add(padlock);

  group.add(slidingDoor);
  group.userData.parts = { slidingDoor, lockMat };
  return group;
}

export function createPortalModel(): THREE.Group {
  const group = new THREE.Group();

  const archMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.3,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.4,
    metalness: 0.2,
  });

  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.16, 12, 28, Math.PI), archMat);
  arch.position.y = 1.1;
  arch.castShadow = true;
  group.add(arch);

  for (const sx of [-1.02, 1.02]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 1.1, 12), trimMat);
    leg.position.set(sx, 0.55, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  const vortexMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    emissive: 0x334155,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    roughness: 0.2,
  });
  const vortexDisc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), vortexMat);
  vortexDisc.position.y = 1.1;
  group.add(vortexDisc);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x475569,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.7,
  });
  const spinRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 24), ringMat);
  spinRing.position.y = 1.1;
  group.add(spinRing);

  const basePad = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.15, 0.1, 24),
    archMat,
  );
  basePad.position.y = 0.05;
  group.add(basePad);

  group.userData.parts = { vortexDisc, vortexMat, spinRing, ringMat };
  return group;
}

export function createSnowmanModel(): THREE.Group {
  const group = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.85,
    metalness: 0.0,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.15,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.72,
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
  });
  const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 12), snowMat);
  bot.position.y = 0.42;
  bot.castShadow = true;

  const mid = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), snowMat);
  mid.position.y = 0.96;
  mid.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), snowMat);
  head.position.y = 1.4;
  head.castShadow = true;

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.06, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.2;

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 8), noseMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.4, 0.27);

  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeL.position.set(-0.085, 1.47, 0.21);
  const eyeR = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeR.position.set(0.085, 1.47, 0.21);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14), hatMat);
  brim.position.y = 1.6;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 14), hatMat);
  crown.position.y = 1.75;

  const alertOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  );
  alertOrb.position.y = 2.15;
  alertOrb.visible = false;

  group.add(bot, mid, head, scarf, nose, eyeL, eyeR, brim, crown, alertOrb);
  group.userData.parts = { glowEyeMat, alertOrb };
  return group;
}

export function createElfModel(): THREE.Group {
  const group = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.68,
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.6,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfed7aa,
    roughness: 0.65,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.85,
  });
  const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 4, 8), redMat);
  legL.position.set(-0.13, 0.22, 0);
  const legR = legL.clone();
  legR.position.x = 0.13;

  const tunic = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.62, 12), greenMat);
  tunic.position.y = 0.62;
  tunic.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), skinMat);
  head.position.y = 1.05;
  head.castShadow = true;

  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeL.position.set(-0.075, 1.08, 0.18);
  const eyeR = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeR.position.set(0.075, 1.08, 0.18);

  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 12), greenMat);
  hat.position.set(0, 1.35, -0.04);
  hat.rotation.x = -0.25;

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldMat);
  bell.position.set(0, 1.54, -0.14);

  const alertOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  );
  alertOrb.position.y = 1.85;
  alertOrb.visible = false;

  group.add(legL, legR, tunic, head, eyeL, eyeR, hat, bell, alertOrb);
  group.userData.parts = { glowEyeMat, alertOrb };
  return group;
}

export function createIceCreatureModel(): THREE.Group {
  const group = new THREE.Group();
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.18,
    metalness: 0.55,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x7dd3fc,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });
  const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
  body.scale.set(0.9, 1.45, 0.9);
  body.position.y = 0.72;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), coreMat);
  head.position.y = 1.36;

  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.36, 5), crystalMat);
  crown.position.y = 1.66;

  const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeL.position.set(-0.09, 1.38, 0.21);
  const eyeR = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeR.position.set(0.09, 1.38, 0.21);

  const shardL = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), crystalMat);
  shardL.position.set(-0.48, 0.9, 0);
  const shardR = shardL.clone();
  shardR.position.x = 0.48;

  const alertOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
  );
  alertOrb.position.y = 2.05;
  alertOrb.visible = false;

  group.add(body, head, crown, eyeL, eyeR, shardL, shardR, alertOrb);
  group.userData.parts = { glowEyeMat, alertOrb, shardL, shardR };
  return group;
}

export function createSnowballModel(): THREE.Group {
  const group = new THREE.Group();
  const iceSnowMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.55,
    metalness: 0.08,
  });
  const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), iceSnowMat);
  sphere.position.y = 0.52;
  sphere.castShadow = true;
  group.add(sphere);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.035, 8, 20),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.14;
  group.add(ring);

  group.userData.parts = { sphere };
  return group;
}

export function createChristmasTreeModel(scale = 1): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8,
  });

  const baseSnow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.15, 0.14, 14),
    snowMat,
  );
  baseSnow.position.y = 0.07;
  group.add(baseSnow);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.65, 10), trunkMat);
  trunk.position.y = 0.35;
  group.add(trunk);

  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(0.98, 1.0, 12), leafMat);
  tier1.position.y = 1.05;
  tier1.castShadow = true;
  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.76, 0.9, 12), leafMat);
  tier2.position.y = 1.6;
  tier2.castShadow = true;
  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.78, 12), leafMat);
  tier3.position.y = 2.12;
  tier3.castShadow = true;
  const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.34, 12), snowMat);
  snowCap.position.y = 2.36;
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), starMat);
  star.position.y = 2.65;

  group.add(tier1, tier2, tier3, snowCap, star);
  group.scale.setScalar(scale);
  return group;
}

export function createReindeerModel(): THREE.Group {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.78 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd6b892, roughness: 0.85 });
  const antlerMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const harnessMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 12), furMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.72;
  body.castShadow = true;

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bellyMat);
  chest.position.set(0, 0.72, 0.26);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 8, 16), harnessMat);
  collar.position.set(0, 0.86, 0.34);
  collar.rotation.x = Math.PI / 3;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.42, 10), furMat);
  neck.position.set(0, 1.0, 0.42);
  neck.rotation.x = 0.25;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), furMat);
  head.position.set(0, 1.24, 0.52);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), noseMat);
  nose.position.set(0, 1.22, 0.72);

  const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.45, 6), antlerMat);
  antlerL.position.set(-0.14, 1.54, 0.46);
  antlerL.rotation.z = 0.35;
  const antlerR = antlerL.clone();
  antlerR.position.x = 0.14;
  antlerR.rotation.z = -0.35;

  const legOffsets: Array<[number, number]> = [
    [-0.16, 0.26],
    [0.16, 0.26],
    [-0.16, -0.26],
    [0.16, -0.26],
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.52, 8), furMat);
    leg.position.set(lx, 0.26, lz);
    group.add(leg);
  }

  group.add(body, chest, collar, neck, head, nose, antlerL, antlerR);
  return group;
}

export function createCityBackdropProps(
  cityId: ChapterId,
  halfW: number,
  halfD: number,
  isDark: boolean,
): THREE.Group {
  const group = new THREE.Group();

  const treeCoords: Array<[number, number, number]> = [
    [-halfW - 3.8, -halfD - 2.5, 1.3],
    [halfW + 3.8, -halfD - 2.5, 1.4],
    [-halfW - 4.0, halfD + 2.5, 1.2],
    [halfW + 4.0, halfD + 2.5, 1.3],
    [-halfW - 4.2, 0, 1.5],
    [halfW + 4.2, 0, 1.25],
  ];
  for (const [tx, tz, ts] of treeCoords) {
    const tree = createChristmasTreeModel(ts);
    tree.position.set(tx, 0, tz);
    group.add(tree);
  }

  const goldGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: isDark ? 1.2 : 0.45,
    roughness: 0.25,
  });

  switch (cityId) {
    case 'london': {
      const tower = new THREE.Group();
      tower.position.set(0, 0, -halfD - 6.5);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc2a375, roughness: 0.72 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 });
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(3.2, 11.5, 3.2), stoneMat);
      shaft.position.y = 5.75;
      const belfry = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), stoneMat);
      belfry.position.y = 12.2;
      const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), goldGlowMat);
      clockFace.position.set(0, 12.2, 1.82);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4.6, 4), roofMat);
      spire.position.y = 15.6;
      spire.rotation.y = Math.PI / 4;
      tower.add(shaft, belfry, clockFace, spire);
      group.add(tower);

      const boothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
      for (const bx of [-halfW - 3.6, halfW + 3.6]) {
        const booth = new THREE.Group();
        booth.position.set(bx, 0, -halfD * 0.45);
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.5, 1.1), boothMat);
        body.position.y = 1.25;
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 8), boothMat);
        dome.position.y = 2.55;
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 1.14), goldGlowMat);
        win.position.y = 1.35;
        booth.add(body, dome, win);
        group.add(booth);
      }
      break;
    }
    case 'paris': {
      const eiffel = new THREE.Group();
      eiffel.position.set(0, 0, -halfD - 7.5);
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x92704a,
        roughness: 0.42,
        metalness: 0.65,
      });
      const baseLegs = new THREE.Mesh(new THREE.ConeGeometry(4.2, 6.0, 4), ironMat);
      baseLegs.position.y = 3.0;
      baseLegs.rotation.y = Math.PI / 4;
      const midTier = new THREE.Mesh(new THREE.ConeGeometry(2.3, 6.2, 4), ironMat);
      midTier.position.y = 7.6;
      midTier.rotation.y = Math.PI / 4;
      const topSpire = new THREE.Mesh(new THREE.ConeGeometry(0.85, 6.5, 4), ironMat);
      topSpire.position.y = 12.6;
      topSpire.rotation.y = Math.PI / 4;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), goldGlowMat);
      beacon.position.y = 16.0;
      eiffel.add(baseLegs, midTier, topSpire, beacon);
      group.add(eiffel);
      break;
    }
    case 'new_york':
    case 'toronto': {
      const bldgMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.45,
        metalness: 0.35,
      });
      const heights = cityId === 'toronto' ? [9, 17, 10, 12] : [11, 15, 10, 13];
      heights.forEach((h, i) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(3.2, h, 3.2), bldgMat);
        tower.position.set(-9 + i * 6, h / 2, -halfD - 7.5);
        group.add(tower);
        const crown = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 2.4), goldGlowMat);
        crown.position.set(-9 + i * 6, h + 0.18, -halfD - 7.5);
        group.add(crown);
      });
      break;
    }
    case 'tokyo':
    case 'seoul': {
      const pagoda = new THREE.Group();
      pagoda.position.set(0, 0, -halfD - 7.0);
      const redMat = new THREE.MeshStandardMaterial({
        color: cityId === 'seoul' ? 0x1d4ed8 : 0xb91c1c,
        roughness: 0.45,
      });
      const darkRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      for (let tier = 0; tier < 4; tier++) {
        const w = 3.8 - tier * 0.65;
        const body = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 2.0, w * 0.72), redMat);
        body.position.y = 1.0 + tier * 2.4;
        const eave = new THREE.Mesh(new THREE.ConeGeometry(w, 0.9, 4), darkRoofMat);
        eave.position.y = 2.2 + tier * 2.4;
        eave.rotation.y = Math.PI / 4;
        pagoda.add(body, eave);
      }
      const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 2.2, 8), goldGlowMat);
      finial.position.y = 11.4;
      pagoda.add(finial);
      group.add(pagoda);

      const lanternMat = new THREE.MeshStandardMaterial({
        color: cityId === 'seoul' ? 0x38bdf8 : 0xef4444,
        emissive: cityId === 'seoul' ? 0x0284c7 : 0xef4444,
        emissiveIntensity: isDark ? 1.1 : 0.4,
        roughness: 0.35,
      });
      for (const lx of [-halfW - 3.2, halfW + 3.2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.0, 8), darkRoofMat);
        post.position.set(lx, 1.5, -halfD * 0.3);
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), lanternMat);
        lantern.scale.y = 1.3;
        lantern.position.set(lx, 2.7, -halfD * 0.3);
        group.add(post, lantern);
      }
      break;
    }
    case 'sydney': {
      const opera = new THREE.Group();
      opera.position.set(0, 0, -halfD - 7.0);
      const sailMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.32,
        metalness: 0.1,
      });
      const waterMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0c4a6e : 0x0ea5e9,
        roughness: 0.15,
        metalness: 0.4,
      });
      const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.7, 5), sailMat);
      baseDeck.position.y = 0.35;
      opera.add(baseDeck);
      [-3.2, 0, 3.2].forEach((sx, idx) => {
        const sail = new THREE.Mesh(
          new THREE.SphereGeometry(2.6 - idx * 0.25, 14, 12, 0, Math.PI),
          sailMat,
        );
        sail.scale.set(0.75, 1.8, 1.2);
        sail.position.set(sx, 0.6, 0);
        sail.rotation.x = -0.35;
        opera.add(sail);
      });
      const harbour = new THREE.Mesh(new THREE.PlaneGeometry(46, 12), waterMat);
      harbour.rotation.x = -Math.PI / 2;
      harbour.position.set(0, 0.02, -3.5);
      opera.add(harbour);
      group.add(opera);
      break;
    }
    case 'lapland':
    case 'reykjavik': {
      const auroraMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x34d399 : 0x6ee7b7,
        transparent: true,
        opacity: isDark ? 0.55 : 0.25,
        side: THREE.DoubleSide,
      });
      const aurora = new THREE.Mesh(new THREE.PlaneGeometry(36, 6, 16, 2), auroraMat);
      aurora.position.set(0, 12, -halfD - 9);
      aurora.rotation.z = 0.08;
      group.add(aurora);

      for (const cx of [-halfW - 5, halfW + 5]) {
        const cabin = createHouseModel();
        cabin.scale.setScalar(1.6);
        cabin.position.set(cx, 0, -halfD * 0.4);
        group.add(cabin);
      }
      break;
    }
    case 'venice':
    case 'amsterdam': {
      const waterMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0e4f73 : 0x38bdf8,
        roughness: 0.14,
        metalness: 0.35,
      });
      const canal = new THREE.Mesh(new THREE.PlaneGeometry(52, 8), waterMat);
      canal.rotation.x = -Math.PI / 2;
      canal.position.set(0, 0.02, -halfD - 5.5);
      group.add(canal);

      const brickMat = new THREE.MeshStandardMaterial({
        color: cityId === 'venice' ? 0xb45309 : 0x9a3412,
        roughness: 0.7,
      });
      for (let i = -2; i <= 2; i++) {
        const h = 5 + (Math.abs(i) % 2) * 2.5;
        const house = new THREE.Mesh(new THREE.BoxGeometry(3.0, h, 3.0), brickMat);
        house.position.set(i * 4.5, h / 2, -halfD - 9.2);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.2, 4), goldGlowMat);
        roof.position.set(i * 4.5, h + 1.1, -halfD - 9.2);
        roof.rotation.y = Math.PI / 4;
        group.add(house, roof);
      }
      break;
    }
    case 'cairo': {
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xd9b372, roughness: 0.8 });
      const p1 = new THREE.Mesh(new THREE.ConeGeometry(6.5, 9.5, 4), sandMat);
      p1.position.set(-4, 4.75, -halfD - 9.5);
      p1.rotation.y = Math.PI / 4;
      const p2 = new THREE.Mesh(new THREE.ConeGeometry(4.8, 7.0, 4), sandMat);
      p2.position.set(5.5, 3.5, -halfD - 8.5);
      p2.rotation.y = Math.PI / 4;
      const capstone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.6, 4), goldGlowMat);
      capstone.position.set(-4, 9.5, -halfD - 9.5);
      capstone.rotation.y = Math.PI / 4;
      group.add(p1, p2, capstone);
      break;
    }
    case 'rio':
    case 'nairobi':
    case 'singapore': {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      const leafMat = new THREE.MeshStandardMaterial({
        color: cityId === 'singapore' ? 0x10b981 : 0x16a34a,
        emissive: cityId === 'singapore' ? 0x059669 : 0x000000,
        emissiveIntensity: isDark ? 0.55 : 0.15,
        roughness: 0.65,
      });
      for (let i = -2; i <= 2; i++) {
        const px = i * 5.2;
        const pz = -halfD - 6.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 7.5, 10), trunkMat);
        trunk.position.set(px, 3.75, pz);
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 8), leafMat);
        canopy.position.set(px, 7.8, pz);
        const glow = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 16), goldGlowMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.set(px, 6.8, pz);
        group.add(trunk, canopy, glow);
      }
      break;
    }
    case 'prague':
    case 'istanbul':
    case 'mumbai': {
      const castleMat = new THREE.MeshStandardMaterial({
        color: cityId === 'mumbai' ? 0xb91c1c : cityId === 'istanbul' ? 0x1d4ed8 : 0x4b5563,
        roughness: 0.65,
      });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 2.6), castleMat);
      wall.position.set(0, 2.25, -halfD - 7.5);
      group.add(wall);
      for (const tx of [-6.5, 0, 6.5]) {
        const h = tx === 0 ? 8.5 : 6.8;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, h, 12), castleMat);
        turret.position.set(tx, h / 2, -halfD - 7.5);
        const dome =
          cityId === 'prague'
            ? new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.4, 8), goldGlowMat)
            : new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), goldGlowMat);
        dome.position.set(tx, h + 1.0, -halfD - 7.5);
        group.add(turret, dome);
      }
      break;
    }
    case 'swiss_alps': {
      const peakMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
      const snowPeakMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
      for (let i = -2; i <= 2; i++) {
        const h = 11 - Math.abs(i) * 1.8;
        const peak = new THREE.Mesh(new THREE.ConeGeometry(4.4, h, 5), peakMat);
        peak.position.set(i * 5.8, h / 2, -halfD - 8.5);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, h * 0.42, 5), snowPeakMat);
        cap.position.set(i * 5.8, h * 0.8, -halfD - 8.5);
        group.add(peak, cap);
      }
      break;
    }
    case 'north_pole': {
      const grandTree = createChristmasTreeModel(3.8);
      grandTree.position.set(0, 0, -halfD - 7.5);
      group.add(grandTree);

      const redStripe = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
      for (const ax of [-halfW - 4.2, halfW + 4.2]) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.32, 10, 20, Math.PI), redStripe);
        arch.position.set(ax, 2.2, -halfD * 0.3);
        group.add(arch);
      }
      break;
    }
  }

  return group;
}

export function createChapterDioramaModel(chapter: ChapterDefinition): THREE.Group {
  const group = new THREE.Group();
  const pal = chapter.palette;

  // Shared snowy circular base plinth tinted with chapter floor/wall palette
  const plinthMat = new THREE.MeshStandardMaterial({
    color: pal.wallPrimary,
    roughness: 0.72,
    metalness: 0.08,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: pal.floorLight,
    roughness: 0.85,
    metalness: 0.04,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: pal.snowTint,
    roughness: 0.9,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: pal.accent,
    emissive: pal.accent,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.55,
  });
  const goldGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.6,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.65, 0.28, 24), plinthMat);
  plinth.position.y = 0.14;
  group.add(plinth);

  const topDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.5, 0.08, 24), floorMat);
  topDisc.position.y = 0.31;
  group.add(topDisc);

  const snowRim = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 8, 28), snowMat);
  snowRim.rotation.x = Math.PI / 2;
  snowRim.position.y = 0.32;
  group.add(snowRim);

  // Small festive gift accent on the side of every diorama
  const miniPresent = createPresentModel(false);
  miniPresent.scale.setScalar(0.55);
  miniPresent.position.set(0.95, 0.35, 0.65);
  miniPresent.rotation.y = -0.45;
  group.add(miniPresent);

  const stage = new THREE.Group();
  stage.position.y = 0.35;
  group.add(stage);

  switch (chapter.id) {
    case 'london': {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc2a375, roughness: 0.72 });
      const slateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.75, 0.66), stoneMat);
      shaft.position.set(-0.2, 0.875, -0.1);
      const belfry = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.76), stoneMat);
      belfry.position.set(-0.2, 1.9, -0.1);
      const clock = new THREE.Mesh(new THREE.CircleGeometry(0.24, 18), goldGlowMat);
      clock.position.set(-0.2, 1.9, 0.29);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.85, 4), slateMat);
      spire.position.set(-0.2, 2.55, -0.1);
      spire.rotation.y = Math.PI / 4;
      stage.add(shaft, belfry, clock, spire);

      const boothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
      const boothBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.82, 0.36), boothMat);
      boothBody.position.set(0.65, 0.41, 0.1);
      const boothWin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.54, 0.38), goldGlowMat);
      boothWin.position.set(0.65, 0.45, 0.1);
      const boothDome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), boothMat);
      boothDome.position.set(0.65, 0.84, 0.1);
      stage.add(boothBody, boothWin, boothDome);
      break;
    }
    case 'paris': {
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x92704a,
        roughness: 0.38,
        metalness: 0.68,
      });
      const base = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.05, 4), ironMat);
      base.position.set(0, 0.52, 0);
      base.rotation.y = Math.PI / 4;
      const mid = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 4), ironMat);
      mid.position.set(0, 1.25, 0);
      mid.rotation.y = Math.PI / 4;
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.05, 4), ironMat);
      top.position.set(0, 2.1, 0);
      top.rotation.y = Math.PI / 4;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), goldGlowMat);
      beacon.position.set(0, 2.66, 0);
      const chalet = createHouseModel();
      chalet.scale.setScalar(0.45);
      chalet.position.set(-0.78, 0, 0.38);
      stage.add(base, mid, top, beacon, chalet);
      break;
    }
    case 'new_york': {
      const bldgMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.42,
        metalness: 0.4,
      });
      const towers: Array<[number, number, number, number]> = [
        [-0.55, -0.25, 0.52, 1.65],
        [0, -0.35, 0.62, 2.35],
        [0.58, -0.2, 0.5, 1.45],
      ];
      for (const [tx, tz, w, h] of towers) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bldgMat);
        b.position.set(tx, h / 2, tz);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.14, w * 0.72), goldGlowMat);
        cap.position.set(tx, h + 0.07, tz);
        stage.add(b, cap);
      }
      const tree = createChristmasTreeModel(0.52);
      tree.position.set(-0.55, 0, 0.55);
      stage.add(tree);
      break;
    }
    case 'tokyo': {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      for (let t = 0; t < 4; t++) {
        const w = 1.0 - t * 0.18;
        const body = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, 0.4, w * 0.68), redMat);
        body.position.y = 0.2 + t * 0.48;
        const eave = new THREE.Mesh(new THREE.ConeGeometry(w, 0.24, 4), darkMat);
        eave.position.y = 0.46 + t * 0.48;
        eave.rotation.y = Math.PI / 4;
        stage.add(body, eave);
      }
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.52, 8), goldGlowMat);
      spire.position.y = 2.28;
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), accentMat);
      lantern.scale.y = 1.25;
      lantern.position.set(-0.78, 0.35, 0.52);
      stage.add(spire, lantern);
      break;
    }
    case 'sydney': {
      const sailMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.12 });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.45 });
      const sea = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.04, 24), waterMat);
      sea.position.y = 0.01;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.9), sailMat);
      deck.position.set(0, 0.09, -0.1);
      stage.add(sea, deck);
      [-0.48, 0, 0.48].forEach((sx, idx) => {
        const sail = new THREE.Mesh(
          new THREE.SphereGeometry(0.48 - idx * 0.04, 14, 12, 0, Math.PI),
          sailMat,
        );
        sail.scale.set(0.7, 1.5, 1.1);
        sail.position.set(sx, 0.15, -0.1);
        sail.rotation.x = -0.35;
        stage.add(sail);
      });
      break;
    }
    case 'lapland': {
      const cabin = createHouseModel();
      cabin.scale.setScalar(0.68);
      cabin.position.set(-0.28, 0, 0.15);
      const tree = createChristmasTreeModel(0.62);
      tree.position.set(0.62, 0, -0.3);
      const auroraMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
      });
      const aurora = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 8, 24, Math.PI), auroraMat);
      aurora.position.set(0, 1.15, -0.35);
      aurora.rotation.z = 0.12;
      stage.add(cabin, tree, aurora);
      break;
    }
    case 'venice': {
      const canalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.14, metalness: 0.35 });
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.72 });
      const canal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.72), canalMat);
      canal.position.set(0, 0.03, 0.35);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 8, 16, Math.PI), snowMat);
      arch.position.set(0, 0.05, 0.35);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.7, 0.54), brickMat);
      tower.position.set(-0.38, 0.85, -0.35);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 4), goldGlowMat);
      spire.position.set(-0.38, 2.05, -0.35);
      spire.rotation.y = Math.PI / 4;
      const palazzo = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.65), brickMat);
      palazzo.position.set(0.48, 0.42, -0.35);
      stage.add(canal, arch, tower, spire, palazzo);
      break;
    }
    case 'cairo': {
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xd9b372, roughness: 0.82 });
      const p1 = new THREE.Mesh(new THREE.ConeGeometry(0.88, 1.45, 4), sandMat);
      p1.position.set(-0.26, 0.72, -0.15);
      p1.rotation.y = Math.PI / 4;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.4, 4), goldGlowMat);
      cap.position.set(-0.26, 1.32, -0.15);
      cap.rotation.y = Math.PI / 4;
      const p2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.98, 4), sandMat);
      p2.position.set(0.52, 0.49, 0.15);
      p2.rotation.y = Math.PI / 4;
      const star = new THREE.Mesh(createExtrudedStarGeometry(0.2, 0.09, 0.06), goldGlowMat);
      star.position.set(0.52, 1.3, 0.15);
      stage.add(p1, cap, p2, star);
      break;
    }
    case 'rio': {
      const peakMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.75 });
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.65, 10), peakMat);
      peak.position.set(-0.25, 0.82, -0.2);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.11, 8, 20, Math.PI), accentMat);
      arch.position.set(0.1, 0.15, 0.25);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.1, 1.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }),
      );
      trunk.position.set(0.62, 0.58, -0.15);
      const fronds = new THREE.Mesh(
        new THREE.ConeGeometry(0.52, 0.42, 7),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 }),
      );
      fronds.position.set(0.62, 1.2, -0.15);
      stage.add(peak, arch, trunk, fronds);
      break;
    }
    case 'seoul': {
      const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.58 });
      for (let t = 0; t < 3; t++) {
        const w = 1.15 - t * 0.24;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.44, w * 0.65), blueMat);
        wall.position.y = 0.22 + t * 0.52;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w, 0.28, 4), roofMat);
        roof.position.y = 0.54 + t * 0.52;
        roof.rotation.y = Math.PI / 4;
        stage.add(wall, roof);
      }
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), accentMat);
      lantern.position.set(-0.78, 0.38, 0.48);
      stage.add(lantern);
      break;
    }
    case 'prague': {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.68 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.68, 0.55), stoneMat);
      wall.position.set(0, 0.34, -0.1);
      stage.add(wall);
      for (const [tx, h] of [
        [-0.58, 1.15],
        [0, 1.5],
        [0.58, 1.15],
      ] as Array<[number, number]>) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, h, 10), stoneMat);
        t.position.set(tx, h / 2, -0.1);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.55, 8), accentMat);
        spire.position.set(tx, h + 0.25, -0.1);
        stage.add(t, spire);
      }
      break;
    }
    case 'amsterdam': {
      const canalMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.14 });
      const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 });
      const canal = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.58), canalMat);
      canal.position.set(0, 0.025, 0.45);
      const millTower = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 1.45, 10), brickMat);
      millTower.position.set(-0.25, 0.72, -0.18);
      const millCap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.36, 10), goldGlowMat);
      millCap.position.set(-0.25, 1.58, -0.18);
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 0.05), snowMat);
      blade1.position.set(-0.25, 1.22, 0.14);
      blade1.rotation.z = 0.45;
      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.35, 0.05), snowMat);
      blade2.position.set(-0.25, 1.22, 0.14);
      blade2.rotation.z = 0.45;
      const gable = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.05, 0.55), brickMat);
      gable.position.set(0.55, 0.52, -0.25);
      stage.add(canal, millTower, millCap, blade1, blade2, gable);
      break;
    }
    case 'mumbai': {
      const archMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
      for (const px of [-0.46, 0.46]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.25, 0.5), archMat);
        pillar.position.set(px, 0.62, -0.1);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), goldGlowMat);
        dome.position.set(px, 1.35, -0.1);
        stage.add(pillar, dome);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.36, 0.52), archMat);
      lintel.position.set(0, 1.15, -0.1);
      const centerDome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), goldGlowMat);
      centerDome.position.set(0, 1.48, -0.1);
      stage.add(lintel, centerDome);
      break;
    }
    case 'toronto': {
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.24, 2.1, 12), towerMat);
      shaft.position.set(0, 1.05, -0.1);
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.22, 16), accentMat);
      pod.position.set(0, 1.55, -0.1);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.68, 8), goldGlowMat);
      antenna.position.set(0, 2.38, -0.1);
      const pine = createChristmasTreeModel(0.5);
      pine.position.set(-0.68, 0, 0.35);
      stage.add(shaft, pod, antenna, pine);
      break;
    }
    case 'reykjavik': {
      const basaltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 });
      const heights = [0.65, 1.05, 1.55, 2.05, 1.55, 1.05, 0.65];
      heights.forEach((h, i) => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.38), basaltMat);
        col.position.set((i - 3) * 0.23, h / 2, -0.1);
        stage.add(col);
      });
      const aurora = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 8, 24, Math.PI), accentMat);
      aurora.position.set(0, 1.25, -0.38);
      stage.add(aurora);
      break;
    }
    case 'nairobi': {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.2, 8), trunkMat);
      trunk.position.set(-0.2, 0.6, -0.1);
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.62, 0.22, 14), canopyMat);
      canopy.position.set(-0.2, 1.25, -0.1);
      const lodge = createHouseModel();
      lodge.scale.setScalar(0.5);
      lodge.position.set(0.55, 0, 0.2);
      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldGlowMat);
      lantern.position.set(-0.75, 0.45, 0.5);
      stage.add(trunk, canopy, lodge, lantern);
      break;
    }
    case 'singapore': {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.65 });
      for (const [sx, sz, h] of [
        [-0.45, -0.2, 1.4],
        [0.15, -0.3, 1.85],
        [0.62, 0.05, 1.2],
      ] as Array<[number, number, number]>) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, h, 10), trunkMat);
        stem.position.set(sx, h / 2, sz);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.28, 10), accentMat);
        crown.position.set(sx, h + 0.08, sz);
        crown.rotation.x = Math.PI;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 8, 16), goldGlowMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(sx, h - 0.1, sz);
        stage.add(stem, crown, ring);
      }
      break;
    }
    case 'istanbul': {
      const palaceMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55 });
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 1.0), palaceMat);
      hall.position.set(0, 0.36, -0.1);
      const mainDome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldGlowMat);
      mainDome.position.set(0, 0.72, -0.1);
      stage.add(hall, mainDome);
      for (const mx of [-0.72, 0.72]) {
        const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.65, 10), snowMat);
        minaret.position.set(mx, 0.82, -0.1);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 10), goldGlowMat);
        tip.position.set(mx, 1.8, -0.1);
        stage.add(minaret, tip);
      }
      break;
    }
    case 'swiss_alps': {
      const iceMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
      for (const [px, pz, r, h] of [
        [-0.45, -0.25, 0.55, 1.65],
        [0.12, -0.35, 0.65, 2.05],
        [0.62, -0.1, 0.48, 1.35],
      ] as Array<[number, number, number, number]>) {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), iceMat);
        peak.position.set(px, h / 2, pz);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.48, h * 0.42, 5), snowMat);
        cap.position.set(px, h * 0.8, pz);
        stage.add(peak, cap);
      }
      const chalet = createHouseModel();
      chalet.scale.setScalar(0.45);
      chalet.position.set(-0.52, 0, 0.45);
      stage.add(chalet);
      break;
    }
    case 'north_pole': {
      const grandTree = createChristmasTreeModel(0.92);
      grandTree.position.set(0, 0, -0.1);
      const candyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32 });
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 10, 24, Math.PI), candyMat);
      arch.position.set(0, 0.35, 0.45);
      const goldenCookie = createGoldenCookieModel();
      goldenCookie.scale.setScalar(0.55);
      goldenCookie.position.set(-0.78, 0.05, 0.55);
      stage.add(grandTree, arch, goldenCookie);
      break;
    }
  }

  return group;
}

