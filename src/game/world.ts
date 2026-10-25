import * as THREE from 'three';
import {
  createTataTruck,
  createAmbassadorTaxi,
  createSacredCow,
  createChaiDhaba,
  createHaveliBuilding,
  createRoadsideTemple,
  createBanyanTree,
  createMilestone,
  createChaiPickup,
  createRupeeCoinPickup,
  createStreetLamp,
  createMotorbike,
  createDesiStreetDog,
  createPushCart,
  createSpeedBreakerMesh,
  createPotholeMesh,
  createWaterPuddleMesh,
  createHighwaySign,
  StreetLampObject,
  SacredCowObject,
  createDesiTractor,
  DesiTractorObject,
  createRivalAutoRickshaw,
  RivalAutoObject,
  createStateTransportBus,
  StateTransportBusObject,
  createCycleRickshaw,
  CycleRickshawObject,
  createChaiBreakStall,
  ChaiBreakStallObject,
} from './models';
import { getRoadTexture, getRangoliTexture } from './textures';

const _tempWorldPos = new THREE.Vector3();

export interface TrafficEntity {
  mesh: THREE.Group;
  speed: number;
  lane: number;
  type: 'truck' | 'taxi' | 'cow' | 'bike' | 'dog' | 'thela' | 'tractor' | 'rival_auto' | 'bus' | 'cycle_rickshaw';
  colliderRadius: number;
  cowRef?: SacredCowObject;
  tractorRef?: DesiTractorObject;
  rivalAutoRef?: RivalAutoObject;
  busRef?: StateTransportBusObject;
  cycleRef?: CycleRickshawObject;
  targetX?: number;

  // Dynamic Crossing Cow properties
  isCrossingCow?: boolean;
  crossDirection?: number; // 1 (left to right) or -1 (right to left)
  crossSpeed?: number;
  crossPauseTimer?: number;
  isPausedMidway?: boolean;
  hasAlertedPlayer?: boolean;

  // Dynamic Rival Auto properties
  isRivalAuto?: boolean;
  nextLaneChangeIn?: number;
  targetLaneX?: number;
  isBrakingSudden?: boolean;
  brakeTimer?: number;
  turnSignalActive?: 'left' | 'right' | null;
  signalBlinkTimer?: number;

  // Dynamic Tractor properties
  isTractor?: boolean;
  smokeTimer?: number;

  // Near-miss detection & Hazard alert flags
  nearMissRegistered?: boolean;
  hazardAlertSent?: boolean;
}

export interface CollectibleEntity {
  mesh: THREE.Group;
  type: 'chai' | 'coin';
  active: boolean;
  baseY: number;
}

export interface RoadHazardEntity {
  mesh: THREE.Group;
  z: number;
  x: number;
  type: 'speedbreaker' | 'pothole' | 'puddle';
  radius: number;
  triggered?: boolean;
}

export interface PassengerStop {
  mesh: THREE.Group;
  z: number;
  x: number;
  active: boolean;
  destinationZ?: number;
  name: string;
}

export class WorldManager {
  public scene: THREE.Scene;
  public chunks: THREE.Group[] = [];
  public traffic: TrafficEntity[] = [];
  public collectibles: CollectibleEntity[] = [];
  public roadHazards: RoadHazardEntity[] = [];
  public passengerStops: PassengerStop[] = [];
  public streetLamps: StreetLampObject[] = [];
  public templePositions: { z: number; passed: boolean }[] = [];
  public chaiStalls: { z: number; x: number; mesh: THREE.Group; triggered: boolean }[] = [];

  public chunkLength = 100;
  public numChunks = 5;
  private currentChunkIndex = 0;
  private roadMaterial: THREE.MeshStandardMaterial;
  private groundMaterial: THREE.MeshStandardMaterial;
  public currentTimePhase: string = 'sunset';

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const roadTex = getRoadTexture();
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Indian countryside golden-sand / terracotta clay soil
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xba8a56,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.initTrack();
  }

  private initTrack() {
    for (let i = 0; i < this.numChunks; i++) {
      const zPos = (i - 1) * this.chunkLength;
      const chunk = this.createChunk(zPos, i);
      this.chunks.push(chunk);
      this.scene.add(chunk);
    }
    this.currentChunkIndex = this.numChunks - 1;
  }

  private createChunk(zPos: number, index: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    // 1. Road Surface (14m wide asphalt highway)
    const roadGeo = new THREE.PlaneGeometry(14, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.receiveShadow = true;
    chunk.add(roadMesh);

    // 1b. Reflective Cat's Eyes / Road Studs along median & edges
    const studMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const studGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
    for (let sz = -this.chunkLength / 2; sz < this.chunkLength / 2; sz += 8) {
      // Median stud
      const medianStud = new THREE.Mesh(studGeo, studMat);
      medianStud.position.set(0, 0.02, sz);
      chunk.add(medianStud);

      // Left & right edge studs
      const leftStud = new THREE.Mesh(studGeo, studMat);
      leftStud.position.set(-6.5, 0.02, sz);
      chunk.add(leftStud);

      const rightStud = new THREE.Mesh(studGeo, studMat);
      rightStud.position.set(6.5, 0.02, sz);
      chunk.add(rightStud);
    }

    // 2. Wide Terracotta Terrain Shoulders (left and right)
    const groundGeo = new THREE.PlaneGeometry(80, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, -0.05, 0);
    const groundMesh = new THREE.Mesh(groundGeo, this.groundMaterial);
    groundMesh.receiveShadow = true;
    chunk.add(groundMesh);

    // 3. Concrete Curbs (Indian yellow-and-black painted curbs)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 });
    for (const cx of [-7.2, 7.2]) {
      const curbGeo = new THREE.BoxGeometry(0.5, 0.25, this.chunkLength);
      curbGeo.translate(cx, 0.1, 0);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      chunk.add(curb);
    }

    // 3b. Street Lamps along both curbs
    for (const lampZ of [-30, 20]) {
      const lampLeft = createStreetLamp();
      lampLeft.position.set(-7.5, 0, lampZ);
      lampLeft.rotation.y = Math.PI / 2;
      chunk.add(lampLeft);
      this.streetLamps.push(lampLeft);

      const lampRight = createStreetLamp();
      lampRight.position.set(7.5, 0, lampZ);
      lampRight.rotation.y = -Math.PI / 2;
      chunk.add(lampRight);
      this.streetLamps.push(lampRight);
    }

    // 4. Cultural & Architectural Scenery (Left and Right)
    const sideVariants: ('haveli' | 'dhaba' | 'temple' | 'tree' | 'milestone' | 'pushcart' | 'sign')[] = [
      'haveli',
      'dhaba',
      'tree',
      'temple',
      'milestone',
      'pushcart',
      'sign',
    ];

    const pickLeft = sideVariants[(index * 2) % sideVariants.length];
    const pickRight = sideVariants[(index * 2 + 1) % sideVariants.length];

    this.spawnSceneryProp(chunk, pickLeft, -11.5, -20);
    this.spawnSceneryProp(chunk, pickRight, 11.5, 20);

    // Extra street life: stray dog or rangoli on sidewalk
    if (index % 2 === 0) {
      const dog = createDesiStreetDog();
      dog.position.set(Math.random() > 0.5 ? 8.2 : -8.2, 0, 10 + (Math.random() * 20 - 10));
      dog.rotation.y = Math.random() * Math.PI * 2;
      chunk.add(dog);

      // Rangoli on sidewalk
      const rangoliMat = new THREE.MeshBasicMaterial({
        map: getRangoliTexture(),
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const rangoli = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), rangoliMat);
      rangoli.rotateX(-Math.PI / 2);
      rangoli.position.set(8.5, 0.05, 0);
      chunk.add(rangoli);
    }

    // 5. Road Hazards (Speed breaker or Pothole every couple chunks)
    if (index > 1 && index % 2 === 1) {
      this.spawnRoadHazard(chunk, zPos);
    }

    // 6. Spawn Collectibles (Cutting Chai & Rupee Coins) in this chunk
    this.spawnChunkCollectibles(chunk, zPos);

    // 7. Spawn Passenger Stand
    if (index % 3 === 1) {
      this.spawnPassengerStop(chunk, zPos);
    }

    // 8. Spawn Roadside Chai Break Dhaba Stall
    if (index > 0 && index % 3 === 2) {
      this.spawnChaiBreakStall(chunk, zPos);
    }

    // 9. Spawn Dynamic Traffic
    this.spawnChunkTraffic(zPos);

    return chunk;
  }

  private spawnChaiBreakStall(chunk: THREE.Group, zBase: number) {
    const stall = createChaiBreakStall();
    const side = -8.6;
    const localZ = 12;
    stall.position.set(side, 0, localZ);
    stall.rotation.y = Math.PI / 2;
    chunk.add(stall);

    this.chaiStalls.push({
      mesh: stall,
      z: zBase + localZ,
      x: side + 2.5, // Center of parking bay along roadside shoulder
      triggered: false,
    });
  }

  private spawnRoadHazard(chunk: THREE.Group, zBase: number) {
    const roll = Math.random();
    const localZ = Math.random() * 40 - 20;

    if (roll < 0.35) {
      // 1. Speed Breaker across road
      const bump = createSpeedBreakerMesh();
      bump.position.set(0, 0, localZ);
      chunk.add(bump);

      // Road warning sign placed 18m before the bump!
      const sign = createHighwaySign('speed_breaker');
      sign.position.set(7.8, 0, localZ - 18);
      chunk.add(sign);

      this.roadHazards.push({
        mesh: bump,
        z: zBase + localZ,
        x: 0,
        type: 'speedbreaker',
        radius: 6.8,
      });
    } else if (roll < 0.7) {
      // 2. Asphalt Pothole in one of the lanes
      const potholeX = (Math.random() - 0.5) * 8.0;
      const pothole = createPotholeMesh();
      pothole.position.set(potholeX, 0, localZ);
      chunk.add(pothole);

      this.roadHazards.push({
        mesh: pothole,
        z: zBase + localZ,
        x: potholeX,
        type: 'pothole',
        radius: 1.2,
      });
    } else {
      // 3. Reflective Monsoon Water Puddle (Causes hydroplane drag and water splash)
      const puddleX = (Math.random() - 0.5) * 8.0;
      const puddle = createWaterPuddleMesh(2.4, 3.6);
      puddle.position.set(puddleX, 0, localZ);
      chunk.add(puddle);

      this.roadHazards.push({
        mesh: puddle,
        z: zBase + localZ,
        x: puddleX,
        type: 'puddle',
        radius: 1.8,
      });
    }
  }

  private spawnSceneryProp(
    chunk: THREE.Group,
    type: 'haveli' | 'dhaba' | 'temple' | 'tree' | 'milestone' | 'pushcart' | 'sign',
    x: number,
    localZ: number
  ) {
    if (type === 'haveli') {
      const styles: ('sandstone' | 'terracotta' | 'blue')[] = ['sandstone', 'terracotta', 'blue'];
      const style = styles[Math.floor(Math.random() * styles.length)];
      const haveli = createHaveliBuilding(style);
      haveli.position.set(x > 0 ? x + 2 : x - 2, 0, localZ);
      haveli.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      chunk.add(haveli);
    } else if (type === 'dhaba') {
      const dhaba = createChaiDhaba();
      dhaba.position.set(x, 0, localZ);
      dhaba.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      chunk.add(dhaba);
    } else if (type === 'temple') {
      const temple = createRoadsideTemple();
      temple.position.set(x, 0, localZ);
      temple.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      chunk.add(temple);
      this.templePositions.push({ z: chunk.position.z + localZ, passed: false });
    } else if (type === 'tree') {
      const tree = createBanyanTree();
      tree.position.set(x, 0, localZ);
      chunk.add(tree);
    } else if (type === 'milestone') {
      const km = (Math.floor(Math.random() * 80) + 10).toString();
      const stone = createMilestone(km);
      stone.position.set(x > 0 ? 7.6 : -7.6, 0, localZ);
      chunk.add(stone);
    } else if (type === 'pushcart') {
      const cart = createPushCart();
      cart.position.set(x > 0 ? 8.2 : -8.2, 0, localZ);
      cart.rotation.y = x > 0 ? -Math.PI / 3 : Math.PI / 3;
      chunk.add(cart);
    } else if (type === 'sign') {
      const signTypes: ('speed_breaker' | 'cows' | 'accident' | 'horn')[] = ['cows', 'accident', 'horn'];
      const st = signTypes[Math.floor(Math.random() * signTypes.length)];
      const sign = createHighwaySign(st);
      sign.position.set(x > 0 ? 7.8 : -7.8, 0, localZ);
      chunk.add(sign);
    }
  }

  private spawnChunkCollectibles(chunk: THREE.Group, zBase: number) {
    const numItems = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numItems; i++) {
      const type: 'chai' | 'coin' = Math.random() > 0.45 ? 'chai' : 'coin';
      const itemMesh = type === 'chai' ? createChaiPickup() : createRupeeCoinPickup();

      // Placed inside drivable lanes
      const lanes = [-4.5, -2.0, 0, 2.0, 4.5];
      const x = lanes[Math.floor(Math.random() * lanes.length)];
      const localZ = Math.random() * 70 - 35;
      const baseY = type === 'chai' ? 0.35 : 0.8;

      itemMesh.position.set(x, baseY, localZ);
      chunk.add(itemMesh);

      this.collectibles.push({
        mesh: itemMesh,
        type,
        active: true,
        baseY,
      });
    }
  }

  private spawnPassengerStop(chunk: THREE.Group, zBase: number) {
    const passengerGroup = new THREE.Group();
    const side = Math.random() > 0.5 ? 7.8 : -7.8;
    const localZ = 10;
    passengerGroup.position.set(side, 0, localZ);

    // Glowing green circular halo stop marker
    const haloGeo = new THREE.RingGeometry(0.8, 1.2, 24);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 0.05;
    passengerGroup.add(halo);

    // Friendly Stylized Passenger (Kurta Uncle with folded umbrella / briefcase)
    const person = new THREE.Group();
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.85, 8), kurtaMat);
    torso.position.y = 1.0;
    person.add(torso);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.8 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
    head.position.y = 1.6;
    person.add(head);

    const capMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.9 });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.28), capMat);
    cap.position.y = 1.76;
    person.add(cap);

    // Waving arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), kurtaMat);
    arm.position.set(side > 0 ? -0.32 : 0.32, 1.35, 0);
    arm.rotation.z = side > 0 ? 0.7 : -0.7;
    person.add(arm);

    passengerGroup.add(person);
    chunk.add(passengerGroup);

    const indianNames = [
      'Sharmaji (to Railway Station)',
      'Dr. Priya (to City Hospital)',
      'Ramesh Bhai (to Gold Souk Bazaar)',
      'Mrs. Iyer (to Meenakshi Temple)',
      'Bunty & Chintu (to Model School)',
    ];
    const name = indianNames[Math.floor(Math.random() * indianNames.length)];

    this.passengerStops.push({
      mesh: passengerGroup,
      z: zBase + localZ,
      x: side,
      active: true,
      destinationZ: zBase + localZ + 180 + Math.random() * 80,
      name,
    });
  }

  private dynamicSpawnTimer = 1.2;

  // Dynamic Spawner: Continuous on-demand obstacle generation ahead of player
  public spawnDynamicObstacle(playerZ: number, playerSpeed: number = 10) {
    const lanes = [-4.2, -1.9, 1.9, 4.2];
    const spawnZ = playerZ + 55 + Math.random() * 55;
    const isNight = this.currentTimePhase === 'night';

    // Weighted random selection:
    // 20% Local State Transport Bus (Lal Dabba)
    // 15% Cycle Rickshaw (Slow pedal-powered puller with brass bell)
    // 20% Slow-Moving Tractor (with sugarcane trolley bottleneck)
    // 20% Stray Cow Crossing Path (articulated legs, cud pause, honk scurry)
    // 15% Unexpected Rival Auto-Rickshaw (aggressive cut-ins & indicator flashing)
    // 10% Heavy Tata Truck
    const r = Math.random();

    if (r < 0.20) {
      // 1. Local State Transport Bus (Lal Dabba - High mass, route board)
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const bus = createStateTransportBus();
      bus.position.set(lane, 0, spawnZ);
      this.scene.add(bus);

      this.traffic.push({
        mesh: bus,
        speed: isNight ? 17 + Math.random() * 5 : 13 + Math.random() * 4,
        lane,
        type: 'bus',
        colliderRadius: 3.2,
        busRef: bus,
      });
    } else if (r < 0.35) {
      // 2. Pedal-Powered Cycle Rickshaw (Slow moving, outer lane)
      const cycleLane = Math.random() > 0.5 ? 4.8 : -4.8;
      const cycle = createCycleRickshaw();
      cycle.position.set(cycleLane, 0, spawnZ);
      this.scene.add(cycle);

      this.traffic.push({
        mesh: cycle,
        speed: 3.2 + Math.random() * 1.6, // ~11 - 17 km/h
        lane: cycleLane,
        type: 'cycle_rickshaw',
        colliderRadius: 1.1,
        cycleRef: cycle,
      });
    } else if (r < 0.55) {
      // 3. Slow-Moving Tractor (with heavy Sugarcane Trailer)
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const tractor = createDesiTractor(Math.random() > 0.5 ? 'red' : 'blue');
      tractor.position.set(lane, 0, spawnZ);
      this.scene.add(tractor);

      this.traffic.push({
        mesh: tractor,
        speed: 3.5 + Math.random() * 2.2, // ~12 - 20 km/h (Slow obstacle bottleneck)
        lane,
        type: 'tractor',
        colliderRadius: 2.3,
        tractorRef: tractor,
        isTractor: true,
        smokeTimer: 0,
      });
    } else if (r < 0.75) {
      // 4. Stray Cow Crossing the Path
      const startOnRight = Math.random() > 0.5;
      const startX = startOnRight ? 7.2 : -7.2;
      const crossDir = startOnRight ? -1 : 1;
      const cow = createSacredCow();
      cow.position.set(startX, 0, spawnZ);
      cow.rotation.y = crossDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(cow);

      this.traffic.push({
        mesh: cow,
        speed: isNight ? 0.3 : 0.8,
        lane: startX,
        type: 'cow',
        colliderRadius: 1.5,
        cowRef: cow,
        isCrossingCow: true,
        crossDirection: crossDir,
        crossSpeed: 1.3 + Math.random() * 0.7,
        crossPauseTimer: Math.random() > 0.35 ? 2.5 + Math.random() * 2.0 : 0,
      });
    } else if (r < 0.90) {
      // 5. Unexpected Rival Auto-Rickshaw Traffic
      const liveries: ('mumbai' | 'delhi' | 'bangalore')[] = ['mumbai', 'delhi', 'bangalore'];
      const livery = liveries[Math.floor(Math.random() * liveries.length)];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const rival = createRivalAutoRickshaw(livery);
      rival.position.set(lane, 0, spawnZ);
      this.scene.add(rival);

      this.traffic.push({
        mesh: rival,
        speed: 11 + Math.random() * 5, // 40 - 58 km/h
        lane,
        type: 'rival_auto',
        colliderRadius: 1.4,
        rivalAutoRef: rival,
        isRivalAuto: true,
        targetLaneX: lane,
        nextLaneChangeIn: 1.8 + Math.random() * 2.5,
        isBrakingSudden: Math.random() < 0.22,
        brakeTimer: Math.random() < 0.22 ? 2.0 : 0,
      });
    } else {
      // 6. Heavy Tata Truck
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const truck = createTataTruck();
      truck.position.set(lane, 0, spawnZ);
      this.scene.add(truck);

      this.traffic.push({
        mesh: truck,
        speed: isNight ? 17 + Math.random() * 6 : 13 + Math.random() * 5,
        lane,
        type: 'truck',
        colliderRadius: 2.2,
      });
    }
  }

  private spawnChunkTraffic(zBase: number) {
    if (zBase < 40) return;
    this.spawnDynamicObstacle(zBase - 30, 10);
  }

  public updateLighting(isNight: boolean, lampIntensity: number) {
    for (const lamp of this.streetLamps) {
      if (lamp.bulbMesh && lamp.bulbMesh.material) {
        (lamp.bulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isNight ? 2.0 : 0.2;
      }
      if (lamp.light) {
        lamp.light.intensity = lampIntensity;
      }
    }
  }

  // Update track recycling and dynamic obstacle simulation
  public update(playerZ: number, delta: number, playerSpeed: number = 10) {
    // 1. Recycle chunks
    const firstChunk = this.chunks[0];
    if (playerZ - firstChunk.position.z > this.chunkLength * 1.5) {
      const removed = this.chunks.shift()!;
      this.currentChunkIndex++;
      const newZ = this.chunks[this.chunks.length - 1].position.z + this.chunkLength;

      while (removed.children.length > 0) {
        removed.remove(removed.children[0]);
      }
      this.scene.remove(removed);

      this.streetLamps = this.streetLamps.filter((l) => l.parent !== null);

      const newChunk = this.createChunk(newZ, this.currentChunkIndex);
      this.chunks.push(newChunk);
      this.scene.add(newChunk);
    }

    // 2. Animate collectibles (spin and bob)
    const time = performance.now() * 0.003;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      if (!item.active) continue;
      item.mesh.rotation.y += delta * 2.5;
      item.mesh.position.y = item.baseY + Math.sin(time + i) * 0.15;

      item.mesh.getWorldPosition(_tempWorldPos);
      if (playerZ - _tempWorldPos.z > 60) {
        item.active = false;
        this.collectibles.splice(i, 1);
      }
    }

    // 2b. Clean up road hazards and chai stalls far behind
    for (let i = this.roadHazards.length - 1; i >= 0; i--) {
      if (playerZ - this.roadHazards[i].z > 60) {
        this.roadHazards.splice(i, 1);
      }
    }

    for (let i = this.chaiStalls.length - 1; i >= 0; i--) {
      if (playerZ - this.chaiStalls[i].z > 70) {
        this.chaiStalls.splice(i, 1);
      }
    }

    // 3. Dynamic Obstacle Spawner Clock
    this.dynamicSpawnTimer -= delta;
    const activeAhead = this.traffic.filter(
      (t) => t.mesh.position.z > playerZ + 20 && t.mesh.position.z < playerZ + 170
    ).length;

    const targetObstacles = Math.min(8, 4 + Math.floor(playerSpeed / 4.5));
    if ((activeAhead < targetObstacles || this.dynamicSpawnTimer <= 0) && activeAhead < 9) {
      this.spawnDynamicObstacle(playerZ, playerSpeed);
      this.dynamicSpawnTimer = 2.4 + Math.random() * 2.2;
    }

    // 4. Update Traffic Movement, Dynamic AI, and Articulated Animations
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const entity = this.traffic[i];

      // A. Forward movement along road
      entity.mesh.position.z += entity.speed * delta;

      // B. Dynamic Stray Cow Crossing Behavior
      if (entity.isCrossingCow && entity.cowRef) {
        const cow = entity.cowRef;
        cow.animTime += delta * 2.5;

        const isNearMiddle = Math.abs(entity.mesh.position.x) < 1.4;
        const isPaused = isNearMiddle && entity.crossPauseTimer !== undefined && entity.crossPauseTimer > 0;

        if (isPaused) {
          entity.crossPauseTimer! -= delta;
          cow.head.rotation.y = Math.sin(cow.animTime * 1.4) * 0.28;
          cow.head.rotation.x = Math.sin(cow.animTime * 0.8) * 0.1;
          cow.tail.rotation.z = Math.sin(cow.animTime * 2.0) * 0.3;
          cow.frontLeftLeg.rotation.x = 0;
          cow.frontRightLeg.rotation.x = 0;
          cow.backLeftLeg.rotation.x = 0;
          cow.backRightLeg.rotation.x = 0;
        } else {
          entity.mesh.position.x += entity.crossDirection! * entity.crossSpeed! * delta;

          const walkCycle = cow.animTime * 5.5 * (entity.crossSpeed! > 3.0 ? 1.6 : 1.0);
          cow.frontLeftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
          cow.frontRightLeg.rotation.x = -Math.sin(walkCycle) * 0.45;
          cow.backLeftLeg.rotation.x = -Math.sin(walkCycle) * 0.4;
          cow.backRightLeg.rotation.x = Math.sin(walkCycle) * 0.4;

          cow.head.rotation.y = Math.sin(walkCycle * 0.5) * 0.15;
          cow.tail.rotation.z = Math.sin(walkCycle * 0.8) * 0.4;
          if (cow.bell) {
            cow.bell.rotation.z = Math.sin(walkCycle) * 0.25;
          }

          if (Math.abs(entity.mesh.position.x) >= 7.4) {
            entity.crossSpeed = 0.2;
          }
        }
      } else if (entity.type === 'cow' && entity.cowRef) {
        entity.cowRef.animTime += delta * 2;
        entity.cowRef.head.rotation.y = Math.sin(entity.cowRef.animTime * 0.8) * 0.2;
        entity.cowRef.tail.rotation.z = Math.sin(entity.cowRef.animTime * 2.5) * 0.3;
      }

      // C. Dynamic Rival Auto-Rickshaw AI Behavior
      if (entity.isRivalAuto && entity.rivalAutoRef) {
        const rival = entity.rivalAutoRef;

        rival.wheels.forEach((w) => {
          w.rotation.x += entity.speed * delta * 2.8;
        });

        if (entity.nextLaneChangeIn !== undefined) {
          entity.nextLaneChangeIn -= delta;
          if (entity.nextLaneChangeIn <= 0) {
            const laneOptions = [-4.2, -1.9, 1.9, 4.2].filter((l) => Math.abs(l - entity.mesh.position.x) > 1.2);
            entity.targetLaneX = laneOptions[Math.floor(Math.random() * laneOptions.length)];
            const isGoingLeft = entity.targetLaneX < entity.mesh.position.x;
            entity.turnSignalActive = isGoingLeft ? 'left' : 'right';
            entity.nextLaneChangeIn = 3.5 + Math.random() * 4.0;
          }
        }

        if (entity.targetLaneX !== undefined) {
          const diff = entity.targetLaneX - entity.mesh.position.x;
          entity.mesh.position.x = THREE.MathUtils.damp(entity.mesh.position.x, entity.targetLaneX, 2.6, delta);
          rival.bodyPivot.rotation.z = THREE.MathUtils.clamp(diff * 0.12, -0.18, 0.18);

          if (Math.abs(diff) < 0.2) {
            entity.turnSignalActive = null;
          }
        }

        if (entity.turnSignalActive) {
          entity.signalBlinkTimer = (entity.signalBlinkTimer || 0) + delta;
          const isLit = Math.sin(entity.signalBlinkTimer * 16) > 0;
          const leftMat = rival.leftIndicator.material as THREE.MeshStandardMaterial;
          const rightMat = rival.rightIndicator.material as THREE.MeshStandardMaterial;

          if (entity.turnSignalActive === 'left') {
            leftMat.emissive.setHex(isLit ? 0xf59e0b : 0x000000);
            leftMat.emissiveIntensity = isLit ? 1.5 : 0;
            rightMat.emissiveIntensity = 0;
          } else {
            rightMat.emissive.setHex(isLit ? 0xf59e0b : 0x000000);
            rightMat.emissiveIntensity = isLit ? 1.5 : 0;
            leftMat.emissiveIntensity = 0;
          }
        } else {
          (rival.leftIndicator.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          (rival.rightIndicator.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
        }

        if (entity.isBrakingSudden && entity.brakeTimer !== undefined) {
          entity.brakeTimer -= delta;
          if (entity.brakeTimer > 0) {
            entity.speed = Math.max(5.0, entity.speed - delta * 12);
            rival.brakeLightPoint.intensity = 2.5;
            (rival.taillightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.8;
          } else {
            entity.isBrakingSudden = false;
            rival.brakeLightPoint.intensity = 0;
            (rival.taillightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
          }
        }
      }

      // D. Slow Tractor Animations
      if (entity.isTractor && entity.tractorRef) {
        const tractor = entity.tractorRef;

        tractor.frontWheels.forEach((w) => {
          w.rotation.x += entity.speed * delta * 2.2;
        });
        tractor.rearWheels.forEach((w) => {
          w.rotation.x += entity.speed * delta * 1.25;
        });

        if (tractor.trailer) {
          tractor.trailer.rotation.y = Math.sin(performance.now() * 0.003 + i) * 0.025;
        }
      }

      // E. State Transport Bus Wheel Rotations
      if (entity.type === 'bus' && entity.busRef) {
        entity.busRef.wheels.forEach((w) => {
          w.rotation.x += entity.speed * delta * 2.0;
        });
      }

      // F. Cycle Rickshaw Pedaling Animations
      if (entity.type === 'cycle_rickshaw' && entity.cycleRef) {
        const cycle = entity.cycleRef;
        cycle.pullerAnimTime += delta * entity.speed * 2.0;

        // Realistic pedaling alternating legs
        cycle.leftLeg.rotation.x = Math.sin(cycle.pullerAnimTime) * 0.45;
        cycle.rightLeg.rotation.x = -Math.sin(cycle.pullerAnimTime) * 0.45;
        cycle.pedalPivot.rotation.x += delta * entity.speed * 2.4;
        cycle.frontWheel.rotation.x += delta * entity.speed * 2.8;
        cycle.rearWheels.forEach((w) => {
          w.rotation.x += delta * entity.speed * 2.5;
        });
      }

      // G. Cleanup obstacles far behind or far ahead
      if (playerZ - entity.mesh.position.z > 75 || entity.mesh.position.z - playerZ > 260) {
        this.scene.remove(entity.mesh);
        this.traffic.splice(i, 1);
      }
    }
  }

  public handleHonk(playerPos: THREE.Vector3): {
    cowsAlerted: number;
    autosHonked: number;
    tractorsHonked: number;
    busesHonked: number;
    cyclesHonked: number;
  } {
    let cowsAlerted = 0;
    let autosHonked = 0;
    let tractorsHonked = 0;
    let busesHonked = 0;
    let cyclesHonked = 0;

    for (const entity of this.traffic) {
      const dist = entity.mesh.position.distanceTo(playerPos);
      if (dist < 36 && entity.mesh.position.z > playerPos.z - 2) {
        if (entity.type === 'cow' && entity.cowRef) {
          entity.crossPauseTimer = 0;
          entity.crossSpeed = Math.max(3.8, (entity.crossSpeed || 1.5) * 2.2);
          cowsAlerted++;
        } else if (entity.type === 'rival_auto') {
          entity.speed = Math.min(24, entity.speed + 3.5);
          entity.isBrakingSudden = false;
          autosHonked++;
        } else if (entity.type === 'tractor') {
          tractorsHonked++;
        } else if (entity.type === 'bus') {
          busesHonked++;
        } else if (entity.type === 'cycle_rickshaw') {
          cyclesHonked++;
          // Steers onto outer shoulder to yield path
          entity.mesh.position.x = entity.mesh.position.x > 0 ? 5.8 : -5.8;
        } else if (entity.type === 'taxi' || entity.type === 'bike') {
          entity.speed = Math.min(26, entity.speed + 4);
        }
      }
    }
    return { cowsAlerted, autosHonked, tractorsHonked, busesHonked, cyclesHonked };
  }

  public reset() {
    for (const t of this.traffic) {
      this.scene.remove(t.mesh);
    }
    this.traffic = [];

    for (const c of this.chunks) {
      this.scene.remove(c);
    }
    this.chunks = [];
    this.collectibles = [];
    this.roadHazards = [];
    this.passengerStops = [];
    this.streetLamps = [];
    this.templePositions = [];
    this.chaiStalls = [];

    this.initTrack();
  }
}
