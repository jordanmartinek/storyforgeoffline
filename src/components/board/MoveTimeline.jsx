import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MOVE_OUTCOMES, MOVE_RISK } from '@/lib/gameMeta';
import { Plus, Trash2, Sword, X } from 'lucide-react';

export default function MoveTimeline({ moves, players, objectives, projectId, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    player_id: '',
    objective_id: '',
    title: '',
    description: '',
    intent: '',
    outcome: 'pending',
    consequences: '',
    state_changes: '',
    risk: 'medium',
  });

  function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.player_id) return;
    onCreate({
      project_id: projectId,
      ...form,
      order: moves.length,
      story_order: moves.length,
    });
    setForm({ player_id: '', objective_id: '', title: '', description: '', intent: '', outcome: 'pending', consequences: '', state_changes: '', risk: 'medium' });
    setAdding(false);
  }

  const sortedMoves = [...moves].sort((a, b) => (a.order || 0) - (b.order || 0));

  function getPlayerName(id) {
    return players.find(p => p.id === id)?.name || 'Unknown';
  }

  function getObjectiveTitle(id) {
    return objectives.find(o => o.id === id)?.title || '';
  }

  return (
    <div className="w-72 border-l flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <Sword className="h-3 w-3" /> Moves ({moves.length})
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAdding(!adding)}>
          {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-3 border-b space-y-2 bg-muted/50">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Player</Label>
              <Select value={form.player_id} onValueChange={v => setForm(f => ({ ...f, player_id: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Who?" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Target Objective</Label>
              <Select value={form.objective_id} onValueChange={v => setForm(f => ({ ...f, objective_id: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="(optional)" /></SelectTrigger>
                <SelectContent>
                  {objectives.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Move title..." className="h-7 text-xs" />
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description..." rows={2} className="text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOVE_OUTCOMES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.risk} onValueChange={v => setForm(f => ({ ...f, risk: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOVE_RISK).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" className="w-full h-7 text-xs">Record Move</Button>
        </form>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedMoves.map((move, idx) => (
            <div key={move.id} className="border rounded-md p-2 hover:bg-muted/50 group relative">
              <Button
                variant="ghost" size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => onDelete(move.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                <span className="text-xs font-medium truncate flex-1">{move.title}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="text-[8px]">{getPlayerName(move.player_id)}</Badge>
                <Badge className={`text-[8px] px-1 py-0 ${MOVE_OUTCOMES[move.outcome]?.color || ''}`}>
                  {MOVE_OUTCOMES[move.outcome]?.label || move.outcome}
                </Badge>
                <Badge className={`text-[8px] px-1 py-0 ${MOVE_RISK[move.risk]?.color || ''}`}>
                  {MOVE_RISK[move.risk]?.label || move.risk}
                </Badge>
              </div>
              {move.objective_id && (
                <p className="text-[9px] text-muted-foreground mt-1 truncate">
                  → {getObjectiveTitle(move.objective_id)}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
