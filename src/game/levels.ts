import { CHAPTERS, getChapterById } from './chapters';
import { generateLevel } from './mazeGenerator';
import type { ChapterDefinition, ChapterId, LevelDefinition } from './types';

function buildAllLevels(): LevelDefinition[] {
  const levels: LevelDefinition[] = [];
  const usedLayouts = new Set<string>();
  let globalIndex = 0;

  for (const chapter of CHAPTERS) {
    for (let lvl = 1; lvl <= 10; lvl++) {
      const level = generateLevel(chapter, lvl, globalIndex, usedLayouts);
      levels.push(level);
      globalIndex++;
    }
  }
  return levels;
}

export const ALL_LEVELS: LevelDefinition[] = buildAllLevels();

// Keep LEVELS export alias for compatibility
export const LEVELS = ALL_LEVELS;

export { CHAPTERS, getChapterById };

export function getLevelById(id: string): LevelDefinition {
  return ALL_LEVELS.find((l) => l.id === id) ?? ALL_LEVELS[0];
}

export function getLevelsForChapter(chapterId: ChapterId): LevelDefinition[] {
  return ALL_LEVELS.filter((l) => l.chapterId === chapterId);
}

export function getChapterByNumber(chapterNumber: number): ChapterDefinition {
  return CHAPTERS.find((c) => c.chapterNumber === chapterNumber) ?? CHAPTERS[0];
}
