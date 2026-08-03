import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LOCATION_TYPES } from '@/lib/bibleMeta';
import { cn } from '@/lib/utils';
import { Plus, MapPin } from 'lucide-react';

export default function LocationList({ locations, selected, onSelect, onCreate }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Locations ({locations.length})</h4>
        <Button variant="ghost" size="sm" onClick={onCreate}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-1">
        {locations.map(l => (
          <button
            key={l.id}
            onClick={() => onSelect(l)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
              selected?.id === l.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
            )}
          >
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{l.name}</p>
              <Badge variant="outline" className="text-[9px]">
                {LOCATION_TYPES[l.type]?.label || l.type || 'Other'}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
