'use client';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function TooltipInfo({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-white/20 hover:text-white/50 transition-colors"
        type="button"
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {show && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-48 bg-[#1a1a2e] border border-white/[0.1] rounded-lg p-2.5 text-[11px] text-white/70 z-50 shadow-xl">
          {content}
        </div>
      )}
    </div>
  );
}
