import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SIDE_META, PLAYER_STATUS } from '@/lib/gameMeta';
import ObjectiveList from './ObjectiveList';
import ResourceList from './ResourceList';
import { Save, Trash2 } from 'lucide-react';

const STATS = [
  { key: 'initiative', label: 'Initiative', color: 'text-blue-500' },
  { key: 'pressure', label: 'Pressure', color: 'text-orange-500' },
  { key: 'morale', label: 'Morale', color: 'text-green-500' },
  { key: 'threat_level', label: 'Threat', color: 'text-red-500' },
  { key: 'victory_progress', label: 'Victory', color: 'text-purple-500' },
];

export default function PlayerDetail({
  player, objectives, resources, projectId,
  onSave, onDelete,
  onCreateObjective, onDeleteObjective,
  onCreateResource, onDeleteResource,
}) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (player) setForm({ ...player });
  }, [player?.id]);

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a player to view details
      </div>
    );
  }

  function handleSave() {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    onSave(player.id, data);
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{player.name}</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}><Save className="h-3 w-3 mr-1" /> Save</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(player.id)}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Side</Label>
          <Select value={form.side || 'neutral'} onValueChange={v => setForm(f => ({ ...f, side: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SIDE_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={form.status || 'active'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PLAYER_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat sliders */}
      <div className="space-y-3">
        {STATS.map(stat => (
          <div key={stat.key} className="space-y-1">
            <div className="flex justify-between">
              <Label className={`text-xs ${stat.color}`}>{stat.label}</Label>
              <span className="text-xs text-muted-foreground">{form[stat.key] || 0}</span>
            </div>
            <Slider
              value={[form[stat.key] || 0]}
              onValueChange={([v]) => setForm(f => ({ ...f, [stat.key]: v }))}
              max={100} step={5}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Strategy</Label>
        <Textarea value={form.current_strategy || ''} onChange={e => setForm(f => ({ ...f, current_strategy: e.target.value }))} rows={2} className="text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Known Information</Label>
          <Textarea value={form.known_information || ''} onChange={e => setForm(f => ({ ...f, known_information: e.target.value }))} rows={2} className="text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hidden Information</Label>
          <Textarea value={form.hidden_information || ''} onChange={e => setForm(f => ({ ...f, hidden_information: e.target.value }))} rows={2} className="text-xs" />
        </div>
      </div>

      <Separator />

      {/* Objectives */}
      <ObjectiveList
        objectives={objectives}
        playerId={player.id}
        projectId={projectId}
        onCreate={onCreateObjective}
        onDelete={onDeleteObjective}
      />

      <Separator />

      {/* Resources */}
      <ResourceList
        resources={resources}
        playerId={player.id}
        projectId={projectId}
        onCreate={onCreateResource}
        onDelete={onDeleteResource}
      />
    </div>
  );
}
