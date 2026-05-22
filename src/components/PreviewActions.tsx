'use client';

export default function PreviewActions() {
  return (
    <button className="btn btn-sm" onClick={() => window.print()}>🖨 Печать</button>
  );
}
