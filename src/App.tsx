import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChapterCompleteModal,
  ChapterIntroModal,
} from './components/ChapterIntroModal';
import { GameHUD } from './components/GameHUD';
import { LevelSelectModal } from './components/LevelSelectModal';
import {
  GameOverModal,
  LevelClearModal,
  PauseModal,
  SoundSettingsModal,
  VictoryCelebrationOverlay,
} from './components/StatusModals';
import { TitleOverlay } from './components/TitleOverlay';
import { SantaSceneManager } from './game/SantaSceneManager';
import { audioEngine } from './game/audio';
import {
  CHAPTERS,
  getChapterById,
  getOutfitById,
} from './game/chapters';
import {
  ALL_LEVELS,
  getChapterByNumber,
  getLevelsForChapter,
} from './game/levels';
import { computeStars, createSimState, getHudSnapshot } from './game/simulation';
import type {
  AudioSettings,
  GameScreenState,
  GlobalProgressStats,
  HudSnapshot,
  LevelDefinition,
  SantaOutfitId,
  SaveProgressData,
  SimState,
  ThemeMode,
} from './game/types';

const THEME_STORAGE_KEY = 'santa_worldwide_theme_v2';
const PROGRESS_STORAGE_KEY = 'santa_worldwide_progress_v2';

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

function loadInitialProgress(): SaveProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveProgressData>;
      return {
        levels: parsed.levels ?? {},
        totalCookies: parsed.totalCookies ?? 0,
        totalDeliveries: parsed.totalDeliveries ?? 0,
        selectedOutfit: parsed.selectedOutfit ?? 'classic_red',
        seenChapterIntros: parsed.seenChapterIntros ?? {},
      };
    }
  } catch {
    // Ignore storage errors
  }
  return {
    levels: {},
    totalCookies: 0,
    totalDeliveries: 0,
    selectedOutfit: 'classic_red',
    seenChapterIntros: {},
  };
}

function computeGlobalStats(progress: SaveProgressData): GlobalProgressStats {
  let levelsCompleted = 0;
  let totalStars = 0;
  for (const lvl of ALL_LEVELS) {
    const rec = progress.levels[lvl.id];
    if (rec?.completed) {
      levelsCompleted++;
      totalStars += rec.stars ?? 0;
    }
  }

  let chaptersCompleted = 0;
  let highestChapterUnlocked = 1;
  let contiguous = true;
  for (const ch of CHAPTERS) {
    const chLevels = getLevelsForChapter(ch.id);
    const allCleared = chLevels.every((l) => progress.levels[l.id]?.completed);
    if (allCleared) {
      chaptersCompleted++;
      if (contiguous && ch.chapterNumber < 20) {
        highestChapterUnlocked = ch.chapterNumber + 1;
      }
    } else {
      contiguous = false;
    }
  }

  return {
    levelsCompleted,
    chaptersCompleted,
    totalStars,
    totalCookies: progress.totalCookies,
    totalDeliveries: progress.totalDeliveries,
    highestChapterUnlocked,
  };
}

function findResumeLevel(progress: SaveProgressData): LevelDefinition {
  for (const lvl of ALL_LEVELS) {
    if (!progress.levels[lvl.id]?.completed) {
      return lvl;
    }
  }
  return ALL_LEVELS[0];
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SantaSceneManager | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    audioEngine.getSettings(),
  );
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);
  const [progress, setProgress] = useState<SaveProgressData>(loadInitialProgress);
  const [currentLevel, setCurrentLevel] = useState<LevelDefinition>(() =>
    findResumeLevel(loadInitialProgress()),
  );
  const [screenState, setScreenState] = useState<GameScreenState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });
  const [levelSelectReturnTo, setLevelSelectReturnTo] = useState<
    'title' | 'paused'
  >('title');

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const sim = createSimState(currentLevel);
    return getHudSnapshot(sim, currentLevel);
  });

  const [endSummary, setEndSummary] = useState<{
    score: number;
    elapsedTime: number;
    hpRemaining: number;
    stars: number;
    cookiesCollected: number;
    cookiesRequired: number;
    deliveredHouses: number;
    totalHouses: number;
  }>({
    score: 0,
    elapsedTime: 0,
    hpRemaining: 100,
    stars: 1,
    cookiesCollected: 0,
    cookiesRequired: 0,
    deliveredHouses: 0,
    totalHouses: 0,
  });

  const screenStateRef = useRef<GameScreenState>(screenState);
  screenStateRef.current = screenState;

  const globalStats = useMemo(() => computeGlobalStats(progress), [progress]);
  const resumeLevel = useMemo(() => findResumeLevel(progress), [progress]);

  // Persist progress whenever it changes
  const saveProgress = useCallback((updater: (prev: SaveProgressData) => SaveProgressData) => {
    setProgress((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Sync Tailwind .dark class and persist UI theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
    sceneRef.current?.applyTheme(theme);
  }, [theme]);

  // Sync Santa outfit
  useEffect(() => {
    sceneRef.current?.setOutfit(progress.selectedOutfit);
  }, [progress.selectedOutfit]);

  // Sync document.body.dataset.state
  useEffect(() => {
    const mapped =
      screenState === 'level-clear' ||
      screenState === 'chapter-complete' ||
      screenState === 'game-over' ||
      screenState === 'victory'
        ? 'gameover'
        : screenState === 'level-select'
          ? levelSelectReturnTo
          : screenState === 'chapter-intro'
            ? 'title'
            : screenState;
    document.body.dataset.state = mapped;
    sceneRef.current?.setScreenState(screenState);
  }, [screenState, levelSelectReturnTo]);

  const handleLevelComplete = useCallback(
    (sim: SimState, level: LevelDefinition) => {
      const earnedStars = computeStars(sim, level.parTimeSeconds);
      const finalScore = Math.round(sim.score);

      setEndSummary({
        score: finalScore,
        elapsedTime: sim.elapsedTime,
        hpRemaining: Math.round(sim.player.hp),
        stars: earnedStars,
        cookiesCollected: sim.cookiesCollected,
        cookiesRequired: sim.cookiesRequired,
        deliveredHouses: sim.deliveredHouses,
        totalHouses: sim.totalHouses,
      });

      saveProgress((prev) => {
        const existing = prev.levels[level.id];
        return {
          ...prev,
          totalCookies: prev.totalCookies + sim.cookiesCollected,
          totalDeliveries: prev.totalDeliveries + sim.deliveredHouses,
          levels: {
            ...prev.levels,
            [level.id]: {
              completed: true,
              bestScore: Math.max(existing?.bestScore ?? 0, finalScore),
              bestTime: existing?.bestTime
                ? Math.min(existing.bestTime, sim.elapsedTime)
                : sim.elapsedTime,
              stars: Math.max(existing?.stars ?? 0, earnedStars),
            },
          },
        };
      });

      if (level.isFinale) {
        sceneRef.current?.triggerVictoryCelebration();
        setScreenState('victory');
      } else if (level.isChapterFinale) {
        setScreenState('chapter-complete');
      } else {
        setScreenState('level-clear');
      }
    },
    [saveProgress],
  );

  const handleGameOver = useCallback((sim: SimState, _level: LevelDefinition) => {
    audioEngine.stopMusic();
    setEndSummary({
      score: Math.round(sim.score),
      elapsedTime: sim.elapsedTime,
      hpRemaining: 0,
      stars: 0,
      cookiesCollected: sim.cookiesCollected,
      cookiesRequired: sim.cookiesRequired,
      deliveredHouses: sim.deliveredHouses,
      totalHouses: sim.totalHouses,
    });
    setScreenState('game-over');
  }, []);

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const manager = new SantaSceneManager(
      container,
      theme,
      progress.selectedOutfit,
      {
        onHudUpdate: (snapshot) => setHud(snapshot),
        onLevelComplete: handleLevelComplete,
        onGameOver: handleGameOver,
      },
    );
    sceneRef.current = manager;
    if (currentLevel.id !== ALL_LEVELS[0].id) {
      manager.loadLevel(currentLevel);
    }
    manager.setScreenState(screenStateRef.current);

    return () => {
      manager.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const launchLevel = useCallback(
    (level: LevelDefinition, skipIntro = false) => {
      audioEngine.unlock();
      blurActiveElement();
      setCurrentLevel(level);
      sceneRef.current?.loadLevel(level);

      const shouldShowIntro =
        !skipIntro &&
        level.levelNumber === 1 &&
        !progress.seenChapterIntros[level.chapterId];

      if (shouldShowIntro) {
        audioEngine.stopMusic();
        setScreenState('chapter-intro');
      } else {
        audioEngine.startMusic('day');
        setScreenState('playing');
      }
    },
    [progress.seenChapterIntros],
  );

  const handleConfirmChapterIntro = useCallback(() => {
    audioEngine.unlock();
    audioEngine.startMusic('day');
    blurActiveElement();
    saveProgress((prev) => ({
      ...prev,
      seenChapterIntros: {
        ...prev.seenChapterIntros,
        [currentLevel.chapterId]: true,
      },
    }));
    setScreenState('playing');
  }, [currentLevel.chapterId, saveProgress]);

  const handleStartFromTitle = useCallback(() => {
    launchLevel(resumeLevel, false);
  }, [launchLevel, resumeLevel]);

  const handleRestart = useCallback(() => {
    audioEngine.unlock();
    audioEngine.startMusic('day');
    blurActiveElement();
    sceneRef.current?.restartCurrentLevel();
    setScreenState('playing');
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleUpdateAudio = useCallback((partial: Partial<AudioSettings>) => {
    audioEngine.unlock();
    const updated = audioEngine.updateSettings(partial);
    setAudioSettings(updated);
  }, []);

  const handleToggleMute = useCallback(() => {
    audioEngine.unlock();
    const updated = audioEngine.updateSettings({ muted: !audioSettings.muted });
    setAudioSettings(updated);
  }, [audioSettings.muted]);

  const handleSelectOutfit = useCallback(
    (outfitId: SantaOutfitId) => {
      saveProgress((prev) => ({ ...prev, selectedOutfit: outfitId }));
    },
    [saveProgress],
  );

  const handleNextLevel = useCallback(() => {
    const nextIdx = currentLevel.globalIndex + 1;
    if (nextIdx < ALL_LEVELS.length) {
      launchLevel(ALL_LEVELS[nextIdx], false);
    }
  }, [currentLevel.globalIndex, launchLevel]);

  // Global keyboard controls (Enter/Space on Title, P/Esc Pause, R Restart, M Mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const state = screenStateRef.current;

      if (showSoundSettings) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setShowSoundSettings(false);
        }
        return;
      }

      const isEnter = e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter';

      if (state === 'title' && (isEnter || e.code === 'Space')) {
        e.preventDefault();
        handleStartFromTitle();
        return;
      }

      if (state === 'chapter-intro' && (isEnter || e.code === 'Space')) {
        e.preventDefault();
        handleConfirmChapterIntro();
        return;
      }

      if ((state === 'level-clear' || state === 'chapter-complete') && isEnter) {
        const activeBtn =
          document.activeElement instanceof HTMLButtonElement
            ? document.activeElement
            : null;
        if (!activeBtn || activeBtn.dataset.start === 'true') {
          e.preventDefault();
          handleNextLevel();
        }
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'playing') {
          e.preventDefault();
          audioEngine.stopMusic();
          setScreenState('paused');
        } else if (state === 'paused') {
          e.preventDefault();
          audioEngine.startMusic();
          blurActiveElement();
          setScreenState('playing');
        } else if (state === 'level-select') {
          e.preventDefault();
          setScreenState(levelSelectReturnTo);
        }
        return;
      }

      if (
        e.code === 'KeyR' &&
        (state === 'playing' || state === 'paused' || state === 'game-over')
      ) {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleConfirmChapterIntro,
    handleNextLevel,
    handleRestart,
    handleStartFromTitle,
    handleToggleMute,
    levelSelectReturnTo,
    showSoundSettings,
  ]);

  const currentChapter = getChapterById(currentLevel.chapterId);
  const nextLevel =
    currentLevel.globalIndex + 1 < ALL_LEVELS.length
      ? ALL_LEVELS[currentLevel.globalIndex + 1]
      : null;
  const nextChapter =
    currentChapter.chapterNumber < 20
      ? getChapterByNumber(currentChapter.chapterNumber + 1)
      : null;

  const unlockedOutfitName = currentChapter.unlockOutfitId
    ? getOutfitById(currentChapter.unlockOutfitId).name
    : undefined;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-sky-100 dark:bg-slate-950">
      {/* Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        data-testid="game-canvas"
        className="fixed inset-0 w-full h-full"
      />

      {/* Title Screen */}
      {screenState === 'title' && (
        <TitleOverlay
          theme={theme}
          muted={audioSettings.muted}
          resumeLevel={resumeLevel}
          stats={globalStats}
          onStartGame={handleStartFromTitle}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
          onToggleTheme={handleToggleTheme}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Chapter Introduction Screen */}
      {screenState === 'chapter-intro' && (
        <ChapterIntroModal
          chapter={currentChapter}
          levelNumber={currentLevel.levelNumber}
          onStartChapter={handleConfirmChapterIntro}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screenState === 'playing' || screenState === 'paused') && (
        <GameHUD
          hud={hud}
          theme={theme}
          muted={audioSettings.muted}
          onToggleTheme={handleToggleTheme}
          onToggleMute={handleToggleMute}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
          onPause={() => {
            audioEngine.stopMusic();
            setScreenState('paused');
          }}
          onRestart={handleRestart}
          onOpenLevelSelect={() => {
            audioEngine.stopMusic();
            setLevelSelectReturnTo('paused');
            setScreenState('level-select');
          }}
          onDpadChange={(mx, mz) => sceneRef.current?.setDpadIntent(mx, mz)}
        />
      )}

      {/* Chapters (20x10 = 200 Levels) & Outfits Modal */}
      {screenState === 'level-select' && (
        <LevelSelectModal
          progress={progress}
          stats={globalStats}
          currentLevel={currentLevel}
          onSelectLevel={(lvl) => launchLevel(lvl, false)}
          onSelectOutfit={handleSelectOutfit}
          onClose={() => setScreenState(levelSelectReturnTo)}
        />
      )}

      {/* Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          level={currentLevel}
          onResume={() => {
            audioEngine.startMusic();
            blurActiveElement();
            setScreenState('playing');
          }}
          onRestart={handleRestart}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('paused');
            setScreenState('level-select');
          }}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
          onGoTitle={() => {
            audioEngine.stopMusic();
            setScreenState('title');
          }}
        />
      )}

      {/* Level Clear Modal (Levels 1-9 of a chapter) */}
      {screenState === 'level-clear' && (
        <LevelClearModal
          level={currentLevel}
          hasNextLevel={nextLevel !== null}
          nextLevel={nextLevel}
          score={endSummary.score}
          elapsedTime={endSummary.elapsedTime}
          hpRemaining={endSummary.hpRemaining}
          stars={endSummary.stars}
          cookiesCollected={endSummary.cookiesCollected}
          deliveredHouses={endSummary.deliveredHouses}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
        />
      )}

      {/* Chapter Complete Modal (Level 10 of Chapters 1-19) */}
      {screenState === 'chapter-complete' && (
        <ChapterCompleteModal
          completedChapter={currentChapter}
          nextChapter={nextChapter}
          score={endSummary.score}
          elapsedTime={endSummary.elapsedTime}
          stars={endSummary.stars}
          unlockedOutfitName={unlockedOutfitName}
          onContinueNextChapter={handleNextLevel}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
          onReplayLevel={handleRestart}
        />
      )}

      {/* Game Over Modal (HP reaches 0) */}
      {screenState === 'game-over' && (
        <GameOverModal
          level={currentLevel}
          score={endSummary.score}
          elapsedTime={endSummary.elapsedTime}
          cookiesCollected={endSummary.cookiesCollected}
          cookiesRequired={endSummary.cookiesRequired}
          deliveredHouses={endSummary.deliveredHouses}
          totalHouses={endSummary.totalHouses}
          onRetry={handleRestart}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
          onGoTitle={() => {
            audioEngine.stopMusic();
            setScreenState('title');
          }}
        />
      )}

      {/* North Pole Grand Victory Celebration (Chapter 20 Level 10) */}
      {screenState === 'victory' && (
        <VictoryCelebrationOverlay
          score={endSummary.score}
          elapsedTime={endSummary.elapsedTime}
          stars={endSummary.stars}
          onPlayAgain={() => launchLevel(ALL_LEVELS[0], true)}
          onOpenLevelSelect={() => {
            setLevelSelectReturnTo('title');
            setScreenState('level-select');
          }}
          onGoTitle={() => {
            audioEngine.stopMusic();
            setScreenState('title');
          }}
        />
      )}

      {/* Sound & Music Volume Settings */}
      {showSoundSettings && (
        <SoundSettingsModal
          settings={audioSettings}
          onUpdate={handleUpdateAudio}
          onClose={() => setShowSoundSettings(false)}
        />
      )}
    </main>
  );
}
