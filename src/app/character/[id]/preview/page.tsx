import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) notFound();

  let data: CharacterData = {};
  try { data = JSON.parse(character.data); } catch {}

  const charName = character.name || [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Безымянный персонаж';

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background h-full">
      <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="font-label-caps text-[14px] font-medium text-on-surface-variant/70 lowercase">Редактор персонажа</div>
        </div>
        <nav className="hidden md:flex gap-8">
          <span className="text-on-surface-variant font-label-caps text-label-caps py-2">Режим: Просмотр</span>
        </nav>
        <div className="flex items-center gap-4">
          <Link href={`/character/${id}`} className="bg-primary text-on-primary px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform">
            Редактировать
          </Link>
        </div>
      </header>

      <div className="p-container-padding pb-32 max-w-[800px] mx-auto space-y-stack-lg">
        {/* Character Header: Identity */}
        <section className="flex flex-col md:flex-row gap-gutter items-start">
        {/* Photo Upload Placeholder */}
        <div className="shrink-0 group cursor-pointer">
          <div className="w-32 h-40 bg-surface-container-high border border-outline-variant flex flex-col items-center justify-center text-on-surface-variant group-hover:bg-surface-container-highest transition-colors relative overflow-hidden">
            {character.emoji ? (
              <span className="text-[64px]">{character.emoji}</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">add_a_photo</span>
                <span className="font-label-caps text-[10px] uppercase tracking-widest opacity-50">Фото</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 w-full space-y-4 pt-2">
          {/* Name Input (Readonly in Preview) */}
          <div>
            <input 
              className="w-full text-display-lg font-display-lg text-primary bg-transparent input-underline placeholder:text-outline focus:ring-0 px-0 focus:outline-none uppercase" 
              placeholder="ИМЯ ПЕРСОНАЖА" 
              type="text" 
              value={charName}
              readOnly
            />
          </div>

          {/* Role / Archetype Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {data.roleInStory ? (
              <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
                {data.roleInStory}
              </span>
            ) : (
              <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase opacity-50">
                Роль не указана
              </span>
            )}
            
            <span className="bg-primary/10 text-primary font-mono-data text-[12px] px-2 py-1 rounded">
              Обновлено: {character.updatedAt.toLocaleDateString('ru-RU')}
            </span>
            <Link href={`/character/${id}`} className="ml-auto bg-surface-container-highest text-primary font-label-caps text-label-caps px-3 py-1.5 rounded hover:bg-white transition-colors">
              Редактировать
            </Link>
          </div>
        </div>
      </section>

      <hr className="border-outline-variant" />

      {/* Sections dynamically generated from Schema */}
      {CHARACTER_SCHEMA.map(section => {
        const filledFields = section.fields.filter(
          f => data[f.id] && data[f.id].trim() !== ''
        );
        if (filledFields.length === 0) return null;

        return (
          <section key={section.id}>
            <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-md uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {section.label}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filledFields.map(field => (
                  <div key={field.id} className={`bg-surface p-4 border border-outline-variant rounded w-full ${field.type === 'textarea' ? 'col-span-full' : ''}`}>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <div className="w-full bg-transparent border-none p-0 font-body-md text-on-surface whitespace-pre-wrap">
                        {data[field.id]}
                      </div>
                    ) : (
                      <input 
                        className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0" 
                        type="text" 
                        value={data[field.id]} 
                        readOnly 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );
}
