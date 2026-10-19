import * as THREE from 'three';
import {
  getRoadTexture,
  getHaveliTexture,
  getTruckArtTexture,
  getDhabaSignTexture,
  getRickshawMudflapTexture,
  getMeterScreenTexture,
} from './textures';

// Shared materials and geometries for optimal draw call reuse & performance
const rubberMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1c,
  roughness: 0.9,
  metalness: 0.05,
});

const chromeMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3f4f6,
  metalness: 0.95,
  roughness: 0.12,
});

const goldBrassMaterial = new THREE.MeshStandardMaterial({
  color: 0xdfa025,
  metalness: 0.85,
  roughness: 0.25,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xdbeafe,
  transparent: true,
  opacity: 0.45,
  roughness: 0.1,
  transmission: 0.85,
  ior: 1.5,
  depthWrite: false,
});

// Helper for wheels
function createWheel(radius = 0.35, width = 0.22): THREE.Group {
  const wheel = new THREE.Group();

  // Tire rubber
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeo, rubberMaterial);
  tireMesh.castShadow = true;
  wheel.add(tireMesh);

  // Chrome rim
  const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, chromeMaterial);
  wheel.add(rimMesh);

  // Hubcap center nut
  const nutGeo = new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.05, 8);
  nutGeo.rotateZ(Math.PI / 2);
  const nutMesh = new THREE.Mesh(nutGeo, goldBrassMaterial);
  wheel.add(nutMesh);

  return wheel;
}

// ==========================================
// 1. HERO AUTO RICKSHAW (BAJAJ RE 3-WHEELER)
// ==========================================
export interface AutoRickshawObject extends THREE.Group {
  frontWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  handlebar: THREE.Group;
  headlightLight: THREE.SpotLight;
  taillightMesh: THREE.Mesh;
  meterMesh: THREE.Mesh;
  exhaustAnchor: THREE.Vector3;
  wiperMesh: THREE.Mesh;
  bodyLeanPivot: THREE.Group;
}

export function createAutoRickshaw(): AutoRickshawObject {
  const root = new THREE.Group() as AutoRickshawObject;

  // Body lean pivot (allows the iconic tuk-tuk tilt while keeping wheels on ground)
  const bodyLeanPivot = new THREE.Group();
  bodyLeanPivot.position.y = 0.35;
  root.add(bodyLeanPivot);
  root.bodyLeanPivot = bodyLeanPivot;

  // A. Lower Chassis & Green Body Shell (Emerald Indian Green)
  const greenBodyMat = new THREE.MeshStandardMaterial({
    color: 0x0a6639, // Iconic Bajaj dark green
    roughness: 0.35,
    metalness: 0.25,
  });

  const bodyBaseGeo = new THREE.BoxGeometry(1.4, 0.6, 2.3);
  bodyBaseGeo.translate(0, 0.45, 0);
  const bodyBaseMesh = new THREE.Mesh(bodyBaseGeo, greenBodyMat);
  bodyBaseMesh.castShadow = true;
  bodyBaseMesh.receiveShadow = true;
  bodyLeanPivot.add(bodyBaseMesh);

  // Curved front apron cowl (slanted nose)
  const frontApronGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.7, 16, 1, false, 0, Math.PI);
  frontApronGeo.rotateY(Math.PI / 2);
  frontApronGeo.translate(0, 0.6, 1.25);
  const frontApronMesh = new THREE.Mesh(frontApronGeo, greenBodyMat);
  frontApronMesh.castShadow = true;
  bodyLeanPivot.add(frontApronMesh);

  // B. Canary Yellow Roof Canopy
  const yellowRoofMat = new THREE.MeshStandardMaterial({
    color: 0xf5b300, // Vibrant Auto Yellow
    roughness: 0.4,
    metalness: 0.1,
  });

  // Roof top dome
  const roofGeo = new THREE.BoxGeometry(1.44, 0.14, 2.45);
  roofGeo.translate(0, 1.75, 0.05);
  const roofMesh = new THREE.Mesh(roofGeo, yellowRoofMat);
  roofMesh.castShadow = true;
  bodyLeanPivot.add(roofMesh);

  // Roof support pillars (black metal steel tubing)
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.6,
    metalness: 0.8,
  });
  const pillarPositions = [
    [-0.65, 1.15, -1.05],
    [0.65, 1.15, -1.05],
    [-0.65, 1.15, 0.2],
    [0.65, 1.15, 0.2],
    [-0.45, 1.15, 1.05],
    [0.45, 1.15, 1.05],
  ];
  pillarPositions.forEach(([px, py, pz]) => {
    const pGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8);
    const pMesh = new THREE.Mesh(pGeo, pillarMat);
    pMesh.position.set(px, py, pz);
    bodyLeanPivot.add(pMesh);
  });

  // C. Front Windshield & Wiper
  const windshieldGeo = new THREE.PlaneGeometry(1.0, 0.65);
  const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshieldMesh.position.set(0, 1.35, 1.1);
  windshieldMesh.rotateX(-0.15);
  bodyLeanPivot.add(windshieldMesh);

  // Single wiper blade
  const wiperGeo = new THREE.BoxGeometry(0.02, 0.45, 0.02);
  const wiperMesh = new THREE.Mesh(wiperGeo, chromeMaterial);
  wiperMesh.position.set(0, 1.35, 1.12);
  wiperMesh.rotation.z = -0.3;
  bodyLeanPivot.add(wiperMesh);
  root.wiperMesh = wiperMesh;

  // D. Handlebars & Dashboard
  const handlebarGroup = new THREE.Group();
  handlebarGroup.position.set(0, 0.95, 0.9);

  const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  barGeo.rotateZ(Math.PI / 2);
  const barMesh = new THREE.Mesh(barGeo, chromeMaterial);
  handlebarGroup.add(barMesh);

  // Rubber grips
  for (const gx of [-0.38, 0.38]) {
    const gripGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
    gripGeo.rotateZ(Math.PI / 2);
    const gripMesh = new THREE.Mesh(gripGeo, rubberMaterial);
    gripMesh.position.set(gx, 0, 0);
    handlebarGroup.add(gripMesh);
  }

  // Mirrors
  for (const mx of [-0.42, 0.42]) {
    const mirrorStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6);
    const stemMesh = new THREE.Mesh(mirrorStemGeo, chromeMaterial);
    stemMesh.position.set(mx, 0.1, 0.02);
    stemMesh.rotation.z = mx > 0 ? -0.3 : 0.3;
    handlebarGroup.add(stemMesh);

    const mirrorHeadGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    mirrorHeadGeo.rotateX(Math.PI / 2);
    const mirrorHeadMesh = new THREE.Mesh(mirrorHeadGeo, chromeMaterial);
    mirrorHeadMesh.position.set(mx + (mx > 0 ? 0.05 : -0.05), 0.2, 0.02);
    handlebarGroup.add(mirrorHeadMesh);
  }

  // Squeeze Bulb Horn (Red bulb + Brass trumpet)
  const hornBulbGeo = new THREE.SphereGeometry(0.05, 12, 12);
  const hornBulbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
  const hornBulb = new THREE.Mesh(hornBulbGeo, hornBulbMat);
  hornBulb.position.set(-0.25, 0.04, 0.05);
  handlebarGroup.add(hornBulb);

  const hornTrumpetGeo = new THREE.ConeGeometry(0.06, 0.15, 12);
  hornTrumpetGeo.rotateX(-Math.PI / 2);
  const hornTrumpet = new THREE.Mesh(hornTrumpetGeo, goldBrassMaterial);
  hornTrumpet.position.set(-0.25, 0.04, 0.16);
  handlebarGroup.add(hornTrumpet);

  bodyLeanPivot.add(handlebarGroup);
  root.handlebar = handlebarGroup;

  // E. Vintage Indian Fare Taxi Meter (Dashboard Mounted)
  const meterMat = new THREE.MeshBasicMaterial({ map: getMeterScreenTexture(0, false) });
  const meterGeo = new THREE.BoxGeometry(0.3, 0.16, 0.12);
  const meterMesh = new THREE.Mesh(meterGeo, meterMat);
  meterMesh.position.set(0.25, 0.9, 0.9);
  meterMesh.rotation.x = -0.3;
  bodyLeanPivot.add(meterMesh);
  root.meterMesh = meterMesh;

  // F. Driver Saddle & Passenger Rear Bench
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x452312,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Driver seat
  const driverSeatGeo = new THREE.BoxGeometry(0.5, 0.15, 0.45);
  driverSeatGeo.translate(0, 0.65, 0.35);
  const driverSeat = new THREE.Mesh(driverSeatGeo, leatherMat);
  bodyLeanPivot.add(driverSeat);

  // Rear passenger seat bench
  const rearSeatGeo = new THREE.BoxGeometry(1.28, 0.22, 0.65);
  rearSeatGeo.translate(0, 0.65, -0.65);
  const rearSeat = new THREE.Mesh(rearSeatGeo, leatherMat);
  rearSeat.castShadow = true;
  bodyLeanPivot.add(rearSeat);

  const rearBackrestGeo = new THREE.BoxGeometry(1.28, 0.5, 0.14);
  rearBackrestGeo.translate(0, 1.05, -1.02);
  const rearBackrest = new THREE.Mesh(rearBackrestGeo, leatherMat);
  bodyLeanPivot.add(rearBackrest);

  // G. Headlamp & Functional SpotLight Beam
  const headlampGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
  headlampGeo.rotateX(Math.PI / 2);
  const headlampMesh = new THREE.Mesh(headlampGeo, chromeMaterial);
  headlampMesh.position.set(0, 0.65, 1.62);

  const lensGeo = new THREE.CircleGeometry(0.12, 16);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xffe277,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });
  const lensMesh = new THREE.Mesh(lensGeo, lensMat);
  lensMesh.position.set(0, 0, 0.065);
  headlampMesh.add(lensMesh);
  bodyLeanPivot.add(headlampMesh);

  // Real Three.js SpotLight for road illumination
  const headlightLight = new THREE.SpotLight(0xfff3c4, 5.0, 35, Math.PI / 6, 0.45, 1.2);
  headlightLight.position.set(0, 0.65, 1.65);
  const targetObj = new THREE.Object3D();
  targetObj.position.set(0, 0, 15);
  bodyLeanPivot.add(targetObj);
  headlightLight.target = targetObj;
  bodyLeanPivot.add(headlightLight);
  root.headlightLight = headlightLight;

  // H. Rear Taillights (Dual red lights that glow on braking)
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.5,
  });
  const taillightGeo = new THREE.BoxGeometry(0.16, 0.08, 0.05);
  const taillightLeft = new THREE.Mesh(taillightGeo, taillightMat);
  taillightLeft.position.set(-0.55, 0.55, -1.16);
  const taillightRight = new THREE.Mesh(taillightGeo, taillightMat);
  taillightRight.position.set(0.55, 0.55, -1.16);
  bodyLeanPivot.add(taillightLeft);
  bodyLeanPivot.add(taillightRight);
  root.taillightMesh = taillightLeft; // Reference for emissive toggle

  // I. Rear Mudflap ("HORN OK PLEASE")
  const mudflapMat = new THREE.MeshBasicMaterial({
    map: getRickshawMudflapTexture(),
    side: THREE.DoubleSide,
  });
  const mudflapGeo = new THREE.PlaneGeometry(1.2, 0.4);
  const mudflapMesh = new THREE.Mesh(mudflapGeo, mudflapMat);
  mudflapMesh.position.set(0, 0.35, -1.18);
  bodyLeanPivot.add(mudflapMesh);

  // J. Lemon Chilli Lucky Charm (Nimbu Mirchi)
  const nimbuMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.6 });
  const mirchiMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
  const lemonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), nimbuMat);
  lemonMesh.position.set(0, 0.35, 1.65);
  bodyLeanPivot.add(lemonMesh);
  const chilliMesh = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.1, 6), mirchiMat);
  chilliMesh.position.set(0, 0.28, 1.65);
  chilliMesh.rotation.x = Math.PI;
  bodyLeanPivot.add(chilliMesh);

  // K. Exhaust pipe
  const exhaustGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustMesh.position.set(-0.4, 0.22, -1.1);
  bodyLeanPivot.add(exhaustMesh);
  root.exhaustAnchor = new THREE.Vector3(-0.4, 0.22, -1.3);

  // L. Three Realistic Wheels (Mounted to root so body leans independently)
  // 1. Single front wheel
  const frontWheel = createWheel(0.32, 0.18);
  frontWheel.position.set(0, 0.32, 1.4);
  root.add(frontWheel);
  root.frontWheel = frontWheel;

  // Front mudguard attached to wheel steering
  const frontGuardGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 16, 1, true, 0, Math.PI);
  frontGuardGeo.rotateZ(Math.PI / 2);
  const frontGuardMesh = new THREE.Mesh(frontGuardGeo, greenBodyMat);
  frontGuardMesh.position.y = 0.05;
  frontWheel.add(frontGuardMesh);

  // 2. Rear Left Wheel
  const rearLeftWheel = createWheel(0.34, 0.2);
  rearLeftWheel.position.set(-0.62, 0.34, -0.65);
  root.add(rearLeftWheel);
  root.rearLeftWheel = rearLeftWheel;

  // 3. Rear Right Wheel
  const rearRightWheel = createWheel(0.34, 0.2);
  rearRightWheel.position.set(0.62, 0.34, -0.65);
  root.add(rearRightWheel);
  root.rearRightWheel = rearRightWheel;

  return root;
}

// ==========================================
// 2. INDIAN HIGHWAY TRUCK (TATA / ASHOK LEYLAND)
// ==========================================
export function createTataTruck(): THREE.Group {
  const truck = new THREE.Group();

  // Vibrant Truck Colors (Deep Royal Blue Cabin + Gold Accents)
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.35,
    metalness: 0.3,
  });

  const cargoWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.8,
  });

  // Cabin block
  const cabinGeo = new THREE.BoxGeometry(2.3, 2.2, 2.2);
  cabinGeo.translate(0, 1.7, 2.2);
  const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
  cabinMesh.castShadow = true;
  truck.add(cabinMesh);

  // Crown Roof Rack ("All India Permit")
  const crownGeo = new THREE.BoxGeometry(2.34, 0.6, 1.8);
  crownGeo.translate(0, 3.0, 2.0);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
  const crownMesh = new THREE.Mesh(crownGeo, crownMat);
  crownMesh.castShadow = true;
  truck.add(crownMesh);

  // Dual brass roof horns
  for (const hx of [-0.6, 0.6]) {
    const hornGeo = new THREE.ConeGeometry(0.12, 0.6, 8);
    hornGeo.rotateX(-Math.PI / 2);
    const hornMesh = new THREE.Mesh(hornGeo, goldBrassMaterial);
    hornMesh.position.set(hx, 3.4, 2.3);
    truck.add(hornMesh);
  }

  // Large Heavy Cargo Bed
  const cargoGeo = new THREE.BoxGeometry(2.4, 2.2, 5.2);
  cargoGeo.translate(0, 1.8, -1.6);
  const cargoMesh = new THREE.Mesh(cargoGeo, cargoWoodMat);
  cargoMesh.castShadow = true;
  cargoMesh.receiveShadow = true;
  truck.add(cargoMesh);

  // Rear Truck Art Panel ("HORN OK PLEASE")
  const truckArtMat = new THREE.MeshBasicMaterial({
    map: getTruckArtTexture(),
  });
  const truckArtGeo = new THREE.PlaneGeometry(2.38, 2.18);
  const truckArtMesh = new THREE.Mesh(truckArtGeo, truckArtMat);
  truckArtMesh.position.set(0, 1.8, -4.21);
  truckArtMesh.rotateY(Math.PI);
  truck.add(truckArtMesh);

  // Chrome front grill & bumper
  const bumperGeo = new THREE.BoxGeometry(2.5, 0.4, 0.3);
  bumperGeo.translate(0, 0.7, 3.35);
  const bumperMesh = new THREE.Mesh(bumperGeo, chromeMaterial);
  truck.add(bumperMesh);

  // Headlamps
  for (const lx of [-0.85, 0.85]) {
    const lampGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    lampGeo.rotateX(Math.PI / 2);
    const lampMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfffbdb,
        emissiveIntensity: 0.9,
      })
    );
    lampMesh.position.set(lx, 1.1, 3.32);
    truck.add(lampMesh);
  }

  // 6 Wheels (2 front, 4 rear double axle)
  const wheelPositions = [
    [-1.15, 0.55, 2.2],
    [1.15, 0.55, 2.2],
    [-1.15, 0.55, -1.8],
    [1.15, 0.55, -1.8],
    [-1.15, 0.55, -3.2],
    [1.15, 0.55, -3.2],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    const w = createWheel(0.55, 0.32);
    w.position.set(wx, wy, wz);
    truck.add(w);
  });

  return truck;
}

// ==========================================
// 3. RETRO AMBASSADOR TAXI (BLACK & YELLOW)
// ==========================================
export function createAmbassadorTaxi(): THREE.Group {
  const taxi = new THREE.Group();

  const blackPaint = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.3 });
  const yellowPaint = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 });

  // Lower Body (Black)
  const lowerGeo = new THREE.BoxGeometry(1.8, 0.65, 4.2);
  lowerGeo.translate(0, 0.6, 0);
  const lowerMesh = new THREE.Mesh(lowerGeo, blackPaint);
  lowerMesh.castShadow = true;
  taxi.add(lowerMesh);

  // Rounded Cabin & Roof (Yellow)
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.75, 2.4);
  cabinGeo.translate(0, 1.25, -0.2);
  const cabinMesh = new THREE.Mesh(cabinGeo, yellowPaint);
  cabinMesh.castShadow = true;
  taxi.add(cabinMesh);

  // Roof Taxi Sign
  const taxiSignGeo = new THREE.BoxGeometry(0.5, 0.16, 0.18);
  const taxiSignMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 0.8,
  });
  const taxiSign = new THREE.Mesh(taxiSignGeo, taxiSignMat);
  taxiSign.position.set(0, 1.7, -0.2);
  taxi.add(taxiSign);

  // Chrome curved bumpers
  const fBumpGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.9, 12);
  fBumpGeo.rotateZ(Math.PI / 2);
  const fBump = new THREE.Mesh(fBumpGeo, chromeMaterial);
  fBump.position.set(0, 0.45, 2.15);
  taxi.add(fBump);

  const rBump = new THREE.Mesh(fBumpGeo, chromeMaterial);
  rBump.position.set(0, 0.45, -2.15);
  taxi.add(rBump);

  // 4 Wheels
  const wCoords = [
    [-0.85, 0.38, 1.3],
    [0.85, 0.38, 1.3],
    [-0.85, 0.38, -1.3],
    [0.85, 0.38, -1.3],
  ];
  wCoords.forEach(([wx, wy, wz]) => {
    const w = createWheel(0.38, 0.22);
    w.position.set(wx, wy, wz);
    taxi.add(w);
  });

  return taxi;
}

// ==========================================
// 4. THE SACRED INDIAN COW (GAU MATA)
// ==========================================
export interface SacredCowObject extends THREE.Group {
  head: THREE.Group;
  tail: THREE.Mesh;
  animTime: number;
}

export function createSacredCow(): SacredCowObject {
  const cow = new THREE.Group() as SacredCowObject;
  cow.animTime = Math.random() * 10;

  // Cream/White sacred cow skin
  const cowSkinMat = new THREE.MeshStandardMaterial({
    color: 0xf5f3ee,
    roughness: 0.85,
  });

  // Torso / Barrel
  const torsoGeo = new THREE.BoxGeometry(0.9, 0.85, 1.8);
  torsoGeo.translate(0, 1.15, 0);
  const torsoMesh = new THREE.Mesh(torsoGeo, cowSkinMat);
  torsoMesh.castShadow = true;
  cow.add(torsoMesh);

  // Prominent Zebu Dorsal Hump
  const humpGeo = new THREE.SphereGeometry(0.35, 12, 12);
  humpGeo.scale(1.0, 1.2, 0.8);
  const humpMesh = new THREE.Mesh(humpGeo, cowSkinMat);
  humpMesh.position.set(0, 1.72, 0.45);
  humpMesh.castShadow = true;
  cow.add(humpMesh);

  // 4 Legs & Hooves
  const legPositions = [
    [-0.35, 0.5, 0.65],
    [0.35, 0.5, 0.65],
    [-0.35, 0.5, -0.65],
    [0.35, 0.5, -0.65],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8);
    const legMesh = new THREE.Mesh(legGeo, cowSkinMat);
    legMesh.position.set(lx, ly, lz);
    legMesh.castShadow = true;
    cow.add(legMesh);

    // Hoof
    const hoofGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.1, 8);
    const hoofMesh = new THREE.Mesh(hoofGeo, rubberMaterial);
    hoofMesh.position.set(lx, 0.05, lz);
    cow.add(hoofMesh);
  });

  // Head Pivot (can turn peacefully when honked at)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.45, 1.05);

  // Snout & head
  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.7);
  headGeo.translate(0, 0, 0.25);
  const headMesh = new THREE.Mesh(headGeo, cowSkinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Dark muzzle
  const muzzleGeo = new THREE.BoxGeometry(0.38, 0.3, 0.25);
  const muzzleMat = new THREE.MeshStandardMaterial({ color: 0x4a4742, roughness: 0.9 });
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzleMesh.position.set(0, -0.08, 0.65);
  headGroup.add(muzzleMesh);

  // Painted Sacred Horns (Orange/Vermilion tips)
  for (const hx of [-0.25, 0.25]) {
    const hornGeo = new THREE.ConeGeometry(0.06, 0.45, 8);
    hornGeo.rotateX(0.4);
    hornGeo.rotateZ(hx > 0 ? -0.4 : 0.4);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Festive painted horn
      roughness: 0.5,
    });
    const hornMesh = new THREE.Mesh(hornGeo, hornMat);
    hornMesh.position.set(hx, 0.35, 0.2);
    headGroup.add(hornMesh);
  }

  // Marigold Garland around neck
  const garlandGeo = new THREE.TorusGeometry(0.42, 0.08, 8, 16);
  garlandGeo.rotateX(Math.PI / 3);
  const garlandMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.9,
  });
  const garlandMesh = new THREE.Mesh(garlandGeo, garlandMat);
  garlandMesh.position.set(0, -0.15, 0.1);
  headGroup.add(garlandMesh);

  // Brass Bell
  const bellGeo = new THREE.ConeGeometry(0.08, 0.12, 8);
  bellGeo.rotateX(Math.PI);
  const bellMesh = new THREE.Mesh(bellGeo, goldBrassMaterial);
  bellMesh.position.set(0, -0.4, 0.25);
  headGroup.add(bellMesh);

  cow.add(headGroup);
  cow.head = headGroup;

  // Gentle swishing tail
  const tailGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.9, 6);
  tailGeo.translate(0, -0.45, 0);
  const tailMesh = new THREE.Mesh(tailGeo, cowSkinMat);
  tailMesh.position.set(0, 1.3, -0.95);
  cow.add(tailMesh);
  cow.tail = tailMesh;

  return cow;
}

// ==========================================
// 5. ROADSIDE DHABA (SHARMA CHAI & NASHTA)
// ==========================================
export function createChaiDhaba(): THREE.Group {
  const dhaba = new THREE.Group();

  // Wooden platform & pillars
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const platformGeo = new THREE.BoxGeometry(5.2, 0.3, 4.2);
  platformGeo.translate(0, 0.15, 0);
  const platform = new THREE.Mesh(platformGeo, woodMat);
  platform.receiveShadow = true;
  dhaba.add(platform);

  // Striped Fabric Canopy Roof (Crimson & Yellow)
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.8,
  });
  const roofGeo = new THREE.BoxGeometry(5.4, 0.15, 4.4);
  roofGeo.translate(0, 3.2, 0);
  const roof = new THREE.Mesh(roofGeo, canopyMat);
  roof.castShadow = true;
  dhaba.add(roof);

  // Signboard atop
  const signMat = new THREE.MeshBasicMaterial({ map: getDhabaSignTexture() });
  const signGeo = new THREE.PlaneGeometry(4.2, 1.8);
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 4.2, 2.1);
  dhaba.add(sign);

  // Chai preparation counter
  const counterGeo = new THREE.BoxGeometry(3.6, 1.1, 1.0);
  counterGeo.translate(0, 0.85, 1.0);
  const counter = new THREE.Mesh(counterGeo, woodMat);
  dhaba.add(counter);

  // Boiling Brass Samovar / Chai Kettle
  const kettleGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.65, 16);
  const kettle = new THREE.Mesh(kettleGeo, goldBrassMaterial);
  kettle.position.set(-0.8, 1.7, 1.0);
  dhaba.add(kettle);

  // Stacks of terracotta Kulhad cups
  for (let k = 0; k < 6; k++) {
    const kulhadGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.14, 8);
    const kulhadMat = new THREE.MeshStandardMaterial({ color: 0xc2714f, roughness: 0.9 });
    const kulhad = new THREE.Mesh(kulhadGeo, kulhadMat);
    kulhad.position.set(0.3 + (k % 3) * 0.22, 1.48 + Math.floor(k / 3) * 0.15, 1.0);
    dhaba.add(kulhad);
  }

  return dhaba;
}

// ==========================================
// 6. HAVELI HERITAGE ARCHITECTURE BUILDING
// ==========================================
export function createHaveliBuilding(variant: 'sandstone' | 'terracotta' | 'blue' = 'sandstone'): THREE.Group {
  const haveli = new THREE.Group();

  const texture = getHaveliTexture(variant);
  const wallMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
  });

  // Main 3-story block
  const blockGeo = new THREE.BoxGeometry(8, 12, 6);
  blockGeo.translate(0, 6, 0);
  const blockMesh = new THREE.Mesh(blockGeo, wallMat);
  blockMesh.castShadow = true;
  blockMesh.receiveShadow = true;
  haveli.add(blockMesh);

  // Rooftop Chhatri Dome (Carved pavilion)
  const domeMat = new THREE.MeshStandardMaterial({
    color: variant === 'terracotta' ? 0x991b1b : variant === 'blue' ? 0x1e3a8a : 0xb45309,
    roughness: 0.6,
  });
  const domeGeo = new THREE.SphereGeometry(1.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.translate(0, 12.8, 0);
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.castShadow = true;
  haveli.add(dome);

  // Brass finial spike (Kalash)
  const finialGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
  const finial = new THREE.Mesh(finialGeo, goldBrassMaterial);
  finial.position.set(0, 14.6, 0);
  haveli.add(finial);

  return haveli;
}

// ==========================================
// 7. ROADSIDE HINDU TEMPLE / CHHATRI SHRINE
// ==========================================
export function createRoadsideTemple(): THREE.Group {
  const temple = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xdfbc8c,
    roughness: 0.8,
  });

  // Base platform with steps
  const baseGeo = new THREE.BoxGeometry(3.6, 0.4, 3.6);
  baseGeo.translate(0, 0.2, 0);
  const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
  baseMesh.receiveShadow = true;
  temple.add(baseMesh);

  // 4 Carved Pillars
  const pillarPositions = [
    [-1.2, 1.4, -1.2],
    [1.2, 1.4, -1.2],
    [-1.2, 1.4, 1.2],
    [1.2, 1.4, 1.2],
  ];
  pillarPositions.forEach(([px, py, pz]) => {
    const pGeo = new THREE.CylinderGeometry(0.16, 0.2, 2.4, 12);
    const pMesh = new THREE.Mesh(pGeo, stoneMat);
    pMesh.position.set(px, py, pz);
    pMesh.castShadow = true;
    temple.add(pMesh);
  });

  // Shikhara Spire / Pyramidal Dome
  const roofGeo = new THREE.ConeGeometry(2.2, 2.6, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.translate(0, 3.9, 0);
  const roofMesh = new THREE.Mesh(roofGeo, stoneMat);
  roofMesh.castShadow = true;
  temple.add(roofMesh);

  // Brass Bell (Ghanti)
  const bellGeo = new THREE.ConeGeometry(0.22, 0.35, 12);
  bellGeo.rotateX(Math.PI);
  const bellMesh = new THREE.Mesh(bellGeo, goldBrassMaterial);
  bellMesh.position.set(0, 2.3, 0);
  temple.add(bellMesh);

  // Glowing Diya Oil Lamp
  const diyaGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.08, 12);
  const diyaMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
  const diya = new THREE.Mesh(diyaGeo, diyaMat);
  diya.position.set(0, 0.5, 0);
  temple.add(diya);

  const flameGeo = new THREE.SphereGeometry(0.07, 8, 8);
  flameGeo.scale(1, 2, 1);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.65, 0);
  temple.add(flame);

  // Fluttering Saffron Triangular Flag (Dhwaja)
  const flagPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6);
  const pole = new THREE.Mesh(flagPoleGeo, chromeMaterial);
  pole.position.set(0, 5.5, 0);
  temple.add(pole);

  const flagGeo = new THREE.BufferGeometry();
  const flagVertices = new Float32Array([
    0, 6.2, 0,
    0, 5.4, 0,
    0.9, 5.8, 0,
  ]);
  flagGeo.setAttribute('position', new THREE.BufferAttribute(flagVertices, 3));
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xea580c, side: THREE.DoubleSide });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  temple.add(flag);

  return temple;
}

// ==========================================
// 8. SACRED BANYAN / PEEPAL TREE
// ==========================================
export function createBanyanTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x452a17, roughness: 0.95 });
  const trunkGeo = new THREE.CylinderGeometry(0.7, 1.2, 4.5, 10);
  trunkGeo.translate(0, 2.25, 0);
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
  trunkMesh.castShadow = true;
  tree.add(trunkMesh);

  // Sacred red thread tied around the trunk (Raksha Sutra)
  const threadGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.45, 12, 1, true);
  const threadMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const thread = new THREE.Mesh(threadGeo, threadMat);
  thread.position.set(0, 1.8, 0);
  tree.add(thread);

  // Multi-tier lush green leafy canopy
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.8,
  });

  const canopyConfigs = [
    [0, 5.2, 0, 2.6],
    [-1.2, 4.5, 0.8, 1.8],
    [1.4, 4.8, -0.6, 2.0],
    [0.6, 6.4, 0.4, 1.7],
  ];

  canopyConfigs.forEach(([cx, cy, cz, cr]) => {
    const cGeo = new THREE.DodecahedronGeometry(cr, 1);
    const cMesh = new THREE.Mesh(cGeo, leafMat);
    cMesh.position.set(cx, cy, cz);
    cMesh.castShadow = true;
    tree.add(cMesh);
  });

  return tree;
}

// ==========================================
// 9. HIGHWAY MILESTONE PILLAR ("NH 48")
// ==========================================
export function createMilestone(kmText = '24'): THREE.Group {
  const stone = new THREE.Group();

  // White base cylinder
  const baseGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.8, 16);
  baseGeo.translate(0, 0.4, 0);
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.9 });
  const baseMesh = new THREE.Mesh(baseGeo, whiteMat);
  baseMesh.castShadow = true;
  stone.add(baseMesh);

  // Yellow rounded dome top (Standard Indian National Highway marker)
  const topGeo = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  topGeo.translate(0, 0.8, 0);
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.85 });
  const topMesh = new THREE.Mesh(topGeo, yellowMat);
  stone.add(topMesh);

  return stone;
}

// ==========================================
// 10. COLLECTIBLE: CUTTING CHAI CUP (BOOST)
// ==========================================
export function createChaiPickup(): THREE.Group {
  const pickup = new THREE.Group();

  // Clay Kulhad
  const cupGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.4, 12);
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xc2643a,
    roughness: 0.9,
  });
  const cup = new THREE.Mesh(cupGeo, cupMat);
  cup.position.y = 0.2;
  pickup.add(cup);

  // Steaming liquid
  const teaGeo = new THREE.CircleGeometry(0.22, 12);
  teaGeo.rotateX(-Math.PI / 2);
  const teaMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
  const tea = new THREE.Mesh(teaGeo, teaMat);
  tea.position.y = 0.38;
  pickup.add(tea);

  // Golden halo glow ring
  const haloGeo = new THREE.RingGeometry(0.4, 0.55, 16);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.y = 0.05;
  pickup.add(halo);

  return pickup;
}

// ==========================================
// 11. COLLECTIBLE: SHINING RUPEE COIN
// ==========================================
export function createRupeeCoinPickup(): THREE.Group {
  const coin = new THREE.Group();

  const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 20);
  coinGeo.rotateZ(Math.PI / 2);

  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xf5b300,
    metalness: 0.95,
    roughness: 0.15,
  });
  const coinMesh = new THREE.Mesh(coinGeo, coinMat);
  coin.add(coinMesh);

  return coin;
}
