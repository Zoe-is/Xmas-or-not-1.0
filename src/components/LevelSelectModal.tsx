import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Lock,
  Play,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { CHAPTERS, SANTA_OUTFITS } from '../game/chapters';
import { getLevelsForChapter } from '../game/levels';
import type {
  ChapterDefinition,
  GlobalProgressStats,
  LevelDefinition,
  SantaOutfitId,
  SaveProgressData,
} from '../game/types';
import { CookieIcon, HouseIcon, StarIcon } from './GameIcons';
import { ModelPreview3D } from './ModelPreview3D';

interface LevelSelectModalProps {
  progress: SaveProgressData;
  stats: GlobalProgressStats;
  currentLevel: LevelDefinition;
  onSelectLevel: (level: LevelDefinition) => void;
  onSelectOutfit: (outfitId: SantaOutfitId) => void;
  onClose: () => void;
}

export function LevelSelectModal({
  progress,
  stats,
  currentLevel,
  onSelectLevel,
  onSelectOutfit,
  onClose,
}: LevelSelectModalProps) {
  const [activeTab, setActiveTab] = useState<'chapters' | 'outfits'>('chapters');
  const [focusedChapter, setFocusedChapter] = useState<ChapterDefinition>(
    CHAPTERS.find((c) => c.id === currentLevel.chapterId) ?? CHAPTERS[0],
  );
  const [viewingLevels, setViewingLevels] = useState<boolean>(false);

  const completionPct = Math.round((stats.levelsCompleted / 200) * 100);
  const focusedLevels = getLevelsForChapter(focusedChapter.id);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-select-heading"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {activeTab === 'chapters' && viewingLevels && (
              <button
                type="button"
                onClick={() => setViewingLevels(false)}
                aria-label="Back to 20 Chapters"
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-amber-400">
                {stats.levelsCompleted}/200 Levels ({completionPct}%) · {stats.totalStars}/600 Stars
              </p>
              <h2
                id="level-select-heading"
                className="font-display text-lg sm:text-2xl font-extrabold leading-tight"
              >
                {activeTab === 'outfits'
                  ? "Santa's Wardrobe & Stats"
                  : viewingLevels
                    ? `Ch ${focusedChapter.chapterNumber}: ${focusedChapter.cityName} (10 Levels)`
                    : '20 Chapters Worldwide'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chapters')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                  activeTab === 'chapters'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chapters
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('outfits')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                  activeTab === 'outfits'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Outfits</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Chapters and Outfits"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden max-w-xs">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="font-mono-num font-bold">{completionPct}% Complete</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 font-semibold">
            <span className="inline-flex items-center gap-1 font-mono-num">
              <CookieIcon className="w-3.5 h-3.5" />
              {stats.totalCookies} Cookies
            </span>
            <span className="inline-flex items-center gap-1 font-mono-num">
              <HouseIcon className="w-3.5 h-3.5" />
              {stats.totalDeliveries} Gifts
            </span>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'chapters' && !viewingLevels && (
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CHAPTERS.map((ch) => {
              const chLevels = getLevelsForChapter(ch.id);
              const clearedInCh = chLevels.filter(
                (l) => progress.levels[l.id]?.completed,
              ).length;
              const chStars = chLevels.reduce(
                (sum, l) => sum + (progress.levels[l.id]?.stars ?? 0),
                0,
              );
              const isUnlocked = ch.chapterNumber <= stats.highestChapterUnlocked;
              const isCurrent = ch.id === currentLevel.chapterId;

              return (
                <button
                  key={ch.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => {
                    setFocusedChapter(ch);
                    setViewingLevels(true);
                  }}
                  className={`text-left rounded-2xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                    !isUnlocked
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 opacity-65 cursor-not-allowed'
                      : isCurrent
                        ? 'border-rose-500 dark:border-amber-400 bg-rose-50/70 dark:bg-slate-800 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-rose-400 dark:hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>Chapter {ch.chapterNumber}/20</span>
                      {clearedInCh === 10 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : !isUnlocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : null}
                    </div>

                    <div className="mt-2 h-28 w-full rounded-xl bg-gradient-to-b from-sky-200/90 via-blue-100/85 to-indigo-100/90 dark:from-slate-900/95 dark:to-slate-950/95 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-center overflow-hidden">
                      <ModelPreview3D
                        target={{ kind: 'chapter', id: ch.id }}
                        className="w-full h-full"
                      />
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-extrabold mt-2 leading-snug">
                      {ch.cityName}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                      {ch.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <span className="font-mono-num font-bold text-slate-700 dark:text-slate-200">
                      {isUnlocked ? `${clearedInCh}/10 Lv` : `Clear Ch ${ch.chapterNumber - 1}`}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono-num font-semibold">
                      <StarIcon filled={chStars > 0} className="w-3.5 h-3.5" />
                      {chStars}/30
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'chapters' && viewingLevels && (
          <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-24 h-20 rounded-xl bg-gradient-to-b from-sky-200/90 to-indigo-100/90 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
                  <ModelPreview3D
                    target={{ kind: 'chapter', id: focusedChapter.id }}
                    autoSpin
                    interactive
                    label={`${focusedChapter.cityName} 3D model`}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {focusedChapter.title}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                    {focusedChapter.decorationsLabel} · {focusedChapter.specialFeatureLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingLevels(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                All 20 Chapters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {focusedLevels.map((lvl, idx) => {
                const rec = progress.levels[lvl.id];
                const prevLvl = idx > 0 ? focusedLevels[idx - 1] : null;
                const levelUnlocked =
                  idx === 0 || Boolean(prevLvl && progress.levels[prevLvl.id]?.completed);
                const isCurrent = lvl.id === currentLevel.id;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    disabled={!levelUnlocked}
                    onClick={() => onSelectLevel(lvl)}
                    className={`text-left rounded-2xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                      !levelUnlocked
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 opacity-60 cursor-not-allowed'
                        : isCurrent
                          ? 'border-rose-500 dark:border-amber-400 bg-rose-50/70 dark:bg-slate-800 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-rose-400 dark:hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-mono-num text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Level {lvl.levelNumber}/10
                        </span>
                        <h4 className="font-display text-base font-extrabold mt-0.5">
                          {lvl.isFinale
                            ? 'Grand Finale'
                            : lvl.isChapterFinale
                              ? 'Chapter Boss'
                              : `Stage ${lvl.levelNumber}`}
                        </h4>
                      </div>

                      {!levelUnlocked ? (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : rec?.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-600 text-white shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <StarIcon
                            key={s}
                            filled={(rec?.stars ?? 0) >= s}
                            className="w-3.5 h-3.5 text-slate-400"
                          />
                        ))}
                      </div>
                      <span className="font-mono-num font-semibold text-slate-600 dark:text-slate-300">
                        {rec?.bestTime ? `${Math.round(rec.bestTime)}s` : `Par ${lvl.parTimeSeconds}s`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'outfits' && (
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SANTA_OUTFITS.map((outfit) => {
              const unlocked = outfit.unlockCheck(stats);
              const equipped = progress.selectedOutfit === outfit.id;
              const coatHex = '#' + outfit.coatColor.toString(16).padStart(6, '0');
              const trimHex = '#' + outfit.trimColor.toString(16).padStart(6, '0');
              const accentHex = '#' + outfit.accentColor.toString(16).padStart(6, '0');

              return (
                <div
                  key={outfit.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                    equipped
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20'
                      : unlocked
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full border border-slate-400/50"
                          style={{ backgroundColor: coatHex }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-slate-400/50"
                          style={{ backgroundColor: trimHex }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-400/50"
                          style={{ backgroundColor: accentHex }}
                        />
                      </div>
                      {equipped ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                          <Check className="w-3 h-3" /> Equipped
                        </span>
                      ) : unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Sparkles className="w-3.5 h-3.5" /> Unlocked
                        </span>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="mt-2.5 h-36 w-full rounded-xl bg-gradient-to-b from-sky-200/90 via-blue-100/85 to-indigo-100/90 dark:from-slate-900/95 dark:to-slate-950/95 border border-slate-200/80 dark:border-slate-700/70 relative flex items-center justify-center overflow-hidden">
                      <ModelPreview3D
                        target={{ kind: 'outfit', id: outfit.id }}
                        interactive
                        autoSpin={equipped}
                        label={`${outfit.name} 3D model`}
                        className="w-full h-full"
                      />
                      <span className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Drag to rotate
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-extrabold mt-2.5">
                      {outfit.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {outfit.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {outfit.unlockRequirementLabel}
                    </span>
                    {unlocked && !equipped && (
                      <button
                        type="button"
                        onClick={() => onSelectOutfit(outfit.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shrink-0"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
