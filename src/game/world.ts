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
  SacredCowObject,
} from './models';
import { getRoadTexture, getRangoliTexture } from './textures';

export interface TrafficEntity {
  mesh: THREE.Group;
  speed: number;
  lane: number;
  type: 'truck' | 'taxi' | 'cow';
  colliderRadius: number;
  cowRef?: SacredCowObject;
  targetX?: number;
}

export interface CollectibleEntity {
  mesh: THREE.Group;
  type: 'chai' | 'coin';
  active: boolean;
  baseY: number;
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
  public passengerStops: PassengerStop[] = [];

  public chunkLength = 100;
  public numChunks = 5;
  private currentChunkIndex = 0;
  private roadMaterial: THREE.MeshStandardMaterial;
  private groundMaterial: THREE.MeshStandardMaterial;

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

    // 2. Wide Terracotta Terrain Shoulders (left and right)
    const groundGeo = new THREE.PlaneGeometry(80, this.chunkLength);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, -0.05, 0);
    const groundMesh = new THREE.Mesh(groundGeo, this.groundMaterial);
    groundMesh.receiveShadow = true;
    chunk.add(groundMesh);

    // 3. Concrete Curbs / Pedestrian Footpaths (Indian yellow-and-black painted curbs)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 });
    for (const cx of [-7.2, 7.2]) {
      const curbGeo = new THREE.BoxGeometry(0.5, 0.25, this.chunkLength);
      curbGeo.translate(cx, 0.1, 0);
      const curb = new THREE.Mesh(curbGeo, curbMat);
      chunk.add(curb);
    }

    // 4. Cultural & Architectural Scenery (Left and Right)
    // Alternate between Havelis, Chai Dhabas, Ancient Temples, and Banyan Trees
    const sideVariants: ('haveli' | 'dhaba' | 'temple' | 'tree' | 'milestone')[] = [
      'haveli',
      'dhaba',
      'tree',
      'temple',
      'milestone',
    ];

    const pickLeft = sideVariants[(index * 2) % sideVariants.length];
    const pickRight = sideVariants[(index * 2 + 1) % sideVariants.length];

    this.spawnSceneryProp(chunk, pickLeft, -11.5, -20);
    this.spawnSceneryProp(chunk, pickRight, 11.5, 20);

    // Extra banyan trees or rangoli on sidewalk
    if (index % 2 === 0) {
      const tree = createBanyanTree();
      tree.position.set(-14, 0, 15);
      chunk.add(tree);

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

    // 5. Spawn Collectibles (Cutting Chai & Rupee Coins) in this chunk
    this.spawnChunkCollectibles(chunk, zPos);

    // 6. Spawn Passenger Stand
    if (index % 3 === 1) {
      this.spawnPassengerStop(chunk, zPos);
    }

    // 7. Spawn Dynamic Traffic (Tata Truck or Ambassador Taxi or Sacred Cow)
    this.spawnChunkTraffic(zPos);

    return chunk;
  }

  private spawnSceneryProp(
    chunk: THREE.Group,
    type: 'haveli' | 'dhaba' | 'temple' | 'tree' | 'milestone',
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
    } else if (type === 'tree') {
      const tree = createBanyanTree();
      tree.position.set(x, 0, localZ);
      chunk.add(tree);
    } else if (type === 'milestone') {
      const km = (Math.floor(Math.random() * 80) + 10).toString();
      const stone = createMilestone(km);
      stone.position.set(x > 0 ? 7.6 : -7.6, 0, localZ);
      chunk.add(stone);
    }
  }

  private spawnChunkCollectibles(chunk: THREE.Group, zBase: number) {
    // 2-3 items per chunk
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const isChai = Math.random() < 0.35; // 35% chai, 65% rupee
      const localZ = -30 + i * 35 + (Math.random() * 10 - 5);
      const laneX = [-4.5, -1.8, 1.8, 4.5][Math.floor(Math.random() * 4)];

      const mesh = isChai ? createChaiPickup() : createRupeeCoinPickup();
      mesh.position.set(laneX, 0.8, localZ);
      chunk.add(mesh);

      this.collectibles.push({
        mesh,
        type: isChai ? 'chai' : 'coin',
        active: true,
        baseY: 0.8,
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
    // Torso
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.85, 8), kurtaMat);
    torso.position.y = 1.0;
    person.add(torso);

    // Head with Nehru cap
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

  private spawnChunkTraffic(zBase: number) {
    const laneChoices = [-4.5, -1.8, 1.8, 4.5];
    const lane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
    const zOffset = (Math.random() * 40 - 20);
    const spawnZ = zBase + zOffset;

    // Don't spawn too close to start
    if (spawnZ < 40) return;

    const r = Math.random();
    if (r < 0.4) {
      // Tata Truck
      const truck = createTataTruck();
      truck.position.set(lane, 0, spawnZ);
      this.scene.add(truck);
      this.traffic.push({
        mesh: truck,
        speed: 12 + Math.random() * 6,
        lane,
        type: 'truck',
        colliderRadius: 2.2,
      });
    } else if (r < 0.75) {
      // Ambassador Taxi
      const taxi = createAmbassadorTaxi();
      taxi.position.set(lane, 0, spawnZ);
      this.scene.add(taxi);
      this.traffic.push({
        mesh: taxi,
        speed: 16 + Math.random() * 8,
        lane,
        type: 'taxi',
        colliderRadius: 1.6,
      });
    } else {
      // Sacred Indian Cow (Gau Mata relaxing or grazing)
      const cow = createSacredCow();
      const cowX = Math.random() > 0.5 ? 2.5 : -2.5; // Near lane edge
      cow.position.set(cowX, 0, spawnZ);
      cow.rotation.y = Math.PI / 4 + (Math.random() * 0.4 - 0.2);
      this.scene.add(cow);
      this.traffic.push({
        mesh: cow,
        speed: 1.5, // Slow peaceful stroll
        lane: cowX,
        type: 'cow',
        colliderRadius: 1.4,
        cowRef: cow,
        targetX: cowX,
      });
    }
  }

  // Update track recycling as rickshaw drives forward
  public update(playerZ: number, delta: number) {
    // 1. Check if first chunk is far behind
    const firstChunk = this.chunks[0];
    if (playerZ - firstChunk.position.z > this.chunkLength * 1.5) {
      // Recycle oldest chunk to the front
      const removed = this.chunks.shift()!;
      this.currentChunkIndex++;
      const newZ = this.chunks[this.chunks.length - 1].position.z + this.chunkLength;

      // Clean up previous chunk's children
      while (removed.children.length > 0) {
        removed.remove(removed.children[0]);
      }
      this.scene.remove(removed);

      // Re-populate new chunk at newZ
      const newChunk = this.createChunk(newZ, this.currentChunkIndex);
      this.chunks.push(newChunk);
      this.scene.add(newChunk);
    }

    // 2. Animate and update collectibles (spin and bob)
    const time = performance.now() * 0.003;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      if (!item.active) continue;
      item.mesh.rotation.y += delta * 2.5;
      item.mesh.position.y = item.baseY + Math.sin(time + i) * 0.15;

      // Prune if far behind player
      const worldPos = new THREE.Vector3();
      item.mesh.getWorldPosition(worldPos);
      if (playerZ - worldPos.z > 60) {
        item.active = false;
        this.collectibles.splice(i, 1);
      }
    }

    // 3. Update Traffic movement & Cow animations
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const entity = this.traffic[i];

      // Move forward along road
      entity.mesh.position.z += entity.speed * delta;

      // Sacred Cow idle animations & gentle dodge to shoulder
      if (entity.type === 'cow' && entity.cowRef) {
        entity.cowRef.animTime += delta * 2;
        entity.cowRef.head.rotation.y = Math.sin(entity.cowRef.animTime * 0.8) * 0.2;
        entity.cowRef.tail.rotation.z = Math.sin(entity.cowRef.animTime * 2.5) * 0.3;

        // Smoothly steer cow towards shoulder if alerted
        if (entity.targetX !== undefined) {
          entity.mesh.position.x = THREE.MathUtils.damp(entity.mesh.position.x, entity.targetX, 2.5, delta);
        }
      }

      // Remove traffic far behind or too far ahead
      if (playerZ - entity.mesh.position.z > 80 || entity.mesh.position.z - playerZ > 300) {
        this.scene.remove(entity.mesh);
        this.traffic.splice(i, 1);
      }
    }
  }

  // When player presses Horn ("PO-POOO!"), alert cows and cars
  public handleHonk(playerPos: THREE.Vector3): { cowsAlerted: number } {
    let cowsAlerted = 0;
    for (const entity of this.traffic) {
      const dist = entity.mesh.position.distanceTo(playerPos);
      if (dist < 32 && entity.mesh.position.z > playerPos.z - 2) {
        if (entity.type === 'cow') {
          // Gau Mata serenely moves towards the soft shoulder
          entity.targetX = entity.mesh.position.x > 0 ? 6.2 : -6.2;
          cowsAlerted++;
        } else if (entity.type === 'taxi') {
          // Taxi accelerates slightly
          entity.speed = Math.min(28, entity.speed + 4);
        }
      }
    }
    return { cowsAlerted };
  }

  public reset() {
    // Remove all traffic
    for (const t of this.traffic) {
      this.scene.remove(t.mesh);
    }
    this.traffic = [];

    // Remove all chunks
    for (const c of this.chunks) {
      this.scene.remove(c);
    }
    this.chunks = [];
    this.collectibles = [];
    this.passengerStops = [];

    this.initTrack();
  }
}
