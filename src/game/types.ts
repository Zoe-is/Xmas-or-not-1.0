export type ThemeMode = 'light' | 'dark';

export type DayNightPhase = 'day' | 'night';

export const DAY_DURATION_SECONDS = 12;
export const NIGHT_DURATION_SECONDS = 120;

export type GameScreenState =
  | 'title'
  | 'chapter-intro'
  | 'level-select'
  | 'playing'
  | 'paused'
  | 'level-clear'
  | 'chapter-complete'
  | 'game-over'
  | 'victory';

export type ChapterId =
  | 'london'
  | 'paris'
  | 'new_york'
  | 'tokyo'
  | 'sydney'
  | 'lapland'
  | 'venice'
  | 'cairo'
  | 'rio'
  | 'seoul'
  | 'prague'
  | 'amsterdam'
  | 'mumbai'
  | 'toronto'
  | 'reykjavik'
  | 'nairobi'
  | 'singapore'
  | 'istanbul'
  | 'swiss_alps'
  | 'north_pole';

export type CityId = ChapterId;

export type SantaOutfitId =
  | 'classic_red'
  | 'frost_royal'
  | 'golden_explorer'
  | 'emerald_elf_king'
  | 'aurora_starlight'
  | 'north_pole_master';

export interface SantaOutfit {
  id: SantaOutfitId;
  name: string;
  description: string;
  coatColor: number;
  trimColor: number;
  accentColor: number;
  unlockRequirementLabel: string;
  unlockCheck: (stats: GlobalProgressStats) => boolean;
}

export type TileType =
  | 'wall'
  | 'floor'
  | 'ice'
  | 'secret_wall'
  | 'locked_gate'
  | 'exit_gate'
  | 'portal'
  | 'house'
  | 'trap';

export type CollectibleKind =
  | 'present'
  | 'hidden_present'
  | 'cookie'
  | 'fake_cookie'
  | 'key'
  | 'star'
  | 'golden_cookie';

export type HazardKind = 'snowman' | 'elf' | 'snowball' | 'ice_creature';

export type EnemyAiState = 'patrol' | 'chase' | 'return';

export interface HazardBlueprint {
  id: string;
  kind: HazardKind;
  waypoints: Array<{ row: number; col: number }>;
  speed: number;
  detectRange: number;
}

export interface CityPalette {
  wallPrimary: number;
  wallTrim: number;
  floorLight: number;
  floorDark: number;
  accent: number;
  lightSky: number;
  lightFog: number;
  darkSky: number;
  darkFog: number;
  landmarkTint: number;
  snowTint: number;
}

export interface ChapterDefinition {
  id: ChapterId;
  chapterNumber: number; // 1..20
  title: string;
  cityName: string;
  subtitle: string;
  introStory: string;
  completionStory: string;
  decorationsLabel: string;
  specialFeatureLabel: string;
  rewardLabel: string;
  unlockOutfitId?: SantaOutfitId;
  isFinale?: boolean;
  palette: CityPalette;
}

export interface LevelDefinition {
  id: string; // e.g. "london-1" .. "north_pole-10"
  chapterId: ChapterId;
  chapterNumber: number; // 1..20
  levelNumber: number; // 1..10
  globalIndex: number; // 0..199
  index: number; // alias for globalIndex
  name: string;
  subtitle: string;
  decorationsLabel: string;
  isFinale?: boolean;
  isChapterFinale?: boolean;
  parTimeSeconds: number;
  grid: string[];
  hazards: HazardBlueprint[];
  palette: CityPalette;
}

export interface CollectibleState {
  id: string;
  kind: CollectibleKind;
  row: number;
  col: number;
  x: number;
  z: number;
  collected: boolean;
  hasClue?: boolean;
  prankLabel?: string;
}

export interface HouseState {
  id: string;
  row: number;
  col: number;
  x: number;
  z: number;
  delivered: boolean;
}

export interface GateState {
  id: string;
  kind: 'key_gate' | 'exit_gate';
  row: number;
  col: number;
  x: number;
  z: number;
  unlocked: boolean;
  openProgress: number;
}

export interface TrapState {
  id: string;
  row: number;
  col: number;
  x: number;
  z: number;
  phaseOffset: number;
  active: boolean; // active spikes/frost burst
}

export interface HazardState {
  id: string;
  kind: HazardKind;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  speed: number;
  detectRange: number;
  aiState: EnemyAiState;
  alertTimer: number;
  waypoints: Array<{ x: number; z: number }>;
  waypointTiles: Array<{ row: number; col: number }>;
  targetWaypointIndex: number;
  direction: 1 | -1;
  windupTimer: number;
  radius: number;
  repathTimer: number;
  nextStepTile: { row: number; col: number } | null;
}

export type GameEventKind =
  | 'present'
  | 'hidden_present'
  | 'deliver'
  | 'cookie'
  | 'fake_cookie'
  | 'key'
  | 'gate_open'
  | 'exit_gate_open'
  | 'star'
  | 'golden_cookie'
  | 'portal_unlock'
  | 'hazard_hit'
  | 'trap_hit'
  | 'enemy_detect'
  | 'heal_tick'
  | 'need_present'
  | 'need_key'
  | 'day_start'
  | 'night_start'
  | 'game_over'
  | 'level_complete';

export interface GameEvent {
  kind: GameEventKind;
  x: number;
  z: number;
  message: string;
  pointsDelta: number;
}

export interface SimState {
  levelId: string;
  chapterId: ChapterId;
  chapterNumber: number;
  levelNumber: number;
  levelIndex: number;
  isFinale: boolean;
  rows: number;
  cols: number;
  tileSize: number;
  tiles: TileType[][];
  player: {
    x: number;
    z: number;
    vx: number;
    vz: number;
    facing: number;
    radius: number;
    distanceTraveled: number;
    stunTimer: number;
    invulnTimer: number;
    spinTimer: number;
    squashX: number;
    squashY: number;
    onIce: boolean;
    hp: number;
    maxHp: number;
    healTimer: number; // remaining seconds of +2 HP/s healing
    healAccumulator: number;
    damageTakenTotal: number;
  };
  dayNight: {
    phase: DayNightPhase;
    timeRemaining: number;
    cycleElapsed: number;
    nightFactor: number; // 0 in full day, 1 in full night (smoothly damped)
  };
  portal: {
    row: number;
    col: number;
    x: number;
    z: number;
    unlocked: boolean;
  };
  collectibles: CollectibleState[];
  houses: HouseState[];
  gates: GateState[];
  traps: TrapState[];
  hazards: HazardState[];
  carriedPresents: number;
  deliveredHouses: number;
  totalHouses: number;
  hiddenPresentsFound: number;
  totalHiddenPresents: number;
  cookiesCollected: number;
  cookiesRequired: number;
  goldenCookiesCollected: number;
  goldenCookiesRequired: number;
  fakeCookiesTriggered: number;
  hasGoldenCookie: boolean;
  keysHeld: number;
  starsCollected: number;
  totalStars: number;
  score: number;
  elapsedTime: number;
  hitstopTimer: number;
  cameraTrauma: number;
  completed: boolean;
  gameOver: boolean;
  statusBanner: string;
  statusBannerTimer: number;
  statusBannerTone: 'good' | 'prank' | 'warn' | 'gold';
}

export interface HudSnapshot {
  levelId: string;
  chapterId: ChapterId;
  chapterNumber: number;
  levelNumber: number;
  levelIndex: number;
  levelName: string;
  subtitle: string;
  isFinale: boolean;
  score: number;
  elapsedTime: number;
  hp: number;
  maxHp: number;
  isHealing: boolean;
  healSecondsLeft: number;
  dayNightPhase: DayNightPhase;
  dayNightRemaining: number;
  cookiesCollected: number;
  cookiesRequired: number;
  goldenCookiesCollected: number;
  goldenCookiesRequired: number;
  hasGoldenCookie: boolean;
  carriedPresents: number;
  deliveredHouses: number;
  totalHouses: number;
  keysHeld: number;
  starsCollected: number;
  totalStars: number;
  portalUnlocked: boolean;
  statusBanner: string;
  statusBannerTone: 'good' | 'prank' | 'warn' | 'gold';
}

export interface LevelProgressRecord {
  completed: boolean;
  bestScore: number;
  bestTime: number;
  stars: number;
}

export interface GlobalProgressStats {
  levelsCompleted: number;
  chaptersCompleted: number;
  totalStars: number;
  totalCookies: number;
  totalDeliveries: number;
  highestChapterUnlocked: number; // 1..20
}

export interface SaveProgressData {
  levels: Record<string, LevelProgressRecord>;
  totalCookies: number;
  totalDeliveries: number;
  selectedOutfit: SantaOutfitId;
  seenChapterIntros: Record<string, boolean>;
}

export type SaveProgressMap = SaveProgressData;

export interface AudioSettings {
  muted: boolean;
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
}

export interface InputIntent {
  moveX: number;
  moveZ: number;
}
