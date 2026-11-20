import { Award, Compass, Gift, Map, Play, Sparkles } from 'lucide-react';
import type { ChapterDefinition } from '../game/types';
import { StarIcon } from './GameIcons';
import { ModelPreview3D } from './ModelPreview3D';

interface ChapterIntroModalProps {
  chapter: ChapterDefinition;
  levelNumber: number;
  onStartChapter: () => void;
  onOpenLevelSelect: () => void;
}

export function ChapterIntroModal({
  chapter,
  levelNumber,
  onStartChapter,
  onOpenLevelSelect,
}: ChapterIntroModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-intro-heading"
    >
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-amber-400">
            <Compass className="w-4 h-4" />
            <span>Chapter {chapter.chapterNumber} of 20 · 10 Levels</span>
          </span>
          {chapter.isFinale && (
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase">
              Grand Finale
            </span>
          )}
        </div>

        <h2
          id="chapter-intro-heading"
          className="font-display text-2xl sm:text-3xl font-extrabold mt-1.5 leading-tight"
        >
          {chapter.title}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
          {chapter.subtitle}
        </p>

        <div className="mt-3.5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-44 h-36 rounded-2xl bg-gradient-to-b from-sky-200/90 to-indigo-100/90 dark:from-slate-800 dark:to-slate-950 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
            <ModelPreview3D
              target={{ kind: 'chapter', id: chapter.id }}
              autoSpin
              interactive
              label={`${chapter.cityName} 3D model`}
              className="w-full h-full"
            />
          </div>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {chapter.introStory}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Environment & Decor
            </p>
            <p className="font-semibold mt-0.5">{chapter.decorationsLabel}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chapter Challenge
            </p>
            <p className="font-semibold mt-0.5">{chapter.specialFeatureLabel}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm">
          <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong className="font-bold">Chapter Reward:</strong> {chapter.rewardLabel}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onStartChapter}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm sm:text-base shadow-lg transition-colors whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              Start {chapter.cityName} · Level {levelNumber}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
          >
            <Map className="w-4 h-4" />
            <span>Chapters</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChapterCompleteModalProps {
  completedChapter: ChapterDefinition;
  nextChapter: ChapterDefinition | null;
  score: number;
  elapsedTime: number;
  stars: number;
  unlockedOutfitName?: string;
  onContinueNextChapter: () => void;
  onOpenLevelSelect: () => void;
  onReplayLevel: () => void;
}

export function ChapterCompleteModal({
  completedChapter,
  nextChapter,
  score,
  elapsedTime,
  stars,
  unlockedOutfitName,
  onContinueNextChapter,
  onOpenLevelSelect,
  onReplayLevel,
}: ChapterCompleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-complete-heading"
    >
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-400/60 dark:border-emerald-500/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Chapter {completedChapter.chapterNumber}/20 Complete!
              </p>
              <h2
                id="chapter-complete-heading"
                className="font-display text-2xl sm:text-3xl font-extrabold leading-tight"
              >
                {completedChapter.cityName} Cleared!
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3].map((s) => (
              <StarIcon
                key={s}
                filled={stars >= s}
                className="w-6 h-6 text-slate-400"
              />
            ))}
          </div>
        </div>

        <p className="mt-3.5 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
          {completedChapter.completionStory}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Level 10 Score
            </p>
            <p className="font-mono-num text-xl font-extrabold mt-0.5">{score}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clear Time
            </p>
            <p className="font-mono-num text-xl font-extrabold mt-0.5">
              {Math.round(elapsedTime)}s
            </p>
          </div>
        </div>

        {unlockedOutfitName && (
          <div className="mt-3.5 rounded-2xl border border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              New Santa Outfit Unlocked: <strong>{unlockedOutfitName}</strong>! Equip it in
              Chapters &amp; Outfits.
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {nextChapter && (
            <button
              type="button"
              data-start="true"
              autoFocus
              onClick={onContinueNextChapter}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                Fly to Chapter {nextChapter.chapterNumber}: {nextChapter.cityName}
              </span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-emerald-700/90 border border-emerald-300/40 text-[11px] font-mono font-bold uppercase tracking-wide">
                Enter
              </kbd>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onReplayLevel}
              className="inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
            >
              Replay Stage
            </button>
            <button
              type="button"
              onClick={onOpenLevelSelect}
              className="inline-flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
            >
              <Map className="w-4 h-4" />
              <span>All Chapters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
