import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RESOURCE_CATEGORIES, RESOURCE_STATUS } from '@/lib/gameMeta';

export default function AssetLedger({ resources, players }) {
  if (resources.length === 0) {
    return <p className="text-sm text-muted-foreground">No resources acquired yet.</p>;
  }

  // Group by player
  const grouped = {};
  resources.forEach(r => {
    const owner = players.find(p => p.id === r.player_id)?.name || 'Unowned';
    if (!grouped[owner]) grouped[owner] = [];
    grouped[owner].push(r);
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([owner, items]) => (
        <div key={owner}>
          <h5 className="text-xs font-semibold mb-2">{owner}</h5>
          <div className="space-y-1">
            {items.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50">
                <span className="text-xs font-medium flex-1 truncate">{r.name}</span>
                <Badge className={`text-[8px] ${RESOURCE_CATEGORIES[r.category]?.color || ''}`}>
                  {RESOURCE_CATEGORIES[r.category]?.label || r.category}
                </Badge>
                <Badge className={`text-[8px] ${RESOURCE_STATUS[r.status]?.color || ''}`}>
                  {RESOURCE_STATUS[r.status]?.label || r.status}
                </Badge>
                {r.quantity > 1 && <span className="text-[9px] text-muted-foreground">x{r.quantity}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
