export default function CharacterLoading() {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background animate-pulse">
      <header className="h-16 border-b border-outline-variant bg-surface flex items-center px-6">
        <div className="w-32 h-4 bg-surface-container rounded"></div>
        <div className="ml-auto flex gap-4">
          <div className="w-24 h-8 bg-surface-container rounded-full"></div>
          <div className="w-32 h-8 bg-primary/20 rounded"></div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden p-6 max-w-[800px] mx-auto w-full">
        <div className="flex gap-6 mb-12">
          <div className="w-32 h-40 bg-surface-container rounded"></div>
          <div className="flex-1 space-y-4 pt-2">
            <div className="w-3/4 h-12 bg-surface-container rounded"></div>
            <div className="flex gap-2">
              <div className="w-20 h-6 bg-surface-container rounded"></div>
              <div className="w-20 h-6 bg-surface-container rounded"></div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="w-48 h-6 bg-surface-container rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-6 h-24 bg-surface-container rounded"></div>
                <div className="md:col-span-3 h-16 bg-surface-container rounded"></div>
                <div className="md:col-span-3 h-16 bg-surface-container rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
