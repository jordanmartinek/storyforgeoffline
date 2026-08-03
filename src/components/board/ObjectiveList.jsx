import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OBJECTIVE_TYPES, OBJECTIVE_STATUS } from '@/lib/gameMeta';
import { Plus, Trash2, Target } from 'lucide-react';

export default function ObjectiveList({ objectives, playerId, projectId, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ project_id: projectId, player_id: playerId, title: title.trim(), type: 'primary', status: 'active', progress: 0 });
    setTitle('');
    setAdding(false);
  }

  const playerObjectives = objectives.filter(o => o.player_id === playerId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-medium flex items-center gap-1">
          <Target className="h-3 w-3" /> Objectives ({playerObjectives.length})
        </h5>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="flex gap-1">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Objective title..." className="h-7 text-xs" autoFocus />
          <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
        </form>
      )}

      {playerObjectives.map(obj => (
        <div key={obj.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted group">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{obj.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge className={`text-[8px] px-1 py-0 ${OBJECTIVE_TYPES[obj.type]?.color || ''}`}>
                {OBJECTIVE_TYPES[obj.type]?.label || obj.type}
              </Badge>
              <Badge className={`text-[8px] px-1 py-0 ${OBJECTIVE_STATUS[obj.status]?.color || ''}`}>
                {OBJECTIVE_STATUS[obj.status]?.label || obj.status}
              </Badge>
            </div>
            <Progress value={obj.progress || 0} className="h-1 mt-1" />
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
            onClick={() => onDelete(obj.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
