import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LORE_CATEGORIES } from '@/lib/bibleMeta';
import Connections from './Connections';
import { Save, Trash2 } from 'lucide-react';

export default function LoreDetail({ lore, onSave, onDelete, connections, onCreateConnection, onDeleteConnection, allEntities }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (lore) setForm({ ...lore });
  }, [lore?.id]);

  if (!lore) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a lore entry to view details
      </div>
    );
  }

  function handleSave() {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    onSave(lore.id, data);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{lore.name}</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}><Save className="h-3 w-3 mr-1" /> Save</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(lore.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category || 'other'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(LORE_CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Summary</Label>
        <Textarea value={form.summary || ''} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
      </div>

      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input value={(form.tags || []).join(', ')} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
      </div>

      <Connections
        entityType="lore"
        entityId={lore.id}
        connections={connections}
        allEntities={allEntities}
        onCreateConnection={onCreateConnection}
        onDeleteConnection={onDeleteConnection}
      />
    </div>
  );
}
