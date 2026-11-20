import type {
  ChapterDefinition,
  HazardBlueprint,
  HazardKind,
  LevelDefinition,
} from './types';

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    // Mulberry32
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, maxInclusive: number): number {
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

interface Coord {
  r: number;
  c: number;
}

function bfsDistances(
  grid: string[][],
  start: Coord,
  blockedChars: Set<string>,
): Map<string, number> {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist = new Map<string, number>();
  const queue: Coord[] = [start];
  dist.set(`${start.r},${start.c}`, 0);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const d = dist.get(`${curr.r},${curr.c}`)!;
    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (blockedChars.has(grid[nr][nc])) continue;
      const key = `${nr},${nc}`;
      if (dist.has(key)) continue;
      dist.set(key, d + 1);
      queue.push({ r: nr, c: nc });
    }
  }
  return dist;
}

function getDimensions(chapterNum: number, levelNum: number): { rows: number; cols: number } {
  // Odd dimensions for crisp 2-step maze walls & corridors
  if (chapterNum === 1) {
    if (levelNum <= 4) return { rows: 13, cols: 13 };
    if (levelNum <= 8) return { rows: 13, cols: 15 };
    return { rows: 15, cols: 15 };
  }
  if (chapterNum <= 4) {
    if (levelNum <= 5) return { rows: 15, cols: 15 };
    return { rows: 15, cols: 17 };
  }
  if (chapterNum <= 10) {
    if (levelNum <= 4) return { rows: 15, cols: 17 };
    if (levelNum <= 8) return { rows: 17, cols: 17 };
    return { rows: 17, cols: 19 };
  }
  if (chapterNum <= 16) {
    if (levelNum <= 5) return { rows: 17, cols: 19 };
    return { rows: 19, cols: 19 };
  }
  if (levelNum <= 6) return { rows: 19, cols: 19 };
  return { rows: 19, cols: 21 };
}

function pickExitCorner(
  rows: number,
  cols: number,
  variant: number,
): {
  spawn: Coord;
  portal: Coord;
  exitGate: Coord;
  gateAdjacentFloor: Coord;
  reservedWalls: Coord[];
} {
  // 4 distinct exit gate & spawn configurations so gate locations vary across levels!
  const mode = variant % 4;
  if (mode === 0) {
    // Spawn top-left (1,1), Exit alcove bottom-right
    return {
      spawn: { r: 1, c: 1 },
      portal: { r: rows - 2, c: cols - 2 },
      exitGate: { r: rows - 2, c: cols - 3 },
      gateAdjacentFloor: { r: rows - 2, c: cols - 4 },
      reservedWalls: [
        { r: rows - 3, c: cols - 2 },
        { r: rows - 3, c: cols - 3 },
      ],
    };
  }
  if (mode === 1) {
    // Spawn bottom-left, Exit alcove top-right
    return {
      spawn: { r: rows - 2, c: 1 },
      portal: { r: 1, c: cols - 2 },
      exitGate: { r: 2, c: cols - 2 },
      gateAdjacentFloor: { r: 3, c: cols - 2 },
      reservedWalls: [
        { r: 1, c: cols - 3 },
        { r: 2, c: cols - 3 },
      ],
    };
  }
  if (mode === 2) {
    // Spawn top-right, Exit alcove bottom-left
    return {
      spawn: { r: 1, c: cols - 2 },
      portal: { r: rows - 2, c: 1 },
      exitGate: { r: rows - 2, c: 2 },
      gateAdjacentFloor: { r: rows - 2, c: 3 },
      reservedWalls: [
        { r: rows - 3, c: 1 },
        { r: rows - 3, c: 2 },
      ],
    };
  }
  // mode === 3: Spawn mid-left, Exit alcove mid-right
  const midR = Math.floor(rows / 2) % 2 === 1 ? Math.floor(rows / 2) : Math.floor(rows / 2) - 1;
  return {
    spawn: { r: midR, c: 1 },
    portal: { r: midR, c: cols - 2 },
    exitGate: { r: midR, c: cols - 3 },
    gateAdjacentFloor: { r: midR, c: cols - 4 },
    reservedWalls: [
      { r: midR - 1, c: cols - 2 },
      { r: midR + 1, c: cols - 2 },
      { r: midR - 1, c: cols - 3 },
      { r: midR + 1, c: cols - 3 },
    ],
  };
}

export function generateLevel(
  chapter: ChapterDefinition,
  levelNumber: number, // 1..10
  globalIndex: number, // 0..199
  usedLayouts: Set<string>,
): LevelDefinition {
  const chapterNum = chapter.chapterNumber;
  const { rows, cols } = getDimensions(chapterNum, levelNumber);

  // Try deterministic seed + salt if duplicate or invalid
  for (let attempt = 0; attempt < 25; attempt++) {
    const seed =
      (chapterNum * 9973 + levelNumber * 1307 + globalIndex * 313 + attempt * 7919) >>> 0;
    const rng = new SeededRng(seed);

    const grid: string[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => '#'),
    );

    const cornerVariant = (globalIndex + attempt) % 4;
    const layout = pickExitCorner(rows, cols, cornerVariant);

    const isReservedCell = (r: number, c: number): boolean => {
      if (r === layout.portal.r && c === layout.portal.c) return true;
      if (r === layout.exitGate.r && c === layout.exitGate.c) return true;
      return layout.reservedWalls.some((w) => w.r === r && w.c === c);
    };

    // 1. Recursive backtracker maze carving on odd cells
    const visited = new Set<string>();
    const stack: Coord[] = [layout.spawn];
    visited.add(`${layout.spawn.r},${layout.spawn.c}`);
    grid[layout.spawn.r][layout.spawn.c] = '.';

    const stepDirs = [
      { dr: -2, dc: 0 },
      { dr: 2, dc: 0 },
      { dr: 0, dc: -2 },
      { dr: 0, dc: 2 },
    ];

    // Bias directions based on level archetype for distinct maze feel
    const archetype = (levelNumber + chapterNum) % 4;

    while (stack.length > 0) {
      const curr = stack[stack.length - 1];
      const candidates: Array<{ nr: number; nc: number; mr: number; mc: number }> = [];

      for (const d of stepDirs) {
        const nr = curr.r + d.dr;
        const nc = curr.c + d.dc;
        const mr = curr.r + d.dr / 2;
        const mc = curr.c + d.dc / 2;
        if (nr <= 0 || nr >= rows - 1 || nc <= 0 || nc >= cols - 1) continue;
        if (isReservedCell(nr, nc) || isReservedCell(mr, mc)) continue;
        if (visited.has(`${nr},${nc}`)) continue;
        candidates.push({ nr, nc, mr, mc });
      }

      if (candidates.length === 0) {
        stack.pop();
        continue;
      }

      // Archetype 1 favors horizontal corridors; Archetype 2 favors vertical; others random
      let chosen = candidates[Math.floor(rng.next() * candidates.length)];
      if (archetype === 1 && candidates.length > 1 && rng.next() < 0.65) {
        const horiz = candidates.filter((x) => x.nr === curr.r);
        if (horiz.length > 0) chosen = rng.pick(horiz);
      } else if (archetype === 2 && candidates.length > 1 && rng.next() < 0.65) {
        const vert = candidates.filter((x) => x.nc === curr.c);
        if (vert.length > 0) chosen = rng.pick(vert);
      }

      grid[chosen.mr][chosen.mc] = '.';
      grid[chosen.nr][chosen.nc] = '.';
      visited.add(`${chosen.nr},${chosen.nc}`);
      stack.push({ r: chosen.nr, c: chosen.nc });
    }

    // Ensure gateAdjacentFloor is carved and connected to the maze
    grid[layout.gateAdjacentFloor.r][layout.gateAdjacentFloor.c] = '.';
    const adjNeighbors = [
      { r: layout.gateAdjacentFloor.r - 1, c: layout.gateAdjacentFloor.c },
      { r: layout.gateAdjacentFloor.r + 1, c: layout.gateAdjacentFloor.c },
      { r: layout.gateAdjacentFloor.r, c: layout.gateAdjacentFloor.c - 1 },
      { r: layout.gateAdjacentFloor.r, c: layout.gateAdjacentFloor.c + 1 },
    ].filter(
      (p) =>
        p.r > 0 &&
        p.r < rows - 1 &&
        p.c > 0 &&
        p.c < cols - 1 &&
        !isReservedCell(p.r, p.c),
    );
    if (adjNeighbors.length > 0 && !adjNeighbors.some((p) => grid[p.r][p.c] === '.')) {
      const openOne = adjNeighbors[0];
      grid[openOne.r][openOne.c] = '.';
    }

    // 2. Carve Open Plaza / Rooms based on archetype (1-2 rooms)
    const roomCount = archetype === 0 ? 1 : archetype === 3 ? 2 : 1;
    for (let rm = 0; rm < roomCount; rm++) {
      const rr = rng.int(2, rows - 5);
      const rc = rng.int(2, cols - 5);
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const tr = rr + dr;
          const tc = rc + dc;
          if (!isReservedCell(tr, tc) && !(tr === layout.spawn.r && tc === layout.spawn.c)) {
            grid[tr][tc] = '.';
          }
        }
      }
    }

    // 3. Carve extra braided loops (multiple pathways!)
    const braidCount = Math.floor((rows * cols) / 26) + (archetype === 2 ? 4 : 2);
    for (let b = 0; b < braidCount; b++) {
      const r = rng.int(1, rows - 2);
      const c = rng.int(1, cols - 2);
      if (grid[r][c] !== '#' || isReservedCell(r, c)) continue;
      const horizOpen = grid[r][c - 1] === '.' && grid[r][c + 1] === '.';
      const vertOpen = grid[r - 1][c] === '.' && grid[r + 1][c] === '.';
      if ((horizOpen && grid[r - 1][c] === '#' && grid[r + 1][c] === '#') ||
          (vertOpen && grid[r][c - 1] === '#' && grid[r][c + 1] === '#')) {
        grid[r][c] = '.';
      }
    }

    // 4. Carve a Secret Room connected by a Secret Wall (~) when possible
    let secretPresentPos: Coord | null = null;
    for (let trySec = 0; trySec < 25; trySec++) {
      const sr = rng.int(2, rows - 3);
      const sc = rng.int(2, cols - 3);
      if (grid[sr][sc] !== '#' || isReservedCell(sr, sc)) continue;
      // Check if surrounded by 3 walls and 1 wall-to-floor bridge
      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];
      for (const d of dirs) {
        const wr = sr + d.dr;
        const wc = sc + d.dc;
        const fr = sr + d.dr * 2;
        const fc = sc + d.dc * 2;
        if (
          fr > 0 &&
          fr < rows - 1 &&
          fc > 0 &&
          fc < cols - 1 &&
          !isReservedCell(wr, wc) &&
          grid[wr][wc] === '#' &&
          grid[fr][fc] === '.'
        ) {
          // Ensure sr,sc isn't already adjacent to another open tile
          const adjFloor = dirs.filter((x) => grid[sr + x.dr][sc + x.dc] === '.').length;
          if (adjFloor === 0) {
            grid[wr][wc] = '~';
            grid[sr][sc] = '.';
            secretPresentPos = { r: sr, c: sc };
            break;
          }
        }
      }
      if (secretPresentPos) break;
    }

    // Ensure Exit chamber walls & gate are intact
    for (const rw of layout.reservedWalls) {
      grid[rw.r][rw.c] = '#';
    }
    grid[layout.portal.r][layout.portal.c] = 'O';
    grid[layout.exitGate.r][layout.exitGate.c] = 'E';
    grid[layout.spawn.r][layout.spawn.c] = 'S';

    // Verify spawn can reach gateAdjacentFloor cleanly
    const blockedWalls = new Set(['#', 'E', 'O']);
    const distFromSpawn = bfsDistances(grid, layout.spawn, blockedWalls);
    if (!distFromSpawn.has(`${layout.gateAdjacentFloor.r},${layout.gateAdjacentFloor.c}`)) {
      continue;
    }

    // Collect reachable floor cells sorted by distance from spawn
    const floorCells: Array<Coord & { dist: number }> = [];
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] !== '.') continue;
        if (secretPresentPos && r === secretPresentPos.r && c === secretPresentPos.c) continue;
        const d = distFromSpawn.get(`${r},${c}`);
        if (d !== undefined && d >= 2) {
          floorCells.push({ r, c, dist: d });
        }
      }
    }

    if (floorCells.length < 18) continue;

    // Open a clean second tile next to spawn so Santa always spawns on an open area
    const spawnAdj = [
      { r: layout.spawn.r, c: layout.spawn.c + 1 },
      { r: layout.spawn.r + 1, c: layout.spawn.c },
      { r: layout.spawn.r, c: layout.spawn.c - 1 },
      { r: layout.spawn.r - 1, c: layout.spawn.c },
    ].filter((p) => p.r > 0 && p.r < rows - 1 && p.c > 0 && p.c < cols - 1 && !isReservedCell(p.r, p.c));
    if (spawnAdj.length > 0 && grid[spawnAdj[0].r][spawnAdj[0].c] === '#') {
      grid[spawnAdj[0].r][spawnAdj[0].c] = '.';
    }

    // 5. Place Key-Locked Gate (G) on a choke corridor if available, or lock a sub-alcove
    let gateCount = 0;
    const maxGates = chapterNum >= 6 ? 2 : 1;
    const placedGates: Coord[] = [];
    for (const cell of rng.shuffle([...floorCells])) {
      if (gateCount >= maxGates) break;
      if (cell.dist < 4) continue;
      if (Math.abs(cell.r - layout.gateAdjacentFloor.r) + Math.abs(cell.c - layout.gateAdjacentFloor.c) <= 1) {
        continue;
      }
      const horizChoke =
        grid[cell.r - 1][cell.c] === '#' &&
        grid[cell.r + 1][cell.c] === '#' &&
        grid[cell.r][cell.c - 1] === '.' &&
        grid[cell.r][cell.c + 1] === '.';
      const vertChoke =
        grid[cell.r][cell.c - 1] === '#' &&
        grid[cell.r][cell.c + 1] === '#' &&
        grid[cell.r - 1][cell.c] === '.' &&
        grid[cell.r + 1][cell.c] === '.';
      if (!horizChoke && !vertChoke) continue;

      // Test placing G here: ensure exit gate is still reachable OR key is placed on spawn side
      grid[cell.r][cell.c] = 'G';
      const blockedWithGate = new Set(['#', 'E', 'O', 'G']);
      const withoutKeyReach = bfsDistances(grid, layout.spawn, blockedWithGate);
      if (withoutKeyReach.size >= 10) {
        placedGates.push({ r: cell.r, c: cell.c });
        gateCount++;
      } else {
        grid[cell.r][cell.c] = '.';
      }
    }

    // Recompute reachable without keys so we place Keys safely on the reachable side!
    const blockedWithGates = new Set(['#', 'E', 'O', 'G']);
    const spawnSideDist = bfsDistances(grid, layout.spawn, blockedWithGates);
    const spawnSideCells = floorCells.filter((fc) =>
      spawnSideDist.has(`${fc.r},${fc.c}`),
    );
    if (spawnSideCells.length < 12) continue;

    // Track occupied cells so nothing overlaps
    const occupied = new Set<string>();
    occupied.add(`${layout.spawn.r},${layout.spawn.c}`);
    occupied.add(`${layout.portal.r},${layout.portal.c}`);
    occupied.add(`${layout.exitGate.r},${layout.exitGate.c}`);
    occupied.add(`${layout.gateAdjacentFloor.r},${layout.gateAdjacentFloor.c}`);

    const takeCell = (pool: Array<Coord & { dist: number }>, minDist = 2): Coord | null => {
      const candidates = pool.filter(
        (p) => p.dist >= minDist && !occupied.has(`${p.r},${p.c}`),
      );
      if (candidates.length === 0) return null;
      const picked = rng.pick(candidates);
      occupied.add(`${picked.r},${picked.c}`);
      return { r: picked.r, c: picked.c };
    };

    // Place Keys for every placed gate (strictly on spawnSideCells!)
    const spawnSideSorted = [...spawnSideCells].sort((a, b) => a.dist - b.dist);
    for (let g = 0; g < placedGates.length; g++) {
      // If multiple gates, progressively verify reachability; simplest & 100% guaranteed:
      // place all required keys in spawnSideCells!
      const keyCell = takeCell(spawnSideSorted, 3);
      if (!keyCell) {
        // Remove the gate if no key spot
        grid[placedGates[g].r][placedGates[g].c] = '.';
      } else {
        grid[keyCell.r][keyCell.c] = 'K';
      }
    }

    // Place Secret Present in secret room
    if (secretPresentPos) {
      grid[secretPresentPos.r][secretPresentPos.c] = 'h';
      occupied.add(`${secretPresentPos.r},${secretPresentPos.c}`);
    }

    // Difficulty scaling across 20 chapters x 10 levels
    const houseCount = Math.min(4, 2 + Math.floor((chapterNum - 1) / 6) + (levelNumber >= 8 ? 1 : 0));
    const cookieCount = Math.min(7, 3 + Math.floor((chapterNum - 1) / 4) + (levelNumber >= 6 ? 1 : 0));
    const fakeCookieCount = Math.min(5, 1 + Math.floor((chapterNum + levelNumber) / 6));
    const starCount = 2 + (levelNumber % 2);
    const needGoldenCookie = Boolean(chapter.isFinale || levelNumber === 10);

    // Ensure enough presents >= houses (always place presents on full reachable set;
    // even better, place presents & houses in reachable cells)
    let placedAll = true;
    for (let i = 0; i < houseCount; i++) {
      const cell = takeCell(floorCells, 4);
      if (!cell) {
        placedAll = false;
        break;
      }
      grid[cell.r][cell.c] = 'H';
    }
    for (let i = 0; i < houseCount; i++) {
      const cell = takeCell(floorCells, 2);
      if (!cell) {
        placedAll = false;
        break;
      }
      grid[cell.r][cell.c] = 'P';
    }
    for (let i = 0; i < cookieCount; i++) {
      const cell = takeCell(floorCells, 2);
      if (!cell) {
        placedAll = false;
        break;
      }
      grid[cell.r][cell.c] = 'C';
    }
    if (!placedAll) continue;

    if (needGoldenCookie) {
      const farCells = [...floorCells].sort((a, b) => b.dist - a.dist);
      const goldSpot = takeCell(farCells.slice(0, Math.max(4, Math.floor(farCells.length / 3))), 5) ?? takeCell(floorCells, 3);
      if (goldSpot) {
        grid[goldSpot.r][goldSpot.c] = 'X';
      }
    }

    for (let i = 0; i < fakeCookieCount; i++) {
      const cell = takeCell(floorCells, 3);
      if (cell) grid[cell.r][cell.c] = 'F';
    }

    for (let i = 0; i < starCount; i++) {
      const cell = takeCell(floorCells, 3);
      if (cell) grid[cell.r][cell.c] = '*';
    }

    // Place Ice floor patches (I) on remaining '.' tiles
    const icePatchCount = Math.min(10, 2 + Math.floor(chapterNum / 3) + (levelNumber % 3));
    for (let i = 0; i < icePatchCount; i++) {
      const cell = takeCell(floorCells, 3);
      if (cell && grid[cell.r][cell.c] === '.') {
        grid[cell.r][cell.c] = 'I';
      }
    }

    // Place Special Frost Traps (T) starting from Chapter 2+ or level 4+
    const trapCount =
      chapterNum === 1 && levelNumber < 4
        ? 0
        : Math.min(5, 1 + Math.floor(chapterNum / 5) + (levelNumber >= 7 ? 1 : 0));
    for (let i = 0; i < trapCount; i++) {
      const cell = takeCell(floorCells, 4);
      if (cell && grid[cell.r][cell.c] === '.') {
        grid[cell.r][cell.c] = 'T';
      }
    }

    // 6. Generate Valid Enemy Patrol Waypoints (strictly on open walkable tiles, >= 4 distance from spawn!)
    const enemyCount = Math.min(
      6,
      1 + Math.floor(chapterNum / 4) + (levelNumber >= 5 ? 1 : 0) + (levelNumber === 10 ? 1 : 0),
    );
    const hazards: HazardBlueprint[] = [];
    const enemyBlocked = new Set(['#', 'E', 'O', 'G', '~']);

    const usedEnemyStarts = new Set<string>();
    for (let e = 0; e < enemyCount; e++) {
      const patrolCandidates = floorCells.filter(
        (fc) =>
          fc.dist >= 5 &&
          !enemyBlocked.has(grid[fc.r][fc.c]) &&
          !usedEnemyStarts.has(`${fc.r},${fc.c}`),
      );
      if (patrolCandidates.length === 0) break;
      const startCell = rng.pick(patrolCandidates);
      usedEnemyStarts.add(`${startCell.r},${startCell.c}`);

      // Build a short valid connected patrol walk of 2-4 tiles along non-blocked cells
      const waypoints: Array<{ row: number; col: number }> = [
        { row: startCell.r, col: startCell.c },
      ];
      let curr = { r: startCell.r, c: startCell.c };
      const walkLen = rng.int(2, 4);
      for (let w = 0; w < walkLen; w++) {
        const neighbors = [
          { r: curr.r + 1, c: curr.c },
          { r: curr.r - 1, c: curr.c },
          { r: curr.r, c: curr.c + 1 },
          { r: curr.r, c: curr.c - 1 },
        ].filter(
          (p) =>
            p.r > 0 &&
            p.r < rows - 1 &&
            p.c > 0 &&
            p.c < cols - 1 &&
            !enemyBlocked.has(grid[p.r][p.c]) &&
            !(p.r === layout.spawn.r && p.c === layout.spawn.c) &&
            !waypoints.some((wp) => wp.row === p.r && wp.col === p.c),
        );
        if (neighbors.length === 0) break;
        const next = rng.pick(neighbors);
        waypoints.push({ row: next.r, col: next.c });
        curr = next;
      }

      if (waypoints.length < 2) continue;

      let kind: HazardKind = 'snowman';
      if (chapterNum >= 5 && e % 3 === 2) kind = 'ice_creature';
      else if (chapterNum >= 2 && e % 2 === 1) kind = 'elf';
      else if (chapterNum >= 3 && e === 0 && levelNumber % 2 === 0) kind = 'snowball';

      const baseSpeed =
        kind === 'snowball'
          ? 3.2 + chapterNum * 0.08
          : kind === 'ice_creature'
            ? 2.9 + chapterNum * 0.08
            : kind === 'elf'
              ? 2.6 + chapterNum * 0.07
              : 2.1 + chapterNum * 0.06;

      hazards.push({
        id: `${chapter.id}-${levelNumber}-enemy-${e}`,
        kind,
        waypoints,
        speed: Number(Math.min(4.8, baseSpeed).toFixed(2)),
        detectRange: kind === 'ice_creature' ? 7.5 : kind === 'elf' ? 6.5 : 4.8,
      });
    }

    const gridStrings = grid.map((row) => row.join(''));
    const layoutSignature = gridStrings.join('\n');
    if (usedLayouts.has(layoutSignature)) {
      continue;
    }

    usedLayouts.add(layoutSignature);

    const parTime = Math.round(75 + chapterNum * 4 + levelNumber * 5);

    return {
      id: `${chapter.id}-${levelNumber}`,
      chapterId: chapter.id,
      chapterNumber: chapterNum,
      levelNumber,
      globalIndex,
      index: globalIndex,
      name: `${chapter.cityName} · Level ${levelNumber}`,
      subtitle:
        levelNumber === 10
          ? `${chapter.cityName} Chapter Finale`
          : chapter.subtitle,
      decorationsLabel: chapter.decorationsLabel,
      isFinale: Boolean(chapter.isFinale && levelNumber === 10),
      isChapterFinale: levelNumber === 10,
      parTimeSeconds: parTime,
      grid: gridStrings,
      hazards,
      palette: chapter.palette,
    };
  }

  throw new Error(`Failed to generate unique solvable maze for ${chapter.id} level ${levelNumber}`);
}
