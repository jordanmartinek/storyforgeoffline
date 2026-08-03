import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Link } from 'lucide-react';

export default function Connections({
  entityType,
  entityId,
  connections,
  allEntities,
  onCreateConnection,
  onDeleteConnection,
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    target_type: 'character',
    target_id: '',
    relationship_type: '',
    description: '',
    strength: 50,
  });

  // Filter connections for this entity
  const myConnections = connections.filter(
    c => (c.source_type === entityType && c.source_id === entityId) ||
         (c.target_type === entityType && c.target_id === entityId)
  );

  // Get available targets based on selected target_type
  const availableTargets = (allEntities[form.target_type] || [])
    .filter(e => e.id !== entityId);

  function handleAdd() {
    if (!form.target_id || !form.relationship_type) return;
    onCreateConnection({
      source_type: entityType,
      source_id: entityId,
      target_type: form.target_type,
      target_id: form.target_id,
      relationship_type: form.relationship_type,
      description: form.description,
      strength: form.strength,
    });
    setForm({ target_type: 'character', target_id: '', relationship_type: '', description: '', strength: 50 });
    setAdding(false);
  }

  function getEntityName(type, id) {
    const entity = (allEntities[type] || []).find(e => e.id === id);
    return entity?.name || 'Unknown';
  }

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1">
          <Link className="h-3 w-3" /> Connections ({myConnections.length})
        </h4>
        <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {adding && (
        <Card className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Target Type</Label>
              <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v, target_id: '' }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="lore">Lore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target</Label>
              <Select value={form.target_id} onValueChange={v => setForm(f => ({ ...f, target_id: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {availableTargets.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Relationship</Label>
            <Input
              value={form.relationship_type}
              onChange={e => setForm(f => ({ ...f, relationship_type: e.target.value }))}
              placeholder="e.g. ally, rival, lives in..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Strength: {form.strength}</Label>
            <Slider
              value={[form.strength]}
              onValueChange={([v]) => setForm(f => ({ ...f, strength: v }))}
              max={100}
              step={5}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Create</Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-1">
        {myConnections.map(conn => {
          const isSource = conn.source_id === entityId;
          const otherType = isSource ? conn.target_type : conn.source_type;
          const otherId = isSource ? conn.target_id : conn.source_id;
          return (
            <div key={conn.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted group">
              <Badge variant="outline" className="text-[9px] capitalize">{otherType}</Badge>
              <span className="text-xs font-medium flex-1 truncate">
                {getEntityName(otherType, otherId)}
              </span>
              <span className="text-[10px] text-muted-foreground">{conn.relationship_type}</span>
              <span className="text-[10px] text-muted-foreground">({conn.strength}%)</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => onDeleteConnection(conn.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
