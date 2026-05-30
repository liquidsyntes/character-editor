import Link from 'next/link';
import { CHARACTER_SCHEMA } from '@/lib/schema';

export default function CharacterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editor-grid">
      {/* SideNavBar */}
      <aside className="sidebar-mobile-hidden fixed left-0 top-0 h-full flex flex-col w-sidebar-width z-30 bg-primary-container">
        {/* Brand/Header */}
        <div className="p-container-padding pb-6 border-b border-white/10">
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-primary">Chars Edit</h1>
          <p className="font-body-md text-body-md mt-1 text-on-primary-container">Без названия</p>
        </div>
        {/* Navigation Tabs */}
        <nav className="flex-1 py-4 custom-scrollbar overflow-y-auto">
          <ul className="space-y-1">
            {CHARACTER_SCHEMA.map(section => {
              const iconMap: Record<string, string> = {
                basic: 'person_book',
                psychology: 'psychology',
                goals: 'track_changes',
                relations: 'hub',
                habits: 'routine',
                backstory: 'history',
                secrets: 'key',
                role: 'movie',
                arc: 'show_chart',
                screen: 'theaters',
                stress: 'bolt',
                social: 'account_balance',
                storyConnection: 'link',
                cheatCode: 'vpn_key',
                innerWorld: 'all_inclusive',
                shadow: 'contrast',
                fearDesire: 'local_fire_department',
                trauma: 'heart_broken',
                intimacy: 'favorite',
                morality: 'balance',
                bodyHabits: 'accessibility_new',
                speechVoice: 'record_voice_over',
                selfDeception: 'masks',
                extreme: 'warning'
              };
              
              return (
                <li key={section.id}>
                  <Link href={`#${section.id}`} className="flex items-center px-6 py-2.5 text-on-primary-container hover:text-on-primary hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined mr-4">{iconMap[section.id] || 'article'}</span>
                    <span className="font-label-caps text-label-caps tracking-wider truncate" title={section.label}>{section.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <main className="md:ml-[375px] flex flex-col h-screen overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
