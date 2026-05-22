import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import Link from 'next/link';
import PreviewActions from '@/components/PreviewActions';

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

  const charName = character.name || data.name || 'Безымянный персонаж';

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <Link href={`/character/${id}`} className="btn btn-back btn-ghost btn-sm">
            <span className="arrow">←</span> Редактор
          </Link>
          <div className="toolbar-dot"></div>
          <span className="toolbar-title">Просмотр</span>
        </div>
        <div className="toolbar-right">
          <PreviewActions />
        </div>
      </header>

      <div className="preview-page">
        <div className="preview-header">
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{character.emoji}</div>
          <h1 className="preview-name">{charName}</h1>
          <p className="preview-meta">
            Обновлено {character.updatedAt.toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {CHARACTER_SCHEMA.map(section => {
          const filledFields = section.fields.filter(
            f => data[f.id] && data[f.id].trim() !== ''
          );
          if (filledFields.length === 0) return null;

          return (
            <div key={section.id} className="preview-section">
              <h2 className="preview-section-title">
                <span>{section.icon}</span> {section.label}
              </h2>
              {filledFields.map(field => (
                <div key={field.id} className="preview-field">
                  <div className="preview-field-label">{field.label}</div>
                  <div className="preview-field-value">{data[field.id]}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
