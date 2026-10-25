import * as THREE from 'three';
import { sounds } from './audio';

export type TimePhase = 'sunrise' | 'noon' | 'sunset' | 'night';
export type WeatherType = 'sunny' | 'monsoon' | 'dusty_haze';

export interface TimeState {
  normalized: number; // 0.0 to 1.0 (0=6 AM, 0.25=12 PM, 0.5=6 PM, 0.75=12 AM, 1=6 AM)
  phase: TimePhase;
  phaseLabel: string;
  timeString: string;
  isNight: boolean;
  visibilityPercent: number;
}

export interface WeatherState {
  type: WeatherType;
  label: string;
  hindiLabel: string;
  icon: string;
  tractionMultiplier: number;
  visibilityPercent: number;
  isRaining: boolean;
  isDusty: boolean;
  windForce: number;
}

export class DynamicEnvironment {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;

  // Sky elements
  private skyDome: THREE.Mesh;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private starParticles: THREE.Points;
  private starMaterial: THREE.PointsMaterial;
  private skyMaterial: THREE.ShaderMaterial;

  // Weather Particle Systems (Optimized count for smooth 60fps)
  public currentWeather: WeatherType = 'sunny';
  private rainParticles: THREE.Points;
  private rainPositions: Float32Array;
  private rainCount = 750;

  private dustParticles: THREE.Points;
  private dustPositions: Float32Array;
  private dustCount = 450;

  // Weather dynamics & timers
  private lightningTimer = 0;
  private isLightningFlashing = false;
  private weatherTransition = 1.0;
  public windGust = 0;
  public weatherCycleTimer = 75; // Natural weather shifts every 75 seconds of driving
  public isWeatherManualLock = false;

  // Time progress
  public timeNormalized: number = 0.52; // Start at vibrant Indian golden hour / sunset
  public timeSpeed: number = 0.012; // Cycle speed per second
  public isManualLock: boolean = false;

  // Color lerp buffers (avoid GC in update)
  private _topColor = new THREE.Color();
  private _bottomColor = new THREE.Color();
  private _sunColor = new THREE.Color();
  private _hemiSky = new THREE.Color();
  private _hemiGround = new THREE.Color();
  private _fogColor = new THREE.Color();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    // 1. Directional Sun/Moon Light (Optimized shadow map 1024x1024 & tighter frustum)
    this.sunLight = new THREE.DirectionalLight(0xffedd5, 2.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 180;
    this.sunLight.shadow.camera.left = -22;
    this.sunLight.shadow.camera.right = 22;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -22;
    this.sunLight.shadow.bias = -0.0008;
    this.sunLight.shadow.normalBias = 0.03;
    this.scene.add(this.sunLight);

    // 2. Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x9a3412, 1.1);
    this.scene.add(this.hemiLight);

    // 3. Procedural Sky Dome with Vertex Shader Gradient
    const skyGeo = new THREE.SphereGeometry(500, 32, 24);
    skyGeo.scale(-1, 1, 1);

    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0xf6ad55) },
        bottomColor: { value: new THREE.Color(0xd97706) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.skyDome = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.scene.add(this.skyDome);

    // 4. Procedural Radiant Sun Disc Mesh
    const sunGeo = new THREE.SphereGeometry(16, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    // 5. Procedural Glowing Crescent Moon Mesh
    const moonGeo = new THREE.SphereGeometry(12, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // 6. Starfield Layer (Visible at dusk and night)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.1);
      const r = 460;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.starParticles = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starParticles);

    // 7. Monsoon Rain Particles Sheet System
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 44;
      this.rainPositions[i * 3 + 1] = Math.random() * 26;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // 8. Dusty Haze / Loo Storm Particle System
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 50;
      this.dustPositions[i * 3 + 1] = Math.random() * 14;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 0.42,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.dustParticles.visible = false;
    this.scene.add(this.dustParticles);

    // Initial pass
    this.update(0, 0);
  }

  // --- WEATHER SYSTEM CONTROLS ---
  public getWeatherState(): WeatherState {
    const states: Record<WeatherType, WeatherState> = {
      sunny: {
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
      monsoon: {
        type: 'monsoon',
        label: 'Monsoon Rain',
        hindiLabel: 'मानसून बारिश (Barish)',
        icon: '🌧️',
        tractionMultiplier: 0.65, // Slippery wet asphalt causes drifting and longer braking!
        visibilityPercent: 55,
        isRaining: true,
        isDusty: false,
        windForce: 0.3,
      },
      dusty_haze: {
        type: 'dusty_haze',
        label: 'Dusty Haze (Loo)',
        hindiLabel: 'धूल भरी आंधी (Aandhi)',
        icon: '🌪️',
        tractionMultiplier: 0.85, // Loose dust sand slip
        visibilityPercent: 40,
        isRaining: false,
        isDusty: true,
        windForce: 0.8,
      },
    };
    return states[this.currentWeather];
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    sounds.setRainAudio(weather === 'monsoon');
  }

  public cycleNextWeather(): WeatherState {
    const cycle: WeatherType[] = ['sunny', 'monsoon', 'dusty_haze'];
    const nextIdx = (cycle.indexOf(this.currentWeather) + 1) % cycle.length;
    this.setWeather(cycle[nextIdx]);
    return this.getWeatherState();
  }

  // Get current phase and formatted time string
  public getTimeState(): TimeState {
    const norm = (this.timeNormalized % 1.0 + 1.0) % 1.0;
    const totalMinutes = Math.floor(norm * 24 * 60);
    const hour24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const timeString = `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    let phase: TimePhase = 'noon';
    let phaseLabel = 'Midday (Dopahar)';
    let isNight = false;
    let baseVisibility = 100;

    if (norm >= 0.0 && norm < 0.22) {
      phase = 'sunrise';
      phaseLabel = 'Sunrise (Bhor)';
      baseVisibility = 85;
    } else if (norm >= 0.22 && norm < 0.48) {
      phase = 'noon';
      phaseLabel = 'Midday Sun (Dopahar)';
      baseVisibility = 100;
    } else if (norm >= 0.48 && norm < 0.72) {
      phase = 'sunset';
      phaseLabel = 'Godhuli Sunset (Sandhya)';
      baseVisibility = 75;
    } else {
      phase = 'night';
      phaseLabel = 'Starry Night (Raat)';
      isNight = true;
      baseVisibility = 50;
    }

    const weatherVisFactor = this.getWeatherState().visibilityPercent / 100;
    const visibilityPercent = Math.round(baseVisibility * weatherVisFactor);

    return {
      normalized: norm,
      phase,
      phaseLabel,
      timeString,
      isNight,
      visibilityPercent,
    };
  }

  public setTimePreset(preset: TimePhase) {
    const map: Record<TimePhase, number> = {
      sunrise: 0.08,
      noon: 0.32,
      sunset: 0.54,
      night: 0.82,
    };
    this.timeNormalized = map[preset];
  }

  public cycleNextTime() {
    const states: TimePhase[] = ['sunrise', 'noon', 'sunset', 'night'];
    const current = this.getTimeState().phase;
    const nextIdx = (states.indexOf(current) + 1) % states.length;
    this.setTimePreset(states[nextIdx]);
  }

  // Main per-frame update
  public update(dt: number, playerZ: number, speed = 0) {
    if (!this.isManualLock) {
      const drivingProgress = (speed * dt) / 3200;
      const timeProgress = dt * this.timeSpeed;
      this.timeNormalized = (this.timeNormalized + timeProgress + drivingProgress) % 1.0;
    }

    // Dynamic Weather Cycle progression
    if (!this.isWeatherManualLock) {
      this.weatherCycleTimer -= dt;
      if (this.weatherCycleTimer <= 0) {
        this.weatherCycleTimer = 65 + Math.random() * 25;
        this.cycleNextWeather();
      }
    }

    const t = this.timeNormalized;
    this.skyDome.position.z = playerZ;
    this.starParticles.position.z = playerZ;

    let fogDens = 0.005;
    let sunInt = 2.4;
    let hemiInt = 1.0;
    let exposure = 1.15;
    let starsAlpha = 0.0;

    if (t < 0.25) {
      // --- SUNRISE -> NOON ---
      const f = t / 0.25;
      this._topColor.lerpColors(new THREE.Color(0x38bdf8), new THREE.Color(0x0284c7), f);
      this._bottomColor.lerpColors(new THREE.Color(0xfdba74), new THREE.Color(0xbae6fd), f);
      this._sunColor.lerpColors(new THREE.Color(0xffaa5e), new THREE.Color(0xfffbeb), f);
      this._hemiSky.lerpColors(new THREE.Color(0x7dd3fc), new THREE.Color(0x93c5fd), f);
      this._hemiGround.lerpColors(new THREE.Color(0xc2410c), new THREE.Color(0x78350f), f);
      this._fogColor.lerpColors(new THREE.Color(0xfdba74), new THREE.Color(0xdbeafe), f);
      sunInt = THREE.MathUtils.lerp(2.2, 3.4, f);
      hemiInt = THREE.MathUtils.lerp(0.9, 1.3, f);
      fogDens = THREE.MathUtils.lerp(0.006, 0.0035, f);
      exposure = THREE.MathUtils.lerp(1.1, 1.25, f);
      starsAlpha = 0.0;
    } else if (t < 0.5) {
      // --- NOON -> SUNSET ---
      const f = (t - 0.25) / 0.25;
      this._topColor.lerpColors(new THREE.Color(0x0284c7), new THREE.Color(0x581c87), f);
      this._bottomColor.lerpColors(new THREE.Color(0xbae6fd), new THREE.Color(0xf97316), f);
      this._sunColor.lerpColors(new THREE.Color(0xfffbeb), new THREE.Color(0xe11d48), f);
      this._hemiSky.lerpColors(new THREE.Color(0x93c5fd), new THREE.Color(0xa855f7), f);
      this._hemiGround.lerpColors(new THREE.Color(0x78350f), new THREE.Color(0x991b1b), f);
      this._fogColor.lerpColors(new THREE.Color(0xdbeafe), new THREE.Color(0xf59e0b), f);
      sunInt = THREE.MathUtils.lerp(3.4, 2.4, f);
      hemiInt = THREE.MathUtils.lerp(1.3, 0.95, f);
      fogDens = THREE.MathUtils.lerp(0.0035, 0.0055, f);
      exposure = THREE.MathUtils.lerp(1.25, 1.1, f);
      starsAlpha = THREE.MathUtils.lerp(0.0, 0.2, f);
    } else if (t < 0.75) {
      // --- SUNSET -> MIDNIGHT ---
      const f = (t - 0.5) / 0.25;
      this._topColor.lerpColors(new THREE.Color(0x581c87), new THREE.Color(0x030712), f);
      this._bottomColor.lerpColors(new THREE.Color(0xf97316), new THREE.Color(0x0f172a), f);
      this._sunColor.lerpColors(new THREE.Color(0xe11d48), new THREE.Color(0x93c5fd), f);
      this._hemiSky.lerpColors(new THREE.Color(0xa855f7), new THREE.Color(0x1e293b), f);
      this._hemiGround.lerpColors(new THREE.Color(0x991b1b), new THREE.Color(0x020617), f);
      this._fogColor.lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0x0f172a), f);
      sunInt = THREE.MathUtils.lerp(2.4, 0.45, f);
      hemiInt = THREE.MathUtils.lerp(0.95, 0.35, f);
      fogDens = THREE.MathUtils.lerp(0.0055, 0.0065, f);
      exposure = THREE.MathUtils.lerp(1.1, 0.92, f);
      starsAlpha = THREE.MathUtils.lerp(0.2, 1.0, f);
    } else {
      // --- MIDNIGHT -> SUNRISE ---
      const f = (t - 0.75) / 0.25;
      this._topColor.lerpColors(new THREE.Color(0x030712), new THREE.Color(0x38bdf8), f);
      this._bottomColor.lerpColors(new THREE.Color(0x0f172a), new THREE.Color(0xfdba74), f);
      this._sunColor.lerpColors(new THREE.Color(0x93c5fd), new THREE.Color(0xffaa5e), f);
      this._hemiSky.lerpColors(new THREE.Color(0x1e293b), new THREE.Color(0x7dd3fc), f);
      this._hemiGround.lerpColors(new THREE.Color(0x020617), new THREE.Color(0xc2410c), f);
      this._fogColor.lerpColors(new THREE.Color(0x0f172a), new THREE.Color(0xfdba74), f);
      sunInt = THREE.MathUtils.lerp(0.45, 2.2, f);
      hemiInt = THREE.MathUtils.lerp(0.35, 0.9, f);
      fogDens = THREE.MathUtils.lerp(0.0065, 0.006, f);
      exposure = THREE.MathUtils.lerp(0.92, 1.1, f);
      starsAlpha = THREE.MathUtils.lerp(1.0, 0.0, f);
    }

    // --- APPLY WEATHER EFFECTS & OVERRIDES ---
    if (this.currentWeather === 'monsoon') {
      // Overcast rainy slate-indigo palette
      this._topColor.lerp(new THREE.Color(0x1e293b), 0.75);
      this._bottomColor.lerp(new THREE.Color(0x334155), 0.85);
      this._fogColor.lerp(new THREE.Color(0x334155), 0.88);
      sunInt *= 0.35;
      hemiInt = 0.55;
      fogDens = 0.012; // Dense tropical rain mist
      exposure = 0.95;

      // Update Rain Particle Sheet
      this.rainParticles.visible = true;
      this.dustParticles.visible = false;
      this.rainParticles.position.z = playerZ;

      const rainPos = this.rainPositions;
      for (let i = 0; i < this.rainCount; i++) {
        // Fall downwards with forward wind streak
        rainPos[i * 3 + 1] -= dt * 38;
        rainPos[i * 3 + 2] -= dt * (speed * 0.4 + 4);
        // Reset when below ground
        if (rainPos[i * 3 + 1] < 0) {
          rainPos[i * 3 + 1] = 22 + Math.random() * 4;
          rainPos[i * 3] = (Math.random() - 0.5) * 44;
          rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;

      // Periodic Lightning Flash & Thunder
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 8 + Math.random() * 12;
        this.isLightningFlashing = true;
        sounds.playThunder();
        setTimeout(() => {
          this.isLightningFlashing = false;
        }, 120);
      }

      if (this.isLightningFlashing) {
        this._topColor.setHex(0xe0f2fe);
        this._bottomColor.setHex(0xffffff);
        this._fogColor.setHex(0xbae6fd);
        sunInt = 6.0;
      }
    } else if (this.currentWeather === 'dusty_haze') {
      // Warm dusty ochre / sandstorm palette
      this._topColor.lerp(new THREE.Color(0xc2410c), 0.7);
      this._bottomColor.lerp(new THREE.Color(0xd97706), 0.85);
      this._fogColor.lerp(new THREE.Color(0xb45309), 0.88);
      sunInt *= 0.55;
      hemiInt = 0.7;
      fogDens = 0.016; // Very thick sand/dust haze
      exposure = 1.05;

      // Update Dust Particle System
      this.dustParticles.visible = true;
      this.rainParticles.visible = false;
      this.dustParticles.position.z = playerZ;

      const dustPos = this.dustPositions;
      const windSpeed = 14 + Math.sin(performance.now() * 0.002) * 6;
      this.windGust = windSpeed * 0.05;

      for (let i = 0; i < this.dustCount; i++) {
        dustPos[i * 3] += dt * windSpeed;
        dustPos[i * 3 + 1] += Math.sin(dustPos[i * 3] * 0.1) * dt * 2;
        dustPos[i * 3 + 2] -= dt * speed * 0.8;

        if (dustPos[i * 3] > 25) {
          dustPos[i * 3] = -25;
          dustPos[i * 3 + 1] = Math.random() * 12;
          dustPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    } else {
      // Sunny / Clear
      this.rainParticles.visible = false;
      this.dustParticles.visible = false;
      this.windGust = 0;
    }

    // Apply colors to Sky Dome Shader
    this.skyMaterial.uniforms.topColor.value.copy(this._topColor);
    this.skyMaterial.uniforms.bottomColor.value.copy(this._bottomColor);

    // Apply Fog & Background
    this.scene.background = this._fogColor;
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this._fogColor);
      this.scene.fog.density = fogDens;
    }

    // Apply Lights
    this.sunLight.color.copy(this._sunColor);
    this.sunLight.intensity = sunInt;

    this.hemiLight.color.copy(this._hemiSky);
    this.hemiLight.groundColor.copy(this._hemiGround);
    this.hemiLight.intensity = hemiInt;

    // Orbit Sun & Moon
    const sunAngle = t * Math.PI * 2;
    const sunRadius = 420;
    const sunX = Math.cos(sunAngle) * sunRadius;
    const sunY = Math.sin(sunAngle) * sunRadius;
    const sunZ = playerZ + 40;

    this.sunMesh.position.set(sunX, Math.max(-50, sunY), sunZ);
    this.sunMesh.visible = sunY > -30 && this.currentWeather === 'sunny';

    const moonAngle = sunAngle + Math.PI;
    const moonX = Math.cos(moonAngle) * sunRadius;
    const moonY = Math.sin(moonAngle) * sunRadius;
    this.moonMesh.position.set(moonX, Math.max(-50, moonY), sunZ);
    this.moonMesh.visible = moonY > -30 && this.currentWeather === 'sunny';

    if (sunY > 0) {
      this.sunLight.position.set(sunX * 0.4, Math.max(30, sunY * 0.4), playerZ - 30);
    } else {
      this.sunLight.position.set(moonX * 0.4, Math.max(30, moonY * 0.4), playerZ - 30);
    }

    this.starMaterial.opacity = this.currentWeather === 'sunny' ? starsAlpha : 0;
    this.renderer.toneMappingExposure = exposure;
  }
}
