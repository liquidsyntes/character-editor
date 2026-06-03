import React, { useRef } from 'react';

interface HighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export function HighlightedTextarea({ value, onChange, className = '', ...props }: HighlightedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlights = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={i} className="text-error font-bold bg-error/10 rounded-sm">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Shared styles for perfect alignment
  const sharedClasses = "font-mono-data text-[12px] p-3 leading-relaxed w-full h-full whitespace-pre-wrap break-words";

  return (
    <div className={`relative ${className}`}>
      {/* Backdrop (rendered text) */}
      <div 
        ref={backdropRef}
        className={`absolute inset-0 overflow-hidden pointer-events-none text-on-surface ${sharedClasses}`}
        aria-hidden="true"
      >
        {renderHighlights(value)}
        {value.endsWith('\n') ? <br /> : null}
      </div>
      
      {/* Actual textarea (transparent text) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        className={`absolute inset-0 bg-transparent text-transparent caret-on-surface resize-none focus:outline-none border border-outline-variant rounded focus:border-primary ${sharedClasses}`}
        spellCheck={false}
        {...props}
      />
    </div>
  );
}
