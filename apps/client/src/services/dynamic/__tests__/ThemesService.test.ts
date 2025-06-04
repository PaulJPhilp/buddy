import { ThemesService } from '../ThemesService';
import { Effect } from 'effect';
import type { ThemeColors } from '@/contexts/ThemeContext';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('ThemesService (Effect.Service)', () => {
  const chatId = 'chat-test';
  const theme = {
    container: {
      borderColor: '#000',
      defaults: {
        headerBar: {
          height: 60,
          color: '#fff',
          font: 'Arial',
          fontStyle: 'normal',
          fontSize: 16,
          fontColor: '#000'
        },
        chatArea: {
          userBubble: {
            color: '#007AFF',
            font: 'Arial',
            fontStyle: 'normal',
            fontSize: 14,
            fontColor: '#fff',
            padding: '8px'
          },
          assistantBubble: {
            color: '#E9E9EB',
            font: 'Arial',
            fontStyle: 'normal',
            fontSize: 14,
            fontColor: '#000',
            padding: '8px'
          },
          userArea: {
            attachmentToolbar: {
              color: '#fff',
              iconColor: '#007AFF',
              iconSize: 24,
              font: 'Arial',
              fontStyle: 'normal',
              fontSize: 14,
              fontColor: '#000',
              padding: '8px'
            },
            inputArea: {
              inactiveRingColor: '#E9E9EB',
              inactiveRingWidth: 1,
              activeRingColor: '#007AFF',
              activeRingWidth: 2,
              inputAreaColor: '#fff',
              font: 'Arial',
              fontStyle: 'normal',
              fontSize: 14,
              fontColor: '#000'
            },
            agentToolbar: {
              color: '#fff',
              iconColor: '#007AFF',
              iconSize: 24,
              font: 'Arial',
              fontStyle: 'normal',
              fontSize: 14,
              fontColor: '#000',
              padding: '8px',
              selectorBackgroundColor: '#F5F5F5'
            }
          }
        }
      }
    },
    headerBar: {
      height: 60,
      color: '#fff',
      font: 'Arial',
      fontStyle: 'normal',
      fontSize: 16,
      fontColor: '#000'
    },
    chatArea: {
      userBubble: {
        color: '#007AFF',
        font: 'Arial',
        fontStyle: 'normal',
        fontSize: 14,
        fontColor: '#fff',
        padding: '8px'
      },
      assistantBubble: {
        color: '#E9E9EB',
        font: 'Arial',
        fontStyle: 'normal',
        fontSize: 14,
        fontColor: '#000',
        padding: '8px'
      },
      userArea: {
        attachmentToolbar: {
          color: '#fff',
          iconColor: '#007AFF',
          iconSize: 24,
          font: 'Arial',
          fontStyle: 'normal',
          fontSize: 14,
          fontColor: '#000',
          padding: '8px'
        },
        inputArea: {
          inactiveRingColor: '#E9E9EB',
          inactiveRingWidth: 1,
          activeRingColor: '#007AFF',
          activeRingWidth: 2,
          inputAreaColor: '#fff',
          font: 'Arial',
          fontStyle: 'normal',
          fontSize: 14,
          fontColor: '#000'
        },
        agentToolbar: {
          color: '#fff',
          iconColor: '#007AFF',
          iconSize: 24,
          font: 'Arial',
          fontStyle: 'normal',
          fontSize: 14,
          fontColor: '#000',
          padding: '8px',
          selectorBackgroundColor: '#F5F5F5'
        }
      }
    }
  } as unknown as ThemeColors;

  const runTest = (test: Effect.Effect<any, never, any>) => 
    Effect.runPromise(Effect.provide(test, ThemesService.Default));

  beforeEach(() => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.resetThemes();
    }))
  );

  it('sets and gets a theme by chatId', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.setTheme(chatId, theme);
      const result = yield* service.getTheme(chatId);
      expect(result).toEqual(theme);
    }))
  );

  it('updates a theme partially', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.setTheme(chatId, theme);
      yield* service.updateTheme(chatId, { background: '#eee' });
      const result = yield* service.getTheme(chatId);
      expect(result?.background).toBe('#eee');
    }))
  );

  it('deletes a theme', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.setTheme(chatId, theme);
      yield* service.deleteTheme(chatId);
      const result = yield* service.getTheme(chatId);
      expect(result).toBeUndefined();
    }))
  );

  it('lists all themes', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.setTheme(chatId, theme);
      const result = yield* service.listThemes();
      expect(result).toHaveProperty(chatId);
    }))
  );

  it('resets all themes', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      yield* service.setTheme(chatId, theme);
      yield* service.resetThemes();
      const result = yield* service.listThemes();
      expect(result).toEqual({});
    }))
  );

  it('saves and loads from JSON file', () => 
    runTest(Effect.gen(function*(_) {
      const service = yield* ThemesService;
      const tmpPath = path.join(__dirname, 'theme-test.json');
      yield* service.setTheme('default', theme);
      yield* service.saveToJsonFile(tmpPath);
      // Clear state and reload
      yield* service.resetThemes();
      yield* service.loadFromJsonFile(tmpPath);
      const loaded = yield* service.getTheme('default');
      expect(loaded).toEqual(theme);
      yield* Effect.promise(() => fs.unlink(tmpPath)); // Clean up
    }))
  );
});
