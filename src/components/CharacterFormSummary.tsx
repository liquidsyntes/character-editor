import { CharacterData } from '@/types/character';

interface CharacterFormSummaryProps {
  data: CharacterData;
  charName: string;
  percent: number;
  filled: number;
  total: number;
  isLore: boolean;
  onToggleLore: (val: boolean) => void;
  subtitleOverride?: string;
}

export function CharacterFormSummary({ data, charName, percent, filled, total, isLore, onToggleLore, subtitleOverride }: CharacterFormSummaryProps) {
  return (
    <section className="flex flex-col md:flex-row gap-gutter items-start">
      <div className="shrink-0 flex flex-col gap-2">
        <div className="group cursor-pointer">
          <div className="w-32 h-40 bg-surface-container-high border border-outline-variant flex flex-col items-center justify-center text-on-surface-variant group-hover:bg-surface-container-highest transition-colors relative overflow-hidden">
            <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">add_a_photo</span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest opacity-50">Фото</span>
          </div>
        </div>
        <button
          onClick={() => onToggleLore(!isLore)}
          className={`w-32 flex flex-col items-center justify-center py-2 rounded border transition-colors ${isLore ? 'bg-[#f97316]/10 border-[#f97316] text-[#f97316]' : 'bg-surface border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'}`}
        >
          <span className="font-label-caps text-[10px] uppercase leading-tight text-center">Лорный<br/>Персонаж</span>
        </button>
      </div>
      <div className="flex-1 w-full space-y-4 pt-2">
        <div>
          <input 
            className="w-full text-display-lg font-display-lg text-primary bg-transparent input-underline placeholder:text-outline focus:ring-0 px-0 focus:outline-none uppercase" 
            placeholder="ИМЯ ПЕРСОНАЖА" 
            type="text" 
            value={charName}
            readOnly
          />
          <div className="text-[12px] text-outline mt-1 font-label-caps">{subtitleOverride || 'Чтобы изменить имя, заполните Имя и Фамилию в Досье'}</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {data.characterFunction && (
            <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
              {data.characterFunction}
            </span>
          )}
          {data.plotSignificance && (
            <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
              {data.plotSignificance}
            </span>
          )}
          {!data.characterFunction && !data.plotSignificance && (
            <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase opacity-50">
              Роль не указана
            </span>
          )}
          <span className={`${percent === 100 ? 'bg-[#22c55e]/10 text-[#22c55e]' : percent >= 50 ? 'bg-[#f97316]/10 text-[#f97316]' : percent > 0 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-surface-variant text-on-surface-variant'} font-mono-data text-[12px] px-2 py-1 rounded transition-colors duration-300`}>
            Прогресс: {filled}/{total} ({percent}%)
          </span>
        </div>
      </div>
    </section>
  );
}
