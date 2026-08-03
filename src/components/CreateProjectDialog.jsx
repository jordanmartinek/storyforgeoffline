import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const GENRES = [
  'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery',
  'Horror', 'Literary', 'Historical', 'Adventure', 'Dystopian',
  'Comedy', 'Drama', 'Western', 'Crime',
];

const STATUSES = ['planning', 'drafting', 'revising', 'complete'];

export default function CreateProjectDialog({ open, onOpenChange, project, onSave }) {
  const [form, setForm] = useState({
    title: '',
    genre: '',
    synopsis: '',
    status: 'planning',
    target_word_count: 80000,
    writing_mode: 'novel',
  });

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || '',
        genre: project.genre || '',
        synopsis: project.synopsis || '',
        status: project.status || 'planning',
        target_word_count: project.target_word_count || 80000,
        writing_mode: project.writing_mode || 'novel',
      });
    } else {
      setForm({
        title: '',
        genre: '',
        synopsis: '',
        status: 'planning',
        target_word_count: 80000,
        writing_mode: 'novel',
      });
    }
  }, [project, open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Your story title..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select value={form.genre} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
                <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                <SelectContent>
                  {GENRES.map(g => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={form.writing_mode} onValueChange={v => setForm(f => ({ ...f, writing_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novel">Novel</SelectItem>
                  <SelectItem value="screenplay">Screenplay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Synopsis</Label>
            <Textarea
              value={form.synopsis}
              onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
              placeholder="Brief description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Words</Label>
              <Input
                type="number"
                value={form.target_word_count}
                onChange={e => setForm(f => ({ ...f, target_word_count: Number(e.target.value) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
