import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RESOURCE_CATEGORIES, RESOURCE_STATUS } from '@/lib/gameMeta';
import { Plus, Trash2, Package } from 'lucide-react';

export default function ResourceList({ resources, playerId, projectId, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ project_id: projectId, player_id: playerId, name: name.trim(), category: 'other', status: 'active', quantity: 1 });
    setName('');
    setAdding(false);
  }

  const playerResources = resources.filter(r => r.player_id === playerId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-medium flex items-center gap-1">
          <Package className="h-3 w-3" /> Resources ({playerResources.length})
        </h5>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="flex gap-1">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Resource name..." className="h-7 text-xs" autoFocus />
          <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
        </form>
      )}

      {playerResources.map(res => (
        <div key={res.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted group">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{res.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge className={`text-[8px] px-1 py-0 ${RESOURCE_CATEGORIES[res.category]?.color || ''}`}>
                {RESOURCE_CATEGORIES[res.category]?.label || res.category}
              </Badge>
              <Badge className={`text-[8px] px-1 py-0 ${RESOURCE_STATUS[res.status]?.color || ''}`}>
                {RESOURCE_STATUS[res.status]?.label || res.status}
              </Badge>
              {res.quantity > 1 && <span className="text-[9px] text-muted-foreground">x{res.quantity}</span>}
            </div>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={() => onDelete(res.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
