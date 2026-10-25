import * as THREE from 'three';
import {
  getRoadTexture,
  getHaveliTexture,
  getTruckArtTexture,
  getDhabaSignTexture,
  getRickshawMudflapTexture,
  getMeterScreenTexture,
  getSpeedometerDialTexture,
  getLicensePlateTexture,
  getSpeedBreakerTexture,
  getHighwaySignTexture,
  getMountedPhoneScreenTexture,
  getTractorTrolleyTexture,
  getRivalAutoMudflapTexture,
  getBusRouteBoardTexture,
  getCycleRickshawHoodTexture,
  getDhabaQrStandTexture,
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
  lensMesh: THREE.Mesh;
  taillightMesh: THREE.Mesh;
  meterMesh: THREE.Mesh;
  exhaustAnchor: THREE.Vector3;
  wiperMesh: THREE.Mesh;
  bodyLeanPivot: THREE.Group;
  speedometerNeedle: THREE.Mesh;
  hangingCharm: THREE.Group;
  brakeLightPoint: THREE.PointLight;
  throttleGrip: THREE.Mesh;
  brakeLever: THREE.Mesh;
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

  // Single wiper blade with articulated wiper motor pivot
  const wiperGeo = new THREE.BoxGeometry(0.02, 0.45, 0.02);
  const wiperMesh = new THREE.Mesh(wiperGeo, chromeMaterial);
  wiperMesh.position.set(0, 1.35, 1.12);
  wiperMesh.rotation.z = -0.3;
  bodyLeanPivot.add(wiperMesh);
  root.wiperMesh = wiperMesh;

  // D. Hanging Talisman Charm (Nimbu Mirchi + Marigold Garland)
  // Attached to front windshield crossbar; dynamically sways with physics G-forces!
  const hangingCharm = new THREE.Group();
  hangingCharm.position.set(0, 1.62, 1.02);

  // String
  const stringGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.16, 4);
  stringGeo.translate(0, -0.08, 0);
  const stringMesh = new THREE.Mesh(stringGeo, new THREE.MeshBasicMaterial({ color: 0x1f2937 }));
  hangingCharm.add(stringMesh);

  // Marigold flower ball
  const gendaGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const gendaMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.9 });
  const gendaMesh = new THREE.Mesh(gendaGeo, gendaMat);
  gendaMesh.position.y = -0.17;
  hangingCharm.add(gendaMesh);

  // Lemon (Nimbu)
  const nimbuMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
  const lemonObj = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), nimbuMat);
  lemonObj.position.y = -0.23;
  hangingCharm.add(lemonObj);

  // 3 Green Chillies (Mirchi)
  const mirchiMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  for (let c = 0; c < 3; c++) {
    const chilli = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.08, 6), mirchiMat);
    const ang = (c * Math.PI * 2) / 3;
    chilli.position.set(Math.cos(ang) * 0.015, -0.29, Math.sin(ang) * 0.015);
    chilli.rotation.x = Math.PI;
    hangingCharm.add(chilli);
  }
  bodyLeanPivot.add(hangingCharm);
  root.hangingCharm = hangingCharm;

  // E. Handlebars & Dashboard
  const handlebarGroup = new THREE.Group();
  handlebarGroup.position.set(0, 0.95, 0.9);

  const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  barGeo.rotateZ(Math.PI / 2);
  const barMesh = new THREE.Mesh(barGeo, chromeMaterial);
  handlebarGroup.add(barMesh);

  // Left fixed rubber grip
  const leftGripGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
  leftGripGeo.rotateZ(Math.PI / 2);
  const leftGrip = new THREE.Mesh(leftGripGeo, rubberMaterial);
  leftGrip.position.set(-0.38, 0, 0);
  handlebarGroup.add(leftGrip);

  // Right twist throttle grip (rotates with forward throttle)
  const rightGrip = new THREE.Mesh(leftGripGeo, rubberMaterial);
  rightGrip.position.set(0.38, 0, 0);
  handlebarGroup.add(rightGrip);
  root.throttleGrip = rightGrip;

  // Brake lever (chrome lever in front of right grip)
  const leverGeo = new THREE.BoxGeometry(0.12, 0.012, 0.02);
  const brakeLever = new THREE.Mesh(leverGeo, chromeMaterial);
  brakeLever.position.set(0.36, -0.01, 0.05);
  handlebarGroup.add(brakeLever);
  root.brakeLever = brakeLever;

  // Dual Rear-View Mirrors with high-reflection chrome casing
  for (const mx of [-0.42, 0.42]) {
    const mirrorStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6);
    const stemMesh = new THREE.Mesh(mirrorStemGeo, chromeMaterial);
    stemMesh.position.set(mx, 0.1, 0.02);
    stemMesh.rotation.z = mx > 0 ? -0.32 : 0.32;
    handlebarGroup.add(stemMesh);

    const mirrorHeadGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
    mirrorHeadGeo.rotateX(Math.PI / 2);
    const mirrorHeadMesh = new THREE.Mesh(mirrorHeadGeo, chromeMaterial);
    mirrorHeadMesh.position.set(mx + (mx > 0 ? 0.06 : -0.06), 0.22, 0.02);

    // Reflective glass disc
    const glassDiscGeo = new THREE.CircleGeometry(0.058, 16);
    const glassDiscMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.98,
    });
    const glassDisc = new THREE.Mesh(glassDiscGeo, glassDiscMat);
    glassDisc.position.set(0, 0, -0.011);
    glassDisc.rotateY(Math.PI);
    mirrorHeadMesh.add(glassDisc);

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

  // F. Vintage Indian Fare Taxi Meter (Dashboard Mounted - Right side)
  const meterMat = new THREE.MeshBasicMaterial({ map: getMeterScreenTexture(0, false) });
  const meterGeo = new THREE.BoxGeometry(0.28, 0.15, 0.12);
  const meterMesh = new THREE.Mesh(meterGeo, meterMat);
  meterMesh.position.set(0.26, 0.9, 0.9);
  meterMesh.rotation.x = -0.3;
  bodyLeanPivot.add(meterMesh);
  root.meterMesh = meterMesh;

  // G. Authentic Circular Indian Speedometer Dial (Left side of dashboard)
  const speedoMat = new THREE.MeshBasicMaterial({ map: getSpeedometerDialTexture() });
  const speedoGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 20);
  speedoGeo.rotateX(-Math.PI / 3);
  const speedoMesh = new THREE.Mesh(speedoGeo, speedoMat);
  speedoMesh.position.set(-0.24, 0.9, 0.9);
  bodyLeanPivot.add(speedoMesh);

  // Speedometer rotating red needle
  const needleGeo = new THREE.BoxGeometry(0.008, 0.065, 0.006);
  needleGeo.translate(0, 0.03, 0.022);
  const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const speedometerNeedle = new THREE.Mesh(needleGeo, needleMat);
  speedometerNeedle.position.set(-0.24, 0.9, 0.9);
  speedometerNeedle.rotation.x = -Math.PI / 3;
  bodyLeanPivot.add(speedometerNeedle);
  root.speedometerNeedle = speedometerNeedle;

  // H. Handlebar-Mounted OPPO F27 5G Smartphone (In-Game Phone in Handlebar Cradle)
  const phoneCradleGroup = new THREE.Group();
  phoneCradleGroup.position.set(0.02, 0.98, 0.88);
  phoneCradleGroup.rotation.x = -0.42;

  // Clamp bar
  const clampGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8);
  const clampMesh = new THREE.Mesh(clampGeo, rubberMaterial);
  phoneCradleGroup.add(clampMesh);

  // OPPO F27 5G Phone body (Ultra-slim 7.69mm flat edge profile)
  const phoneBodyGeo = new THREE.BoxGeometry(0.082, 0.146, 0.0076);
  const phoneBodyMat = new THREE.MeshStandardMaterial({
    color: 0xca6218, // Amber Orange leatherette finish
    roughness: 0.45,
    metalness: 0.75,
  });
  const phoneBodyMesh = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
  phoneCradleGroup.add(phoneBodyMesh);

  // Flat golden metallic rim
  const rimBorderGeo = new THREE.BoxGeometry(0.084, 0.148, 0.0072);
  const rimBorderMat = new THREE.MeshStandardMaterial({
    color: 0xdfa025,
    metalness: 0.95,
    roughness: 0.15,
  });
  const rimMesh = new THREE.Mesh(rimBorderGeo, rimBorderMat);
  phoneBodyMesh.add(rimMesh);

  // Front Screen (High screen-to-body ratio display)
  const phoneScreenGeo = new THREE.PlaneGeometry(0.078, 0.142);
  const phoneScreenMat = new THREE.MeshBasicMaterial({
    map: getMountedPhoneScreenTexture(),
  });
  const phoneScreenMesh = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
  phoneScreenMesh.position.z = 0.0042;
  phoneBodyMesh.add(phoneScreenMesh);

  // REAR: OPPO F27 5G Signature "Cosmos Ring" Camera Module
  const cosmosRingGroup = new THREE.Group();
  cosmosRingGroup.position.set(0, 0.035, -0.0042);
  cosmosRingGroup.rotation.y = Math.PI;

  // Outer golden metal bezel ring
  const cosmosBezelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.002, 20);
  cosmosBezelGeo.rotateX(Math.PI / 2);
  const cosmosBezel = new THREE.Mesh(cosmosBezelGeo, goldBrassMaterial);
  cosmosRingGroup.add(cosmosBezel);

  // Iconic Glowing "Halo Light" LED Ring (breathes/pulses)
  const haloLightGeo = new THREE.TorusGeometry(0.019, 0.0022, 8, 24);
  const haloLightMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b, // Amber Gold Halo Glow
  });
  const haloLightMesh = new THREE.Mesh(haloLightGeo, haloLightMat);
  haloLightMesh.position.z = 0.0012;
  cosmosRingGroup.add(haloLightMesh);

  // Dual camera lenses + flash inside Cosmos Ring
  const phoneLensGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.0025, 12);
  phoneLensGeo.rotateX(Math.PI / 2);
  const phoneLensMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const lensTop = new THREE.Mesh(phoneLensGeo, phoneLensMat);
  lensTop.position.set(0, 0.007, 0.0015);
  cosmosRingGroup.add(lensTop);

  const lensBottom = new THREE.Mesh(phoneLensGeo, phoneLensMat);
  lensBottom.position.set(0, -0.007, 0.0015);
  cosmosRingGroup.add(lensBottom);

  phoneBodyMesh.add(cosmosRingGroup);

  // Silicone cradle clips
  for (const cx of [-0.043, 0.043]) {
    const clipGeo = new THREE.BoxGeometry(0.006, 0.03, 0.014);
    const clipMesh = new THREE.Mesh(clipGeo, rubberMaterial);
    clipMesh.position.set(cx, 0, 0.003);
    phoneCradleGroup.add(clipMesh);
  }
  bodyLeanPivot.add(phoneCradleGroup);

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
  root.lensMesh = lensMesh;

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

  // Real brake point light that illuminates road and smoke behind on braking
  const brakeLightPoint = new THREE.PointLight(0xdc2626, 0.0, 8, 2.0);
  brakeLightPoint.position.set(0, 0.55, -1.4);
  bodyLeanPivot.add(brakeLightPoint);
  root.brakeLightPoint = brakeLightPoint;

  // I. Rear Mudflap ("HORN OK PLEASE")
  const mudflapMat = new THREE.MeshBasicMaterial({
    map: getRickshawMudflapTexture(),
    side: THREE.DoubleSide,
  });
  const mudflapGeo = new THREE.PlaneGeometry(1.2, 0.4);
  const mudflapMesh = new THREE.Mesh(mudflapGeo, mudflapMat);
  mudflapMesh.position.set(0, 0.35, -1.18);
  bodyLeanPivot.add(mudflapMesh);

  // J. Authentic Indian License Plates (Front & Rear)
  const plateMat = new THREE.MeshBasicMaterial({ map: getLicensePlateTexture('DL 1R TA 4092') });
  const frontPlateGeo = new THREE.PlaneGeometry(0.42, 0.12);
  const frontPlate = new THREE.Mesh(frontPlateGeo, plateMat);
  frontPlate.position.set(0, 0.38, 1.63);
  bodyLeanPivot.add(frontPlate);

  const rearPlateGeo = new THREE.PlaneGeometry(0.42, 0.12);
  const rearPlate = new THREE.Mesh(rearPlateGeo, plateMat);
  rearPlate.position.set(0, 0.62, -1.18);
  rearPlate.rotateY(Math.PI);
  bodyLeanPivot.add(rearPlate);

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
  frontLeftLeg: THREE.Group;
  frontRightLeg: THREE.Group;
  backLeftLeg: THREE.Group;
  backRightLeg: THREE.Group;
  bell: THREE.Mesh;
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

  // Helper for articulated leg with hip pivot
  const createArticulatedLeg = (isFront: boolean): THREE.Group => {
    const legPivot = new THREE.Group();
    const upperLegGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8);
    upperLegGeo.translate(0, -0.45, 0);
    const upperLegMesh = new THREE.Mesh(upperLegGeo, cowSkinMat);
    upperLegMesh.castShadow = true;
    legPivot.add(upperLegMesh);

    // Hoof
    const hoofGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.1, 8);
    hoofGeo.translate(0, -0.9, 0);
    const hoofMesh = new THREE.Mesh(hoofGeo, rubberMaterial);
    legPivot.add(hoofMesh);
    return legPivot;
  };

  const fl = createArticulatedLeg(true);
  fl.position.set(-0.35, 0.95, 0.65);
  cow.add(fl);
  cow.frontLeftLeg = fl;

  const fr = createArticulatedLeg(true);
  fr.position.set(0.35, 0.95, 0.65);
  cow.add(fr);
  cow.frontRightLeg = fr;

  const bl = createArticulatedLeg(false);
  bl.position.set(-0.35, 0.95, -0.65);
  cow.add(bl);
  cow.backLeftLeg = bl;

  const br = createArticulatedLeg(false);
  br.position.set(0.35, 0.95, -0.65);
  cow.add(br);
  cow.backRightLeg = br;

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
  cow.bell = bellMesh;

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

  // Scannable Digital Dhaba UPI / QR Standee on Counter
  const qrStand = createDigitalDhabaQrStand('SHARMA-CHAI-99');
  qrStand.position.set(1.2, 1.4, 1.05);
  qrStand.scale.set(0.85, 0.85, 0.85);
  dhaba.add(qrStand);

  return dhaba;
}

// Scannable 3D Digital Dhaba QR Acrylic Standee Object
export function createDigitalDhabaQrStand(codeText: string = 'SHARMA-CHAI-99'): THREE.Group {
  const stand = new THREE.Group();

  // Acrylic base
  const baseGeo = new THREE.BoxGeometry(0.7, 0.05, 0.4);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.2,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.025;
  stand.add(baseMesh);

  // Angled QR Face
  const faceGeo = new THREE.PlaneGeometry(0.65, 0.95);
  faceGeo.translate(0, 0.5, 0);
  faceGeo.rotateX(-0.15);
  const qrMat = new THREE.MeshBasicMaterial({
    map: getDhabaQrStandTexture(codeText),
    side: THREE.DoubleSide,
  });
  const faceMesh = new THREE.Mesh(faceGeo, qrMat);
  stand.add(faceMesh);

  // Back of stand
  const backGeo = new THREE.PlaneGeometry(0.65, 0.95);
  backGeo.translate(0, 0.5, 0);
  backGeo.rotateX(-0.15);
  backGeo.rotateY(Math.PI);
  const backMesh = new THREE.Mesh(backGeo, baseMat);
  stand.add(backMesh);

  return stand;
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

// ==========================================
// 12. HERITAGE INDIAN STREET LAMPPOST
// ==========================================
export interface StreetLampObject extends THREE.Group {
  bulbMesh: THREE.Mesh;
  light: THREE.PointLight;
}

export function createStreetLamp(): StreetLampObject {
  const lamp = new THREE.Group() as StreetLampObject;

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.7,
    metalness: 0.8,
  });

  // Base plinth
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.6, 8);
  baseGeo.translate(0, 0.3, 0);
  lamp.add(new THREE.Mesh(baseGeo, ironMat));

  // Tall cast-iron column
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 5.0, 8);
  poleGeo.translate(0, 3.1, 0);
  lamp.add(new THREE.Mesh(poleGeo, ironMat));

  // Curved ornamental swan-neck bracket arm
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8);
  armGeo.rotateZ(Math.PI / 3);
  armGeo.translate(0.5, 5.5, 0);
  lamp.add(new THREE.Mesh(armGeo, ironMat));

  // Brass lantern housing
  const lanternGeo = new THREE.CylinderGeometry(0.26, 0.16, 0.45, 6);
  lanternGeo.translate(0.95, 5.65, 0);
  lamp.add(new THREE.Mesh(lanternGeo, goldBrassMaterial));

  // Emissive glowing bulb
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xffa34d,
    emissiveIntensity: 0.8,
  });
  const bulbGeo = new THREE.SphereGeometry(0.14, 10, 10);
  bulbGeo.translate(0.95, 5.5, 0);
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  lamp.add(bulbMesh);
  lamp.bulbMesh = bulbMesh;

  // Real point light casting warm illumination on the road
  const light = new THREE.PointLight(0xffa34d, 0.8, 16, 1.8);
  light.position.set(0.95, 5.3, 0);
  lamp.add(light);
  lamp.light = light;

  return lamp;
}

// ==========================================
// 13. INDIAN COMMUTER MOTORBIKE (HERO SPLENDOR / PULSAR)
// ==========================================
export function createMotorbike(): THREE.Group {
  const bike = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.8 });
  const redTankMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.3 });

  // Chassis & Engine Block
  const engineGeo = new THREE.BoxGeometry(0.3, 0.35, 0.6);
  engineGeo.translate(0, 0.45, 0);
  bike.add(new THREE.Mesh(engineGeo, frameMat));

  // Sculpted Fuel Tank (Red)
  const tankGeo = new THREE.BoxGeometry(0.35, 0.25, 0.65);
  tankGeo.translate(0, 0.82, 0.15);
  bike.add(new THREE.Mesh(tankGeo, redTankMat));

  // Saddle Seat
  const seatGeo = new THREE.BoxGeometry(0.28, 0.12, 0.7);
  seatGeo.translate(0, 0.78, -0.45);
  bike.add(new THREE.Mesh(seatGeo, rubberMaterial));

  // Chrome Exhaust
  const exhaustGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaust = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaust.position.set(0.2, 0.28, -0.4);
  bike.add(exhaust);

  // Front & Rear Wheels
  const fWheel = createWheel(0.34, 0.12);
  fWheel.position.set(0, 0.34, 0.85);
  bike.add(fWheel);

  const rWheel = createWheel(0.34, 0.12);
  rWheel.position.set(0, 0.34, -0.85);
  bike.add(rWheel);

  // Handlebars & Headlamp
  const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8);
  barGeo.rotateZ(Math.PI / 2);
  const bar = new THREE.Mesh(barGeo, chromeMaterial);
  bar.position.set(0, 1.05, 0.6);
  bike.add(bar);

  const lampGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
  lampGeo.rotateX(Math.PI / 2);
  const lamp = new THREE.Mesh(lampGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 }));
  lamp.position.set(0, 0.92, 0.85);
  bike.add(lamp);

  // RIDER FIGURE
  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.55, 0.28);
  torsoGeo.translate(0, 1.25, -0.3);
  bike.add(new THREE.Mesh(torsoGeo, shirtMat));

  // Helmeted Head
  const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
  headGeo.translate(0, 1.7, -0.28);
  bike.add(new THREE.Mesh(headGeo, helmetMat));

  // Visor
  const visorGeo = new THREE.BoxGeometry(0.22, 0.08, 0.1);
  visorGeo.translate(0, 1.7, -0.16);
  bike.add(new THREE.Mesh(visorGeo, rubberMaterial));

  // Arms leaning onto handlebar
  for (const ax of [-0.22, 0.22]) {
    const armGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.55, 6);
    armGeo.rotateX(0.7);
    armGeo.rotateZ(ax > 0 ? -0.2 : 0.2);
    armGeo.translate(ax, 1.15, 0.15);
    bike.add(new THREE.Mesh(armGeo, shirtMat));
  }

  bike.castShadow = true;
  return bike;
}

// ==========================================
// 14. DESI STREET DOG (INDIAN INDIE / PARIAH DOG)
// ==========================================
export function createDesiStreetDog(): THREE.Group {
  const dog = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }); // Sandy golden tan
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.26, 0.28, 0.65);
  torsoGeo.translate(0, 0.42, 0);
  dog.add(new THREE.Mesh(torsoGeo, coatMat));

  // Head & Muzzle
  const headGeo = new THREE.BoxGeometry(0.2, 0.2, 0.24);
  headGeo.translate(0, 0.62, 0.35);
  dog.add(new THREE.Mesh(headGeo, coatMat));

  const snoutGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18);
  snoutGeo.translate(0, 0.58, 0.5);
  dog.add(new THREE.Mesh(snoutGeo, darkMat));

  // Alert Triangular Ears
  for (const ex of [-0.08, 0.08]) {
    const earGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    earGeo.rotateZ(ex > 0 ? -0.3 : 0.3);
    earGeo.translate(ex, 0.76, 0.32);
    dog.add(new THREE.Mesh(earGeo, coatMat));
  }

  // Curled Tail (Signature Desi dog tail)
  const tailGeo = new THREE.TorusGeometry(0.1, 0.03, 6, 8, Math.PI);
  tailGeo.rotateX(-Math.PI / 2);
  tailGeo.translate(0, 0.56, -0.38);
  dog.add(new THREE.Mesh(tailGeo, coatMat));

  // 4 Legs
  const legCoords = [
    [-0.1, 0.2, 0.22],
    [0.1, 0.2, 0.22],
    [-0.1, 0.2, -0.22],
    [0.1, 0.2, -0.22],
  ];
  legCoords.forEach(([lx, ly, lz]) => {
    const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.4, 6);
    legGeo.translate(lx, ly, lz);
    dog.add(new THREE.Mesh(legGeo, coatMat));
  });

  return dog;
}

// ==========================================
// 15. ROADSIDE PUSHCART / THELA (FRUIT & VEGGIES)
// ==========================================
export function createPushCart(): THREE.Group {
  const thela = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.7, metalness: 0.6 });

  // Wooden Table Platter
  const bedGeo = new THREE.BoxGeometry(1.6, 0.1, 2.4);
  bedGeo.translate(0, 0.85, 0);
  thela.add(new THREE.Mesh(bedGeo, woodMat));

  // 4 Legs & Support Frame
  for (const lx of [-0.7, 0.7]) {
    for (const lz of [-1.0, 1.0]) {
      const pGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
      pGeo.translate(lx, 0.4, lz);
      thela.add(new THREE.Mesh(pGeo, woodMat));
    }
  }

  // 2 Large bicycle thin wheels
  for (const wx of [-0.85, 0.85]) {
    const wGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 20);
    wGeo.rotateY(Math.PI / 2);
    wGeo.translate(wx, 0.45, 0);
    thela.add(new THREE.Mesh(wGeo, wheelMat));
  }

  // Push Handle Bar
  const handleGeo = new THREE.BoxGeometry(1.5, 0.06, 0.06);
  handleGeo.translate(0, 1.0, -1.25);
  thela.add(new THREE.Mesh(handleGeo, woodMat));

  // Crates of Bananas, Oranges, and Melons
  const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const melonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

  // Bananas pile
  const bananaPile = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.18, 8), bananaMat);
  bananaPile.position.set(-0.4, 1.0, 0.4);
  thela.add(bananaPile);

  // Oranges pile
  const orangePile = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), orangeMat);
  orangePile.position.set(0.4, 1.05, 0.4);
  thela.add(orangePile);

  // Melons pile
  const melonPile = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), melonMat);
  melonPile.position.set(0, 1.05, -0.4);
  thela.add(melonPile);

  return thela;
}

// ==========================================
// 16. ASPHALT SPEED BREAKER HUMP
// ==========================================
export function createSpeedBreakerMesh(): THREE.Group {
  const root = new THREE.Group();

  const bumpGeo = new THREE.CylinderGeometry(0.9, 0.9, 13.6, 16, 1, false, 0, Math.PI);
  bumpGeo.rotateZ(Math.PI / 2);
  bumpGeo.scale(1, 0.16, 1); // Flatten into gentle ramp
  bumpGeo.translate(0, 0.05, 0);

  const bumpMat = new THREE.MeshStandardMaterial({
    map: getSpeedBreakerTexture(),
    roughness: 0.9,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(bumpGeo, bumpMat);
  mesh.receiveShadow = true;
  root.add(mesh);

  return root;
}

// ==========================================
// 17. ASPHALT POTHOLE WITH RAIN PUDDLE REFLECTION
// ==========================================
export function createPotholeMesh(): THREE.Group {
  const root = new THREE.Group();

  // Dark rough crater rim
  const rimGeo = new THREE.RingGeometry(0.5, 0.85, 12);
  rimGeo.rotateX(-Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.95,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.01;
  root.add(rim);

  // Reflective dark water puddle interior
  const puddleGeo = new THREE.CircleGeometry(0.55, 12);
  puddleGeo.rotateX(-Math.PI / 2);
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.06,
    metalness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const puddle = new THREE.Mesh(puddleGeo, puddleMat);
  puddle.position.y = 0.015;
  root.add(puddle);

  return root;
}

// 17b. Wide Reflective Monsoon Water Puddle (Dynamic Rain Hazard)
export function createWaterPuddleMesh(width = 2.4, length = 3.6): THREE.Group {
  const root = new THREE.Group();

  // Wet damp asphalt dark halo ring
  const haloGeo = new THREE.PlaneGeometry(width * 1.35, length * 1.35);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.35,
    metalness: 0.4,
    transparent: true,
    opacity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.y = 0.01;
  root.add(halo);

  // Reflective pool water surface (high specular reflection of sky & street lights)
  const waterGeo = new THREE.PlaneGeometry(width, length);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    emissive: 0x0284c7,
    emissiveIntensity: 0.15,
    roughness: 0.04,
    metalness: 0.88,
    transparent: true,
    opacity: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.018;
  root.add(water);

  // Concentric raindrop ripple rings
  for (const [rx, rz, scale] of [
    [-0.3, 0.4, 0.35],
    [0.4, -0.5, 0.45],
  ]) {
    const ringGeo = new THREE.RingGeometry(0.1, 0.16, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(rx, 0.022, rz);
    ring.scale.set(scale, 1, scale);
    root.add(ring);
  }

  return root;
}

// ==========================================
// 18. INDIAN HIGHWAY WARNING SIGNBOARD
// ==========================================
export function createHighwaySign(type: 'speed_breaker' | 'cows' | 'accident' | 'horn'): THREE.Group {
  const post = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.8 });

  // Vertical steel post
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
  poleGeo.translate(0, 1.6, 0);
  post.add(new THREE.Mesh(poleGeo, steelMat));

  // Sign face panel
  const signMat = new THREE.MeshBasicMaterial({ map: getHighwaySignTexture(type) });
  const signGeo = new THREE.PlaneGeometry(1.4, 1.4);
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 2.7, 0.05);
  post.add(signMesh);

  // Back of sign
  const backGeo = new THREE.PlaneGeometry(1.4, 1.4);
  backGeo.rotateY(Math.PI);
  const backMesh = new THREE.Mesh(backGeo, steelMat);
  backMesh.position.set(0, 2.7, -0.05);
  post.add(backMesh);

  return post;
}

// ==========================================
// 19. DESI AGRICULTURAL TRACTOR WITH SUGARCANE TROLLEY
// ==========================================
export interface DesiTractorObject extends THREE.Group {
  exhaustAnchor: THREE.Vector3;
  frontWheels: THREE.Group[];
  rearWheels: THREE.Group[];
  trailer: THREE.Group;
  smokeTimer: number;
}

export function createDesiTractor(colorTheme: 'red' | 'blue' = 'red'): DesiTractorObject {
  const tractorGroup = new THREE.Group() as DesiTractorObject;
  tractorGroup.smokeTimer = 0;
  tractorGroup.frontWheels = [];
  tractorGroup.rearWheels = [];

  const mainColor = colorTheme === 'red' ? 0xdc2626 : 0x1d4ed8;
  const tractorBodyMat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.35,
    metalness: 0.25,
  });

  const tractorEngineMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.7,
    metalness: 0.6,
  });

  // 1. Lower Chassis & Heavy Engine Block
  const chassisGeo = new THREE.BoxGeometry(1.0, 0.6, 2.2);
  chassisGeo.translate(0, 0.6, 0.4);
  const chassisMesh = new THREE.Mesh(chassisGeo, tractorEngineMat);
  chassisMesh.castShadow = true;
  tractorGroup.add(chassisMesh);

  // 2. High Hood / Engine Bonnet (Swaraj / Massey style)
  const hoodGeo = new THREE.BoxGeometry(0.9, 0.65, 1.8);
  hoodGeo.translate(0, 1.15, 0.85);
  const hoodMesh = new THREE.Mesh(hoodGeo, tractorBodyMat);
  hoodMesh.castShadow = true;
  tractorGroup.add(hoodMesh);

  // Front Radiator Grill (Silver Mesh)
  const grillGeo = new THREE.BoxGeometry(0.82, 0.55, 0.1);
  const grillMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.5,
    metalness: 0.8,
  });
  const grillMesh = new THREE.Mesh(grillGeo, grillMat);
  grillMesh.position.set(0, 1.15, 1.8);
  tractorGroup.add(grillMesh);

  // Chrome front emblem badge
  const badgeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8);
  badgeGeo.rotateX(Math.PI / 2);
  const badgeMesh = new THREE.Mesh(badgeGeo, goldBrassMaterial);
  badgeMesh.position.set(0, 1.25, 1.86);
  tractorGroup.add(badgeMesh);

  // Twin Warm Glowing Headlamps
  for (const hx of [-0.32, 0.32]) {
    const lampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    lampGeo.rotateX(Math.PI / 2);
    const lampMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfbbf24,
        emissiveIntensity: 1.2,
      })
    );
    lampMesh.position.set(hx, 1.15, 1.85);
    tractorGroup.add(lampMesh);
  }

  // Heavy Front Bumper / Counterweight Bar
  const fBarGeo = new THREE.BoxGeometry(1.4, 0.28, 0.22);
  fBarGeo.translate(0, 0.5, 1.9);
  const fBarMesh = new THREE.Mesh(fBarGeo, tractorEngineMat);
  tractorGroup.add(fBarMesh);

  // 3. Tall Vertical Chrome/Black Exhaust Silencer Stack with Flapper Cap
  const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.4, 8);
  exhaustGeo.translate(0.38, 1.8, 1.3);
  const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMaterial);
  tractorGroup.add(exhaustMesh);

  // Flapper rain cap on top of exhaust
  const capGeo = new THREE.BoxGeometry(0.12, 0.02, 0.12);
  capGeo.translate(0.38, 2.52, 1.3);
  const capMesh = new THREE.Mesh(capGeo, chromeMaterial);
  capMesh.rotation.z = 0.2;
  tractorGroup.add(capMesh);

  // Exhaust anchor position in world coordinates for black/grey smoke puff emission
  tractorGroup.exhaustAnchor = new THREE.Vector3(0.38, 2.55, 1.3);

  // 4. Large Arched Rear Wheel Mudguards (Fenders)
  for (const fx of [-0.85, 0.85]) {
    const fenderGeo = new THREE.BoxGeometry(0.48, 0.14, 1.5);
    fenderGeo.translate(fx, 1.4, -0.4);
    const fenderMesh = new THREE.Mesh(fenderGeo, tractorBodyMat);
    fenderMesh.castShadow = true;
    tractorGroup.add(fenderMesh);

    // Vertical side shield
    const shieldGeo = new THREE.BoxGeometry(0.06, 0.65, 1.48);
    shieldGeo.translate(fx > 0 ? fx - 0.22 : fx + 0.22, 1.1, -0.4);
    const shieldMesh = new THREE.Mesh(shieldGeo, tractorBodyMat);
    tractorGroup.add(shieldMesh);
  }

  // 5. Driver Station: Seat, Steering Column, Farmer Character
  const seatGeo = new THREE.BoxGeometry(0.55, 0.12, 0.45);
  seatGeo.translate(0, 1.05, -0.45);
  const seatMesh = new THREE.Mesh(seatGeo, rubberMaterial);
  tractorGroup.add(seatMesh);

  // Steering Column & Large Flat Tractor Wheel
  const colGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8);
  colGeo.rotateX(0.45);
  colGeo.translate(0, 1.25, 0.05);
  const colMesh = new THREE.Mesh(colGeo, tractorEngineMat);
  tractorGroup.add(colMesh);

  const wheelRimGeo = new THREE.TorusGeometry(0.22, 0.025, 6, 16);
  wheelRimGeo.rotateX(0.45);
  wheelRimGeo.translate(0, 1.5, -0.1);
  const wheelRimMesh = new THREE.Mesh(wheelRimGeo, rubberMaterial);
  tractorGroup.add(wheelRimMesh);

  // Desi Farmer Figure (White Kurta + Colorful Saffron/Red Safa Turban)
  const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
  const farmerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.6, 8), kurtaMat);
  farmerTorso.position.set(0, 1.4, -0.4);
  tractorGroup.add(farmerTorso);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.8 });
  const farmerHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), skinMat);
  farmerHead.position.set(0, 1.82, -0.4);
  tractorGroup.add(farmerHead);

  // Vibrant Safa / Turban (Saffron / Marigold)
  const turbanMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.9 });
  const turbanGeo = new THREE.TorusGeometry(0.16, 0.08, 8, 12);
  turbanGeo.rotateX(Math.PI / 2);
  const turbanMesh = new THREE.Mesh(turbanGeo, turbanMat);
  turbanMesh.position.set(0, 1.92, -0.4);
  tractorGroup.add(turbanMesh);

  // Arms reaching for steering wheel
  for (const ax of [-0.18, 0.18]) {
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);
    armGeo.rotateX(0.85);
    armGeo.rotateZ(ax > 0 ? -0.2 : 0.2);
    armGeo.translate(ax, 1.45, -0.2);
    tractorGroup.add(new THREE.Mesh(armGeo, kurtaMat));
  }

  // 6. Wheels: 2 Small Front Wheels, 2 Massive Ribbed Lugged Rear Wheels
  // Front Wheels (Radius 0.42, Width 0.22)
  for (const wx of [-0.65, 0.65]) {
    const fw = createWheel(0.42, 0.22);
    fw.position.set(wx, 0.42, 1.45);
    tractorGroup.add(fw);
    tractorGroup.frontWheels.push(fw);
  }

  // Massive Rear Wheels with Deep Chevron Lug Treads (Radius 0.78, Width 0.46)
  for (const wx of [-0.88, 0.88]) {
    const rwGroup = new THREE.Group();
    rwGroup.position.set(wx, 0.78, -0.42);

    // Main heavy tire
    const tireGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.46, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, rubberMaterial);
    tireMesh.castShadow = true;
    rwGroup.add(tireMesh);

    // Deep Angular Chevron Lug Treads around perimeter
    const lugGeo = new THREE.BoxGeometry(0.48, 0.08, 0.12);
    for (let a = 0; a < 14; a++) {
      const angle = (a / 14) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, rubberMaterial);
      lug.position.set(0, Math.sin(angle) * 0.76, Math.cos(angle) * 0.76);
      lug.rotation.x = angle + 0.2;
      rwGroup.add(lug);
    }

    // Yellow/Red Heavy Cast-Iron Wheel Rim & Hub
    const rimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.48, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.5,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rwGroup.add(rimMesh);

    tractorGroup.add(rwGroup);
    tractorGroup.rearWheels.push(rwGroup);
  }

  // 7. Tow Hitch and Large Heavy Sugarcane / Agricultural Trolley (Trailer)
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, -2.8);

  // Tow bar link
  const towBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8);
  towBarGeo.rotateX(Math.PI / 2);
  towBarGeo.translate(0, 0.55, 0.8);
  trailerGroup.add(new THREE.Mesh(towBarGeo, tractorEngineMat));

  // Wooden slatted heavy cargo bed
  const trailerBedGeo = new THREE.BoxGeometry(2.1, 1.2, 3.4);
  trailerBedGeo.translate(0, 1.15, -0.7);
  const trailerMat = new THREE.MeshStandardMaterial({
    map: getTractorTrolleyTexture(),
    roughness: 0.8,
  });
  const trailerBedMesh = new THREE.Mesh(trailerBedGeo, trailerMat);
  trailerBedMesh.castShadow = true;
  trailerBedMesh.receiveShadow = true;
  trailerGroup.add(trailerBedMesh);

  // Sugarcane Bundles (Piled high, overflowing the trailer)
  const caneMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.75 }); // Fresh sugarcane green/yellow
  const caneStalkGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.2, 8);
  caneStalkGeo.rotateX(Math.PI / 2);

  const caneConfigs = [
    [-0.6, 1.85, -0.7],
    [-0.2, 1.95, -0.65],
    [0.2, 1.95, -0.65],
    [0.6, 1.85, -0.7],
    [-0.4, 2.15, -0.6],
    [0.0, 2.25, -0.6],
    [0.4, 2.15, -0.6],
    [-0.1, 2.45, -0.6],
    [0.1, 2.45, -0.6],
  ];

  caneConfigs.forEach(([cx, cy, cz]) => {
    const bundle = new THREE.Mesh(caneStalkGeo, caneMat);
    bundle.position.set(cx, cy, cz);
    bundle.castShadow = true;
    trailerGroup.add(bundle);
  });

  // Jute Burlap Grain Sacks tucked at the rear
  const burlapMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 });
  for (let s = 0; s < 4; s++) {
    const sackGeo = new THREE.SphereGeometry(0.28, 8, 8);
    sackGeo.scale(1.2, 0.7, 0.9);
    const sack = new THREE.Mesh(sackGeo, burlapMat);
    sack.position.set(-0.6 + s * 0.4, 1.8, -2.1);
    trailerGroup.add(sack);
  }

  // 2 Heavy Trailer Wheels
  for (const tx of [-1.12, 1.12]) {
    const tw = createWheel(0.62, 0.35);
    tw.position.set(tx, 0.62, -0.85);
    trailerGroup.add(tw);
  }

  // Rear hazard reflectors on trailer
  for (const rx of [-0.9, 0.9]) {
    const refGeo = new THREE.BoxGeometry(0.14, 0.14, 0.04);
    const refMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
    });
    const ref = new THREE.Mesh(refGeo, refMat);
    ref.position.set(rx, 0.65, -2.42);
    trailerGroup.add(ref);
  }

  tractorGroup.add(trailerGroup);
  tractorGroup.trailer = trailerGroup;

  tractorGroup.castShadow = true;
  return tractorGroup;
}

// ==========================================
// 20. UNEXPECTED RIVAL AUTO-RICKSHAW TRAFFIC
// ==========================================
export interface RivalAutoObject extends THREE.Group {
  leftIndicator: THREE.Mesh;
  rightIndicator: THREE.Mesh;
  bodyPivot: THREE.Group;
  wheels: THREE.Group[];
  taillightMesh: THREE.Mesh;
  brakeLightPoint: THREE.PointLight;
}

export function createRivalAutoRickshaw(
  variant: 'mumbai' | 'delhi' | 'bangalore' = 'mumbai'
): RivalAutoObject {
  const rival = new THREE.Group() as RivalAutoObject;
  rival.wheels = [];

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.35;
  rival.add(bodyPivot);
  rival.bodyPivot = bodyPivot;

  // Colors based on regional iconic liveries
  const bodyColors = {
    mumbai: 0x18181b, // Mumbai Black
    delhi: 0x065f46, // Delhi CNG Emerald Green
    bangalore: 0xeab308, // Bangalore Bright Yellow
  };

  const roofColors = {
    mumbai: 0xf59e0b, // Yellow Canopy
    delhi: 0xf59e0b, // Yellow Canopy
    bangalore: 0x18181b, // Black Canopy
  };

  const lowerMat = new THREE.MeshStandardMaterial({
    color: bodyColors[variant],
    roughness: 0.35,
    metalness: 0.25,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColors[variant],
    roughness: 0.45,
    metalness: 0.1,
  });

  // Lower Cabin Shell
  const lowerGeo = new THREE.BoxGeometry(1.36, 0.58, 2.2);
  lowerGeo.translate(0, 0.45, 0);
  const lowerMesh = new THREE.Mesh(lowerGeo, lowerMat);
  lowerMesh.castShadow = true;
  bodyPivot.add(lowerMesh);

  // Slanted front apron nose
  const apronGeo = new THREE.CylinderGeometry(0.5, 0.68, 0.65, 14, 1, false, 0, Math.PI);
  apronGeo.rotateY(Math.PI / 2);
  apronGeo.translate(0, 0.58, 1.2);
  const apronMesh = new THREE.Mesh(apronGeo, lowerMat);
  apronMesh.castShadow = true;
  bodyPivot.add(apronMesh);

  // Yellow Roof Canopy
  const roofGeo = new THREE.BoxGeometry(1.4, 0.12, 2.35);
  roofGeo.translate(0, 1.72, 0.05);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.castShadow = true;
  bodyPivot.add(roofMesh);

  // Roof pillars (black metal tubing)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
  [
    [-0.62, 1.15, -1.0],
    [0.62, 1.15, -1.0],
    [-0.62, 1.15, 0.2],
    [0.62, 1.15, 0.2],
    [-0.42, 1.15, 1.0],
    [0.42, 1.15, 1.0],
  ].forEach(([px, py, pz]) => {
    const pGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.15, 6);
    const pMesh = new THREE.Mesh(pGeo, pillarMat);
    pMesh.position.set(px, py, pz);
    bodyPivot.add(pMesh);
  });

  // Windshield
  const wsGeo = new THREE.PlaneGeometry(0.95, 0.6);
  const wsMesh = new THREE.Mesh(wsGeo, glassMaterial);
  wsMesh.position.set(0, 1.32, 1.05);
  wsMesh.rotateX(-0.15);
  bodyPivot.add(wsMesh);

  // Headlight (Single central round headlamp)
  const headlampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  headlampGeo.rotateX(Math.PI / 2);
  const headlampMesh = new THREE.Mesh(
    headlampGeo,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 1.0,
    })
  );
  headlampMesh.position.set(0, 0.82, 1.55);
  bodyPivot.add(headlampMesh);

  // Rooftop Luggage Rack with Tied Bags & Suitcase
  const rackGeo = new THREE.BoxGeometry(1.15, 0.06, 1.4);
  rackGeo.translate(0, 1.82, -0.2);
  bodyPivot.add(new THREE.Mesh(rackGeo, pillarMat));

  // Luggage: Retro red suitcase & blue cloth duffel bag
  const suitcaseGeo = new THREE.BoxGeometry(0.45, 0.25, 0.7);
  const suitcaseMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
  const suitcase = new THREE.Mesh(suitcaseGeo, suitcaseMat);
  suitcase.position.set(-0.25, 2.0, -0.2);
  bodyPivot.add(suitcase);

  const duffelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 8);
  duffelGeo.rotateZ(Math.PI / 2);
  const duffelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.85 });
  const duffel = new THREE.Mesh(duffelGeo, duffelMat);
  duffel.position.set(0.28, 2.02, -0.2);
  bodyPivot.add(duffel);

  // Driver Figure (Khaki Auto Driver Uniform)
  const khakiMat = new THREE.MeshStandardMaterial({ color: 0xa87948, roughness: 0.85 });
  const dTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.6, 8), khakiMat);
  dTorso.position.set(0, 1.02, 0.35);
  bodyPivot.add(dTorso);

  const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.8 }));
  dHead.position.set(0, 1.44, 0.35);
  bodyPivot.add(dHead);

  // Driver Khaki Cap
  const capGeo = new THREE.BoxGeometry(0.24, 0.08, 0.26);
  const capMesh = new THREE.Mesh(capGeo, khakiMat);
  capMesh.position.set(0, 1.55, 0.35);
  bodyPivot.add(capMesh);

  // Rear Mudflap with Authentic Slogan ("BURI NAZAR WALE TERA MUNH KALA")
  const mudflapGeo = new THREE.PlaneGeometry(0.85, 0.42);
  const mudflapMat = new THREE.MeshBasicMaterial({
    map: getRivalAutoMudflapTexture(variant),
    side: THREE.DoubleSide,
  });
  const mudflap = new THREE.Mesh(mudflapGeo, mudflapMat);
  mudflap.position.set(0, 0.35, -1.12);
  mudflap.rotateY(Math.PI);
  bodyPivot.add(mudflap);

  // Taillights
  const tailGeo = new THREE.BoxGeometry(0.2, 0.1, 0.04);
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8,
  });
  const taillight = new THREE.Mesh(tailGeo, tailMat);
  taillight.position.set(0, 0.65, -1.11);
  bodyPivot.add(taillight);
  rival.taillightMesh = taillight;

  const brakeLight = new THREE.PointLight(0xef4444, 0, 4);
  brakeLight.position.set(0, 0.65, -1.2);
  bodyPivot.add(brakeLight);
  rival.brakeLightPoint = brakeLight;

  // Turn Indicators (Left and Right - can blink during lane changing AI)
  const indGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const indMatLeft = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const indMatRight = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });

  const indLeft = new THREE.Mesh(indGeo, indMatLeft);
  indLeft.position.set(-0.62, 0.65, -1.1);
  bodyPivot.add(indLeft);
  rival.leftIndicator = indLeft;

  const indRight = new THREE.Mesh(indGeo, indMatRight);
  indRight.position.set(0.62, 0.65, -1.1);
  bodyPivot.add(indRight);
  rival.rightIndicator = indRight;

  // 3 Wheels (1 front, 2 rear)
  const frontWheel = createWheel(0.32, 0.18);
  frontWheel.position.set(0, 0.32, 1.15);
  rival.add(frontWheel);
  rival.wheels.push(frontWheel);

  const rearLeftWheel = createWheel(0.32, 0.18);
  rearLeftWheel.position.set(-0.62, 0.32, -0.65);
  rival.add(rearLeftWheel);
  rival.wheels.push(rearLeftWheel);

  const rearRightWheel = createWheel(0.32, 0.18);
  rearRightWheel.position.set(0.62, 0.32, -0.65);
  rival.add(rearRightWheel);
  rival.wheels.push(rearRightWheel);

  rival.castShadow = true;
  return rival;
}

// ==========================================
// 21. INDIAN STATE TRANSPORT BUS ("LAL DIBBA")
// ==========================================
export interface StateTransportBusObject extends THREE.Group {
  wheels: THREE.Group[];
  headlamps: THREE.Mesh[];
  taillights: THREE.Mesh[];
}

export function createStateTransportBus(): StateTransportBusObject {
  const bus = new THREE.Group() as StateTransportBusObject;
  bus.wheels = [];
  bus.headlamps = [];
  bus.taillights = [];

  // Iconic Red & Cream Paint
  const redBusMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Classic State Transport Red
    roughness: 0.35,
    metalness: 0.25,
  });

  const creamStripeMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.4,
    metalness: 0.1,
  });

  const busInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });

  // 1. Main Heavy Bus Body (Length 8.6m, Width 2.5m, Height 2.8m)
  const bodyGeo = new THREE.BoxGeometry(2.5, 2.7, 8.6);
  bodyGeo.translate(0, 1.85, 0);
  const bodyMesh = new THREE.Mesh(bodyGeo, redBusMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bus.add(bodyMesh);

  // Horizontal Cream Belt Stripe along middle
  const stripeGeo = new THREE.BoxGeometry(2.52, 0.45, 8.58);
  stripeGeo.translate(0, 1.65, 0);
  const stripeMesh = new THREE.Mesh(stripeGeo, creamStripeMat);
  bus.add(stripeMesh);

  // 2. Front Windshield (Dual Glass Panes)
  const fGlassGeo = new THREE.BoxGeometry(2.35, 0.95, 0.08);
  fGlassGeo.translate(0, 2.2, 4.31);
  const fGlass = new THREE.Mesh(fGlassGeo, glassMaterial);
  bus.add(fGlass);

  // Front Illuminated Destination Route Board ("MUMBAI - PUNE EXPRESS")
  const boardGeo = new THREE.PlaneGeometry(2.2, 0.55);
  const boardMat = new THREE.MeshBasicMaterial({
    map: getBusRouteBoardTexture(),
  });
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.position.set(0, 2.88, 4.32);
  bus.add(boardMesh);

  // Side Passenger Windows (Open Indian Bus Grill Style)
  const sideGlassGeo = new THREE.BoxGeometry(2.54, 0.75, 6.2);
  sideGlassGeo.translate(0, 2.2, -0.4);
  const sideGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
  bus.add(sideGlass);

  // Metal window safety bars
  for (let z = -3.2; z <= 2.4; z += 0.8) {
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.72, 6);
    const leftBar = new THREE.Mesh(barGeo, chromeMaterial);
    leftBar.position.set(-1.28, 2.2, z);
    bus.add(leftBar);

    const rightBar = new THREE.Mesh(barGeo, chromeMaterial);
    rightBar.position.set(1.28, 2.2, z);
    bus.add(rightBar);
  }

  // 3. Rooftop Luggage Carrier Rack (Heavily loaded with traveler luggage)
  const rackFrameGeo = new THREE.BoxGeometry(2.2, 0.35, 5.8);
  rackFrameGeo.translate(0, 3.38, -0.6);
  bus.add(new THREE.Mesh(rackFrameGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })));

  // Luggage: Trunks, bags, tarpaulin bundles
  const bagColors = [0x1e3a8a, 0x047857, 0xb45309, 0x7c2d12, 0x4b5563];
  for (let i = 0; i < 8; i++) {
    const bagGeo = new THREE.BoxGeometry(0.65, 0.38, 0.85);
    const bagMat = new THREE.MeshStandardMaterial({ color: bagColors[i % bagColors.length], roughness: 0.8 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    const bx = (i % 2 === 0 ? -0.55 : 0.55) + (Math.random() - 0.5) * 0.1;
    const bz = -2.6 + Math.floor(i / 2) * 1.3;
    bag.position.set(bx, 3.65, bz);
    bag.castShadow = true;
    bus.add(bag);
  }

  // Dual Booming Brass Pneumatic Roof Horns
  for (const hx of [-0.65, 0.65]) {
    const hornGeo = new THREE.ConeGeometry(0.14, 0.65, 8);
    hornGeo.rotateX(-Math.PI / 2);
    const hornMesh = new THREE.Mesh(hornGeo, goldBrassMaterial);
    hornMesh.position.set(hx, 3.35, 4.0);
    bus.add(hornMesh);
  }

  // Chrome Front Grill & Heavy Steel Bumper
  const grillGeo = new THREE.BoxGeometry(1.8, 0.55, 0.1);
  grillGeo.translate(0, 0.95, 4.32);
  const grillMesh = new THREE.Mesh(grillGeo, chromeMaterial);
  bus.add(grillMesh);

  const bumperGeo = new THREE.BoxGeometry(2.6, 0.42, 0.3);
  bumperGeo.translate(0, 0.55, 4.38);
  const bumperMesh = new THREE.Mesh(bumperGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
  bus.add(bumperMesh);

  // Twin Headlamps
  for (const lx of [-0.95, 0.95]) {
    const lampGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    lampGeo.rotateX(Math.PI / 2);
    const lampMesh = new THREE.Mesh(
      lampGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 1.2,
      })
    );
    lampMesh.position.set(lx, 1.05, 4.32);
    bus.add(lampMesh);
    bus.headlamps.push(lampMesh);
  }

  // Rear Taillights
  for (const tx of [-1.0, 1.0]) {
    const tailGeo = new THREE.BoxGeometry(0.2, 0.35, 0.06);
    const tailMesh = new THREE.Mesh(
      tailGeo,
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.9 })
    );
    tailMesh.position.set(tx, 1.1, -4.32);
    bus.add(tailMesh);
    bus.taillights.push(tailMesh);
  }

  // Rear Safety Slogan
  const rearSignGeo = new THREE.PlaneGeometry(1.8, 0.4);
  const rearSignCanvas = document.createElement('canvas');
  rearSignCanvas.width = 256;
  rearSignCanvas.height = 64;
  const sctx = rearSignCanvas.getContext('2d')!;
  sctx.fillStyle = '#f59e0b';
  sctx.fillRect(0, 0, 256, 64);
  sctx.fillStyle = '#000000';
  sctx.font = 'bold 20px sans-serif';
  sctx.textAlign = 'center';
  sctx.fillText('PASS WITH CARE ➔', 128, 40);
  const rearSignTex = new THREE.CanvasTexture(rearSignCanvas);
  const rearSignMesh = new THREE.Mesh(rearSignGeo, new THREE.MeshBasicMaterial({ map: rearSignTex }));
  rearSignMesh.position.set(0, 0.7, -4.32);
  rearSignMesh.rotateY(Math.PI);
  bus.add(rearSignMesh);

  // 6 Heavy Bus Wheels (2 front, 4 rear double axle)
  const wheelPositions = [
    [-1.18, 0.55, 2.6],
    [1.18, 0.55, 2.6],
    [-1.18, 0.55, -2.2],
    [1.18, 0.55, -2.2],
    [-1.18, 0.55, -3.4],
    [1.18, 0.55, -3.4],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    const w = createWheel(0.55, 0.32);
    w.position.set(wx, wy, wz);
    bus.add(w);
    bus.wheels.push(w);
  });

  return bus;
}

// ==========================================
// 22. INDIAN CYCLE RICKSHAW
// ==========================================
export interface CycleRickshawObject extends THREE.Group {
  frontWheel: THREE.Group;
  rearWheels: THREE.Group[];
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  pedalPivot: THREE.Group;
  bellMesh: THREE.Mesh;
  pullerAnimTime: number;
}

export function createCycleRickshaw(): CycleRickshawObject {
  const cycle = new THREE.Group() as CycleRickshawObject;
  cycle.rearWheels = [];
  cycle.pullerAnimTime = Math.random() * 5;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, metalness: 0.7 }); // Emerald green cycle frame
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });

  // 1. Front Bicycle Frame & Handlebars
  const fForkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
  fForkGeo.translate(0, 0.55, 0.95);
  fForkGeo.rotateX(0.2);
  cycle.add(new THREE.Mesh(fForkGeo, frameMat));

  // Chrome Handlebar
  const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8);
  barGeo.rotateZ(Math.PI / 2);
  const bar = new THREE.Mesh(barGeo, chromeMaterial);
  bar.position.set(0, 1.05, 0.92);
  cycle.add(bar);

  // Brass Ringing Bell on handlebar
  const bellGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const bellMesh = new THREE.Mesh(bellGeo, goldBrassMaterial);
  bellMesh.position.set(0.18, 1.08, 0.93);
  cycle.add(bellMesh);
  cycle.bellMesh = bellMesh;

  // Front Thin Spoked Bicycle Wheel (Radius 0.38, Width 0.08)
  const fw = createWheel(0.38, 0.08);
  fw.position.set(0, 0.38, 1.15);
  cycle.add(fw);
  cycle.frontWheel = fw;

  // 2. Puller Pedaling Station & Articulated Figure
  const saddleGeo = new THREE.BoxGeometry(0.2, 0.08, 0.24);
  saddleGeo.translate(0, 0.88, 0.35);
  cycle.add(new THREE.Mesh(saddleGeo, rubberMaterial));

  // Pedal Crank Pivot
  const pedalPivot = new THREE.Group();
  pedalPivot.position.set(0, 0.45, 0.48);
  cycle.add(pedalPivot);
  cycle.pedalPivot = pedalPivot;

  // Puller Figure
  const pullerGroup = new THREE.Group();
  pullerGroup.position.set(0, 0.88, 0.35);

  const vestMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 }); // Blue banyan/vest
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.8 });
  const lungiMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 }); // Checked lungi / dhoti

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.52, 8), vestMat);
  torso.position.y = 0.35;
  pullerGroup.add(torso);

  // Red gamcha cloth wrapped around neck
  const gamcha = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  gamcha.position.y = 0.56;
  gamcha.rotateX(Math.PI / 2);
  pullerGroup.add(gamcha);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), skinMat);
  head.position.y = 0.76;
  pullerGroup.add(head);

  // Arms leaning on handlebar
  for (const ax of [-0.16, 0.16]) {
    const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.48, 6);
    armGeo.rotateX(0.75);
    armGeo.rotateZ(ax > 0 ? -0.2 : 0.2);
    armGeo.translate(ax, 0.42, 0.22);
    pullerGroup.add(new THREE.Mesh(armGeo, skinMat));
  }

  // Articulated Pedaling Legs (Pivoted at hips)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.12, 0.08, 0.05);
  const lLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.45, 6);
  lLegGeo.translate(0, -0.22, 0);
  leftLegPivot.add(new THREE.Mesh(lLegGeo, lungiMat));
  pullerGroup.add(leftLegPivot);
  cycle.leftLeg = leftLegPivot;

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.12, 0.08, 0.05);
  const rLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.45, 6);
  rLegGeo.translate(0, -0.22, 0);
  rightLegPivot.add(new THREE.Mesh(rLegGeo, lungiMat));
  pullerGroup.add(rightLegPivot);
  cycle.rightLeg = rightLegPivot;

  cycle.add(pullerGroup);

  // 3. Rear Passenger Carriage & Floral Vinyl Canopy Hood
  const carriageGeo = new THREE.BoxGeometry(1.25, 0.45, 1.2);
  carriageGeo.translate(0, 0.52, -0.4);
  cycle.add(new THREE.Mesh(carriageGeo, darkMetalMat));

  // Padded Passenger Bench Seat (Red Vinyl)
  const benchGeo = new THREE.BoxGeometry(1.15, 0.12, 0.55);
  benchGeo.translate(0, 0.78, -0.45);
  cycle.add(new THREE.Mesh(benchGeo, seatMat));

  const backrestGeo = new THREE.BoxGeometry(1.15, 0.45, 0.1);
  backrestGeo.translate(0, 1.05, -0.7);
  cycle.add(new THREE.Mesh(backrestGeo, seatMat));

  // Folded Curved Vinyl Canopy Hood with Rangoli Texture
  const hoodGeo = new THREE.CylinderGeometry(0.68, 0.68, 1.22, 12, 1, false, 0, Math.PI);
  hoodGeo.rotateZ(Math.PI / 2);
  hoodGeo.translate(0, 1.48, -0.5);
  const hoodMat = new THREE.MeshStandardMaterial({
    map: getCycleRickshawHoodTexture(),
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
  cycle.add(hoodMesh);

  // 2 Rear Thin Spoked Bicycle Wheels
  for (const rx of [-0.68, 0.68]) {
    const rw = createWheel(0.42, 0.08);
    rw.position.set(rx, 0.42, -0.4);
    cycle.add(rw);
    cycle.rearWheels.push(rw);
  }

  // Red reflective triangle at rear
  const refGeo = new THREE.BufferGeometry();
  const refVertices = new Float32Array([
    0, 0.6, -1.02,
    -0.12, 0.42, -1.02,
    0.12, 0.42, -1.02,
  ]);
  refGeo.setAttribute('position', new THREE.BufferAttribute(refVertices, 3));
  cycle.add(new THREE.Mesh(refGeo, new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })));

  cycle.castShadow = true;
  return cycle;
}

// ==========================================
// 23. CHAI BREAK DHABA STALL & PULLOVER BAY
// ==========================================
export interface ChaiBreakStallObject extends THREE.Group {
  stoppingBay: THREE.Mesh;
  kettle: THREE.Mesh;
  steamGroup: THREE.Group;
}

export function createChaiBreakStall(): ChaiBreakStallObject {
  const stall = new THREE.Group() as ChaiBreakStallObject;

  // 1. Roadside Dhaba Wooden Hut
  const dhaba = createChaiDhaba();
  stall.add(dhaba);

  // 2. Yellow/Green Striped Stopping Bay on Roadside Shoulder
  const bayGeo = new THREE.PlaneGeometry(3.6, 9.0);
  bayGeo.rotateX(-Math.PI / 2);

  const bayCanvas = document.createElement('canvas');
  bayCanvas.width = 256;
  bayCanvas.height = 512;
  const bctx = bayCanvas.getContext('2d')!;

  // Green parking zone with bright yellow diagonal border
  bctx.fillStyle = '#064e3b';
  bctx.fillRect(0, 0, 256, 512);

  // Diagonal border stripes
  bctx.fillStyle = '#f59e0b';
  bctx.fillRect(0, 0, 256, 32);
  bctx.fillRect(0, 480, 256, 32);
  bctx.fillRect(0, 0, 32, 512);
  bctx.fillRect(224, 0, 32, 512);

  bctx.fillStyle = '#fef08a';
  bctx.font = 'bold 28px sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('☕ CHAI BREAK', 128, 180);
  bctx.font = 'bold 22px sans-serif';
  bctx.fillText('PULL OVER [E]', 128, 230);
  bctx.font = '18px monospace';
  bctx.fillStyle = '#34d399';
  bctx.fillText('REFUEL STAMINA', 128, 280);

  const bayTex = new THREE.CanvasTexture(bayCanvas);
  const bayMat = new THREE.MeshBasicMaterial({
    map: bayTex,
    transparent: true,
    opacity: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const stoppingBay = new THREE.Mesh(bayGeo, bayMat);
  stoppingBay.position.set(-2.5, 0.02, 0); // Positioned along roadside shoulder
  stall.add(stoppingBay);
  stall.stoppingBay = stoppingBay;

  // Flashing roadside LED beacon arrow pointing to the bay
  const arrowGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
  arrowGeo.rotateZ(Math.PI / 2);
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.5,
  });
  const beacon = new THREE.Mesh(arrowGeo, arrowMat);
  beacon.position.set(-0.8, 1.8, 3.8);
  stall.add(beacon);

  // Digital Dhaba Roadside Scannable QR Board
  const roadsideQr = createDigitalDhabaQrStand('MUNNA-SAMOSA-24');
  roadsideQr.position.set(-0.6, 0, 4.4);
  roadsideQr.scale.set(1.3, 1.3, 1.3);
  roadsideQr.rotation.y = -Math.PI / 3;
  stall.add(roadsideQr);

  return stall;
}

