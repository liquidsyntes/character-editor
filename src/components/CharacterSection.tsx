import React from 'react';
import { SectionDef } from '@/types/character';
import { getSectionFilledCount } from '@/lib/schema';

interface CharacterSectionProps {
  section: SectionDef;
  isOpen: boolean;
  data: Record<string, string>;
  fixedFields: string[];
  aiLoading: boolean;
  aiSectionLoading: string | null;
  aiFieldLoading: string | null;
  aiAbortRef: React.MutableRefObject<AbortController | null>;
  handleAiFillSection: (sectionId: string) => void;
  handleAiFillField: (fieldId: string) => void;
  handleAiCondenseField: (fieldId: string, text: string) => void;
  handleChange: (fieldId: string, value: string) => void;
  toggleSection: () => void;
}

const SECTION_PREFIXES: Record<string, string> = {
  basic: 'BD',
  psychology: 'PS',
  goals: 'CM',
  relations: 'OP',
  habits: 'PM',
  backstory: 'IP',
  secrets: 'US',
  role: 'RI',
  arc: 'AI',
  screen: 'EP',
  stress: 'RS',
  social: 'SS',
  storyConnection: 'SI',
  cheatCode: 'CC',
  innerWorld: 'VM',
  shadow: 'TP',
  fearDesire: 'SJ',
  trauma: 'PT',
  intimacy: 'OB',
  morality: 'ZM',
  bodyHabits: 'BT',
  speechVoice: 'RG',
  selfDeception: 'IL',
  extreme: 'ES',
};

export function CharacterSection({
  section,
  isOpen,
  data,
  fixedFields,
  aiLoading,
  aiSectionLoading,
  aiFieldLoading,
  aiAbortRef,
  handleAiFillSection,
  handleAiFillField,
  handleAiCondenseField,
  handleChange,
  toggleSection,
}: CharacterSectionProps) {
  const sectionFilled = getSectionFilledCount(section.id, data);
  const prefix = SECTION_PREFIXES[section.id] || 'XX';

  return (
    <section id={section.id} className="scroll-mt-20">
      <h2 
        className="font-label-caps text-label-caps text-on-surface-variant mb-stack-md uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
        onClick={toggleSection}
      >
        <span className="material-symbols-outlined text-[16px]">{isOpen ? 'expand_more' : 'chevron_right'}</span>
        {section.label}
        <span className="ml-auto text-[10px] bg-surface-variant px-2 py-1 rounded">
          {sectionFilled} / {section.fields.length}
        </span>
        <button 
          className={`ml-2 transition-colors p-1 rounded ${aiSectionLoading === section.id ? 'bg-error text-on-error' : 'bg-surface-container hover:bg-primary hover:text-on-primary'}`}
          onClick={e => { 
            e.stopPropagation(); 
            if (aiSectionLoading === section.id) {
              aiAbortRef.current?.abort();
            } else {
              handleAiFillSection(section.id);
            }
          }}
          title={aiSectionLoading === section.id ? "Отменить запрос" : "Автозаполнить секцию"}
          disabled={aiSectionLoading !== null && aiSectionLoading !== section.id}
        >
          {aiSectionLoading === section.id ? (
            <span className="material-symbols-outlined text-[16px]">close</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">magic_button</span>
          )}
        </button>
      </h2>
      
      {isOpen && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {section.fields.map((field, index) => {
              const spanClass = field.span === 2 ? 'md:col-span-2' : 
                                field.span === 3 ? 'md:col-span-3' : 
                                'md:col-span-6';
              const isFixed = fixedFields.includes(field.id);
              const isSectionLoading = aiLoading || aiSectionLoading === section.id;
              const isFieldLoading = aiFieldLoading === field.id;
              const fieldCode = `${prefix}${String(index + 1).padStart(2, '0')}`;
              
              return (
                <div key={field.id} id={field.id} className={`p-4 border rounded w-full ${spanClass} transition-all duration-500 ${isFixed ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface border-outline-variant'} ${isSectionLoading || isFieldLoading || aiFieldLoading === field.id + '-condense' ? 'animate-pulse bg-surface-container/50' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex-grow">
                      <span className="font-bold text-primary/70 mr-3">{fieldCode} |</span>
                      {field.label}
                    </label>
                    <div className="flex gap-1 ml-2">
                      {data[field.id] && data[field.id].length > 10 && (
                        <button
                          type="button"
                          className={`text-[12px] p-0.5 rounded transition-colors ${aiFieldLoading === field.id + '-condense' ? 'bg-error text-on-error' : 'text-on-surface-variant/50 hover:bg-primary/10 hover:text-primary'} ${isSectionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isSectionLoading || (aiFieldLoading !== null && aiFieldLoading !== field.id + '-condense')}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (aiFieldLoading === field.id + '-condense') {
                              aiAbortRef.current?.abort();
                            } else {
                              handleAiCondenseField(field.id, data[field.id]);
                            }
                          }}
                          title={aiFieldLoading === field.id + '-condense' ? "Отменить сжатие" : "Ужать текст (оставить суть)"}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {aiFieldLoading === field.id + '-condense' ? 'close' : 'compress'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={`text-[12px] p-0.5 rounded transition-colors ${isFieldLoading && aiFieldLoading !== field.id + '-condense' ? 'bg-error text-on-error' : 'text-on-surface-variant/50 hover:bg-primary/10 hover:text-primary'} ${isSectionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSectionLoading || (aiFieldLoading !== null && aiFieldLoading !== field.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFieldLoading && aiFieldLoading !== field.id + '-condense') {
                             aiAbortRef.current?.abort();
                          } else {
                             handleAiFillField(field.id);
                          }
                        }}
                        title={isFieldLoading && aiFieldLoading !== field.id + '-condense' ? "Отменить генерацию поля" : "Сгенерировать/расширить это поле (Magic Wand)"}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isFieldLoading && aiFieldLoading !== field.id + '-condense' ? 'close' : 'magic_button'}
                        </span>
                      </button>
                    </div>
                  </div>
                  {field.type === 'select' ? (
                    <select
                      className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none"
                      value={data[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                    >
                      <option value="" disabled>Выберите...</option>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none resize-y min-h-[60px]"
                      placeholder={field.placeholder}
                      value={data[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      rows={3}
                      autoComplete="off"
                    />
                  ) : (
                    <input
                      className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none"
                      type="text"
                      placeholder={field.placeholder}
                      value={data[field.id] || ''}
                      onChange={e => handleChange(field.id, e.target.value)}
                      autoComplete="off"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
