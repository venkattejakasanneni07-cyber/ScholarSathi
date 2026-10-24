import React from 'react';
import { Tri } from '../../engine/types';
import { Check, HelpCircle, Minus } from 'lucide-react';

interface StatusChipProps {
  status: Tri;
  showSublabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  showSublabel = true,
  size = 'md',
}) => {
  let bg = '';
  let text = '';
  let border = '';
  let icon = null;
  let word = '';
  let sublabel = '';

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  if (status === 'MET') {
    bg = 'bg-[#E6F4F1]';
    text = 'text-[#12706F]';
    border = 'border-[#12706F]/30';
    icon = <Check size={iconSize} className="stroke-[3]" />;
    word = 'Met';
    sublabel = 'Likely, not officially confirmed';
  } else if (status === 'UNMET') {
    bg = 'bg-[#F9DADD]';
    text = 'text-[#A8323F]';
    border = 'border-[#A8323F]/30';
    icon = <Minus size={iconSize} className="stroke-[3]" />;
    word = 'Unmet';
    sublabel = 'Unmet (model estimate)';
  } else {
    // UNKNOWN
    bg = 'bg-[#FBEBC8]';
    text = 'text-[#9A5A00]';
    border = 'border-[#F2B84B]';
    icon = <HelpCircle size={iconSize} className="stroke-[2.5]" />;
    word = 'Unknown';
    sublabel = 'Pending or in conflict';
  }

  const padding =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border ${bg} ${text} ${border} ${padding}`}
      >
        {icon}
        <span>{word}</span>
      </span>
      {showSublabel && (
        <span className="text-[10px] text-[#718096] italic leading-tight ml-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
};
