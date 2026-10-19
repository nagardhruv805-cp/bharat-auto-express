import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAutoRickshaw, AutoRickshawObject } from './models';
import { WorldManager } from './world';
import { sounds } from './audio';
import { getMeterScreenTexture } from './textures';

// Reusable math vectors to prevent GC allocations in tick loop
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();

export interface GameState {
  speedKmh: number;
  fareRupees: number;
  totalEarnings: number;
  distanceKm: number;
  chaiBoost: number;
  condition: number;
  hasPassenger: boolean;
  passengerName: string;
  passengersServed: number;
  chaiCount: number;
  isPaused: boolean;
  isGameOver: boolean;
  activeCameraMode: 'chase' | 'cockpit' | 'title';
  message: string;
}

export type GameCallback = (state: GameState) => void;

export class GameEngine {
  private mount: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private animFrameId: number | null = null;

  public rickshaw!: AutoRickshawObject;
  public world!: WorldManager;

  // Vehicle Kinematics
  public posX = 0;
  public posZ = 0;
  public posY = 0;
  public speed = 0; // m/s
  public headingAngle = 0;
  public steerAngle = 0;
  public bodyRoll = 0;
  public bodyPitch = 0;
  public suspensionBounce = 0;

  // Constants
  private readonly MAX_SPEED = 18; // ~65 km/h
  private readonly BOOST_MAX_SPEED = 26; // ~95 km/h
  private readonly ACCELERATION = 11;
  private readonly BRAKING = 22;
  private readonly DRAG = 3.5;
  private readonly MAX_STEER = 0.55;

  // Input states
  public inputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    horn: false,
    analogSteer: 0, // -1.0 to +1.0
    analogThrottle: 0, // 0 to 1.0
    analogBrake: 0, // 0 to 1.0
  };

  // Particles
  private exhaustParticles: THREE.Points | null = null;
  private exhaustData: { positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array } | null = null;
  private readonly EXHAUST_COUNT = 60;

  // State
  public state: GameState = {
    speedKmh: 0,
    fareRupees: 25,
    totalEarnings: 0,
    distanceKm: 0,
    chaiBoost: 40,
    condition: 100,
    hasPassenger: false,
    passengerName: '',
    passengersServed: 0,
    chaiCount: 0,
    isPaused: false,
    isGameOver: false,
    activeCameraMode: 'title',
    message: 'Welcome to Bharat! Press Space to Start',
  };

  private currentPassengerDestZ = 0;
  private passengerPassengerMesh: THREE.Group | null = null;
  private cameraShake = 0;
  private hitstopTimer = 0;
  private titleOrbitAngle = 0;
  private onStateChange: GameCallback | null = null;

  constructor(mount: HTMLDivElement, onStateChange?: GameCallback) {
    this.mount = mount;
    this.onStateChange = onStateChange || null;
    this.initThree();
    this.initParticles();
    this.initEventListeners();
    this.startLoop();
  }

  private initThree() {
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;

    // 1. Scene & Warm Indian Dusk / Golden Hour Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6ad55); // Rich Indian sunset golden sky
    this.scene.fog = new THREE.FogExp2(0xf6ad55, 0.005);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 800);
    this.camera.position.set(0, 4.5, -8);

    // 3. Renderer with ACES Tone Mapping & PBR Environment
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.mount.appendChild(this.renderer.domElement);

    // Procedural RoomEnvironment for reflective metal finishes (Chrome, Brass, Glossy Canopy)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Balanced 3-Point Lighting Rig
    // Warm Directional Sun Key Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.8);
    sunLight.position.set(40, 60, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 180;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool Sky / Warm Earth Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x9a3412, 1.1);
    this.scene.add(hemiLight);

    // 5. Initialize Rickshaw & World
    this.rickshaw = createAutoRickshaw();
    this.scene.add(this.rickshaw);

    this.world = new WorldManager(this.scene);

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);
  }

  // Procedural exhaust puff particle system
  private initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.EXHAUST_COUNT * 3);
    const velocities = new Float32Array(this.EXHAUST_COUNT * 3);
    const lifetimes = new Float32Array(this.EXHAUST_COUNT);

    for (let i = 0; i < this.EXHAUST_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // Hidden initially
      positions[i * 3 + 2] = 0;
      lifetimes[i] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x9ca3af,
      size: 0.35,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.exhaustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.exhaustParticles);
    this.exhaustData = { positions, velocities, lifetimes };
  }

  private updateParticles(dt: number) {
    if (!this.exhaustParticles || !this.exhaustData) return;

    const { positions, velocities, lifetimes } = this.exhaustData;
    const isAccelerating = this.inputs.forward && this.speed > 0.5;
    const isBoosting = this.inputs.boost && this.state.chaiBoost > 0;

    // Spawn new puff if accelerating
    if (isAccelerating) {
      const freeIdx = lifetimes.findIndex((l) => l >= 1.0);
      if (freeIdx !== -1) {
        lifetimes[freeIdx] = 0;
        const anchor = this.rickshaw.exhaustAnchor.clone().applyMatrix4(this.rickshaw.matrixWorld);
        positions[freeIdx * 3] = anchor.x + (Math.random() - 0.5) * 0.1;
        positions[freeIdx * 3 + 1] = anchor.y;
        positions[freeIdx * 3 + 2] = anchor.z;

        velocities[freeIdx * 3] = (Math.random() - 0.5) * 0.5;
        velocities[freeIdx * 3 + 1] = 0.5 + Math.random() * 0.5;
        velocities[freeIdx * 3 + 2] = -this.speed * 0.5 - 1.0;
      }
    }

    // Animate active puffs
    for (let i = 0; i < this.EXHAUST_COUNT; i++) {
      if (lifetimes[i] < 1.0) {
        lifetimes[i] += dt * (isBoosting ? 2.5 : 1.2);
        positions[i * 3] += velocities[i * 3] * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

        if (lifetimes[i] >= 1.0) {
          positions[i * 3 + 1] = -100;
        }
      }
    }

    this.exhaustParticles.geometry.attributes.position.needsUpdate = true;
  }

  private initEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const code = e.code;

    if (code === 'KeyW' || code === 'ArrowUp') this.inputs.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.inputs.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') this.inputs.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.inputs.right = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.inputs.boost = true;

    // Horn action
    if (code === 'KeyH' || code === 'Space') {
      this.triggerHorn();
    }

    // Camera toggle
    if (code === 'KeyC') {
      this.toggleCamera();
    }

    // Start game from title
    if (this.state.activeCameraMode === 'title' && (code === 'Space' || code === 'Enter')) {
      this.startGame();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.inputs.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.inputs.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') this.inputs.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.inputs.right = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.inputs.boost = false;
  };

  private handleBlur = () => {
    this.inputs.forward = false;
    this.inputs.backward = false;
    this.inputs.left = false;
    this.inputs.right = false;
    this.inputs.boost = false;
    this.inputs.analogSteer = 0;
    this.inputs.analogThrottle = 0;
    this.inputs.analogBrake = 0;
    sounds.updateEngineSound(0, false);
  };

  private handleResize = () => {
    if (!this.mount) return;
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public triggerHorn() {
    sounds.playHorn();
    this.cameraShake = Math.max(this.cameraShake, 0.25);
    const result = this.world.handleHonk(this.rickshaw.position);
    if (result.cowsAlerted > 0) {
      sounds.playCowMoo();
      this.setStateMessage('Gau Mata moves peacefully to the shoulder! 🙏');
    }
  }

  public toggleCamera() {
    if (this.state.activeCameraMode === 'title') return;
    this.state.activeCameraMode = this.state.activeCameraMode === 'chase' ? 'cockpit' : 'chase';
    this.notifyState();
  }

  public startGame() {
    this.state.activeCameraMode = 'chase';
    this.state.isGameOver = false;
    this.state.isPaused = false;
    sounds.startEngine();
    sounds.startAmbientRaga();
    this.setStateMessage('Driving in Bharat! Find passengers & chai cups.');
    this.notifyState();
  }

  public restartGame() {
    this.posX = 0;
    this.posZ = 0;
    this.posY = 0;
    this.speed = 0;
    this.headingAngle = 0;
    this.steerAngle = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;

    this.state.speedKmh = 0;
    this.state.fareRupees = 25;
    this.state.totalEarnings = 0;
    this.state.distanceKm = 0;
    this.state.chaiBoost = 40;
    this.state.condition = 100;
    this.state.hasPassenger = false;
    this.state.passengerName = '';
    this.state.passengersServed = 0;
    this.state.chaiCount = 0;
    this.state.isGameOver = false;
    this.state.isPaused = false;
    this.state.activeCameraMode = 'chase';

    if (this.passengerPassengerMesh) {
      this.rickshaw.remove(this.passengerPassengerMesh);
      this.passengerPassengerMesh = null;
    }

    this.world.reset();
    sounds.startEngine();
    sounds.startAmbientRaga();
    this.setStateMessage('Chalo! Clean meter started.');
    this.notifyState();
  }

  private setStateMessage(msg: string) {
    this.state.message = msg;
    this.notifyState();
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  // Passenger Pickup
  private pickUpPassenger(stopName: string, destZ: number) {
    if (this.state.hasPassenger) return;

    this.state.hasPassenger = true;
    this.state.passengerName = stopName;
    this.currentPassengerDestZ = destZ;
    sounds.playPassengerSuccess();
    this.setStateMessage(`Passenger Picked: ${stopName}! Meter Down!`);

    // Add passenger avatar to back seat
    const passengerGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
    const pTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.75, 8), mat);
    pTorso.position.set(0.2, 0.95, -0.6);
    passengerGroup.add(pTorso);

    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8d5b4c }));
    pHead.position.set(0.2, 1.45, -0.6);
    passengerGroup.add(pHead);

    this.rickshaw.bodyLeanPivot.add(passengerGroup);
    this.passengerPassengerMesh = passengerGroup;

    // Update 3D fare meter screen
    (this.rickshaw.meterMesh.material as THREE.MeshBasicMaterial).map = getMeterScreenTexture(this.state.fareRupees, true);

    this.notifyState();
  }

  // Passenger Drop-off
  private dropOffPassenger() {
    if (!this.state.hasPassenger) return;

    const fareEarned = Math.floor(this.state.fareRupees + 150);
    this.state.totalEarnings += fareEarned;
    this.state.passengersServed += 1;
    this.state.hasPassenger = false;
    this.state.fareRupees = 25; // Reset meter for next customer

    if (this.passengerPassengerMesh) {
      this.rickshaw.bodyLeanPivot.remove(this.passengerPassengerMesh);
      this.passengerPassengerMesh = null;
    }

    sounds.playPassengerSuccess();
    this.setStateMessage(`Destination Reached! Earned ₹${fareEarned} fare! Bahut Badhiya!`);

    // Reset 3D meter texture
    (this.rickshaw.meterMesh.material as THREE.MeshBasicMaterial).map = getMeterScreenTexture(25, false);

    this.notifyState();
  }

  // Core Simulation Step
  private update(dt: number) {
    if (this.state.isPaused) return;

    // Simulation hitstop handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // 1. Title Screen Idle Mode Orbit
    if (this.state.activeCameraMode === 'title') {
      this.titleOrbitAngle += dt * 0.45;
      const camDist = 6.8;
      this.camera.position.x = Math.sin(this.titleOrbitAngle) * camDist;
      this.camera.position.z = Math.cos(this.titleOrbitAngle) * camDist + 0.8;
      this.camera.position.y = 2.4 + Math.sin(this.titleOrbitAngle * 0.5) * 0.4;
      this.camera.lookAt(0, 1.3, 0);

      // Idle engine rumble vibration
      this.rickshaw.position.y = Math.sin(performance.now() * 0.035) * 0.015;
      return;
    }

    if (this.state.isGameOver) return;

    // 2. Acceleration & Braking Dynamics
    let targetAcc = 0;
    const isBoosting = this.inputs.boost && this.state.chaiBoost > 0;
    const currentMaxSpeed = isBoosting ? this.BOOST_MAX_SPEED : this.MAX_SPEED;

    if (isBoosting) {
      this.state.chaiBoost = Math.max(0, this.state.chaiBoost - dt * 25);
      if (Math.random() < 0.15) sounds.playChaiBoost();
    }

    const forwardPower = Math.max(this.inputs.forward ? 1 : 0, this.inputs.analogThrottle);
    const brakePower = Math.max(this.inputs.backward ? 1 : 0, this.inputs.analogBrake);

    if (forwardPower > 0) {
      targetAcc = this.ACCELERATION * forwardPower * (isBoosting ? 1.7 : 1.0);
    } else if (brakePower > 0) {
      if (this.speed > 1.0) {
        targetAcc = -this.BRAKING * brakePower; // Foot brake
      } else {
        targetAcc = -this.ACCELERATION * 0.5 * brakePower; // Reverse gear
      }
    } else {
      // Natural rolling drag
      targetAcc = -Math.sign(this.speed) * this.DRAG;
    }

    this.speed += targetAcc * dt;
    if (Math.abs(this.speed) < 0.1 && forwardPower === 0 && brakePower === 0) {
      this.speed = 0;
    }
    this.speed = Math.max(-5, Math.min(currentMaxSpeed, this.speed));

    // 3. Steering & 3-Wheeler Physics
    let targetSteer = 0;
    if (Math.abs(this.inputs.analogSteer) > 0.02) {
      // Smooth proportional analog steering from phone thumbstick or tilt
      targetSteer = this.inputs.analogSteer * this.MAX_STEER;
    } else {
      if (this.inputs.left) targetSteer += this.MAX_STEER;
      if (this.inputs.right) targetSteer -= this.MAX_STEER;
    }

    // Steering sensitivity reduces with high speed
    const steerSpeedFactor = Math.max(0.35, 1.0 - (Math.abs(this.speed) / this.MAX_SPEED) * 0.5);
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * steerSpeedFactor, 9.0, dt);

    if (Math.abs(this.speed) > 0.1) {
      const turnRate = (this.speed / 2.3) * Math.sin(this.steerAngle);
      this.headingAngle += turnRate * dt;
    }

    // Dynamic 3-Wheeler Body Lean (Rolls outward during tight turns!)
    const targetRoll = -Math.sin(this.steerAngle) * (this.speed / this.MAX_SPEED) * 0.28;
    this.bodyRoll = THREE.MathUtils.damp(this.bodyRoll, targetRoll, 7.0, dt);
    this.rickshaw.bodyLeanPivot.rotation.z = this.bodyRoll;

    // Pitch (slight nose up on hard acceleration, nose dive on hard brake)
    const targetPitch = (targetAcc / this.ACCELERATION) * 0.05;
    this.bodyPitch = THREE.MathUtils.damp(this.bodyPitch, targetPitch, 8.0, dt);
    this.rickshaw.bodyLeanPivot.rotation.x = this.bodyPitch;

    // 4. Update Position
    this.posZ += Math.cos(this.headingAngle) * this.speed * dt;
    this.posX += Math.sin(this.headingAngle) * this.speed * dt;

    // Constrain to road boundaries (with friction penalty on soft dirt shoulders)
    if (Math.abs(this.posX) > 6.8) {
      this.speed *= 0.96; // Shoulder gravel resistance
      if (Math.abs(this.posX) > 8.5) {
        this.posX = Math.sign(this.posX) * 8.5;
        this.headingAngle *= 0.5;
      }
    }

    // Suspension bounce over asphalt texture
    this.suspensionBounce = Math.sin(this.posZ * 1.5) * 0.02 * (Math.abs(this.speed) / 10);
    this.posY = Math.max(0, this.suspensionBounce);

    this.rickshaw.position.set(this.posX, this.posY, this.posZ);
    this.rickshaw.rotation.y = this.headingAngle;

    // Front wheel & handlebars steer
    this.rickshaw.frontWheel.rotation.y = this.steerAngle;
    this.rickshaw.handlebar.rotation.y = this.steerAngle * 0.85;

    // Wheel roll rotation
    const wheelRotDelta = (this.speed * dt) / 0.34;
    this.rickshaw.frontWheel.rotation.x += wheelRotDelta;
    this.rickshaw.rearLeftWheel.rotation.x += wheelRotDelta;
    this.rickshaw.rearRightWheel.rotation.x += wheelRotDelta;

    // Windshield wiper motion when moving
    if (this.speed > 2) {
      this.rickshaw.wiperMesh.rotation.z = Math.sin(performance.now() * 0.008) * 0.55;
    }

    // Taillight brake light glow
    const isBraking = this.inputs.backward && this.speed > 0.5;
    (this.rickshaw.taillightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.5 : 0.5;

    // 5. Audio update
    const speedRatio = Math.abs(this.speed) / this.MAX_SPEED;
    sounds.updateEngineSound(speedRatio, this.inputs.forward || this.inputs.analogThrottle > 0.05);

    // 6. Update Streaming World Chunks & Traffic
    this.world.update(this.posZ, dt);
    this.updateParticles(dt);

    // 7. Distance & Fare Calculations
    const distanceDelta = (this.speed * dt) / 1000;
    this.state.distanceKm += distanceDelta;
    if (this.state.hasPassenger) {
      this.state.fareRupees += distanceDelta * 18 + dt * 0.5; // Indian taxi tariff calculation
    }
    this.state.speedKmh = Math.floor(Math.abs(this.speed) * 3.6);

    // 8. Collision & Pickup Detections
    this.checkCollisions();
    this.checkCollectibles();
    this.checkPassengers();

    // 9. Camera Tracking
    this.updateCamera(dt);

    // 10. Notify React HUD
    this.notifyState();
  }

  private checkCollisions() {
    const rickshawPos = this.rickshaw.position;

    for (const entity of this.world.traffic) {
      const dist = entity.mesh.position.distanceTo(rickshawPos);
      if (dist < entity.colliderRadius + 1.2) {
        // Impact!
        sounds.playCrash();
        this.hitstopTimer = 0.06; // 60ms hitstop
        this.cameraShake = 0.7;

        // Knockback & speed loss
        this.speed = -this.speed * 0.35;
        this.state.condition = Math.max(0, this.state.condition - (entity.type === 'cow' ? 12 : 25));

        if (entity.type === 'cow') {
          sounds.playCowMoo();
          this.setStateMessage('Careful! Gau Mata bumped! Drive respectfully.');
        } else if (entity.type === 'truck') {
          this.setStateMessage('Watch out! Heavy Tata Truck impact!');
        } else {
          this.setStateMessage('Fender bender with Ambassador Taxi!');
        }

        // Push away from obstacle
        _vecA.subVectors(rickshawPos, entity.mesh.position).normalize();
        this.posX += _vecA.x * 1.5;

        if (this.state.condition <= 0) {
          this.triggerGameOver('Rickshaw Broken Down! Engine overheated.');
        }
        break;
      }
    }
  }

  private checkCollectibles() {
    const rickshawPos = this.rickshaw.position;

    for (const item of this.world.collectibles) {
      if (!item.active) continue;

      const itemWorldPos = new THREE.Vector3();
      item.mesh.getWorldPosition(itemWorldPos);
      const dist = itemWorldPos.distanceTo(rickshawPos);

      if (dist < 2.0) {
        item.active = false;
        item.mesh.position.y = -100; // Hide

        if (item.type === 'chai') {
          sounds.playChaiBoost();
          this.state.chaiBoost = Math.min(100, this.state.chaiBoost + 35);
          this.state.chaiCount += 1;
          this.setStateMessage('Garama-Garam Cutting Chai! Boost Refilled! ☕');
        } else if (item.type === 'coin') {
          sounds.playCoin();
          this.state.totalEarnings += 50;
          this.setStateMessage('+₹50 Rupee Coin Collected! 🪙');
        }
      }
    }
  }

  private checkPassengers() {
    // 1. Check pickup
    if (!this.state.hasPassenger) {
      for (const stop of this.world.passengerStops) {
        if (!stop.active) continue;
        const dist = Math.hypot(this.posX - stop.x, this.posZ - stop.z);
        if (dist < 4.5 && this.speed < 12) {
          stop.active = false;
          this.pickUpPassenger(stop.name, stop.destinationZ || this.posZ + 200);
          break;
        }
      }
    } else {
      // 2. Check destination delivery
      if (this.posZ >= this.currentPassengerDestZ) {
        this.dropOffPassenger();
      }
    }
  }

  private updateCamera(dt: number) {
    if (this.state.activeCameraMode === 'chase') {
      // Dynamic third-person chase camera with speed lag
      const camOffset = new THREE.Vector3(0, 3.2, -6.5);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.headingAngle);

      const targetCamPos = this.rickshaw.position.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, dt * 7.5);

      // Decaying camera shake
      if (this.cameraShake > 0.01) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 5.0, dt);
      }

      const lookTarget = this.rickshaw.position.clone().add(new THREE.Vector3(0, 1.4, 4));
      lookTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.headingAngle * 0.2);
      this.camera.lookAt(lookTarget);

      // Dynamic FOV kick on high speed boost
      const targetFov = 58 + (this.speed / this.BOOST_MAX_SPEED) * 16;
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
      this.camera.updateProjectionMatrix();
    } else if (this.state.activeCameraMode === 'cockpit') {
      // First-person driver POV looking through windshield
      const driverEye = this.rickshaw.position.clone().add(new THREE.Vector3(0, 1.6, 0.4));
      this.camera.position.copy(driverEye);

      const lookTarget = this.rickshaw.position.clone().add(
        new THREE.Vector3(
          Math.sin(this.headingAngle) * 15,
          1.5,
          Math.cos(this.headingAngle) * 15
        )
      );
      this.camera.lookAt(lookTarget);
      this.camera.fov = 70;
      this.camera.updateProjectionMatrix();
    }
  }

  public triggerGameOver(reason: string) {
    this.state.isGameOver = true;
    sounds.stopEngine();
    sounds.stopAmbientRaga();
    this.setStateMessage(reason);
    this.notifyState();
  }

  public togglePause(): boolean {
    this.state.isPaused = !this.state.isPaused;
    if (this.state.isPaused) {
      sounds.stopEngine();
    } else if (this.state.activeCameraMode !== 'title') {
      sounds.startEngine();
    }
    this.notifyState();
    return this.state.isPaused;
  }

  private startLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt per guidelines
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
    sounds.stopEngine();
    sounds.stopAmbientRaga();
    this.renderer.dispose();
    if (this.mount.contains(this.renderer.domElement)) {
      this.mount.removeChild(this.renderer.domElement);
    }
  }
}
