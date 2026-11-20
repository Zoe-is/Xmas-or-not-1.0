import {
  Award,
  Home,
  Map,
  Play,
  RotateCcw,
  Skull,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { AudioSettings, LevelDefinition } from '../game/types';
import { StarIcon } from './GameIcons';

interface SoundSettingsModalProps {
  settings: AudioSettings;
  onUpdate: (partial: Partial<AudioSettings>) => void;
  onClose: () => void;
}

export function SoundSettingsModal({
  settings,
  onUpdate,
  onClose,
}: SoundSettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-settings-heading"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-600 dark:text-amber-400" />
            <h2 id="audio-settings-heading" className="font-display text-xl font-extrabold">
              Sound &amp; Music
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Audio Settings"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-100 dark:bg-slate-800 p-3.5">
            <span className="text-sm font-bold">Master Audio</span>
            <button
              type="button"
              onClick={() => onUpdate({ muted: !settings.muted })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                settings.muted
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {settings.muted ? (
                <>
                  <VolumeX className="w-4 h-4" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" /> Active
                </>
              )}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span>Christmas Music Volume</span>
              <span className="font-mono-num">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) =>
                onUpdate({ musicVolume: Number(e.target.value) / 100 })
              }
              className="w-full accent-rose-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span>Sound Effects Volume</span>
              <span className="font-mono-num">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) =>
                onUpdate({ sfxVolume: Number(e.target.value) / 100 })
              }
              className="w-full accent-emerald-600"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

interface PauseModalProps {
  level: LevelDefinition;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenSoundSettings: () => void;
  onGoTitle: () => void;
}

export function PauseModal({
  level,
  onResume,
  onRestart,
  onOpenLevelSelect,
  onOpenSoundSettings,
  onGoTitle,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-7 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-amber-400">
          Paused · Chapter {level.chapterNumber}/20 · Level {level.levelNumber}/10
        </p>
        <h2 id="pause-title" className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
          {level.name}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {level.subtitle}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onResume}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base transition-colors"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume Adventure</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Level</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLevelSelect}
              className="inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>Chapters</span>
            </button>
            <button
              type="button"
              onClick={onOpenSoundSettings}
              className="inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
            >
              <Sliders className="w-4 h-4" />
              <span>Audio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onGoTitle}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 min-h-[42px] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Main Title</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LevelClearModalProps {
  level: LevelDefinition;
  hasNextLevel: boolean;
  nextLevel: LevelDefinition | null;
  score: number;
  elapsedTime: number;
  hpRemaining: number;
  stars: number;
  cookiesCollected: number;
  deliveredHouses: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export function LevelClearModal({
  level,
  hasNextLevel,
  nextLevel,
  score,
  elapsedTime,
  hpRemaining,
  stars,
  cookiesCollected,
  deliveredHouses,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}: LevelClearModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Ch {level.chapterNumber}/20 · Lv {level.levelNumber}/10 Complete
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <StarIcon
                key={s}
                filled={stars >= s}
                className="w-6 h-6 text-slate-400"
              />
            ))}
          </div>
        </div>

        <h2 id="clear-title" className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
          {level.name} Cleared!
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Score
            </p>
            <p className="font-mono-num text-lg font-bold mt-0.5">{score}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Time
            </p>
            <p className="font-mono-num text-lg font-bold mt-0.5">
              {Math.round(elapsedTime)}s
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              HP Left
            </p>
            <p className="font-mono-num text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
              {hpRemaining}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gifts/Cookies
            </p>
            <p className="font-mono-num text-lg font-bold mt-0.5">
              {deliveredHouses}/{cookiesCollected}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {hasNextLevel && nextLevel && (
            <button
              type="button"
              data-start="true"
              autoFocus
              onClick={onNextLevel}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                Next: Ch {nextLevel.chapterNumber} · Level {nextLevel.levelNumber}
              </span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-emerald-700/90 border border-emerald-300/40 text-[11px] font-mono font-bold uppercase tracking-wide">
                Enter
              </kbd>
            </button>
          )}

          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay Stage</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
          >
            <Map className="w-4 h-4" />
            <span>Chapters &amp; Levels</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  level: LevelDefinition;
  score: number;
  elapsedTime: number;
  cookiesCollected: number;
  cookiesRequired: number;
  deliveredHouses: number;
  totalHouses: number;
  onRetry: () => void;
  onOpenLevelSelect: () => void;
  onGoTitle: () => void;
}

export function GameOverModal({
  level,
  score,
  elapsedTime,
  cookiesCollected,
  cookiesRequired,
  deliveredHouses,
  totalHouses,
  onRetry,
  onOpenLevelSelect,
  onGoTitle,
}: GameOverModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-rose-400/70 dark:border-rose-600/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Out of Health (0 / 100 HP)
            </p>
            <h2 id="gameover-title" className="font-display text-2xl sm:text-3xl font-extrabold">
              Santa Needs a Rest!
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
          Your progress in <strong>{level.name}</strong> is saved. Watch out for mischievous enemies, frost traps, and prank cookies!
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Score
            </p>
            <p className="font-mono-num text-lg font-bold">{score}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cookies
            </p>
            <p className="font-mono-num text-lg font-bold">
              {cookiesCollected}/{cookiesRequired}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gifts ({Math.round(elapsedTime)}s)
            </p>
            <p className="font-mono-num text-lg font-bold">
              {deliveredHouses}/{totalHouses}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Retry Level</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
          >
            <Map className="w-4 h-4" />
            <span>Level Selection</span>
          </button>

          <button
            type="button"
            onClick={onGoTitle}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 min-h-[42px] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Main Title</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface VictoryCelebrationOverlayProps {
  score: number;
  elapsedTime: number;
  stars: number;
  onPlayAgain: () => void;
  onOpenLevelSelect: () => void;
  onGoTitle: () => void;
}

export function VictoryCelebrationOverlay({
  score,
  elapsedTime,
  stars,
  onPlayAgain,
  onOpenLevelSelect,
  onGoTitle,
}: VictoryCelebrationOverlayProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3 sm:px-4 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-amber-300 dark:border-amber-500/60 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-amber-400">
                All 20 Chapters Complete · Christmas Saved!
              </p>
              <h2 id="victory-title" className="font-display text-xl sm:text-3xl font-extrabold">
                North Pole Grand Celebration!
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <StarIcon
                key={s}
                filled={stars >= s}
                className="w-6 h-6 text-slate-400"
              />
            ))}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
          Santa conquered all 200 levels around the world and returned with the Golden Christmas Cookie! Reindeer and Elves are celebrating around the Starlight Tree.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Final Score
            </p>
            <p className="font-mono-num text-base sm:text-lg font-bold">{score}</p>
          </div>
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Finale Time
            </p>
            <p className="font-mono-num text-base sm:text-lg font-bold">
              {Math.round(elapsedTime)}s
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Master Suit
            </p>
            <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              Unlocked!
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
          >
            <Map className="w-4 h-4" />
            <span>Chapters &amp; Outfits</span>
          </button>
          <button
            type="button"
            onClick={onGoTitle}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Main Title</span>
          </button>
        </div>
      </div>
    </div>
  );
}
