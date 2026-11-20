import { useState } from 'react';
import {
  Gamepad2,
  Map,
  Moon,
  Pause,
  RotateCcw,
  Sliders,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { HudSnapshot, ThemeMode } from '../game/types';
import {
  CookieIcon,
  GateIcon,
  HeartIcon,
  HouseIcon,
  KeyIcon,
  PresentIcon,
  StarIcon,
} from './GameIcons';
import { VirtualJoystick } from './VirtualJoystick';

interface GameHUDProps {
  hud: HudSnapshot;
  theme: ThemeMode;
  muted: boolean;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onOpenSoundSettings: () => void;
  onPause: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onDpadChange: (moveX: number, moveZ: number) => void;
}

function formatTimer(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameHUD({
  hud,
  theme,
  muted,
  onToggleTheme,
  onToggleMute,
  onOpenSoundSettings,
  onPause,
  onRestart,
  onOpenLevelSelect,
  onDpadChange,
}: GameHUDProps) {
  const [showDesktopDpad, setShowDesktopDpad] = useState(false);

  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const hpColor =
    hpPct > 55
      ? 'bg-emerald-500'
      : hpPct > 28
        ? 'bg-amber-500'
        : 'bg-rose-600';

  const isNight = hud.dayNightPhase === 'night';

  const bannerColors =
    hud.statusBannerTone === 'prank'
      ? 'bg-rose-700 text-white border-rose-400'
      : hud.statusBannerTone === 'warn'
        ? 'bg-amber-600 text-white border-amber-300'
        : hud.statusBannerTone === 'gold'
          ? 'bg-amber-500 text-slate-950 border-amber-200'
          : 'bg-emerald-700 text-white border-emerald-400';

  const utilBtnClass =
    'pointer-events-auto flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/94 dark:bg-slate-900/94 text-slate-900 dark:text-slate-100 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-3.5">
      {/* Top Row: Compact Perimeter Clusters (No backdrop-filter over WebGL!) */}
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left: Chapter, Health, Day/Night Timer, Score, Objectives */}
        <div className="flex flex-col gap-1 max-w-full sm:max-w-[74vw]">
          <div className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/94 dark:bg-slate-900/94 px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-lg text-slate-900 dark:text-slate-100">
            {/* Chapter & Level */}
            <div className="flex items-baseline gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-700">
              <span className="font-mono-num text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-amber-400 whitespace-nowrap">
                Ch {hud.chapterNumber}/20 · Lv {hud.levelNumber}/10
              </span>
              <span className="hidden sm:inline font-display text-sm sm:text-base font-extrabold whitespace-nowrap">
                {hud.levelName}
              </span>
            </div>

            {/* Health Bar */}
            <div
              className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-700"
              aria-label={`Health ${hud.hp} of ${hud.maxHp}`}
            >
              <HeartIcon className="w-4 h-4 shrink-0" />
              <div className="w-16 sm:w-24 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${hpColor}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="font-mono-num text-xs sm:text-sm font-extrabold">
                {hud.hp}
              </span>
              {hud.isHealing && (
                <span className="font-mono-num text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white whitespace-nowrap">
                  +2/s · {hud.healSecondsLeft}s
                </span>
              )}
            </div>

            {/* Automatic Day & Night Countdown */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-extrabold font-mono-num border ${
                isNight
                  ? 'bg-indigo-950 text-amber-300 border-indigo-500/60'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
              }`}
              title={
                isNight
                  ? 'Night Mode (2m) — Santa has a small light ring'
                  : 'Day Mode (12s) — Full visibility'
              }
            >
              {isNight ? (
                <Moon className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isNight ? 'NIGHT' : 'DAY'}</span>
              <span>
                {hud.dayNightRemaining >= 60
                  ? formatTimer(hud.dayNightRemaining)
                  : `${hud.dayNightRemaining}s`}
              </span>
            </div>

            {/* Score & Elapsed Time */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="font-mono-num font-bold" title="Score">
                {hud.score} pts
              </span>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num font-bold" title="Elapsed Time">
                {formatTimer(hud.elapsedTime)}
              </span>
            </div>
          </div>

          {/* Compact Objective Bar */}
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 px-2.5 py-1 sm:px-3 sm:py-1 shadow-md text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100">
            <span className="inline-flex items-center gap-1" title="Real Cookies Collected">
              <CookieIcon className="w-3.5 h-3.5" />
              <span className="font-mono-num">
                {hud.cookiesCollected}/{hud.cookiesRequired}
              </span>
            </span>

            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1" title="Houses Delivered">
              <HouseIcon className="w-3.5 h-3.5" />
              <span className="font-mono-num">
                {hud.deliveredHouses}/{hud.totalHouses}
              </span>
            </span>

            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1" title="Presents Carried">
              <PresentIcon className="w-3.5 h-3.5" />
              <span className="font-mono-num">{hud.carriedPresents}</span>
            </span>

            {hud.keysHeld > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span
                  className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold"
                  title="Golden Keys Held"
                >
                  <KeyIcon className="w-3.5 h-3.5" />
                  <span className="font-mono-num">{hud.keysHeld}</span>
                </span>
              </>
            )}

            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1" title="Bonus Stars">
              <StarIcon className="w-3.5 h-3.5" />
              <span className="font-mono-num">
                {hud.starsCollected}/{hud.totalStars}
              </span>
            </span>

            {hud.goldenCookiesRequired > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span
                  className={
                    hud.hasGoldenCookie
                      ? 'text-amber-600 dark:text-amber-300 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  {hud.hasGoldenCookie ? 'Golden Cookie ✓' : 'Golden Cookie 0/1'}
                </span>
              </>
            )}

            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1 font-bold ${
                hud.portalUnlocked
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <GateIcon open={hud.portalUnlocked} className="w-3.5 h-3.5" />
              <span>{hud.portalUnlocked ? 'Exit Open!' : 'Gate Locked'}</span>
            </span>
          </div>
        </div>

        {/* Top-Right: Compact Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLevelSelect();
            }}
            aria-label="Chapters and Outfits"
            title="Chapters & Outfits"
            className={utilBtnClass}
          >
            <Map className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSoundSettings();
            }}
            aria-label="Audio Settings"
            title="Sound & Music Settings"
            className={utilBtnClass}
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleTheme();
            }}
            aria-label={
              theme === 'dark' ? 'Switch UI to Light Theme' : 'Switch UI to Dark Theme'
            }
            title={theme === 'dark' ? 'Light UI Theme' : 'Dark UI Theme'}
            className={utilBtnClass}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            title="Mute (M)"
            className={utilBtnClass}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            aria-label="Restart Level"
            title="Restart (R)"
            className={utilBtnClass}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause Game"
            title="Pause (P / Esc)"
            className={utilBtnClass}
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transient Event Banner (Non-blocking) */}
      {hud.statusBanner && (
        <div className="flex justify-center mt-1 px-2">
          <div
            role="status"
            className={`px-3.5 py-1 rounded-xl border text-xs sm:text-sm font-bold shadow-lg text-center max-w-md ${bannerColors}`}
          >
            {hud.statusBanner}
          </div>
        </div>
      )}

      {/* Bottom Row: Mobile Fading Snap-Back Joystick + Desktop Toggle */}
      <div className="mt-auto flex items-end justify-between">
        <div className={showDesktopDpad ? 'block' : 'block lg:hidden'}>
          <VirtualJoystick onChange={onDpadChange} />
        </div>

        <div className="hidden lg:flex ml-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setShowDesktopDpad((prev) => !prev);
            }}
            aria-label="Toggle On-Screen Joystick"
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>{showDesktopDpad ? 'Hide Stick' : 'Touch Stick'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
