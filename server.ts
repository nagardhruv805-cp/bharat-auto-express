import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NetworkPlayer {
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

interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  time: string;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Connected players and sockets in memory
  const players = new Map<string, NetworkPlayer>();
  const sockets = new Map<string, WebSocket>();
  const recentChatMessages: ChatMessage[] = [];

  // 1. Health check & internet ping endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      server: 'Bharat Auto Express 5G Multiplayer',
      playersOnline: players.size,
    });
  });

  // Multiplayer stats endpoint
  app.get('/api/multiplayer/stats', (req, res) => {
    res.json({
      onlineCount: players.size,
      players: Array.from(players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        speedKmh: Math.round(p.speedKmh),
        distanceKm: Math.max(0, Math.round((p.z / 1000) * 10) / 10),
        ping: p.ping,
      })),
    });
  });

  // --- LEADERBOARD PERSISTENT STORE & API ---
  interface LeaderboardEntry {
    id: string;
    driverName: string;
    licenseNumber: string;
    city: string;
    earnings: number;
    distanceKm: number;
    topSpeedKmh: number;
    chaiCount: number;
    passengersServed: number;
    rating: number;
    liveryId: string;
    isGuest: boolean;
    avatarIcon: string;
    updatedAt: number;
  }

  const leaderboardEntries: LeaderboardEntry[] = [
    {
      id: 'legend_1',
      driverName: 'Ustaad Vikram Singh',
      licenseNumber: 'DL-01-2025-00482',
      city: 'Delhi NCR',
      earnings: 48250,
      distanceKm: 142.5,
      topSpeedKmh: 98,
      chaiCount: 52,
      passengersServed: 74,
      rating: 4.95,
      liveryId: 'classic_green_yellow',
      isGuest: false,
      avatarIcon: '👳🏽‍♂️',
      updatedAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'legend_2',
      driverName: 'Babu Kaali-Peeli',
      licenseNumber: 'MH-02-2025-09812',
      city: 'Mumbai Metro',
      earnings: 42100,
      distanceKm: 128.0,
      topSpeedKmh: 94,
      chaiCount: 45,
      passengersServed: 68,
      rating: 4.88,
      liveryId: 'mumbai_black_yellow',
      isGuest: false,
      avatarIcon: '🕶️',
      updatedAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'legend_3',
      driverName: 'Ramesh "Raftaar" Patil',
      licenseNumber: 'MH-12-2025-04190',
      city: 'Mumbai Metro',
      earnings: 38900,
      distanceKm: 115.4,
      topSpeedKmh: 96,
      chaiCount: 38,
      passengersServed: 59,
      rating: 4.82,
      liveryId: 'saffron_flame',
      isGuest: false,
      avatarIcon: '⚡',
      updatedAt: Date.now() - 3600000 * 8,
    },
    {
      id: 'legend_4',
      driverName: 'Pink City Bullet',
      licenseNumber: 'RJ-14-2025-07712',
      city: 'Jaipur Pink City',
      earnings: 34750,
      distanceKm: 102.0,
      topSpeedKmh: 92,
      chaiCount: 34,
      passengersServed: 51,
      rating: 4.79,
      liveryId: 'rajasthan_royal_blue',
      isGuest: false,
      avatarIcon: '👑',
      updatedAt: Date.now() - 3600000 * 12,
    },
    {
      id: 'legend_5',
      driverName: 'Namma Auto Guru',
      licenseNumber: 'KA-04-2025-03211',
      city: 'Bengaluru Tech Corridor',
      earnings: 31200,
      distanceKm: 95.8,
      topSpeedKmh: 91,
      chaiCount: 29,
      passengersServed: 46,
      rating: 4.75,
      liveryId: 'electric_violet',
      isGuest: false,
      avatarIcon: '💻',
      updatedAt: Date.now() - 3600000 * 18,
    },
    {
      id: 'legend_6',
      driverName: 'Coastal Konkan King',
      licenseNumber: 'GA-07-2025-01948',
      city: 'Goa Coastal Zone',
      earnings: 28400,
      distanceKm: 88.2,
      topSpeedKmh: 89,
      chaiCount: 27,
      passengersServed: 42,
      rating: 4.71,
      liveryId: 'goa_crimson',
      isGuest: false,
      avatarIcon: '🌴',
      updatedAt: Date.now() - 3600000 * 24,
    },
    {
      id: 'legend_7',
      driverName: 'Ahmedabad Express',
      licenseNumber: 'GJ-01-2025-05520',
      city: 'Ahmedabad Heritage',
      earnings: 26150,
      distanceKm: 81.6,
      topSpeedKmh: 87,
      chaiCount: 31,
      passengersServed: 39,
      rating: 4.68,
      liveryId: 'classic_green_yellow',
      isGuest: false,
      avatarIcon: '🪁',
      updatedAt: Date.now() - 3600000 * 30,
    },
    {
      id: 'legend_8',
      driverName: 'Kolkata Howrah Pilot',
      licenseNumber: 'WB-02-2025-08819',
      city: 'Kolkata City of Joy',
      earnings: 23800,
      distanceKm: 74.0,
      topSpeedKmh: 85,
      chaiCount: 24,
      passengersServed: 36,
      rating: 4.65,
      liveryId: 'classic_green_yellow',
      isGuest: false,
      avatarIcon: '🚖',
      updatedAt: Date.now() - 3600000 * 36,
    },
  ];

  // GET /api/leaderboard
  app.get('/api/leaderboard', (req, res) => {
    const category = String(req.query.category || 'earnings');
    const city = String(req.query.city || 'all');
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

    let filtered = [...leaderboardEntries];
    if (city !== 'all') {
      filtered = filtered.filter(
        (e) => e.city.toLowerCase() === city.toLowerCase() || e.licenseNumber.includes(city)
      );
    }

    filtered.sort((a, b) => {
      if (category === 'distance') return b.distanceKm - a.distanceKm;
      if (category === 'speed') return b.topSpeedKmh - a.topSpeedKmh;
      if (category === 'chai') return b.chaiCount - a.chaiCount;
      if (category === 'passengers') return b.passengersServed - a.passengersServed;
      // Default: earnings
      return b.earnings - a.earnings;
    });

    const entriesWithRank = filtered.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({
      category,
      city,
      totalDrivers: leaderboardEntries.length,
      entries: entriesWithRank,
      podium: entriesWithRank.slice(0, 3),
      updatedAt: Date.now(),
    });
  });

  // POST /api/leaderboard/submit
  app.post('/api/leaderboard/submit', (req, res) => {
    try {
      const {
        id,
        driverName,
        licenseNumber,
        city = 'Delhi NCR',
        earnings = 0,
        distanceKm = 0,
        topSpeedKmh = 0,
        chaiCount = 0,
        passengersServed = 0,
        rating = 4.8,
        liveryId = 'classic_green_yellow',
        isGuest = false,
        avatarIcon = '🛺',
      } = req.body;

      if (!driverName) {
        return res.status(400).json({ error: 'driverName is required' });
      }

      // Check if driver already exists by ID or licenseNumber
      const matchIdx = leaderboardEntries.findIndex(
        (e) => (id && e.id === id) || (licenseNumber && e.licenseNumber === licenseNumber)
      );

      const entryId = id || `driver_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const safeLicense =
        licenseNumber || (isGuest ? `GST-DL-${Math.floor(1000 + Math.random() * 9000)}` : `DL-2025-${Math.floor(1000 + Math.random() * 9000)}`);

      if (matchIdx !== -1) {
        // Update with highest achievements
        const existing = leaderboardEntries[matchIdx];
        existing.driverName = driverName;
        existing.city = city || existing.city;
        existing.earnings = Math.max(existing.earnings, Number(earnings) || 0);
        existing.distanceKm = Math.max(existing.distanceKm, Number(distanceKm) || 0);
        existing.topSpeedKmh = Math.max(existing.topSpeedKmh, Number(topSpeedKmh) || 0);
        existing.chaiCount = Math.max(existing.chaiCount, Number(chaiCount) || 0);
        existing.passengersServed = Math.max(existing.passengersServed, Number(passengersServed) || 0);
        existing.rating = Math.max(existing.rating, Number(rating) || existing.rating);
        existing.liveryId = liveryId || existing.liveryId;
        existing.avatarIcon = avatarIcon || existing.avatarIcon;
        existing.updatedAt = Date.now();
      } else {
        leaderboardEntries.push({
          id: entryId,
          driverName: driverName.trim(),
          licenseNumber: safeLicense,
          city,
          earnings: Math.max(0, Number(earnings) || 0),
          distanceKm: Math.max(0, Number(distanceKm) || 0),
          topSpeedKmh: Math.max(0, Number(topSpeedKmh) || 0),
          chaiCount: Math.max(0, Number(chaiCount) || 0),
          passengersServed: Math.max(0, Number(passengersServed) || 0),
          rating: Number(rating) || 4.8,
          liveryId: liveryId || 'classic_green_yellow',
          isGuest: Boolean(isGuest),
          avatarIcon: avatarIcon || (isGuest ? '🛺' : '⭐'),
          updatedAt: Date.now(),
        });
      }

      // Calculate rank in earnings
      const sorted = [...leaderboardEntries].sort((a, b) => b.earnings - a.earnings);
      const userRank = sorted.findIndex((e) => (id && e.id === id) || e.licenseNumber === safeLicense) + 1;

      res.json({
        success: true,
        rank: userRank > 0 ? userRank : sorted.length,
        totalDrivers: leaderboardEntries.length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server error';
      res.status(500).json({ error: msg });
    }
  });

  // 2. Gemini AI Assistant for In-Game Phone ("Rickshaw Sahayak 5G")
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt, persona = 'assistant' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          text: `[5G Rickshaw Sahayak]: "${prompt}" is a great query! Tip: When cruising on NH-48 or Grand Trunk Road, keep 30 PSI in front tire and take a cutting chai break every 50 km! (Connect GEMINI_API_KEY for live neural answers).`,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      let systemInstruction =
        'You are Rickshaw Sahayak 5G, a street-smart, helpful, witty Indian auto-rickshaw AI assistant built into the OPPO F27 5G phone in the game "Bharat Auto Express". Reply in 2-3 concise sentences with authentic Indian warmth, light vernacular phrases (like "Bhai", "Ji bilkul", "Bindass"), and practical driving/local wisdom.';

      if (persona === 'mechanic') {
        systemInstruction =
          'You are Ramesh Mistri, a master auto-rickshaw mechanic in Mumbai. Be witty, speak with authentic mechanic slang, and give fun, practical 2-stroke or 4-stroke rickshaw maintenance advice in 2-3 sentences.';
      } else if (persona === 'maa') {
        systemInstruction =
          'You are Maa, a caring, loving Indian mother calling your beta driving his auto rickshaw. Always ask if he had food, tell him to drive slowly, and give maternal blessings in 2-3 sentences.';
      } else if (persona === 'traffic_police') {
        systemInstruction =
          'You are Hawaldar Patil, a stern but humorous Mumbai & highway traffic police cop. Give highway safety advice, talk about challans and seatbelts/helmets with funny Mumbai police dialect in 2-3 sentences.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 220,
        },
      });

      res.json({ text: response.text || 'Network timeout on 5G tower. Try again, Bhai!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network hiccup';
      res.json({
        text: `5G Signal fluctuating near the highway tunnel! Error: ${msg}. Safe driving, Bhai! 🛺`,
      });
    }
  });

  // 3. Vite development middleware or static build production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // 4. HTTP and WebSocket Server Setup
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Broadcast helper
  const broadcast = (data: object, excludeId?: string) => {
    const message = JSON.stringify(data);
    for (const [id, ws] of sockets.entries()) {
      if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch {
          // Ignore socket write errors
        }
      }
    }
  };

  wss.on('connection', (ws: WebSocket) => {
    const playerId = `rickshaw_${Math.random().toString(36).substring(2, 9)}`;
    sockets.set(playerId, ws);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          const newPlayer: NetworkPlayer = {
            id: playerId,
            name: (msg.name || 'Ustaad Driver').trim().substring(0, 24),
            color: msg.color || 'classic_green_yellow',
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 0,
            heading: Number(msg.heading) || 0,
            speedKmh: Number(msg.speedKmh) || 0,
            isHonking: false,
            isBoosting: false,
            ping: 25,
            lastUpdate: Date.now(),
          };
          players.set(playerId, newPlayer);

          // Send welcome packet with current active players and recent chat
          ws.send(
            JSON.stringify({
              type: 'welcome',
              selfId: playerId,
              players: Array.from(players.values()),
              recentChats: recentChatMessages.slice(-8),
            })
          );

          // Broadcast to other players that a new rickshaw joined the highway
          broadcast(
            {
              type: 'player_joined',
              player: newPlayer,
            },
            playerId
          );
        } else if (msg.type === 'update') {
          const p = players.get(playerId);
          if (p) {
            p.x = Number(msg.x) || p.x;
            p.y = Number(msg.y) || p.y;
            p.z = Number(msg.z) || p.z;
            p.heading = Number(msg.heading) || p.heading;
            p.speedKmh = Number(msg.speedKmh) || p.speedKmh;
            p.isHonking = Boolean(msg.isHonking);
            p.isBoosting = Boolean(msg.isBoosting);
            p.lastUpdate = Date.now();
          }
        } else if (msg.type === 'honk') {
          broadcast(
            {
              type: 'player_honked',
              playerId,
              variant: msg.variant || 'bulb',
            },
            playerId
          );
        } else if (msg.type === 'chat') {
          const p = players.get(playerId);
          const text = String(msg.text || '').trim().substring(0, 120);
          if (text) {
            const chatMsg: ChatMessage = {
              id: Date.now().toString(),
              playerId,
              name: p ? p.name : 'Ustaad Driver',
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            recentChatMessages.push(chatMsg);
            if (recentChatMessages.length > 30) recentChatMessages.shift();

            broadcast({
              type: 'chat_message',
              message: chatMsg,
            });
            // Also echo back to sender
            ws.send(JSON.stringify({ type: 'chat_message', message: chatMsg }));
          }
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', clientTime: msg.clientTime }));
        }
      } catch {
        // Ignore malformed JSON packets
      }
    });

    ws.on('close', () => {
      players.delete(playerId);
      sockets.delete(playerId);
      broadcast({
        type: 'player_left',
        playerId,
      });
    });

    ws.on('error', () => {
      players.delete(playerId);
      sockets.delete(playerId);
    });
  });

  // 20Hz Server Authoritative State Broadcast (every 50ms)
  setInterval(() => {
    if (players.size > 0) {
      const now = Date.now();
      // Remove stale players inactive for > 15 seconds
      for (const [id, p] of players.entries()) {
        if (now - p.lastUpdate > 15000) {
          players.delete(id);
          const socket = sockets.get(id);
          if (socket) {
            try {
              socket.close();
            } catch {
              // Ignore
            }
            sockets.delete(id);
          }
          broadcast({ type: 'player_left', playerId: id });
        }
      }

      const playerList = Array.from(players.values());
      const statePacket = JSON.stringify({
        type: 'state_update',
        timestamp: now,
        players: playerList,
      });

      for (const ws of sockets.values()) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(statePacket);
          } catch {
            // Ignore socket send errors
          }
        }
      }
    }
  }, 50);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bharat Auto Express server with 5G WebSockets running on port ${PORT}`);
  });
}

startServer();
