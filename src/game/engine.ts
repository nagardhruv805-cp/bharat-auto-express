import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAutoRickshaw, AutoRickshawObject } from './models';
import { WorldManager } from './world';
import { sounds, RADIO_STATIONS, RadioStationInfo, RadioStationId } from './audio';
import { getMeterScreenTexture, getSkidMarkTexture } from './textures';

import { DynamicEnvironment, TimePhase, WeatherState, WeatherType } from './environment';
import { MissionManager, DailyGoal } from './missions';

// Reusable math vectors to prevent GC allocations in tick loop
const _vecA = new THREE.Vector3();

export interface IncomingCallAlert {
  contactId: string;
  name: string;
  avatar: string;
  relation: string;
  number: string;
}

export interface HandlingState {
  gripPercent: number; // 0 to 100%
  surfaceType: 'tarmac' | 'wet_asphalt' | 'loose_sand';
  surfaceLabel: string;
  isAquaplaning: boolean;
  isBrakeLocked: boolean;
  isWheelSpinning: boolean;
  isWindBuffeting: boolean;
  adviceTip: string;
}

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
  timeString: string;
  timePhase: TimePhase;
  timePhaseLabel: string;
  isNight: boolean;
  visibilityPercent: number;
  weather: WeatherState;
  handling: HandlingState;
  isNearChaiStall: boolean;
  isChaiBreakActive: boolean;
  goals: DailyGoal[];
  unclaimedGoalsCount: number;
  currentStation: RadioStationInfo;
  isTwoWheelStunt: boolean;
  incomingCall: IncomingCallAlert | null;
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
  public environment!: DynamicEnvironment;
  public missions = new MissionManager();

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

  // Real-time animation & dynamic weather physics buffers
  private charmPitch = 0;
  private charmRoll = 0;
  private speedoNeedleRot = -2.35;
  private skidMarkTimer = 0;

  // Dynamic Weather Handling Physics Buffers
  public isBrakeLocked = false;
  public brakeLockTimer = 0;
  public isAquaplaning = false;
  public isWheelSpinning = false;
  public crosswindForce = 0;
  public windGustTimer = 4.0;
  public driftSlipAngle = 0;

  // Constants
  private readonly MAX_SPEED = 18; // ~65 km/h
  private readonly BOOST_MAX_SPEED = 26; // ~95 km/h
  private readonly ACCELERATION = 11;
  private readonly BRAKING = 24;
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

  // Particles & Skid Mark Decals
  private exhaustParticles: THREE.Points | null = null;
  private exhaustData: { positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array } | null = null;
  private readonly EXHAUST_COUNT = 75;

  private skidMarks: THREE.Mesh[] = [];
  private skidMarkIndex = 0;
  private readonly SKID_POOL_SIZE = 24;

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
    timeString: '06:15 PM',
    timePhase: 'sunset',
    timePhaseLabel: 'Godhuli Sunset (Sandhya)',
    isNight: false,
    visibilityPercent: 75,
    weather: {
      type: 'sunny',
      label: 'Clear & Sunny',
      hindiLabel: 'धूप (Dhoop)',
      icon: '☀️',
      tractionMultiplier: 1.0,
      visibilityPercent: 100,
      isRaining: false,
      isDusty: false,
      windForce: 0,
    },
    handling: {
      gripPercent: 100,
      surfaceType: 'tarmac',
      surfaceLabel: 'Dry Tarmac (Optimal)',
      isAquaplaning: false,
      isBrakeLocked: false,
      isWheelSpinning: false,
      isWindBuffeting: false,
      adviceTip: 'Smooth highway. Accelerate freely!',
    },
    isNearChaiStall: false,
    isChaiBreakActive: false,
    goals: this.missions.goals,
    unclaimedGoalsCount: 0,
    currentStation: RADIO_STATIONS.find((s) => s.id === 'bollywood')!,
    isTwoWheelStunt: false,
    incomingCall: null,
  };

  private incomingCallTimer = 50; // First incoming call after 50s of driving
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
    this.initSkidMarks();
    this.initEventListeners();
    this.startLoop();
  }

  private initThree() {
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;

    // 1. Scene & Dynamic Sky
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf6ad55, 0.005);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 900);
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

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Dynamic Sky & Lighting Manager
    this.environment = new DynamicEnvironment(this.scene, this.renderer);

    // 5. Procedural World Track & Scenery Manager
    this.world = new WorldManager(this.scene);

    // 6. Hero Bajaj Auto Rickshaw
    this.rickshaw = createAutoRickshaw();
    this.rickshaw.position.set(0, 0, 0);
    this.scene.add(this.rickshaw);
  }

  private initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.EXHAUST_COUNT * 3);
    const velocities = new Float32Array(this.EXHAUST_COUNT * 3);
    const lifetimes = new Float32Array(this.EXHAUST_COUNT);

    for (let i = 0; i < this.EXHAUST_COUNT; i++) {
      positions[i * 3 + 1] = -100; // start hidden
      lifetimes[i] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x64748b, // 2-stroke oil smoke puff
      size: 0.35,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.exhaustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.exhaustParticles);

    this.exhaustData = { positions, velocities, lifetimes };
  }

  private initSkidMarks() {
    const skidGeo = new THREE.PlaneGeometry(1.4, 2.5);
    skidGeo.rotateX(-Math.PI / 2);
    const skidTex = getSkidMarkTexture();

    const skidMat = new THREE.MeshBasicMaterial({
      map: skidTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    for (let i = 0; i < this.SKID_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(skidGeo, skidMat.clone());
      mesh.position.y = -50;
      this.scene.add(mesh);
      this.skidMarks.push(mesh);
    }
  }

  private spawnSkidMark() {
    if (this.skidMarks.length === 0) return;
    const mesh = this.skidMarks[this.skidMarkIndex];
    this.skidMarkIndex = (this.skidMarkIndex + 1) % this.SKID_POOL_SIZE;

    // Place at rear axle position
    const rearAxleZ = this.posZ - Math.cos(this.headingAngle) * 0.65;
    const rearAxleX = this.posX - Math.sin(this.headingAngle) * 0.65;

    mesh.position.set(rearAxleX, 0.02, rearAxleZ);
    mesh.rotation.y = this.headingAngle;
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
  }

  private updateParticles(dt: number) {
    if (!this.exhaustParticles || !this.exhaustData) return;
    const { positions, velocities, lifetimes } = this.exhaustData;

    const anchorWorld = new THREE.Vector3();
    this.rickshaw.localToWorld(anchorWorld.copy(this.rickshaw.exhaustAnchor));

    const isBoosting = this.inputs.boost && this.state.chaiBoost > 0;
    const spawnRate = Math.abs(this.speed) > 0.5 ? 4 : 1;

    for (let i = 0; i < this.EXHAUST_COUNT; i++) {
      lifetimes[i] += dt;
      if (lifetimes[i] > 0.8 && Math.random() < spawnRate * dt * 8) {
        lifetimes[i] = 0;
        positions[i * 3] = anchorWorld.x + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = anchorWorld.y + (Math.random() - 0.5) * 0.05;
        positions[i * 3 + 2] = anchorWorld.z - 0.2;

        const exhaustDir = -Math.cos(this.headingAngle);
        velocities[i * 3] = (Math.random() - 0.5) * 0.8 - Math.sin(this.headingAngle) * (isBoosting ? 6 : 2);
        velocities[i * 3 + 1] = 0.3 + Math.random() * 0.5;
        velocities[i * 3 + 2] = exhaustDir * (isBoosting ? 8 : 3);
      } else if (lifetimes[i] <= 0.8) {
        positions[i * 3] += velocities[i * 3] * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      }
    }

    const mat = this.exhaustParticles.material as THREE.PointsMaterial;
    mat.color.setHex(isBoosting ? 0x38bdf8 : 0x71717a);
    mat.size = isBoosting ? 0.6 : 0.32;

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

    if (code === 'KeyH' || code === 'Space') {
      this.triggerHorn();
    }

    if (code === 'KeyC') {
      this.toggleCamera();
    }

    if (code === 'KeyR') {
      this.nextRadioStation();
    }

    if (code === 'KeyE') {
      if (this.state.isNearChaiStall || Math.abs(this.posX) > 4.5) {
        this.startChaiBreak();
      } else {
        this.setStateMessage('☕ Pull over onto the roadside shoulder near a Chai Dhaba to take a break! [E]');
        this.notifyState();
      }
    }

    if (code === 'KeyQ') {
      this.cycleWeather();
    }

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
    sounds.setSkidding(false);
  };

  private handleResize = () => {
    if (!this.mount) return;
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public triggerHorn(variant: 'airhorn' | 'bulb' = 'airhorn') {
    sounds.playHorn(variant);
    this.cameraShake = Math.max(this.cameraShake, 0.25);
    const { brokenSilence } = this.missions.onHonk();
    if (brokenSilence) {
      this.setStateMessage('🛕 Horn blasted! Silent Pilgrimage goal broken.');
    }
    const result = this.world.handleHonk(this.rickshaw.position);
    if (result.busesHonked > 0) {
      sounds.playBusAirHorn();
      if (!brokenSilence) {
        this.setStateMessage('🚌 State Transport Lal Dabba Bus blares loud pneumatic horn back!');
      }
    } else if (result.cyclesHonked > 0) {
      sounds.playCycleRickshawBell();
      if (!brokenSilence) {
        this.setStateMessage('🚲 Cycle Rickshaw puller rings brass bell "Trin-Trin!" and yields lane!');
      }
    } else if (result.tractorsHonked > 0) {
      sounds.playTractorHorn();
      if (!brokenSilence) {
        this.setStateMessage('🚜 Heavy Sugarcane Tractor responds with klaxon horn!');
      }
    } else if (result.autosHonked > 0) {
      sounds.playRivalAutoHorn();
      if (!brokenSilence) {
        this.setStateMessage('🛺 Rival Auto revs engine: "Peep-peep! Hatt jaa!"');
      }
    } else if (result.cowsAlerted > 0) {
      sounds.playCowMoo();
      if (!brokenSilence) {
        this.setStateMessage('🐄 Gau Mata moves peacefully to the shoulder! 🙏');
      }
    }
  }

  // --- WEATHER SYSTEM ACTIONS ---
  public cycleWeather(): WeatherState {
    const ws = this.environment.cycleNextWeather();
    this.state.weather = ws;
    this.setStateMessage(`Weather: ${ws.label} (${ws.hindiLabel}) - Grip: ${Math.round(ws.tractionMultiplier * 100)}%`);
    this.notifyState();
    return ws;
  }

  public setWeather(type: WeatherType) {
    this.environment.setWeather(type);
    this.state.weather = this.environment.getWeatherState();
    this.notifyState();
  }

  // --- CHAI BREAK PULL-OVER ACTIONS ---
  public startChaiBreak() {
    if (this.state.isChaiBreakActive) return;
    this.state.isChaiBreakActive = true;
    this.speed = 0;
    this.inputs.forward = false;
    this.inputs.backward = false;
    this.inputs.boost = false;
    sounds.updateEngineSound(0, false);

    // Refuel stamina (chaiBoost) to 100%
    this.state.chaiBoost = 100;
    this.state.condition = Math.min(100, this.state.condition + 25);
    this.state.chaiCount += 1;
    this.state.totalEarnings += 15;
    this.missions.onChaiCollected(this.state.chaiCount);

    this.setStateMessage('☕ Cutting Chai Break! Refueling stamina at roadside stall...');
    this.notifyState();
  }

  public finishChaiBreak() {
    this.state.isChaiBreakActive = false;
    sounds.startEngine();
    this.setStateMessage('✨ Kadak Cutting Chai enjoyed! Stamina 100% full nitro boost charged! Chalo!');
    this.notifyState();
  }

  public nextRadioStation(): RadioStationInfo {
    const station = sounds.nextRadioStation();
    this.state.currentStation = station;
    this.setStateMessage(`📻 Radio Tuned: ${station.name} (${station.frequency})`);
    this.notifyState();
    return station;
  }

  public setRadioStation(id: RadioStationId) {
    sounds.setRadioStation(id);
    const station = RADIO_STATIONS.find((s) => s.id === id) || RADIO_STATIONS[0];
    this.state.currentStation = station;
    this.setStateMessage(`📻 Radio: ${station.name}`);
    this.notifyState();
  }

  public claimMissionReward(goalId: string) {
    const reward = this.missions.claimReward(goalId);
    if (reward > 0) {
      sounds.playMissionComplete();
      this.state.totalEarnings += reward;
      this.state.unclaimedGoalsCount = this.missions.getUnclaimedRewardsCount();
      this.setStateMessage(`🎉 Claimed ₹${reward} Mission Reward! Bahut khoob!`);
      this.notifyState();
    }
  }

  public repairVehicle(amount: number = 50, cost: number = 30): boolean {
    const totalAvail = this.state.fareRupees + this.state.totalEarnings;
    if (totalAvail < cost) {
      this.setStateMessage(`❌ Not enough rupees! Need ₹${cost} for Ramesh garage.`);
      this.notifyState();
      return false;
    }
    if (this.state.fareRupees >= cost) {
      this.state.fareRupees -= cost;
    } else {
      const remainder = cost - this.state.fareRupees;
      this.state.fareRupees = 0;
      this.state.totalEarnings -= remainder;
    }
    this.state.condition = Math.min(100, this.state.condition + amount);
    sounds.playRepairWrench();
    this.setStateMessage(`🔧 Ramesh Garage fixed rickshaw! Condition restored to ${Math.round(this.state.condition)}%`);
    this.notifyState();
    return true;
  }

  public boostChai(amount: number = 60, cost: number = 15): boolean {
    const totalAvail = this.state.fareRupees + this.state.totalEarnings;
    if (totalAvail < cost) {
      this.setStateMessage(`❌ Need ₹${cost} for Munna Cutting Chai!`);
      this.notifyState();
      return false;
    }
    if (this.state.fareRupees >= cost) {
      this.state.fareRupees -= cost;
    } else {
      const remainder = cost - this.state.fareRupees;
      this.state.fareRupees = 0;
      this.state.totalEarnings -= remainder;
    }
    this.state.chaiBoost = Math.min(100, this.state.chaiBoost + amount);
    sounds.playChaiBoost();
    this.setStateMessage(`☕ Special Kadak Masala Chai delivered! Boost charged to ${Math.round(this.state.chaiBoost)}%!`);
    this.notifyState();
    return true;
  }

  public grantBlessing() {
    this.state.condition = Math.min(100, this.state.condition + 15);
    this.setStateMessage(`🙏 Maa's blessings! Auto condition +15%! Drive safely!`);
    this.notifyState();
  }

  public triggerIncomingCall(caller?: IncomingCallAlert) {
    if (this.state.incomingCall || this.state.isGameOver || this.state.activeCameraMode === 'title') return;
    this.state.incomingCall = caller || {
      contactId: 'maa',
      name: 'Maa (Mom)',
      avatar: '👵',
      relation: 'Family ❤️',
      number: '98200-10800',
    };
    sounds.playPhoneRingtone();
    this.notifyState();
  }

  public dismissIncomingCall() {
    this.state.incomingCall = null;
    sounds.stopPhoneRingtone();
    sounds.playCallHangup();
    this.notifyState();
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
    this.missions.reset();
    sounds.startEngine();
    sounds.startAmbientRaga();
    this.setStateMessage('Chalo! Clean meter started.');
    this.notifyState();
  }

  public cycleTimeOfDay() {
    this.environment.cycleNextTime();
    const t = this.environment.getTimeState();
    this.setStateMessage(`Time: ${t.phaseLabel} (${t.timeString})`);
    this.notifyState();
  }

  public notifyState() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public setStateMessage(msg: string) {
    this.state.message = msg;
  }

  // Passenger handling
  public pickUpPassenger(name: string, destinationZ: number) {
    this.state.hasPassenger = true;
    this.state.passengerName = name;
    this.currentPassengerDestZ = destinationZ;

    // Mount 3D passenger character on rear seat bench
    const passObj = new THREE.Group();
    const kurta = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xe0e7ff, roughness: 0.8 })
    );
    kurta.position.y = 0.95;
    passObj.add(kurta);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.8 })
    );
    head.position.y = 1.45;
    passObj.add(head);

    passObj.position.set(0.2, 0, -0.65);
    this.rickshaw.bodyLeanPivot.add(passObj);
    this.passengerPassengerMesh = passObj;

    sounds.playPassengerSuccess();
    this.setStateMessage(`Passenger Picked Up: ${name}! Meter Down.`);

    (this.rickshaw.meterMesh.material as THREE.MeshBasicMaterial).map = getMeterScreenTexture(25, true);
    this.notifyState();
  }

  public dropOffPassenger() {
    this.state.hasPassenger = false;
    const fareEarned = Math.round(this.state.fareRupees);
    this.state.totalEarnings += fareEarned;
    this.state.passengersServed += 1;
    this.state.fareRupees = 25;

    if (this.passengerPassengerMesh) {
      this.rickshaw.bodyLeanPivot.remove(this.passengerPassengerMesh);
      this.passengerPassengerMesh = null;
    }

    sounds.playPassengerSuccess();
    const passGoal = this.missions.onPassengerDelivered(this.state.passengersServed);
    if (passGoal) {
      this.setStateMessage(`🎯 Goal Completed: ${passGoal.title}! Tap Goals to claim ₹${passGoal.rewardRupees}!`);
    } else {
      this.setStateMessage(`Destination Reached! Earned ₹${fareEarned} fare! Bahut Badhiya!`);
    }

    (this.rickshaw.meterMesh.material as THREE.MeshBasicMaterial).map = getMeterScreenTexture(25, false);
    this.notifyState();
  }

  // Core Simulation Step
  private update(dt: number) {
    if (this.state.isPaused) return;

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

      this.rickshaw.position.y = Math.sin(performance.now() * 0.035) * 0.015;
      this.environment.update(dt * 0.3, 0, 0);
      return;
    }

    if (this.state.isGameOver) return;

    // 2. Dynamic Weather Handling, Traction & Braking Physics
    const weatherState = this.environment.getWeatherState();
    let baseTraction = weatherState.tractionMultiplier; // 1.0 (sunny), 0.65 (monsoon rain), 0.85 (dusty haze)

    // Off-road dirt shoulder reduces tire adhesion by further 25%
    const isOffRoad = Math.abs(this.posX) > 6.4;
    if (isOffRoad) {
      baseTraction *= 0.75;
    }

    const forwardPower = Math.max(this.inputs.forward ? 1 : 0, this.inputs.analogThrottle);
    const brakePower = Math.max(this.inputs.backward ? 1 : 0, this.inputs.analogBrake);
    const isBoosting = this.inputs.boost && this.state.chaiBoost > 0;
    const currentMaxSpeed = isBoosting ? this.BOOST_MAX_SPEED : this.MAX_SPEED;

    if (isBoosting) {
      this.state.chaiBoost = Math.max(0, this.state.chaiBoost - dt * 25);
      if (Math.random() < 0.15) sounds.playChaiBoost();
    }

    // --- A. TRACTION & WHEELSPIN LAUNCH DYNAMICS ---
    // Flooring the gas from low speed on wet tarmac or sand causes wheelspin
    let torqueBite = 1.0;
    this.isWheelSpinning = false;
    if (weatherState.isRaining && forwardPower > 0.75 && Math.abs(this.speed) < 5.0) {
      this.isWheelSpinning = true;
      torqueBite = 0.52; // Wheelspin robs forward propulsion
      if (Math.random() < 0.18) sounds.playAquaplaneSkid();
    } else if (weatherState.isDusty && forwardPower > 0.82 && Math.abs(this.speed) < 5.5) {
      this.isWheelSpinning = true;
      torqueBite = 0.68;
    }

    let targetAcc = 0;
    if (forwardPower > 0) {
      const surfaceGrip = (0.55 + 0.45 * baseTraction) * torqueBite;
      targetAcc = this.ACCELERATION * forwardPower * (isBoosting ? 1.7 : 1.0) * surfaceGrip;
    }

    // --- B. BRAKING DYNAMICS: CADENCE BRAKING VS BRAKE LOCKUP SKID ---
    if (brakePower > 0) {
      if (this.speed > 1.0) {
        // Stomping the brake (>0.68) at speed on wet asphalt or sand locks rear drum brakes!
        if (weatherState.isRaining && brakePower > 0.68 && this.speed > 6.5) {
          if (!this.isBrakeLocked) {
            this.isBrakeLocked = true;
            this.brakeLockTimer = 0.85;
            sounds.playBrakeLockup();
            this.cameraShake = Math.max(this.cameraShake, 0.4);
            this.setStateMessage('⚠️ Brake Lockup on Wet Road! Release & tap brakes (Cadence Braking)!');
          }
        } else if (weatherState.isDusty && brakePower > 0.75 && this.speed > 7.5) {
          if (!this.isBrakeLocked) {
            this.isBrakeLocked = true;
            this.brakeLockTimer = 0.7;
            sounds.playBrakeLockup();
            this.setStateMessage('⚠️ Sand Skid Lockup! Feather the brakes for traction!');
          }
        } else {
          // Modulated / Cadence Braking preserves traction and steering control
          this.isBrakeLocked = false;
        }

        if (this.brakeLockTimer > 0) {
          this.brakeLockTimer -= dt;
          if (this.brakeLockTimer <= 0 && brakePower < 0.7) {
            this.isBrakeLocked = false;
          }
        }

        // Locked brakes slide uncontrollably (stopping distance increased by ~60%)
        // Modulated cadence braking yields significantly higher deceleration and preserves steering!
        const brakeEfficiency = this.isBrakeLocked ? 0.46 * baseTraction : 0.86 * baseTraction;
        targetAcc = -this.BRAKING * brakePower * brakeEfficiency;
      } else {
        targetAcc = -this.ACCELERATION * 0.5 * brakePower; // Reverse
        this.isBrakeLocked = false;
      }
    } else {
      this.isBrakeLocked = false;
      if (forwardPower === 0) {
        targetAcc = -Math.sign(this.speed) * this.DRAG;
      }
    }

    this.speed += targetAcc * dt;
    if (Math.abs(this.speed) < 0.1 && forwardPower === 0 && brakePower === 0) {
      this.speed = 0;
    }
    this.speed = Math.max(-5, Math.min(currentMaxSpeed, this.speed));

    // --- C. HANDLING, STEERING UNDERSTEER & AQUAPLANING ---
    let targetSteer = 0;
    if (Math.abs(this.inputs.analogSteer) > 0.02) {
      targetSteer = this.inputs.analogSteer * this.MAX_STEER;
    } else {
      if (this.inputs.left) targetSteer += this.MAX_STEER;
      if (this.inputs.right) targetSteer -= this.MAX_STEER;
    }

    // Locked rear brakes strip away steering control (front wheel skids straight)
    if (this.isBrakeLocked) {
      targetSteer *= 0.18;
    }

    // High speed in monsoon rain causes Aquaplaning (understeer widens turn radius)
    this.isAquaplaning = false;
    if (weatherState.isRaining && Math.abs(this.speed) > 11.5) {
      this.isAquaplaning = true;
      const understeerFactor = Math.min(0.55, (Math.abs(this.speed) - 10) * 0.045);
      targetSteer *= (1.0 - understeerFactor);
      if (Math.random() < 0.06) sounds.playAquaplaneSkid();
    }

    const steerSpeedFactor = Math.max(0.35, 1.0 - (Math.abs(this.speed) / this.MAX_SPEED) * 0.5);
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * steerSpeedFactor, 9.0, dt);

    if (Math.abs(this.speed) > 0.1) {
      const turnRate = (this.speed / 2.3) * Math.sin(this.steerAngle);
      this.headingAngle += turnRate * dt;
    }

    // --- D. OVERSTEER / FISHTAIL DRIFTING IN WET MONSOON ---
    // Abrupt steering while on gas in rain causes the rear to slide out
    const isHardTurning = Math.abs(this.steerAngle) > 0.32 && Math.abs(this.speed) > 7.5;
    if (weatherState.isRaining && isHardTurning) {
      const targetDrift = -Math.sign(this.steerAngle) * (1.15 - baseTraction) * 0.42;
      this.driftSlipAngle = THREE.MathUtils.damp(this.driftSlipAngle, targetDrift, 5.0, dt);
      this.headingAngle += this.driftSlipAngle * dt * 2.2;
    } else {
      this.driftSlipAngle = THREE.MathUtils.damp(this.driftSlipAngle, 0, 7.0, dt);
    }

    // 2-Wheel Stunt & Realistic Lateral Rollover Mechanics
    this.state.isTwoWheelStunt = isHardTurning && Math.abs(this.speed) > 10.0;
    const rollMultiplier = isHardTurning ? 0.48 : 0.28;
    const targetRoll = -Math.sin(this.steerAngle) * (Math.abs(this.speed) / this.MAX_SPEED) * rollMultiplier;
    this.bodyRoll = THREE.MathUtils.damp(this.bodyRoll, targetRoll, 7.0, dt);
    this.rickshaw.bodyLeanPivot.rotation.z = this.bodyRoll;

    // Pitch (slight nose up on hard acceleration, nose dive on hard brake)
    const targetPitch = (targetAcc / this.ACCELERATION) * 0.06;
    this.bodyPitch = THREE.MathUtils.damp(this.bodyPitch, targetPitch, 8.0, dt);
    this.rickshaw.bodyLeanPivot.rotation.x = this.bodyPitch;

    // --- E. POSITION UPDATE & WEATHER SLIP DYNAMICS ---
    this.posZ += Math.cos(this.headingAngle) * this.speed * dt;
    this.posX += Math.sin(this.headingAngle) * this.speed * dt;

    // Wet road lateral slide
    if (weatherState.isRaining && Math.abs(this.speed) > 6.0 && Math.abs(this.steerAngle) > 0.2) {
      const slide = Math.sin(this.steerAngle) * (1.0 - baseTraction) * dt * 5.2;
      this.posX += slide;
    }

    // Desert dust storm dynamic crosswind gusts (pushes vehicle laterally)
    let isWindBuffeting = false;
    if (weatherState.isDusty) {
      this.windGustTimer -= dt;
      if (this.windGustTimer <= 0) {
        this.windGustTimer = 4.0 + Math.random() * 5.0;
        this.crosswindForce = (Math.random() > 0.5 ? 1 : -1) * (2.8 + Math.random() * 2.5);
        sounds.playWindGust();
        this.cameraShake = Math.max(this.cameraShake, 0.35);
        this.setStateMessage('🌪️ Desert Loo Crosswind Gust! Counter-steer into the wind!');
      }

      this.posX += this.crosswindForce * dt;
      this.crosswindForce = THREE.MathUtils.damp(this.crosswindForce, 0, 1.5, dt);
      if (Math.abs(this.crosswindForce) > 0.8) {
        isWindBuffeting = true;
      }
    }

    // Real-time Handling Telemetry & Advice calculation
    let currentGrip = baseTraction;
    if (this.isBrakeLocked) currentGrip *= 0.5;
    if (this.isAquaplaning) currentGrip *= 0.65;
    if (this.isWheelSpinning) currentGrip *= 0.7;
    const gripPercent = Math.round(Math.max(15, Math.min(100, currentGrip * 100)));

    let adviceTip = 'Drive smoothly. Accelerate and steer freely!';
    if (this.isBrakeLocked) {
      adviceTip = '⚠️ Brakes Locked! Release and pump pedal (Cadence Braking)!';
    } else if (this.isAquaplaning) {
      adviceTip = '🌧️ Hydroplaning! Ease off gas and slow down before turning!';
    } else if (this.isWheelSpinning) {
      adviceTip = '⚡ Launch Wheelspin! Ease into throttle gently for grip!';
    } else if (weatherState.isDusty) {
      adviceTip = '🌪️ Loose Sand & Loo Wind! Counter-steer into gusts and brake early!';
    } else if (weatherState.isRaining) {
      adviceTip = '🌧️ Monsoon Wet Asphalt! Modulate brakes & slow down for corners!';
    }

    this.state.handling = {
      gripPercent,
      surfaceType: weatherState.isRaining ? 'wet_asphalt' : weatherState.isDusty ? 'loose_sand' : 'tarmac',
      surfaceLabel: weatherState.isRaining ? 'Wet Asphalt (Slippery)' : weatherState.isDusty ? 'Loose Sand & Silt' : 'Dry Tarmac (Optimal)',
      isAquaplaning: this.isAquaplaning,
      isBrakeLocked: this.isBrakeLocked,
      isWheelSpinning: this.isWheelSpinning,
      isWindBuffeting,
      adviceTip,
    };

    // Shoulder gravel friction
    if (Math.abs(this.posX) > 6.8) {
      this.speed *= 0.96;
      if (Math.abs(this.posX) > 8.5) {
        this.posX = Math.sign(this.posX) * 8.5;
        this.headingAngle *= 0.5;
      }
    }

    // Suspension bounce over asphalt grain
    this.suspensionBounce = THREE.MathUtils.damp(
      this.suspensionBounce,
      Math.sin(this.posZ * 1.5) * 0.02 * (Math.abs(this.speed) / 10),
      14.0,
      dt
    );
    this.posY = Math.max(0, this.suspensionBounce);

    this.rickshaw.position.set(this.posX, this.posY, this.posZ);
    this.rickshaw.rotation.y = this.headingAngle;

    // Steering linkage
    this.rickshaw.frontWheel.rotation.y = this.steerAngle;
    this.rickshaw.handlebar.rotation.y = this.steerAngle * 0.85;

    // Wheel roll rotation
    const wheelRotDelta = (this.speed * dt) / 0.34;
    this.rickshaw.frontWheel.rotation.x += wheelRotDelta;
    this.rickshaw.rearLeftWheel.rotation.x += wheelRotDelta;
    this.rickshaw.rearRightWheel.rotation.x += wheelRotDelta;

    // Cockpit Dynamic Details:
    // 1. Hanging talisman charm pendulum physics
    const targetCharmPitch = -(targetAcc / this.ACCELERATION) * 0.45;
    const targetCharmRoll = -Math.sin(this.steerAngle) * (Math.abs(this.speed) / this.MAX_SPEED) * 0.75;
    this.charmPitch = THREE.MathUtils.damp(this.charmPitch, targetCharmPitch, 6.0, dt);
    this.charmRoll = THREE.MathUtils.damp(this.charmRoll, targetCharmRoll, 6.0, dt);
    this.rickshaw.hangingCharm.rotation.x = this.charmPitch;
    this.rickshaw.hangingCharm.rotation.z = this.charmRoll;

    // 2. Analog Speedometer Needle rotation (-2.35 rad to +2.35 rad)
    const speedRatioClamped = Math.min(1.0, (Math.abs(this.speed) * 3.6) / 100);
    const targetNeedleRot = -2.35 + speedRatioClamped * 4.7;
    this.speedoNeedleRot = THREE.MathUtils.damp(this.speedoNeedleRot, targetNeedleRot, 12.0, dt);
    this.rickshaw.speedometerNeedle.rotation.z = this.speedoNeedleRot;

    // 3. Throttle grip & brake lever animation
    const isThrottling = forwardPower > 0.05;
    this.rickshaw.throttleGrip.rotation.x = isThrottling ? -0.32 : 0;

    const isBraking = (this.inputs.backward || this.inputs.analogBrake > 0.1) && this.speed > 0.5;
    this.rickshaw.brakeLever.rotation.y = isBraking ? 0.22 : 0;
    this.rickshaw.brakeLightPoint.intensity = isBraking ? 3.0 : 0.0;
    (this.rickshaw.taillightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.8 : 0.5;

    // 4. Tire Skid & Screech
    const isHardBrakingSkid = isBraking && this.speed > 4.5;
    const isDriftSkid = isHardTurning && Math.abs(this.speed) > 10.0;
    const isSkidding = isHardBrakingSkid || isDriftSkid;

    if (isSkidding) {
      sounds.setSkidding(true, isHardBrakingSkid ? 0.7 : 0.5);
      this.skidMarkTimer += dt;
      if (this.skidMarkTimer > 0.08) {
        this.skidMarkTimer = 0;
        this.spawnSkidMark();
      }
    } else {
      sounds.setSkidding(false);
      this.skidMarkTimer = 0;
    }

    // Windshield wiper motion: active during monsoon rain or at speed
    if (weatherState.isRaining || this.speed > 2) {
      const wiperRate = weatherState.isRaining ? 0.016 : 0.008;
      this.rickshaw.wiperMesh.rotation.z = Math.sin(performance.now() * wiperRate) * 0.55;
    }

    // 5. Audio update
    const speedRatio = Math.abs(this.speed) / this.MAX_SPEED;
    sounds.updateEngineSound(speedRatio, this.inputs.forward || this.inputs.analogThrottle > 0.05);

    // 6. Dynamic Lighting & Skybox
    this.environment.update(dt, this.posZ, this.speed);
    const timeState = this.environment.getTimeState();

    this.world.currentTimePhase = timeState.phase;
    this.world.updateLighting(timeState.isNight, timeState.isNight ? 1.0 : 0.05);

    // Night headlights
    if (timeState.isNight) {
      this.rickshaw.headlightLight.intensity = 8.5;
      (this.rickshaw.lensMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
    } else if (timeState.phase === 'sunset') {
      this.rickshaw.headlightLight.intensity = 4.5;
      (this.rickshaw.lensMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4;
    } else {
      this.rickshaw.headlightLight.intensity = 0.5;
      (this.rickshaw.lensMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
    }

    this.state.timeString = timeState.timeString;
    this.state.timePhase = timeState.phase;
    this.state.timePhaseLabel = timeState.phaseLabel;
    this.state.isNight = timeState.isNight;
    this.state.visibilityPercent = timeState.visibilityPercent;
    this.state.weather = weatherState;

    // 6b. Check roadside Chai Dhaba Stall proximity for pull-over Chai Break
    let nearStall = false;
    for (const stall of this.world.chaiStalls) {
      const dz = Math.abs(this.posZ - stall.z);
      if (dz < 6.8 && this.posX < -4.2) {
        nearStall = true;
        break;
      }
    }
    this.state.isNearChaiStall = nearStall;

    // 7. Update Streaming Track & Traffic
    this.world.update(this.posZ, dt, Math.abs(this.speed));
    this.updateParticles(dt);

    // Fade skid marks
    for (const skid of this.skidMarks) {
      const mat = skid.material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) {
        mat.opacity = Math.max(0, mat.opacity - dt * 0.04);
      }
    }

    // 8. Distance & Fare Calculations
    const distanceDelta = (this.speed * dt) / 1000;
    this.state.distanceKm += distanceDelta;
    if (this.state.hasPassenger) {
      this.state.fareRupees += distanceDelta * 18 + dt * 0.5;
    }
    this.state.speedKmh = Math.floor(Math.abs(this.speed) * 3.6);

    // 8b. Collision & Road Hazard Detections
    this.checkCollisions();
    this.checkRoadHazards();
    this.checkCollectibles();
    this.checkPassengers();

    // 8c. Temple & Mission Goal Progression Checks
    for (const temple of this.world.templePositions) {
      if (!temple.passed && this.posZ >= temple.z - 3) {
        temple.passed = true;
        const templeGoal = this.missions.onTemplePassed();
        if (templeGoal) {
          this.setStateMessage(`🎯 Goal Completed: ${templeGoal.title}! Tap Goals to claim ₹${templeGoal.rewardRupees}! 🛕`);
        }
      }
    }
    this.missions.onSpeedCheck(this.state.speedKmh);
    this.missions.onDistanceCheck(this.state.distanceKm);

    // 8d. Periodic Incoming Phone Call
    if (!this.state.isGameOver && !this.state.incomingCall) {
      this.incomingCallTimer -= dt;
      if (this.incomingCallTimer <= 0) {
        this.incomingCallTimer = 70 + Math.random() * 45;
        const possibleCallers = [
          { contactId: 'maa', name: 'Maa (Mom)', avatar: '👵', relation: 'Family ❤️', number: '98200-10800' },
          { contactId: 'munna_chai', name: 'Munna Chaiwala', avatar: '☕', relation: 'Chai Guru ☕', number: '98990-77882' },
          { contactId: 'traffic_patil', name: 'Hawaldar Patil', avatar: '👮‍♂️', relation: 'NH-48 Chowki 👮', number: '103' },
          { contactId: 'sharma_passenger', name: 'Sharma Ji', avatar: '💼', relation: 'VIP Passenger 💼', number: '98765-43210' },
          { contactId: 'ramesh_mechanic', name: 'Ramesh Mistri', avatar: '👨‍🔧', relation: 'Master Mechanic 🔧', number: '98450-44221' },
          { contactId: 'kallu_don', name: 'Kallu Don', avatar: '😎', relation: 'Station Rival 🛺', number: '99222-33445' },
        ];
        const chosen = possibleCallers[Math.floor(Math.random() * possibleCallers.length)];
        this.triggerIncomingCall(chosen);
      }
    }

    // 9. Camera Tracking
    this.updateCamera(dt);

    // 10. Notify React HUD
    this.notifyState();
  }

  private checkRoadHazards() {
    for (const hazard of this.world.roadHazards) {
      if (hazard.triggered) continue;

      const distZ = Math.abs(this.posZ - hazard.z);
      if (distZ < 1.4) {
        if (hazard.type === 'speedbreaker' && Math.abs(this.posX) < 6.8) {
          hazard.triggered = true;
          if (this.speed > 6.0) {
            // Speed breaker hit at excessive speed!
            this.cameraShake = 0.5;
            this.suspensionBounce = 0.24;
            sounds.playSuspensionThud(0.85);
            this.speed *= 0.75;
            this.state.condition = Math.max(0, this.state.condition - 2);
            this.setStateMessage('⚠️ Speed Breaker! Slow down on bumps! Dheere chalo.');
          } else {
            // Smooth compliance
            this.suspensionBounce = 0.08;
            sounds.playSuspensionThud(0.3);
          }
        } else if (hazard.type === 'pothole') {
          const dist = Math.hypot(this.posX - hazard.x, this.posZ - hazard.z);
          if (dist < hazard.radius + 0.6) {
            hazard.triggered = true;
            this.cameraShake = 0.4;
            this.bodyRoll += this.posX > hazard.x ? 0.14 : -0.14;
            sounds.playSuspensionThud(0.7);
            this.speed *= 0.82;
            this.state.condition = Math.max(0, this.state.condition - 3);
            this.setStateMessage('⚠️ Pothole Hit! Road pothole jarred the chassis!');
          }
        }
      }
    }
  }

  private checkCollisions() {
    const rickshawPos = this.rickshaw.position;

    // 1. Physical Collisions with traffic & obstacles
    for (const entity of this.world.traffic) {
      const dist = entity.mesh.position.distanceTo(rickshawPos);
      if (dist < entity.colliderRadius + 1.2) {
        // Impact!
        sounds.playCrash();
        this.hitstopTimer = 0.07;
        this.cameraShake = 0.75;

        this.speed = -this.speed * 0.35;

        if (entity.type === 'bus') {
          sounds.playBusAirHorn();
          this.cameraShake = 0.95;
          this.state.condition = Math.max(0, this.state.condition - 32);
          this.speed = -this.speed * 0.45;
          this.setStateMessage('💥 Heavy Crash with State Transport Lal Dabba Bus! Driver blasts pneumatic horn!');
        } else if (entity.type === 'cycle_rickshaw') {
          sounds.playCycleRickshawBell();
          this.cameraShake = 0.35;
          this.state.condition = Math.max(0, this.state.condition - 8);
          this.speed *= 0.65;
          this.setStateMessage("⚠️ Bumped into Cycle Rickshaw! Puller shouts: 'Arey bhai dekh ke chalao! Trin-trin!' 🚲");
        } else if (entity.type === 'tractor') {
          sounds.playTractorHorn();
          this.state.condition = Math.max(0, this.state.condition - 28);
          this.setStateMessage('Heavy Crash! Smashed into slow-moving Sugarcane Tractor trailer! 🚜');
        } else if (entity.type === 'cow') {
          sounds.playCowMoo();
          this.state.condition = Math.max(0, this.state.condition - 14);
          this.setStateMessage('Careful! Gau Mata crossing NH-48! Drive respectfully. 🐄');
        } else if (entity.type === 'rival_auto') {
          sounds.playRivalAutoHorn();
          this.state.condition = Math.max(0, this.state.condition - 20);
          this.setStateMessage("Crash with Rival Auto! Driver shouts: 'Arre dekh ke chala bhai!' 🛺");
        } else if (entity.type === 'truck') {
          sounds.playBusAirHorn();
          this.cameraShake = 0.85;
          this.state.condition = Math.max(0, this.state.condition - 26);
          this.setStateMessage("💥 Smashed into Heavy Tata Truck! 'BURI NAZAR WALE TERA MOOH KALA' 🚚");
        } else if (entity.type === 'bike') {
          this.state.condition = Math.max(0, this.state.condition - 16);
          this.setStateMessage('Watch out! Commuter motorbike clipped!');
        } else {
          this.state.condition = Math.max(0, this.state.condition - 20);
          this.setStateMessage('Fender bender with Ambassador Taxi!');
        }

        _vecA.subVectors(rickshawPos, entity.mesh.position).normalize();
        this.posX += _vecA.x * 1.5;

        if (this.state.condition <= 0) {
          this.triggerGameOver('Rickshaw Broken Down! Engine overheated.');
        }
        break;
      }
    }

    // 2. Near-Miss Daring Overtake Detection (Daredevil driving reward)
    if (Math.abs(this.speed) > 7.0) {
      for (const entity of this.world.traffic) {
        if (entity.nearMissRegistered) continue;
        const dz = this.posZ - entity.mesh.position.z;
        const dx = Math.abs(this.posX - entity.mesh.position.x);

        // Player is alongside or just passing vehicle at close proximity (1.4m to 3.2m)
        if (dz > -0.5 && dz < 3.2 && dx > 1.3 && dx < 3.2) {
          entity.nearMissRegistered = true;
          sounds.playNearMissBonus();
          const bonus = 20;
          this.state.totalEarnings += bonus;

          const label =
            entity.type === 'bus'
              ? '🚌 Lal Dabba Bus Overtaken!'
              : entity.type === 'cycle_rickshaw'
              ? '🚲 Cycle Rickshaw Passed safely!'
              : entity.type === 'tractor'
              ? '🚜 Slow Tractor Overtaken!'
              : entity.type === 'cow'
              ? '🐄 Close Shave with Gau Mata!'
              : entity.type === 'rival_auto'
              ? '🛺 Daring Overtake on Rival Auto!'
              : entity.type === 'truck'
              ? '🚚 Tata Highway Truck Overtaken!'
              : '⚡ Close Shave!';
          this.setStateMessage(`${label} +₹${bonus} Daredevil Driving Tip!`);
          break;
        }
      }
    }

    // 3. Proactive Obstacle Warning Alerts when obstacle is in current path
    for (const entity of this.world.traffic) {
      const aheadDist = entity.mesh.position.z - this.posZ;
      const lateralDist = Math.abs(entity.mesh.position.x - this.posX);
      if (aheadDist > 22 && aheadDist < 55 && lateralDist < 2.4) {
        if (!entity.hazardAlertSent) {
          entity.hazardAlertSent = true;
          if (entity.type === 'bus') {
            this.setStateMessage('⚠️ State Transport Bus ahead! Pass with caution or honk [H]!');
          } else if (entity.type === 'cycle_rickshaw') {
            this.setStateMessage('⚠️ Slow Cycle Rickshaw ahead! Honk [H] to alert puller!');
          } else if (entity.type === 'tractor') {
            this.setStateMessage('⚠️ Slow Tractor with Sugarcane Trailer ahead! Pass carefully!');
          } else if (entity.type === 'cow') {
            this.setStateMessage('⚠️ Stray Cow crossing the path! Honk [H] to clear road!');
          } else if (entity.type === 'rival_auto') {
            this.setStateMessage('⚠️ Unexpected Rival Auto ahead! Watch for sudden lane cuts!');
          }
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
        item.mesh.position.y = -100;

        if (item.type === 'chai') {
          sounds.playChaiBoost();
          this.state.chaiBoost = Math.min(100, this.state.chaiBoost + 35);
          this.state.chaiCount += 1;
          const chaiGoal = this.missions.onChaiCollected(this.state.chaiCount);
          if (chaiGoal) {
            this.setStateMessage(`🎯 Goal Completed: ${chaiGoal.title}! Tap Goals to claim ₹${chaiGoal.rewardRupees}! ☕`);
          } else {
            this.setStateMessage('Garama-Garam Cutting Chai! Boost Refilled! ☕');
          }
        } else if (item.type === 'coin') {
          sounds.playCoin();
          this.state.totalEarnings += 50;
          this.setStateMessage('+₹50 Rupee Coin Collected! 🪙');
        }
      }
    }
  }

  private checkPassengers() {
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
      if (this.posZ >= this.currentPassengerDestZ) {
        this.dropOffPassenger();
      }
    }
  }

  private updateCamera(dt: number) {
    if (this.state.activeCameraMode === 'chase') {
      const camOffset = new THREE.Vector3(0, 3.2, -6.5);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.headingAngle);

      const targetCamPos = this.rickshaw.position.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, dt * 7.5);

      if (this.cameraShake > 0.01) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 5.0, dt);
      }

      const lookTarget = this.rickshaw.position.clone().add(new THREE.Vector3(0, 1.4, 4));
      lookTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.headingAngle * 0.2);
      this.camera.lookAt(lookTarget);

      const targetFov = 58 + (this.speed / this.BOOST_MAX_SPEED) * 16;
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
      this.camera.updateProjectionMatrix();
    } else if (this.state.activeCameraMode === 'cockpit') {
      // Driver Eye POV sitting right on the driver saddle
      const driverEye = this.rickshaw.position.clone().add(new THREE.Vector3(0, 1.55, 0.38));
      this.camera.position.copy(driverEye);

      const lookTarget = this.rickshaw.position.clone().add(
        new THREE.Vector3(
          Math.sin(this.headingAngle) * 16,
          1.45,
          Math.cos(this.headingAngle) * 16
        )
      );
      this.camera.lookAt(lookTarget);
      this.camera.fov = 72;
      this.camera.updateProjectionMatrix();
    }
  }

  public triggerGameOver(reason: string) {
    this.state.isGameOver = true;
    sounds.stopEngine();
    sounds.stopAmbientRaga();
    sounds.setSkidding(false);
    this.setStateMessage(reason);
    this.notifyState();
  }

  public togglePause(): boolean {
    this.state.isPaused = !this.state.isPaused;
    if (this.state.isPaused) {
      sounds.stopEngine();
      sounds.setSkidding(false);
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
      const dt = Math.min(rawDt, 0.05);
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
    sounds.setSkidding(false);
    this.renderer.dispose();
    if (this.mount.contains(this.renderer.domElement)) {
      this.mount.removeChild(this.renderer.domElement);
    }
  }
}
