import { Map, Moon, Play, Sliders, Sun, Volume2, VolumeX } from 'lucide-react';
import type { GlobalProgressStats, LevelDefinition, ThemeMode } from '../game/types';
import { StarIcon, TitleEmblemSvg } from './GameIcons';

interface TitleOverlayProps {
  theme: ThemeMode;
  muted: boolean;
  resumeLevel: LevelDefinition;
  stats: GlobalProgressStats;
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenSoundSettings: () => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
}

export function TitleOverlay({
  theme,
  muted,
  resumeLevel,
  stats,
  onStartGame,
  onOpenLevelSelect,
  onOpenSoundSettings,
  onToggleTheme,
  onToggleMute,
}: TitleOverlayProps) {
  const completionPct = Math.round((stats.levelsCompleted / 200) * 100);
  const hasProgress = stats.levelsCompleted > 0 || resumeLevel.globalIndex > 0;

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-6 md:p-10 pointer-events-none">
      {/* Top Bar: Theme & Audio Controls Only */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch UI to Light Theme' : 'Switch UI to Dark Theme'}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
          <span className="whitespace-nowrap">
            {theme === 'dark' ? 'Light UI' : 'Dark UI'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSoundSettings}
          aria-label="Audio & Music Settings"
          title="Audio Settings"
          className="pointer-events-auto inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
          className="pointer-events-auto inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          )}
        </button>
      </div>

      {/* Left/Center Hero Title Lockup over calm negative space */}
      <div className="my-auto max-w-xl">
        <div className="pointer-events-auto inline-block w-full sm:w-auto rounded-3xl border border-slate-200 dark:border-slate-700/90 bg-white/94 dark:bg-slate-900/94 px-5 py-5 sm:px-8 sm:py-7 shadow-2xl">
          <div className="flex items-center gap-3.5 sm:gap-4 mb-3.5">
            <TitleEmblemSvg className="w-12 h-12 sm:w-16 sm:h-16 shrink-0" />
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-amber-400">
                20 Chapters · 200 Worldwide Maze Levels
              </p>
              <h1 className="font-display text-2xl sm:text-4xl md:text-[2.6rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] text-balance">
                Xmas or Not
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
            Brave the 12s Day &amp; 2m Night cycle, dodge tricky cookies &amp; prowling enemies, deliver every gift, and unlock all 20 cities.
          </p>

          {stats.levelsCompleted > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                {stats.levelsCompleted}/200 Levels ({completionPct}%)
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-num">
                <StarIcon className="w-3.5 h-3.5" />
                {stats.totalStars}/600
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {stats.chaptersCompleted}/20 Chapters
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-5">
            <button
              type="button"
              data-start="true"
              onClick={onStartGame}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>
                {hasProgress
                  ? `Play Ch ${resumeLevel.chapterNumber} · Lv ${resumeLevel.levelNumber}`
                  : 'Start Adventure'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenLevelSelect}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 min-h-[46px] rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Map className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Chapters &amp; Outfits</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Safe-Margin Flat Control Hint */}
      <div className="flex justify-center">
        <p className="px-3.5 py-1.5 rounded-lg bg-slate-950/80 text-slate-100 text-[11px] sm:text-sm font-medium tracking-wide text-center">
          WASD / Arrows Move · P Pause · R Restart · M Mute
        </p>
      </div>
    </div>
  );
}
