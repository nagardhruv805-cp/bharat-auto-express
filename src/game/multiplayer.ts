import * as THREE from 'three';
import { createAutoRickshaw, AutoRickshawObject } from './models';
import { sounds } from './audio';

export interface NetworkPlayer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speedKmh: number;
  isHonking: boolean;
  isBoosting: boolean;
  ping: number;
  lastUpdate: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  time: string;
}

export interface RickshawLivery {
  id: string;
  name: string;
  city: string;
  hoodHex: number;
  bodyHex: number;
  accentHex: number;
  description: string;
}

export const RICKSHAW_LIVERIES: RickshawLivery[] = [
  {
    id: 'classic_green_yellow',
    name: 'Classic Bajaj CNG',
    city: 'Delhi & Gujarat',
    hoodHex: 0xf5b300,
    bodyHex: 0x0a6639,
    accentHex: 0x15803d,
    description: 'Iconic yellow canopy and CNG green body seen across northern India.',
  },
  {
    id: 'mumbai_black_yellow',
    name: 'Mumbai Kaali-Peeli',
    city: 'Mumbai & Pune',
    hoodHex: 0xf5b300,
    bodyHex: 0x18181b,
    accentHex: 0xca8a04,
    description: 'Vibrant yellow roof with glossy black lower body of maximum city Mumbai.',
  },
  {
    id: 'saffron_flame',
    name: 'Saffron Highway Express',
    city: 'NH-48 Golden Quadrilateral',
    hoodHex: 0xf97316,
    bodyHex: 0xb91c1c,
    accentHex: 0xf59e0b,
    description: 'Blazing orange canopy and crimson body built for long-distance highway cruising.',
  },
  {
    id: 'rajasthan_royal_blue',
    name: 'Jodhpur Royal Blue',
    city: 'Rajasthan Heritage',
    hoodHex: 0x38bdf8,
    bodyHex: 0x1d4ed8,
    accentHex: 0x60a5fa,
    description: 'Royal indigo body inspired by the Blue City of Jodhpur with turquoise roof.',
  },
  {
    id: 'goa_crimson',
    name: 'Goa Coastal Ruby',
    city: 'Goa & Konkan',
    hoodHex: 0xfbbf24,
    bodyHex: 0xbe123c,
    accentHex: 0xe11d48,
    description: 'Tropical sunset canopy with deep ruby red paint from the beaches of Goa.',
  },
  {
    id: 'electric_violet',
    name: 'HyperBoost EV Rickshaw',
    city: 'Bengaluru Tech Corridor',
    hoodHex: 0x22d3ee,
    bodyHex: 0x6d28d9,
    accentHex: 0xa855f7,
    description: 'Modern cyberpunk violet & electric cyan aesthetic of India\'s EV revolution.',
  },
];

interface RemotePlayerContainer {
  id: string;
  name: string;
  color: string;
  mesh: AutoRickshawObject;
  targetX: number;
  targetY: number;
  targetZ: number;
  targetHeading: number;
  speedKmh: number;
  isHonking: boolean;
  isBoosting: boolean;
  nameplateSprite: THREE.Sprite;
  nameplateCanvas: HTMLCanvasElement;
  nameplateCtx: CanvasRenderingContext2D;
  nameplateTexture: THREE.CanvasTexture;
  lastHonkPlayed: number;
  activeChatText: string;
  chatBubbleTimer: number;
}

export class MultiplayerManager {
  private scene: THREE.Scene;
  private ws: WebSocket | null = null;
  private isDisposed: boolean = false;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;

  // Local Profile
  public selfId: string | null = null;
  public driverName: string = 'Ustaad Driver';
  public liveryId: string = 'classic_green_yellow';

  // Remote Players
  private remotePlayers = new Map<string, RemotePlayerContainer>();

  // State & Subscriptions
  public isConnected: boolean = false;
  public pingMs: number = 24;
  public onlinePlayersCount: number = 1;
  public chatFeed: ChatMessage[] = [];
  public onStateChange: ((state: {
    isConnected: boolean;
    pingMs: number;
    onlineCount: number;
    selfId: string | null;
    players: NetworkPlayer[];
    chatFeed: ChatMessage[];
  }) => void) | null = null;

  // Throttled local sync
  private lastSendTime = 0;
  private readonly SEND_INTERVAL_MS = 40; // 25 Hz update rate

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Load saved driver profile from localStorage
    try {
      const savedName = localStorage.getItem('bharat_driver_name');
      if (savedName) this.driverName = savedName;
      const savedLivery = localStorage.getItem('bharat_rickshaw_livery');
      if (savedLivery && RICKSHAW_LIVERIES.some((l) => l.id === savedLivery)) {
        this.liveryId = savedLivery;
      }
    } catch {
      // Ignore localStorage errors
    }

    this.connect();
  }

  public connect() {
    if (this.isDisposed) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitState();
        this.sendJoinPacket();
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPingLoop();
        this.removeAllRemotePlayers();
        this.emitState();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDisposed || this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', clientTime: Date.now() }));
      }
    }, 4000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendJoinPacket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'join',
          name: this.driverName,
          color: this.liveryId,
          x: 0,
          y: 0,
          z: 0,
          heading: 0,
          speedKmh: 0,
        })
      );
    }
  }

  public updateProfile(name: string, liveryId: string) {
    this.driverName = name.trim().substring(0, 24) || 'Ustaad Driver';
    this.liveryId = liveryId;

    try {
      localStorage.setItem('bharat_driver_name', this.driverName);
      localStorage.setItem('bharat_rickshaw_livery', this.liveryId);
    } catch {
      // Ignore
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendJoinPacket();
    }
  }

  public updateLocalPosition(
    x: number,
    y: number,
    z: number,
    heading: number,
    speedKmh: number,
    isHonking: boolean,
    isBoosting: boolean
  ) {
    const now = performance.now();
    if (now - this.lastSendTime < this.SEND_INTERVAL_MS) return;
    this.lastSendTime = now;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'update',
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          z: Math.round(z * 100) / 100,
          heading: Math.round(heading * 1000) / 1000,
          speedKmh: Math.round(speedKmh),
          isHonking,
          isBoosting,
        })
      );
    }
  }

  public sendChat(text: string) {
    const clean = text.trim();
    if (!clean) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text: clean }));
    }
  }

  public sendHonk(variant: 'bulb' | 'airhorn' = 'bulb') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'honk', variant }));
    }
  }

  private handleServerMessage(msg: any) {
    if (msg.type === 'welcome') {
      this.selfId = msg.selfId;
      if (Array.isArray(msg.recentChats)) {
        this.chatFeed = msg.recentChats;
      }
      if (Array.isArray(msg.players)) {
        this.syncPlayerList(msg.players);
      }
      this.emitState();
    } else if (msg.type === 'player_joined') {
      if (msg.player && msg.player.id !== this.selfId) {
        this.createOrUpdateRemotePlayer(msg.player);
        this.emitState();
      }
    } else if (msg.type === 'state_update') {
      if (Array.isArray(msg.players)) {
        this.syncPlayerList(msg.players);
      }
    } else if (msg.type === 'player_left') {
      this.removeRemotePlayer(msg.playerId);
      this.emitState();
    } else if (msg.type === 'chat_message') {
      if (msg.message) {
        this.chatFeed = [...this.chatFeed.slice(-25), msg.message];
        // Trigger floating speech bubble above player's 3D auto
        const remote = this.remotePlayers.get(msg.message.playerId);
        if (remote) {
          remote.activeChatText = msg.message.text;
          remote.chatBubbleTimer = 4.5; // 4.5 seconds visibility
          this.updateNameplateCanvas(remote);
        }
        this.emitState();
      }
    } else if (msg.type === 'player_honked') {
      const remote = this.remotePlayers.get(msg.playerId);
      if (remote) {
        remote.isHonking = true;
        // Spatial audio check: play sound if close enough to listener
        sounds.playHorn(msg.variant || 'bulb');
      }
    } else if (msg.type === 'pong') {
      if (msg.clientTime) {
        this.pingMs = Math.max(8, Math.round(Date.now() - msg.clientTime));
        this.emitState();
      }
    }
  }

  private syncPlayerList(serverPlayers: NetworkPlayer[]) {
    const activeIds = new Set<string>();

    for (const p of serverPlayers) {
      if (p.id === this.selfId) continue;
      activeIds.add(p.id);
      this.createOrUpdateRemotePlayer(p);
    }

    // Remove disconnected players not in server list
    for (const id of this.remotePlayers.keys()) {
      if (!activeIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    }

    this.onlinePlayersCount = serverPlayers.length;
    this.emitState();
  }

  private createOrUpdateRemotePlayer(p: NetworkPlayer) {
    let remote = this.remotePlayers.get(p.id);

    if (!remote) {
      // 1. Create 3D auto rickshaw model
      const mesh = createAutoRickshaw();

      // Customize livery colors
      this.applyLiveryToMesh(mesh, p.color);

      // 2. Create high-resolution billboard nameplate sprite
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.2, 1.0, 1);
      sprite.position.set(0, 2.5, 0);
      mesh.add(sprite);

      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.y = p.heading;
      this.scene.add(mesh);

      remote = {
        id: p.id,
        name: p.name,
        color: p.color,
        mesh,
        targetX: p.x,
        targetY: p.y,
        targetZ: p.z,
        targetHeading: p.heading,
        speedKmh: p.speedKmh,
        isHonking: p.isHonking,
        isBoosting: p.isBoosting,
        nameplateSprite: sprite,
        nameplateCanvas: canvas,
        nameplateCtx: ctx,
        nameplateTexture: texture,
        lastHonkPlayed: 0,
        activeChatText: '',
        chatBubbleTimer: 0,
      };

      this.updateNameplateCanvas(remote);
      this.remotePlayers.set(p.id, remote);
    } else {
      remote.targetX = p.x;
      remote.targetY = p.y;
      remote.targetZ = p.z;
      remote.targetHeading = p.heading;
      remote.speedKmh = p.speedKmh;
      remote.isBoosting = p.isBoosting;

      if (remote.name !== p.name || remote.color !== p.color) {
        remote.name = p.name;
        if (remote.color !== p.color) {
          remote.color = p.color;
          this.applyLiveryToMesh(remote.mesh, p.color);
        }
        this.updateNameplateCanvas(remote);
      }
    }
  }

  public applyLiveryToMesh(mesh: AutoRickshawObject, liveryId: string) {
    const livery = RICKSHAW_LIVERIES.find((l) => l.id === liveryId) || RICKSHAW_LIVERIES[0];

    // Traverse rickshaw children and customize canopy / body materials
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const mat = child.material.clone();
        // Roof canopy detection (original yellow)
        if (mat.color.getHex() === 0xf5b300) {
          mat.color.setHex(livery.hoodHex);
          child.material = mat;
        }
        // Body shell detection (original green)
        else if (mat.color.getHex() === 0x0a6639) {
          mat.color.setHex(livery.bodyHex);
          child.material = mat;
        }
      }
    });
  }

  private updateNameplateCanvas(remote: RemotePlayerContainer) {
    const { nameplateCanvas, nameplateCtx, nameplateTexture, name, speedKmh, activeChatText, chatBubbleTimer } =
      remote;
    const w = nameplateCanvas.width;
    const h = nameplateCanvas.height;

    nameplateCtx.clearRect(0, 0, w, h);

    // If active chat speech bubble exists
    if (chatBubbleTimer > 0 && activeChatText) {
      nameplateCtx.fillStyle = 'rgba(24, 24, 27, 0.95)';
      nameplateCtx.strokeStyle = '#f59e0b';
      nameplateCtx.lineWidth = 4;
      nameplateCtx.beginPath();
      nameplateCtx.roundRect(16, 8, w - 32, 60, 16);
      nameplateCtx.fill();
      nameplateCtx.stroke();

      nameplateCtx.fillStyle = '#ffffff';
      nameplateCtx.font = 'bold 24px sans-serif';
      nameplateCtx.textAlign = 'center';
      nameplateCtx.textBaseline = 'middle';
      const truncated =
        activeChatText.length > 32 ? activeChatText.substring(0, 32) + '...' : activeChatText;
      nameplateCtx.fillText(`💬 "${truncated}"`, w / 2, 38);
    }

    // Driver Pill Badge
    const pillY = chatBubbleTimer > 0 && activeChatText ? 76 : 40;
    nameplateCtx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    nameplateCtx.strokeStyle = '#38bdf8';
    nameplateCtx.lineWidth = 3;
    nameplateCtx.beginPath();
    nameplateCtx.roundRect(40, pillY, w - 80, 52, 26);
    nameplateCtx.fill();
    nameplateCtx.stroke();

    // Driver Name & Speed
    nameplateCtx.fillStyle = '#facc15';
    nameplateCtx.font = 'bold 24px sans-serif';
    nameplateCtx.textAlign = 'center';
    nameplateCtx.textBaseline = 'middle';
    nameplateCtx.fillText(`🛺 ${name}`, w / 2 - 40, pillY + 26);

    // Speed readout
    nameplateCtx.fillStyle = '#38bdf8';
    nameplateCtx.font = 'bold 20px monospace';
    nameplateCtx.fillText(`${Math.round(speedKmh)} km/h`, w / 2 + 130, pillY + 26);

    nameplateTexture.needsUpdate = true;
  }

  private removeRemotePlayer(playerId: string) {
    const remote = this.remotePlayers.get(playerId);
    if (remote) {
      this.scene.remove(remote.mesh);
      remote.nameplateTexture.dispose();
      this.remotePlayers.delete(playerId);
    }
  }

  private removeAllRemotePlayers() {
    for (const remote of this.remotePlayers.values()) {
      this.scene.remove(remote.mesh);
      remote.nameplateTexture.dispose();
    }
    this.remotePlayers.clear();
  }

  public tick(dt: number, localPlayerX: number, localPlayerZ: number) {
    if (this.remotePlayers.size === 0) return;

    // Interpolation factor (smooth lerp damping)
    const lerpFactor = 1.0 - Math.exp(-14 * dt);

    for (const remote of this.remotePlayers.values()) {
      // 1. Smoothly interpolate position
      remote.mesh.position.x = THREE.MathUtils.lerp(remote.mesh.position.x, remote.targetX, lerpFactor);
      remote.mesh.position.y = THREE.MathUtils.lerp(remote.mesh.position.y, remote.targetY, lerpFactor);
      remote.mesh.position.z = THREE.MathUtils.lerp(remote.mesh.position.z, remote.targetZ, lerpFactor);

      // 2. Smoothly interpolate heading angle
      let diff = remote.targetHeading - remote.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      remote.mesh.rotation.y += diff * lerpFactor;

      // 3. Wheel spin animation based on remote speed
      const wheelSpin = (remote.speedKmh / 3.6) * dt * 2.8;
      if (remote.mesh.frontWheel) remote.mesh.frontWheel.rotation.x += wheelSpin;
      if (remote.mesh.rearLeftWheel) remote.mesh.rearLeftWheel.rotation.x += wheelSpin;
      if (remote.mesh.rearRightWheel) remote.mesh.rearRightWheel.rotation.x += wheelSpin;

      // 4. Update chat bubble timer
      if (remote.chatBubbleTimer > 0) {
        remote.chatBubbleTimer -= dt;
        if (remote.chatBubbleTimer <= 0) {
          remote.activeChatText = '';
          this.updateNameplateCanvas(remote);
        }
      }
    }
  }

  public getActiveRemotePlayers(): Array<{
    id: string;
    name: string;
    color: string;
    x: number;
    z: number;
    speedKmh: number;
    distanceAwayMeters: number;
  }> {
    const result = [];
    for (const r of this.remotePlayers.values()) {
      result.push({
        id: r.id,
        name: r.name,
        color: r.color,
        x: r.mesh.position.x,
        z: r.mesh.position.z,
        speedKmh: r.speedKmh,
        distanceAwayMeters: 0,
      });
    }
    return result;
  }

  private emitState() {
    if (this.onStateChange) {
      const playerList: NetworkPlayer[] = [];
      for (const r of this.remotePlayers.values()) {
        playerList.push({
          id: r.id,
          name: r.name,
          color: r.color,
          x: r.mesh.position.x,
          y: r.mesh.position.y,
          z: r.mesh.position.z,
          heading: r.mesh.rotation.y,
          speedKmh: r.speedKmh,
          isHonking: r.isHonking,
          isBoosting: r.isBoosting,
          ping: 25,
          lastUpdate: Date.now(),
        });
      }
      this.onStateChange({
        isConnected: this.isConnected,
        pingMs: this.pingMs,
        onlineCount: this.remotePlayers.size + 1,
        selfId: this.selfId,
        players: playerList,
        chatFeed: this.chatFeed,
      });
    }
  }

  public dispose() {
    this.isDisposed = true;
    this.stopPingLoop();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.removeAllRemotePlayers();
  }
}
