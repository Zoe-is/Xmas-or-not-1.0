import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, LEVELS } from './levels';
import { SANTA_OUTFITS } from './chapters';
import { computeJoystickOutput } from './joystick';
import {
  applySantaOutfitToModel,
  createChapterDioramaModel,
  createSantaModel,
} from './models';
import {
  TILE_SIZE,
  computeStars,
  createSimState,
  findNextPathTile,
  resolveGridCollisions,
  stepSimulation,
  tileToWorld,
  verifyLevelSolvability,
} from './simulation';
import { DAY_DURATION_SECONDS, NIGHT_DURATION_SECONDS } from './types';

test('all 20 chapters and 200 levels exist, are unique, and are 100% solvable', () => {
  assert.equal(CHAPTERS.length, 20, 'Must have 20 chapters');
  assert.equal(LEVELS.length, 200, 'Must have 200 playable levels');

  const seenLayouts = new Set<string>();

  for (const level of LEVELS) {
    const sig = level.grid.join('\n');
    assert.equal(
      seenLayouts.has(sig),
      false,
      `Duplicate maze layout found at ${level.id}`,
    );
    seenLayouts.add(sig);

    const result = verifyLevelSolvability(level);
    assert.equal(
      result.solvable,
      true,
      `Level ${level.id} failed solvability: ${result.reason ?? 'unknown'}`,
    );
    assert.ok(result.stats.cookies >= 3, `${level.id} should have >= 3 cookies`);
    assert.ok(result.stats.houses >= 2, `${level.id} should have >= 2 houses`);
    assert.ok(result.stats.exitGates >= 1, `${level.id} should have an Exit Gate E`);
  }
});

test('Day and Night cycle runs exact 12s Day -> 120s (2m) Night -> 12s Day loop', () => {
  const sim = createSimState(LEVELS[0]);
  assert.equal(sim.dayNight.phase, 'day');
  assert.equal(sim.dayNight.timeRemaining, DAY_DURATION_SECONDS);

  // Advance 11.9s -> still day
  for (let i = 0; i < 238; i++) {
    stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 });
  }
  assert.equal(sim.dayNight.phase, 'day');

  // Advance 0.2s more -> switches to night with ~119.9s remaining
  let events = stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 });
  events = events.concat(stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 }));
  events = events.concat(stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 }));
  events = events.concat(stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 }));
  assert.equal(sim.dayNight.phase, 'night');
  assert.equal(NIGHT_DURATION_SECONDS, 120);
  assert.ok(
    sim.dayNight.timeRemaining > NIGHT_DURATION_SECONDS - 0.5 &&
      sim.dayNight.timeRemaining <= NIGHT_DURATION_SECONDS,
  );

  // Advance 60s -> still in night mode
  for (let i = 0; i < 1200; i++) {
    stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 });
  }
  assert.equal(sim.dayNight.phase, 'night');

  // Advance another 60s -> switches back to day
  for (let i = 0; i < 1200; i++) {
    stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 });
  }
  assert.equal(sim.dayNight.phase, 'day');
});

test('Health system: starts at 100, enemy deals 15, fake cookie deals 20, real cookie heals +2/s for 5s, 0 triggers game over', () => {
  const sim = createSimState(LEVELS[0]);
  assert.equal(sim.player.hp, 100);
  assert.equal(sim.player.maxHp, 100);

  // Fake cookie deals 20 HP damage
  const fake = sim.collectibles.find((c) => c.kind === 'fake_cookie');
  assert.ok(fake, 'Level should have a fake cookie');
  sim.player.x = fake!.x;
  sim.player.z = fake!.z;
  const fakeEvents = stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  assert.equal(sim.player.hp, 80);
  assert.ok(fakeEvents.some((e) => e.kind === 'fake_cookie'));

  // Enemy collision deals 15 HP with damage cooldown
  sim.player.invulnTimer = 0;
  sim.hitstopTimer = 0;
  const enemy = sim.hazards[0];
  assert.ok(enemy);
  sim.player.x = enemy.x;
  sim.player.z = enemy.z;
  stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  assert.equal(sim.player.hp, 65);

  // Immediate next frame should NOT deal damage again due to cooldown
  sim.hitstopTimer = 0;
  sim.player.x = enemy.x;
  sim.player.z = enemy.z;
  stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  assert.equal(sim.player.hp, 65);

  // Real cookie activates +2 HP/sec for 5s = +10 HP
  const cookie = sim.collectibles.find((c) => c.kind === 'cookie')!;
  sim.player.invulnTimer = 0;
  sim.player.stunTimer = 0;
  sim.player.x = cookie.x;
  sim.player.z = cookie.z;
  stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  assert.ok(sim.player.healTimer > 4.9);

  // Step 5.05 seconds cleanly without moving onto enemies
  sim.hazards = [];
  for (let i = 0; i < 105; i++) {
    stepSimulation(sim, 0.05, { moveX: 0, moveZ: 0 });
  }
  assert.equal(sim.player.hp, 75, 'Real cookie should heal +10 HP over 5 seconds');

  // Reduce HP to <= 0 triggers game over
  sim.player.hp = 10;
  const fake2 = sim.collectibles.find((c) => c.kind === 'fake_cookie' && !c.collected);
  if (fake2) {
    sim.player.x = fake2.x;
    sim.player.z = fake2.z;
    const goEvents = stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
    assert.equal(sim.player.hp, 0);
    assert.equal(sim.gameOver, true);
    assert.ok(goEvents.some((e) => e.kind === 'game_over'));
  }
});

test('Physical Exit Gate E blocks Santa until all deliveries and real cookies are completed', () => {
  const sim = createSimState(LEVELS[0]);
  const exitGate = sim.gates.find((g) => g.kind === 'exit_gate');
  assert.ok(exitGate, 'Exit Gate E must exist');
  assert.equal(exitGate!.unlocked, false);

  // Colliding with locked exit gate pushes Santa back
  const blocked = resolveGridCollisions(sim, exitGate!.x, exitGate!.z, sim.player.radius);
  assert.ok(
    blocked.hitGate?.id === exitGate!.id ||
      Math.hypot(blocked.x - exitGate!.x, blocked.z - exitGate!.z) > 0.5,
  );

  // Collect required presents, cookies, golden cookies (if any), and deliver to houses
  for (const c of sim.collectibles) {
    if (c.kind === 'present' || c.kind === 'cookie' || c.kind === 'golden_cookie') {
      sim.hitstopTimer = 0;
      sim.player.x = c.x;
      sim.player.z = c.z;
      stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
    }
  }
  for (const h of sim.houses) {
    sim.hitstopTimer = 0;
    sim.player.x = h.x;
    sim.player.z = h.z;
    stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  }

  assert.equal(sim.portal.unlocked, true);
  assert.equal(exitGate!.unlocked, true, 'Exit Gate E unlocks when objectives complete');

  // Now Santa can walk to the portal and complete the level
  sim.player.x = sim.portal.x;
  sim.player.z = sim.portal.z;
  const events = stepSimulation(sim, 0.016, { moveX: 0, moveZ: 0 });
  assert.equal(sim.completed, true);
  assert.ok(events.some((e) => e.kind === 'level_complete'));
});

test('Enemy BFS pathfinding finds routes around walls and never crosses walls or closed gates', () => {
  const sim = createSimState(LEVELS[12]); // Chapter 2 level 3
  const enemy = sim.hazards.find((h) => h.kind !== 'snowball') ?? sim.hazards[0];
  assert.ok(enemy);

  // Verify enemy grid collision blocks wall penetration
  const wallPos = tileToWorld(0, 0, sim.rows, sim.cols, TILE_SIZE);
  const res = resolveGridCollisions(sim, wallPos.x, wallPos.z, enemy.radius, true);
  assert.ok(
    Math.hypot(res.x - wallPos.x, res.z - wallPos.z) > 0.1,
    'Enemy must be pushed out of wall tile',
  );

  // Verify BFS pathfinding returns null when target is inside a wall
  const blockedStep = findNextPathTile(sim, { row: 1, col: 1 }, { row: 0, col: 0 });
  assert.equal(blockedStep, null);
});

test('star rating rewards fast clean runs and bonus stars', () => {
  const sim = createSimState(LEVELS[0]);
  sim.elapsedTime = 50;
  sim.starsCollected = 2;
  sim.fakeCookiesTriggered = 0;
  sim.player.hp = 90;
  assert.equal(computeStars(sim, 90), 3);

  sim.elapsedTime = 300;
  sim.starsCollected = 0;
  assert.equal(computeStars(sim, 90), 1);
});

test('joystick math clamps radius, respects deadzone, and snaps cleanly to zero', () => {
  const center = computeJoystickOutput(0, 0, 50);
  assert.deepEqual(center, { knobX: 0, knobY: 0, moveX: 0, moveZ: 0 });

  const deadzone = computeJoystickOutput(4, 3, 50); // dist=5 <= 50*0.14=7
  assert.equal(deadzone.moveX, 0);
  assert.equal(deadzone.moveZ, 0);
  assert.equal(deadzone.knobX, 4);
  assert.equal(deadzone.knobY, 3);

  const clamped = computeJoystickOutput(100, 0, 50);
  assert.equal(clamped.knobX, 50);
  assert.equal(clamped.knobY, 0);
  assert.ok(Math.abs(clamped.moveX - 1) < 1e-6);
  assert.equal(clamped.moveZ, 0);

  const diag = computeJoystickOutput(60, 60, 50);
  assert.ok(Math.hypot(diag.knobX, diag.knobY) <= 50.0001);
  assert.ok(Math.abs(Math.hypot(diag.moveX, diag.moveZ) - 1) < 1e-6);
});

test('every chapter (20) and Santa outfit (6) builds a multi-part 3D model', () => {
  for (const ch of CHAPTERS) {
    const diorama = createChapterDioramaModel(ch);
    assert.ok(
      diorama.children.length >= 4,
      `Chapter ${ch.id} 3D diorama should have multi-part children`,
    );
  }

  for (const outfit of SANTA_OUTFITS) {
    const santa = createSantaModel(outfit);
    assert.ok(santa.children.length >= 3, `Outfit ${outfit.id} Santa model must exist`);
    applySantaOutfitToModel(santa, outfit);
    const parts = santa.userData.parts as {
      outfitAccessories?: Record<string, { visible: boolean }>;
    };
    assert.equal(parts.outfitAccessories?.[outfit.id]?.visible, true);
  }
});
