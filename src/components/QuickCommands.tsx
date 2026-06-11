'use client';

import { CharacterData } from '@/types/character';

interface QuickCommandsProps {
  aiLoading: boolean;
  handleQuickCommand: (cmd: 'lifeEvent' | 'hiddenMotive' | 'innerConflict') => Promise<Partial<CharacterData>>;
  setPendingDiff: (diff: Partial<CharacterData>) => void;
}

export function QuickCommands({ aiLoading, handleQuickCommand, setPendingDiff }: QuickCommandsProps) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-white/50 leading-relaxed">
        Быстрые сценарии для проработки персонажа. Нейросеть сгенерирует новые детали.
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          disabled={aiLoading}
          onClick={async () => {
            try {
              const proposed = await handleQuickCommand('lifeEvent');
              if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
            } catch (e) { console.error(e); }
          }}
          className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
        >
          <span className="text-xl mt-0.5">🎲</span>
          <div className="overflow-hidden">
            <div className="font-semibold text-xs text-white">Случайное событие</div>
            <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Событие из прошлого, наложившее отпечаток на характер.</div>
          </div>
        </button>

        <button
          disabled={aiLoading}
          onClick={async () => {
            try {
              const proposed = await handleQuickCommand('hiddenMotive');
              if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
            } catch (e) { console.error(e); }
          }}
          className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
        >
          <span className="text-xl mt-0.5">🎭</span>
          <div className="overflow-hidden">
            <div className="font-semibold text-xs text-white">Скрытый мотив</div>
            <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Тайная потребность, противоречащая главной цели.</div>
          </div>
        </button>

        <button
          disabled={aiLoading}
          onClick={async () => {
            try {
              const proposed = await handleQuickCommand('innerConflict');
              if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
            } catch (e) { console.error(e); }
          }}
          className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
        >
          <span className="text-xl mt-0.5">⚖️</span>
          <div className="overflow-hidden">
            <div className="font-semibold text-xs text-white">Внутренний конфликт</div>
            <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Борьба между личными убеждениями и поступками.</div>
          </div>
        </button>
      </div>
    </div>
  );
}
