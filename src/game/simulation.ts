import {
  DAY_DURATION_SECONDS,
  NIGHT_DURATION_SECONDS,
  type CollectibleState,
  type GameEvent,
  type GateState,
  type HazardState,
  type HouseState,
  type HudSnapshot,
  type InputIntent,
  type LevelDefinition,
  type SimState,
  type TileType,
  type TrapState,
} from './types';

export const TILE_SIZE = 2.8;
const PLAYER_RADIUS = 0.52;
const BASE_SPEED = 7.0;
const ICE_MAX_SPEED = 9.0;

const PRANK_LABELS = [
  'Hot Chili Cookie! Spicy spin! -20 HP',
  'Sneeze-Powder Cookie! ACHOO! -20 HP',
  'Confetti Cannon Cookie! POP! -20 HP',
  'Rubber-Icing Prank! BOING! -20 HP',
];

export function tileToWorld(
  row: number,
  col: number,
  rows: number,
  cols: number,
  tileSize = TILE_SIZE,
): { x: number; z: number } {
  return {
    x: (col - (cols - 1) / 2) * tileSize,
    z: (row - (rows - 1) / 2) * tileSize,
  };
}

export function worldToTile(
  x: number,
  z: number,
  rows: number,
  cols: number,
  tileSize = TILE_SIZE,
): { row: number; col: number } {
  return {
    col: Math.max(0, Math.min(cols - 1, Math.round(x / tileSize + (cols - 1) / 2))),
    row: Math.max(0, Math.min(rows - 1, Math.round(z / tileSize + (rows - 1) / 2))),
  };
}

export function createSimState(level: LevelDefinition): SimState {
  const rows = level.grid.length;
  const cols = level.grid[0]?.length ?? 0;
  const tiles: TileType[][] = [];
  const collectibles: CollectibleState[] = [];
  const houses: HouseState[] = [];
  const gates: GateState[] = [];
  const traps: TrapState[] = [];

  let spawnX = 0;
  let spawnZ = 0;
  let portalRow = 0;
  let portalCol = 0;
  let portalX = 0;
  let portalZ = 0;
  let fakeIdx = 0;
  let cookieCount = 0;
  let goldenCookieCount = 0;
  let starCount = 0;
  let hiddenPresentCount = 0;
  let trapIdx = 0;

  for (let r = 0; r < rows; r++) {
    const line = level.grid[r];
    const rowTiles: TileType[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = line[c] ?? '#';
      const pos = tileToWorld(r, c, rows, cols, TILE_SIZE);

      switch (ch) {
        case '#':
          rowTiles.push('wall');
          break;
        case '~':
          rowTiles.push('secret_wall');
          break;
        case 'I':
          rowTiles.push('ice');
          break;
        case 'T':
          rowTiles.push('trap');
          traps.push({
            id: `trap-${r}-${c}`,
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            phaseOffset: (trapIdx * 1.15) % 4.0,
            active: false,
          });
          trapIdx++;
          break;
        case 'G':
          rowTiles.push('locked_gate');
          gates.push({
            id: `gate-${r}-${c}`,
            kind: 'key_gate',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            unlocked: false,
            openProgress: 0,
          });
          break;
        case 'E':
          rowTiles.push('exit_gate');
          gates.push({
            id: `exit-gate-${r}-${c}`,
            kind: 'exit_gate',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            unlocked: false,
            openProgress: 0,
          });
          break;
        case 'O':
          rowTiles.push('portal');
          portalRow = r;
          portalCol = c;
          portalX = pos.x;
          portalZ = pos.z;
          break;
        case 'H':
          rowTiles.push('house');
          houses.push({
            id: `house-${r}-${c}`,
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            delivered: false,
          });
          break;
        case 'S':
          rowTiles.push('floor');
          spawnX = pos.x;
          spawnZ = pos.z;
          break;
        case 'P':
          rowTiles.push('floor');
          collectibles.push({
            id: `present-${r}-${c}`,
            kind: 'present',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        case 'h':
          rowTiles.push('floor');
          hiddenPresentCount++;
          collectibles.push({
            id: `hidden-present-${r}-${c}`,
            kind: 'hidden_present',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        case 'C':
          rowTiles.push('floor');
          cookieCount++;
          collectibles.push({
            id: `cookie-${r}-${c}`,
            kind: 'cookie',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        case 'F':
          rowTiles.push('floor');
          collectibles.push({
            id: `fake-cookie-${r}-${c}`,
            kind: 'fake_cookie',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
            hasClue: fakeIdx % 2 === 0,
            prankLabel: PRANK_LABELS[fakeIdx % PRANK_LABELS.length],
          });
          fakeIdx++;
          break;
        case 'K':
          rowTiles.push('floor');
          collectibles.push({
            id: `key-${r}-${c}`,
            kind: 'key',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        case '*':
          rowTiles.push('floor');
          starCount++;
          collectibles.push({
            id: `star-${r}-${c}`,
            kind: 'star',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        case 'X':
          rowTiles.push('floor');
          goldenCookieCount++;
          collectibles.push({
            id: `golden-cookie-${r}-${c}`,
            kind: 'golden_cookie',
            row: r,
            col: c,
            x: pos.x,
            z: pos.z,
            collected: false,
          });
          break;
        default:
          rowTiles.push('floor');
          break;
      }
    }
    tiles.push(rowTiles);
  }

  const hazards: HazardState[] = level.hazards.map((hb) => {
    const worldWaypoints = hb.waypoints.map((wp) =>
      tileToWorld(wp.row, wp.col, rows, cols, TILE_SIZE),
    );
    const start = worldWaypoints[0] ?? { x: 0, z: 0 };
    const next = worldWaypoints[1] ?? start;
    return {
      id: hb.id,
      kind: hb.kind,
      x: start.x,
      z: start.z,
      vx: 0,
      vz: 0,
      facing: Math.atan2(next.x - start.x, next.z - start.z),
      speed: hb.speed,
      detectRange: hb.detectRange,
      aiState: 'patrol',
      alertTimer: 0,
      waypoints: worldWaypoints,
      waypointTiles: hb.waypoints.map((wp) => ({ row: wp.row, col: wp.col })),
      targetWaypointIndex: worldWaypoints.length > 1 ? 1 : 0,
      direction: 1,
      windupTimer: 0,
      radius: hb.kind === 'snowball' ? 0.56 : 0.48,
      repathTimer: 0,
      nextStepTile: null,
    };
  });

  // Determine open starting direction so Santa faces a clear corridor
  const spawnTile = worldToTile(spawnX, spawnZ, rows, cols, TILE_SIZE);
  let initialFacing = 0;
  const dirs = [
    { dr: 0, dc: 1, angle: Math.PI / 2 },
    { dr: 1, dc: 0, angle: 0 },
    { dr: 0, dc: -1, angle: -Math.PI / 2 },
    { dr: -1, dc: 0, angle: Math.PI },
  ];
  for (const d of dirs) {
    const nr = spawnTile.row + d.dr;
    const nc = spawnTile.col + d.dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && tiles[nr][nc] !== 'wall') {
      initialFacing = d.angle;
      break;
    }
  }

  return {
    levelId: level.id,
    chapterId: level.chapterId,
    chapterNumber: level.chapterNumber,
    levelNumber: level.levelNumber,
    levelIndex: level.globalIndex,
    isFinale: Boolean(level.isFinale),
    rows,
    cols,
    tileSize: TILE_SIZE,
    tiles,
    player: {
      x: spawnX,
      z: spawnZ,
      vx: 0,
      vz: 0,
      facing: initialFacing,
      radius: PLAYER_RADIUS,
      distanceTraveled: 0,
      stunTimer: 0,
      invulnTimer: 0,
      spinTimer: 0,
      squashX: 1,
      squashY: 1,
      onIce: false,
      hp: 100,
      maxHp: 100,
      healTimer: 0,
      healAccumulator: 0,
      damageTakenTotal: 0,
    },
    dayNight: {
      phase: 'day',
      timeRemaining: DAY_DURATION_SECONDS,
      cycleElapsed: 0,
      nightFactor: 0,
    },
    portal: {
      row: portalRow,
      col: portalCol,
      x: portalX,
      z: portalZ,
      unlocked: false,
    },
    collectibles,
    houses,
    gates,
    traps,
    hazards,
    carriedPresents: 0,
    deliveredHouses: 0,
    totalHouses: houses.length,
    hiddenPresentsFound: 0,
    totalHiddenPresents: hiddenPresentCount,
    cookiesCollected: 0,
    cookiesRequired: cookieCount,
    goldenCookiesCollected: 0,
    goldenCookiesRequired: goldenCookieCount,
    fakeCookiesTriggered: 0,
    hasGoldenCookie: goldenCookieCount === 0,
    keysHeld: 0,
    starsCollected: 0,
    totalStars: starCount,
    score: 0,
    elapsedTime: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    completed: false,
    gameOver: false,
    statusBanner: level.isFinale
      ? 'Deliver all presents, collect cookies & claim the Golden Cookie!'
      : `Deliver ${houses.length} presents & collect ${cookieCount} cookies!`,
    statusBannerTimer: 4.5,
    statusBannerTone: 'gold',
  };
}

export function isTileBlocked(
  sim: SimState,
  row: number,
  col: number,
  forEnemy = false,
): boolean {
  if (row < 0 || row >= sim.rows || col < 0 || col >= sim.cols) return true;
  const tile = sim.tiles[row][col];
  if (tile === 'wall') return true;
  if (forEnemy && tile === 'secret_wall') return true;
  if (tile === 'locked_gate' || tile === 'exit_gate') {
    const gate = sim.gates.find((g) => g.row === row && g.col === col);
    return gate ? !gate.unlocked : true;
  }
  return false;
}

export function resolveGridCollisions(
  sim: SimState,
  x: number,
  z: number,
  radius: number,
  forEnemy = false,
): { x: number; z: number; hitGate: GateState | null } {
  let outX = x;
  let outZ = z;
  let hitGate: GateState | null = null;
  const half = sim.tileSize / 2;

  const centerTile = worldToTile(outX, outZ, sim.rows, sim.cols, sim.tileSize);

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = centerTile.row + dr;
      const c = centerTile.col + dc;
      if (!isTileBlocked(sim, r, c, forEnemy)) continue;

      const boxCenter = tileToWorld(r, c, sim.rows, sim.cols, sim.tileSize);
      const minX = boxCenter.x - half;
      const maxX = boxCenter.x + half;
      const minZ = boxCenter.z - half;
      const maxZ = boxCenter.z + half;

      const closestX = Math.max(minX, Math.min(outX, maxX));
      const closestZ = Math.max(minZ, Math.min(outZ, maxZ));

      const dx = outX - closestX;
      const dz = outZ - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (sim.tiles[r]?.[c] === 'locked_gate' || sim.tiles[r]?.[c] === 'exit_gate') {
          const gate = sim.gates.find((g) => g.row === r && g.col === c);
          if (gate && !gate.unlocked) {
            hitGate = gate;
          }
        }

        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          outX += (dx / dist) * overlap;
          outZ += (dz / dist) * overlap;
        } else {
          const penLeft = Math.abs(outX - minX);
          const penRight = Math.abs(maxX - outX);
          const penTop = Math.abs(outZ - minZ);
          const penBottom = Math.abs(maxZ - outZ);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) outX = minX - radius;
          else if (minPen === penRight) outX = maxX + radius;
          else if (minPen === penTop) outZ = minZ - radius;
          else outZ = maxZ + radius;
        }
      }
    }
  }

  return { x: outX, z: outZ, hitGate };
}

/**
 * Grid BFS shortest-path step from startTile toward goalTile, strictly respecting
 * walls, secret walls, and closed gates. Returns the next tile to step onto, or null
 * if no valid path exists.
 */
export function findNextPathTile(
  sim: SimState,
  startTile: { row: number; col: number },
  goalTile: { row: number; col: number },
  maxSearchNodes = 160,
): { row: number; col: number } | null {
  if (startTile.row === goalTile.row && startTile.col === goalTile.col) {
    return goalTile;
  }
  if (isTileBlocked(sim, goalTile.row, goalTile.col, true)) {
    return null;
  }

  const rows = sim.rows;
  const cols = sim.cols;
  const visited = new Uint8Array(rows * cols);
  const parent = new Int32Array(rows * cols).fill(-1);
  const startIdx = startTile.row * cols + startTile.col;
  const goalIdx = goalTile.row * cols + goalTile.col;

  const queue: number[] = [startIdx];
  visited[startIdx] = 1;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  let found = false;

  while (head < queue.length && head < maxSearchNodes) {
    const curr = queue[head++];
    if (curr === goalIdx) {
      found = true;
      break;
    }
    const cr = Math.floor(curr / cols);
    const cc = curr % cols;
    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = nr * cols + nc;
      if (visited[nIdx]) continue;
      if (isTileBlocked(sim, nr, nc, true)) continue;
      visited[nIdx] = 1;
      parent[nIdx] = curr;
      queue.push(nIdx);
    }
  }

  if (!found) return null;

  // Backtrack from goalIdx until parent[step] === startIdx
  let step = goalIdx;
  while (parent[step] !== -1 && parent[step] !== startIdx) {
    step = parent[step];
  }
  return {
    row: Math.floor(step / cols),
    col: step % cols,
  };
}

function applyPlayerDamage(
  sim: SimState,
  amount: number,
  events: GameEvent[],
  eventKind: 'hazard_hit' | 'fake_cookie' | 'trap_hit',
  x: number,
  z: number,
  message: string,
  scorePenalty: number,
  bypassInvuln = false,
): boolean {
  if (!bypassInvuln && sim.player.invulnTimer > 0) return false;

  sim.player.hp = Math.max(0, sim.player.hp - amount);
  sim.player.damageTakenTotal += amount;
  sim.player.invulnTimer = 1.3;
  sim.player.stunTimer = eventKind === 'fake_cookie' ? 0.42 : 0.25;
  sim.hitstopTimer = 0.045;
  sim.cameraTrauma = Math.min(1, sim.cameraTrauma + 0.6);

  const penalty = Math.min(scorePenalty, sim.score);
  sim.score -= penalty;
  sim.statusBanner = message;
  sim.statusBannerTimer = 2.8;
  sim.statusBannerTone = 'prank';

  events.push({
    kind: eventKind,
    x,
    z,
    message,
    pointsDelta: -penalty,
  });

  if (sim.player.hp <= 0) {
    sim.player.hp = 0;
    sim.gameOver = true;
    sim.statusBanner = 'Santa ran out of Christmas Energy!';
    sim.statusBannerTimer = 3.0;
    sim.statusBannerTone = 'prank';
    events.push({
      kind: 'game_over',
      x: sim.player.x,
      z: sim.player.z,
      message: 'Game Over!',
      pointsDelta: 0,
    });
  }
  return true;
}

function checkPortalUnlock(sim: SimState, events: GameEvent[]): void {
  if (sim.portal.unlocked) return;
  const cookiesDone = sim.cookiesCollected >= sim.cookiesRequired;
  const housesDone = sim.deliveredHouses >= sim.totalHouses;
  const goldenDone = sim.goldenCookiesCollected >= sim.goldenCookiesRequired;

  if (cookiesDone && housesDone && goldenDone) {
    sim.portal.unlocked = true;
    for (const gate of sim.gates) {
      if (gate.kind === 'exit_gate' && !gate.unlocked) {
        gate.unlocked = true;
        events.push({
          kind: 'exit_gate_open',
          x: gate.x,
          z: gate.z,
          message: 'Exit Gate Opened!',
          pointsDelta: 0,
        });
      }
    }

    const msg = sim.isFinale
      ? 'Final Exit Gate Open! Return to the North Pole Sleigh!'
      : 'Exit Gate Unlocked! Head to the glowing exit!';
    sim.statusBanner = msg;
    sim.statusBannerTimer = 4.2;
    sim.statusBannerTone = 'gold';
    events.push({
      kind: 'portal_unlock',
      x: sim.portal.x,
      z: sim.portal.z,
      message: msg,
      pointsDelta: 150,
    });
    sim.score += 150;
  }
}

export function stepSimulation(
  sim: SimState,
  rawDt: number,
  intent: InputIntent,
): GameEvent[] {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const events: GameEvent[] = [];

  if (sim.completed || sim.gameOver || dt <= 0) return events;

  // Real-time timers (trauma, hitstop, banner, squash recovery)
  if (sim.cameraTrauma > 0) {
    sim.cameraTrauma = Math.max(0, sim.cameraTrauma - dt * 1.8);
  }
  if (sim.statusBannerTimer > 0) {
    sim.statusBannerTimer = Math.max(0, sim.statusBannerTimer - dt);
  }
  sim.player.squashX += (1 - sim.player.squashX) * Math.min(1, dt * 12);
  sim.player.squashY += (1 - sim.player.squashY) * Math.min(1, dt * 12);

  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
    return events;
  }

  sim.elapsedTime += dt;

  // Day & Night Cycle (Exact 12s Day -> 2m (120s) Night -> Repeat)
  sim.dayNight.cycleElapsed += dt;
  sim.dayNight.timeRemaining -= dt;
  while (sim.dayNight.timeRemaining <= 0) {
    if (sim.dayNight.phase === 'day') {
      sim.dayNight.phase = 'night';
      sim.dayNight.timeRemaining += NIGHT_DURATION_SECONDS;
      events.push({
        kind: 'night_start',
        x: sim.player.x,
        z: sim.player.z,
        message: 'Nightfall! Watch your light ring!',
        pointsDelta: 0,
      });
      if (sim.statusBannerTimer <= 0.2) {
        sim.statusBanner = 'Night Mode (2:00) — Stay alert in the dark!';
        sim.statusBannerTimer = 2.6;
        sim.statusBannerTone = 'warn';
      }
    } else {
      sim.dayNight.phase = 'day';
      sim.dayNight.timeRemaining += DAY_DURATION_SECONDS;
      events.push({
        kind: 'day_start',
        x: sim.player.x,
        z: sim.player.z,
        message: 'Daylight returns!',
        pointsDelta: 0,
      });
      if (sim.statusBannerTimer <= 0.2) {
        sim.statusBanner = 'Day Mode (12s) — Full maze visibility!';
        sim.statusBannerTimer = 2.4;
        sim.statusBannerTone = 'good';
      }
    }
  }
  const targetNight = sim.dayNight.phase === 'night' ? 1 : 0;
  sim.dayNight.nightFactor += (targetNight - sim.dayNight.nightFactor) * Math.min(1, dt * 2.5);

  // Player cooldowns & healing over time (+2 HP/sec for 5s on real cookie)
  if (sim.player.invulnTimer > 0) {
    sim.player.invulnTimer = Math.max(0, sim.player.invulnTimer - dt);
  }
  if (sim.player.spinTimer > 0) {
    sim.player.spinTimer = Math.max(0, sim.player.spinTimer - dt);
  }
  if (sim.player.stunTimer > 0) {
    sim.player.stunTimer = Math.max(0, sim.player.stunTimer - dt);
  }

  if (sim.player.healTimer > 0) {
    const healDt = Math.min(dt, sim.player.healTimer);
    sim.player.healTimer = Math.max(0, sim.player.healTimer - healDt);
    sim.player.healAccumulator += healDt * 2.0; // +2 HP per second
    if (sim.player.healAccumulator >= 1) {
      const gained = Math.floor(sim.player.healAccumulator);
      sim.player.healAccumulator -= gained;
      if (sim.player.hp < sim.player.maxHp) {
        sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + gained);
        events.push({
          kind: 'heal_tick',
          x: sim.player.x,
          z: sim.player.z,
          message: `+${gained} HP`,
          pointsDelta: 0,
        });
      }
    }
    if (sim.player.healTimer <= 0) {
      sim.player.healAccumulator = 0;
    }
  }

  // Gate opening animation
  for (const gate of sim.gates) {
    if (gate.unlocked && gate.openProgress < 1) {
      gate.openProgress = Math.min(1, gate.openProgress + dt * 2.8);
    }
  }

  // Special Frost Traps update (4s cycle: 2.4s dormant/telegraph, 1.6s active spikes)
  for (const trap of sim.traps) {
    const phase = (sim.elapsedTime + trap.phaseOffset) % 4.0;
    trap.active = phase >= 2.4;
    if (trap.active) {
      const dist = Math.hypot(sim.player.x - trap.x, sim.player.z - trap.z);
      if (dist < 0.72) {
        applyPlayerDamage(
          sim,
          15,
          events,
          'trap_hit',
          trap.x,
          trap.z,
          'Frost Spike Trap! -15 HP',
          25,
          false,
        );
        if (sim.gameOver) return events;
      }
    }
  }

  // Player tile check (ice vs normal)
  const currentTilePos = worldToTile(
    sim.player.x,
    sim.player.z,
    sim.rows,
    sim.cols,
    sim.tileSize,
  );
  const currentTile = sim.tiles[currentTilePos.row]?.[currentTilePos.col] ?? 'floor';
  sim.player.onIce = currentTile === 'ice';

  // Movement physics
  let inputLen = Math.hypot(intent.moveX, intent.moveZ);
  let dirX = 0;
  let dirZ = 0;
  if (inputLen > 0.05 && sim.player.stunTimer <= 0) {
    dirX = intent.moveX / Math.max(1, inputLen);
    dirZ = intent.moveZ / Math.max(1, inputLen);
  } else {
    inputLen = 0;
  }

  const maxSpeed = sim.player.onIce ? ICE_MAX_SPEED : BASE_SPEED;
  const accel = sim.player.onIce ? 22 : 50;
  const damping = sim.player.onIce ? 1.8 : 14.0;

  if (inputLen > 0) {
    sim.player.vx += dirX * accel * dt;
    sim.player.vz += dirZ * accel * dt;
    const speed = Math.hypot(sim.player.vx, sim.player.vz);
    if (speed > maxSpeed) {
      sim.player.vx = (sim.player.vx / speed) * maxSpeed;
      sim.player.vz = (sim.player.vz / speed) * maxSpeed;
    }
    const targetFacing = Math.atan2(dirX, dirZ);
    let diff = targetFacing - sim.player.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    sim.player.facing += diff * Math.min(1, dt * 14);
  } else {
    const decay = Math.exp(-damping * dt);
    sim.player.vx *= decay;
    sim.player.vz *= decay;
    if (Math.hypot(sim.player.vx, sim.player.vz) < 0.04) {
      sim.player.vx = 0;
      sim.player.vz = 0;
    }
  }

  const prevX = sim.player.x;
  const prevZ = sim.player.z;

  const proposedX = sim.player.x + sim.player.vx * dt;
  const proposedZ = sim.player.z + sim.player.vz * dt;

  // Unlock key-gate automatically when Santa approaches with a key
  for (const gate of sim.gates) {
    if (gate.kind === 'key_gate' && !gate.unlocked && sim.keysHeld > 0) {
      const distToGate = Math.hypot(proposedX - gate.x, proposedZ - gate.z);
      if (distToGate < sim.tileSize * 0.92) {
        gate.unlocked = true;
        sim.keysHeld--;
        sim.score += 100;
        sim.statusBanner = 'Golden Key Unlocked the Gate! +100';
        sim.statusBannerTimer = 2.8;
        sim.statusBannerTone = 'gold';
        events.push({
          kind: 'gate_open',
          x: gate.x,
          z: gate.z,
          message: 'Locked Gate Opened!',
          pointsDelta: 100,
        });
      }
    }
  }

  const resolved = resolveGridCollisions(sim, proposedX, proposedZ, sim.player.radius, false);
  sim.player.x = resolved.x;
  sim.player.z = resolved.z;

  if (resolved.hitGate && sim.statusBannerTimer <= 0.1) {
    if (resolved.hitGate.kind === 'exit_gate') {
      const remCookies = Math.max(0, sim.cookiesRequired - sim.cookiesCollected);
      const remHouses = Math.max(0, sim.totalHouses - sim.deliveredHouses);
      const missing: string[] = [];
      if (remCookies > 0) missing.push(`${remCookies} cookie${remCookies > 1 ? 's' : ''}`);
      if (remHouses > 0) missing.push(`${remHouses} deliver${remHouses > 1 ? 'ies' : 'y'}`);
      if (sim.goldenCookiesCollected < sim.goldenCookiesRequired) {
        missing.push('Golden Cookie');
      }
      sim.statusBanner = `Exit Gate Locked! Need ${missing.join(' & ')}!`;
      sim.statusBannerTimer = 2.4;
      sim.statusBannerTone = 'warn';
    } else if (sim.keysHeld === 0) {
      sim.statusBanner = 'Gate Locked! Find a Golden Key!';
      sim.statusBannerTimer = 2.2;
      sim.statusBannerTone = 'warn';
      events.push({
        kind: 'need_key',
        x: resolved.hitGate.x,
        z: resolved.hitGate.z,
        message: 'Need a Key!',
        pointsDelta: 0,
      });
    }
  }

  const actualDx = sim.player.x - prevX;
  const actualDz = sim.player.z - prevZ;
  sim.player.distanceTraveled += Math.hypot(actualDx, actualDz);
  if (Math.abs(proposedX - resolved.x) > 0.002) sim.player.vx = 0;
  if (Math.abs(proposedZ - resolved.z) > 0.002) sim.player.vz = 0;

  // Collectibles pickup
  const pickupRadius = 1.02;
  for (const item of sim.collectibles) {
    if (item.collected) continue;
    const dist = Math.hypot(sim.player.x - item.x, sim.player.z - item.z);
    if (dist > pickupRadius) continue;

    item.collected = true;
    sim.player.squashX = 1.18;
    sim.player.squashY = 0.84;

    switch (item.kind) {
      case 'present': {
        sim.carriedPresents++;
        sim.score += 100;
        sim.statusBanner = 'Present Collected! Deliver it to a House!';
        sim.statusBannerTimer = 2.2;
        sim.statusBannerTone = 'good';
        events.push({
          kind: 'present',
          x: item.x,
          z: item.z,
          message: '+100 Present!',
          pointsDelta: 100,
        });
        break;
      }
      case 'hidden_present': {
        sim.hiddenPresentsFound++;
        sim.carriedPresents++;
        sim.score += 300;
        sim.statusBanner = 'Secret Room Present Found! +300';
        sim.statusBannerTimer = 2.8;
        sim.statusBannerTone = 'gold';
        events.push({
          kind: 'hidden_present',
          x: item.x,
          z: item.z,
          message: '+300 Secret Present!',
          pointsDelta: 300,
        });
        break;
      }
      case 'cookie': {
        sim.cookiesCollected++;
        sim.score += 120;
        // Real cookies heal +2 HP/sec for 5 seconds!
        sim.player.healTimer = 5.0;
        const left = Math.max(0, sim.cookiesRequired - sim.cookiesCollected);
        sim.statusBanner =
          left > 0
            ? `Real Cookie! Healing +2 HP/s (5s) · ${sim.cookiesCollected}/${sim.cookiesRequired}`
            : 'All Real Cookies Collected! Healing +2 HP/s (5s)!';
        sim.statusBannerTimer = 2.6;
        sim.statusBannerTone = 'good';
        events.push({
          kind: 'cookie',
          x: item.x,
          z: item.z,
          message: '+120 Cookie · Healing!',
          pointsDelta: 120,
        });
        checkPortalUnlock(sim, events);
        break;
      }
      case 'fake_cookie': {
        sim.fakeCookiesTriggered++;
        sim.player.spinTimer = 0.9;
        const pushAngle = Math.atan2(sim.player.z - item.z, sim.player.x - item.x);
        sim.player.vx = Math.cos(pushAngle) * 5.2;
        sim.player.vz = Math.sin(pushAngle) * 5.2;
        applyPlayerDamage(
          sim,
          20,
          events,
          'fake_cookie',
          item.x,
          item.z,
          item.prankLabel ?? 'Mischievous Fake Cookie Trap! -20 HP',
          25,
          true,
        );
        if (sim.gameOver) return events;
        break;
      }
      case 'key': {
        sim.keysHeld++;
        sim.score += 150;
        sim.statusBanner = 'Golden Key Collected! +150';
        sim.statusBannerTimer = 2.6;
        sim.statusBannerTone = 'gold';
        events.push({
          kind: 'key',
          x: item.x,
          z: item.z,
          message: '+150 Key!',
          pointsDelta: 150,
        });
        break;
      }
      case 'star': {
        sim.starsCollected++;
        sim.score += 250;
        sim.statusBanner = `Bonus Star Collected! (${sim.starsCollected}/${sim.totalStars}) +250`;
        sim.statusBannerTimer = 2.6;
        sim.statusBannerTone = 'gold';
        events.push({
          kind: 'star',
          x: item.x,
          z: item.z,
          message: '+250 Bonus Star!',
          pointsDelta: 250,
        });
        break;
      }
      case 'golden_cookie': {
        sim.goldenCookiesCollected++;
        sim.hasGoldenCookie = sim.goldenCookiesCollected >= sim.goldenCookiesRequired;
        sim.score += 500;
        sim.player.healTimer = 5.0;
        sim.cameraTrauma = Math.min(1, sim.cameraTrauma + 0.25);
        sim.statusBanner = 'GOLDEN CHRISTMAS COOKIE! +500 & Healing!';
        sim.statusBannerTimer = 3.5;
        sim.statusBannerTone = 'gold';
        events.push({
          kind: 'golden_cookie',
          x: item.x,
          z: item.z,
          message: '+500 Golden Cookie!',
          pointsDelta: 500,
        });
        checkPortalUnlock(sim, events);
        break;
      }
    }
  }

  // House deliveries
  const deliverRadius = 1.25;
  for (const house of sim.houses) {
    if (house.delivered) continue;
    const dist = Math.hypot(sim.player.x - house.x, sim.player.z - house.z);
    if (dist > deliverRadius) continue;

    if (sim.carriedPresents > 0) {
      sim.carriedPresents--;
      house.delivered = true;
      sim.deliveredHouses++;
      sim.score += 250;
      sim.player.squashX = 0.86;
      sim.player.squashY = 1.18;
      sim.statusBanner = `Present Delivered! (${sim.deliveredHouses}/${sim.totalHouses}) +250`;
      sim.statusBannerTimer = 2.8;
      sim.statusBannerTone = 'good';
      events.push({
        kind: 'deliver',
        x: house.x,
        z: house.z,
        message: 'Ho Ho Ho! Delivered!',
        pointsDelta: 250,
      });
      checkPortalUnlock(sim, events);
    } else if (sim.statusBannerTimer <= 0.1) {
      sim.statusBanner = 'Pick up a wrapped Present first to deliver here!';
      sim.statusBannerTimer = 2.0;
      sim.statusBannerTone = 'warn';
      events.push({
        kind: 'need_present',
        x: house.x,
        z: house.z,
        message: 'Need a Present!',
        pointsDelta: 0,
      });
    }
  }

  // Enemy AI & Wall-Respecting Navigation
  const playerTile = worldToTile(sim.player.x, sim.player.z, sim.rows, sim.cols, sim.tileSize);

  for (const h of sim.hazards) {
    if (h.alertTimer > 0) h.alertTimer = Math.max(0, h.alertTimer - dt);
    if (h.repathTimer > 0) h.repathTimer = Math.max(0, h.repathTimer - dt);

    const enemyTile = worldToTile(h.x, h.z, sim.rows, sim.cols, sim.tileSize);
    const distToPlayer = Math.hypot(sim.player.x - h.x, sim.player.z - h.z);

    if (h.kind === 'snowball') {
      // Rolling Snowball patrols strictly along valid corridor waypoints
      if (h.waypoints.length >= 2) {
        const target = h.waypoints[h.targetWaypointIndex];
        const dx = target.x - h.x;
        const dz = target.z - h.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.14) {
          if (h.targetWaypointIndex === h.waypoints.length - 1) h.direction = -1;
          else if (h.targetWaypointIndex === 0) h.direction = 1;
          h.targetWaypointIndex += h.direction;
        } else {
          const nx = dx / dist;
          const nz = dz / dist;
          const nextPos = resolveGridCollisions(
            sim,
            h.x + nx * h.speed * dt,
            h.z + nz * h.speed * dt,
            h.radius,
            true,
          );
          h.vx = (nextPos.x - h.x) / dt;
          h.vz = (nextPos.z - h.z) / dt;
          h.x = nextPos.x;
          h.z = nextPos.z;
          h.facing = Math.atan2(nx, nz);
        }
      }
    } else {
      // Smart Chaser / Patroller AI (Elves, Snowmen, Ice Creatures)
      const shouldDetect =
        h.aiState === 'chase'
          ? distToPlayer <= h.detectRange * 1.4
          : distToPlayer <= h.detectRange;

      let chaseStep: { row: number; col: number } | null = null;
      if (shouldDetect) {
        if (h.repathTimer <= 0 || !h.nextStepTile) {
          h.repathTimer = 0.22;
          h.nextStepTile = findNextPathTile(sim, enemyTile, playerTile);
        }
        chaseStep = h.nextStepTile;
      }

      if (chaseStep) {
        if (h.aiState !== 'chase') {
          h.aiState = 'chase';
          h.alertTimer = 1.2;
          events.push({
            kind: 'enemy_detect',
            x: h.x,
            z: h.z,
            message: `${h.kind === 'elf' ? 'Elf' : h.kind === 'ice_creature' ? 'Ice Creature' : 'Snowman'} spotted Santa!`,
            pointsDelta: 0,
          });
        }
        const targetPos =
          chaseStep.row === playerTile.row && chaseStep.col === playerTile.col
            ? { x: sim.player.x, z: sim.player.z }
            : tileToWorld(chaseStep.row, chaseStep.col, sim.rows, sim.cols, sim.tileSize);

        const dx = targetPos.x - h.x;
        const dz = targetPos.z - h.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.05) {
          const chaseMult = h.kind === 'ice_creature' ? 1.22 : h.kind === 'elf' ? 1.18 : 1.06;
          const speed = h.speed * chaseMult;
          const nx = dx / dist;
          const nz = dz / dist;
          const proposedEX = h.x + nx * speed * dt;
          const proposedEZ = h.z + nz * speed * dt;
          const resolvedE = resolveGridCollisions(sim, proposedEX, proposedEZ, h.radius, true);
          h.vx = (resolvedE.x - h.x) / dt;
          h.vz = (resolvedE.z - h.z) / dt;
          h.x = resolvedE.x;
          h.z = resolvedE.z;
          h.facing = Math.atan2(nx, nz);
        }
      } else {
        // Patrol or Return to patrol route strictly along valid maze tiles
        if (h.aiState === 'chase') {
          h.aiState = 'return';
          h.nextStepTile = null;
          h.repathTimer = 0;
        }

        if (h.waypointTiles.length >= 2) {
          const wpTile = h.waypointTiles[h.targetWaypointIndex];
          const wpWorld = h.waypoints[h.targetWaypointIndex];
          const distToWp = Math.hypot(wpWorld.x - h.x, wpWorld.z - h.z);

          if (h.windupTimer > 0) {
            h.windupTimer = Math.max(0, h.windupTimer - dt);
            h.vx = 0;
            h.vz = 0;
          } else if (distToWp < 0.16) {
            h.aiState = 'patrol';
            if (h.targetWaypointIndex === h.waypointTiles.length - 1) h.direction = -1;
            else if (h.targetWaypointIndex === 0) h.direction = 1;
            h.targetWaypointIndex += h.direction;
            h.windupTimer = h.kind === 'snowman' ? 0.3 : 0.15;
            h.nextStepTile = null;
          } else {
            if (h.repathTimer <= 0 || !h.nextStepTile) {
              h.repathTimer = 0.28;
              h.nextStepTile = findNextPathTile(sim, enemyTile, wpTile);
            }
            const stepPos =
              h.nextStepTile &&
              !(h.nextStepTile.row === wpTile.row && h.nextStepTile.col === wpTile.col)
                ? tileToWorld(
                    h.nextStepTile.row,
                    h.nextStepTile.col,
                    sim.rows,
                    sim.cols,
                    sim.tileSize,
                  )
                : wpWorld;

            const dx = stepPos.x - h.x;
            const dz = stepPos.z - h.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.04) {
              const nx = dx / d;
              const nz = dz / d;
              const resolvedE = resolveGridCollisions(
                sim,
                h.x + nx * h.speed * dt,
                h.z + nz * h.speed * dt,
                h.radius,
                true,
              );
              h.vx = (resolvedE.x - h.x) / dt;
              h.vz = (resolvedE.z - h.z) / dt;
              h.x = resolvedE.x;
              h.z = resolvedE.z;
              h.facing = Math.atan2(nx, nz);
            }
          }
        }
      }
    }

    // Check collision with Santa (-15 HP with cooldown)
    if (sim.player.invulnTimer <= 0) {
      const hitDist = Math.hypot(sim.player.x - h.x, sim.player.z - h.z);
      if (hitDist < sim.player.radius + h.radius) {
        const angle = Math.atan2(sim.player.z - h.z, sim.player.x - h.x);
        sim.player.vx = Math.cos(angle) * 6.2;
        sim.player.vz = Math.sin(angle) * 6.2;
        const hitLabel =
          h.kind === 'snowman'
            ? 'Bumped a Naughty Snowman! -15 HP'
            : h.kind === 'elf'
              ? 'Tagged by a Mischievous Elf! -15 HP'
              : h.kind === 'ice_creature'
                ? 'Chilled by an Ice Creature! -15 HP'
                : 'Rolled by a Giant Snowball! -15 HP';
        applyPlayerDamage(
          sim,
          15,
          events,
          'hazard_hit',
          sim.player.x,
          sim.player.z,
          hitLabel,
          50,
          false,
        );
        if (sim.gameOver) return events;
      }
    }
  }

  // Portal / Exit check
  const portalDist = Math.hypot(sim.player.x - sim.portal.x, sim.player.z - sim.portal.z);
  if (portalDist < 1.05 && sim.portal.unlocked) {
    sim.completed = true;
    sim.score += 500;
    events.push({
      kind: 'level_complete',
      x: sim.portal.x,
      z: sim.portal.z,
      message: 'Level Complete!',
      pointsDelta: 500,
    });
  }

  return events;
}

export function computeStars(sim: SimState, parTimeSeconds: number): number {
  let stars = 1;
  if (sim.elapsedTime <= parTimeSeconds * 1.45 || sim.starsCollected >= 1) {
    stars = 2;
  }
  if (
    sim.elapsedTime <= parTimeSeconds &&
    sim.starsCollected >= Math.min(2, sim.totalStars) &&
    sim.fakeCookiesTriggered <= 1 &&
    sim.player.hp >= 50
  ) {
    stars = 3;
  }
  return stars;
}

export function getHudSnapshot(sim: SimState, level: LevelDefinition): HudSnapshot {
  return {
    levelId: sim.levelId,
    chapterId: sim.chapterId,
    chapterNumber: sim.chapterNumber,
    levelNumber: sim.levelNumber,
    levelIndex: sim.levelIndex,
    levelName: level.name,
    subtitle: level.subtitle,
    isFinale: sim.isFinale,
    score: Math.round(sim.score),
    elapsedTime: sim.elapsedTime,
    hp: Math.round(sim.player.hp),
    maxHp: sim.player.maxHp,
    isHealing: sim.player.healTimer > 0,
    healSecondsLeft: Math.ceil(sim.player.healTimer),
    dayNightPhase: sim.dayNight.phase,
    dayNightRemaining: Math.max(0, Math.ceil(sim.dayNight.timeRemaining)),
    cookiesCollected: sim.cookiesCollected,
    cookiesRequired: sim.cookiesRequired,
    goldenCookiesCollected: sim.goldenCookiesCollected,
    goldenCookiesRequired: sim.goldenCookiesRequired,
    hasGoldenCookie: sim.hasGoldenCookie,
    carriedPresents: sim.carriedPresents,
    deliveredHouses: sim.deliveredHouses,
    totalHouses: sim.totalHouses,
    keysHeld: sim.keysHeld,
    starsCollected: sim.starsCollected,
    totalStars: sim.totalStars,
    portalUnlocked: sim.portal.unlocked,
    statusBanner: sim.statusBannerTimer > 0 ? sim.statusBanner : '',
    statusBannerTone: sim.statusBannerTone,
  };
}

/**
 * Verifies with iterative key-aware BFS that every level's required
 * presents, houses, cookies, golden cookies, and exit portal (guarded by exit gate E)
 * are reachable from spawn.
 */
export function verifyLevelSolvability(level: LevelDefinition): {
  solvable: boolean;
  reason?: string;
  stats: {
    presents: number;
    houses: number;
    cookies: number;
    keys: number;
    gates: number;
    exitGates: number;
    stars: number;
  };
} {
  const rows = level.grid.length;
  const cols = level.grid[0]?.length ?? 0;
  let spawn: { r: number; c: number } | null = null;
  let portal: { r: number; c: number } | null = null;
  const golden: Array<{ r: number; c: number }> = [];

  const presents: Array<{ r: number; c: number }> = [];
  const houses: Array<{ r: number; c: number }> = [];
  const cookies: Array<{ r: number; c: number }> = [];
  const keys: Array<{ r: number; c: number }> = [];
  const gates: Array<{ r: number; c: number }> = [];
  const exitGates: Array<{ r: number; c: number }> = [];
  const stars: Array<{ r: number; c: number }> = [];

  for (let r = 0; r < rows; r++) {
    if (level.grid[r].length !== cols) {
      return {
        solvable: false,
        reason: `Row ${r} has inconsistent length`,
        stats: {
          presents: 0,
          houses: 0,
          cookies: 0,
          keys: 0,
          gates: 0,
          exitGates: 0,
          stars: 0,
        },
      };
    }
    for (let c = 0; c < cols; c++) {
      const ch = level.grid[r][c];
      if (ch === 'S') spawn = { r, c };
      else if (ch === 'O') portal = { r, c };
      else if (ch === 'X') golden.push({ r, c });
      else if (ch === 'P' || ch === 'h') presents.push({ r, c });
      else if (ch === 'H') houses.push({ r, c });
      else if (ch === 'C') cookies.push({ r, c });
      else if (ch === 'K') keys.push({ r, c });
      else if (ch === 'G') gates.push({ r, c });
      else if (ch === 'E') exitGates.push({ r, c });
      else if (ch === '*') stars.push({ r, c });
    }
  }

  const stats = {
    presents: presents.length,
    houses: houses.length,
    cookies: cookies.length,
    keys: keys.length,
    gates: gates.length,
    exitGates: exitGates.length,
    stars: stars.length,
  };

  if (!spawn) return { solvable: false, reason: 'Missing spawn S', stats };
  if (!portal) return { solvable: false, reason: 'Missing portal O', stats };
  if (presents.length < houses.length) {
    return { solvable: false, reason: 'Fewer presents than houses', stats };
  }
  if (keys.length < gates.length) {
    return { solvable: false, reason: 'Fewer keys than locked gates', stats };
  }
  if (level.isFinale && golden.length === 0) {
    return { solvable: false, reason: 'Finale missing Golden Cookie X', stats };
  }

  // Phase 1: Iterative BFS unlocking key-locked gates G while keeping Exit Gate E sealed
  const unlockedGates = new Set<string>();
  const collectedKeys = new Set<string>();
  let visited = new Set<string>();

  let progress = true;
  while (progress) {
    progress = false;
    visited = new Set<string>();
    const queue: Array<{ r: number; c: number }> = [spawn];
    visited.add(`${spawn.r},${spawn.c}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const deltas = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dr, dc] of deltas) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const coord = `${nr},${nc}`;
        if (visited.has(coord)) continue;

        const ch = level.grid[nr][nc];
        if (ch === '#' || ch === 'E') continue;
        if (ch === 'G' && !unlockedGates.has(coord)) {
          if (collectedKeys.size > unlockedGates.size) {
            unlockedGates.add(coord);
            progress = true;
          } else {
            continue;
          }
        }
        visited.add(coord);
        if (ch === 'K' && !collectedKeys.has(coord)) {
          collectedKeys.add(coord);
          progress = true;
        }
        queue.push({ r: nr, c: nc });
      }
    }
  }

  // Verify Exit Gate E actually blocked Portal O before objectives are done!
  if (exitGates.length > 0 && visited.has(`${portal.r},${portal.c}`)) {
    return { solvable: false, reason: 'Portal is reachable without unlocking Exit Gate E', stats };
  }

  for (const h of houses) {
    if (!visited.has(`${h.r},${h.c}`)) {
      return { solvable: false, reason: `House at (${h.r},${h.c}) unreachable`, stats };
    }
  }
  for (const c of cookies) {
    if (!visited.has(`${c.r},${c.c}`)) {
      return { solvable: false, reason: `Cookie at (${c.r},${c.c}) unreachable`, stats };
    }
  }
  const reachablePresents = presents.filter((p) => visited.has(`${p.r},${p.c}`)).length;
  if (reachablePresents < houses.length) {
    return { solvable: false, reason: 'Not enough reachable presents for houses', stats };
  }
  for (const g of golden) {
    if (!visited.has(`${g.r},${g.c}`)) {
      return { solvable: false, reason: 'Golden Cookie unreachable', stats };
    }
  }

  // Phase 2: Once objectives are done, Exit Gate E opens -> verify Portal O is reachable!
  const openQueue: Array<{ r: number; c: number }> = [];
  for (const eg of exitGates) {
    // Check if at least one neighbor of E was visited in Phase 1
    const adj = [
      { r: eg.r + 1, c: eg.c },
      { r: eg.r - 1, c: eg.c },
      { r: eg.r, c: eg.c + 1 },
      { r: eg.r, c: eg.c - 1 },
    ];
    if (adj.some((a) => visited.has(`${a.r},${a.c}`))) {
      const coord = `${eg.r},${eg.c}`;
      visited.add(coord);
      openQueue.push(eg);
    }
  }
  while (openQueue.length > 0) {
    const curr = openQueue.shift()!;
    const deltas = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const coord = `${nr},${nc}`;
      if (visited.has(coord)) continue;
      const ch = level.grid[nr][nc];
      if (ch === '#') continue;
      if (ch === 'G' && !unlockedGates.has(coord)) continue;
      visited.add(coord);
      openQueue.push({ r: nr, c: nc });
    }
  }

  if (!visited.has(`${portal.r},${portal.c}`)) {
    return { solvable: false, reason: 'Portal unreachable even after Exit Gate unlocks', stats };
  }

  return { solvable: true, stats };
}
