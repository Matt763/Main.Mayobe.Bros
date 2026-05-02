import { useEffect } from 'react';

interface EzoicAdSlotProps {
  id: number;
  className?: string;
}

export function EzoicAdSlot({ id, className }: EzoicAdSlotProps) {
  useEffect(() => {
    return () => {
      window.ezstandalone?.destroyPlaceholders(id);
    };
  }, [id]);

  return (
    <div className={className}>
      <div id={`ezoic-pub-ad-placeholder-${id}`} />
    </div>
  );
}
