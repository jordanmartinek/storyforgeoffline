import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_META, CHARACTER_STATUS } from '@/lib/bibleMeta';
import { cn } from '@/lib/utils';
import { Plus, User } from 'lucide-react';

export default function CharacterList({ characters, selected, onSelect, onCreate }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Characters ({characters.length})</h4>
        <Button variant="ghost" size="sm" onClick={onCreate}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-1">
        {characters.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
              selected?.id === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
            )}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: c.color || 'hsl(var(--muted))' }}
            >
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <div className="flex items-center gap-1">
                {c.role && (
                  <Badge className={`text-[9px] px-1 py-0 ${ROLE_META[c.role]?.color || ''}`}>
                    {ROLE_META[c.role]?.label || c.role}
                  </Badge>
                )}
                {c.status && c.status !== 'active' && (
                  <Badge className={`text-[9px] px-1 py-0 ${CHARACTER_STATUS[c.status]?.color || ''}`}>
                    {CHARACTER_STATUS[c.status]?.label}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
