import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_META, CHARACTER_STATUS } from '@/lib/bibleMeta';
import Connections from './Connections';
import { Save, Trash2 } from 'lucide-react';

export default function CharacterDetail({ character, onSave, onDelete, connections, onCreateConnection, onDeleteConnection, allEntities }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (character) {
      setForm({ ...character });
    }
  }, [character?.id]);

  if (!character) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a character to view details
      </div>
    );
  }

  function handleSave() {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    onSave(character.id, data);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{character.name}</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(character.id)}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={form.role || ''} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status || 'active'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CHARACTER_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Archetype</Label>
          <Input value={form.archetype || ''} onChange={e => setForm(f => ({ ...f, archetype: e.target.value }))} placeholder="e.g. The Hero, The Trickster" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Color</Label>
          <Input type="color" value={form.color || '#6366f1'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={(form.tags || []).join(', ')} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Current Objective</Label>
          <Textarea value={form.current_objective || ''} onChange={e => setForm(f => ({ ...f, current_objective: e.target.value }))} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Long-term Objective</Label>
          <Textarea value={form.long_term_objective || ''} onChange={e => setForm(f => ({ ...f, long_term_objective: e.target.value }))} rows={2} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Motivation</Label>
          <Textarea value={form.motivation || ''} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Conflict</Label>
          <Textarea value={form.conflict || ''} onChange={e => setForm(f => ({ ...f, conflict: e.target.value }))} rows={2} />
        </div>
      </div>

      {/* Connections */}
      <Connections
        entityType="character"
        entityId={character.id}
        connections={connections}
        allEntities={allEntities}
        onCreateConnection={onCreateConnection}
        onDeleteConnection={onDeleteConnection}
      />
    </div>
  );
}
