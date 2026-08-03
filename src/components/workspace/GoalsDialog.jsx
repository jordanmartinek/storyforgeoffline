import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function GoalsDialog({ open, onOpenChange, project, onSave }) {
  const [form, setForm] = useState({
    daily_goal: 1000,
    weekly_goal: 5000,
    monthly_goal: 20000,
    target_word_count: 80000,
    deadline: '',
    writing_mode: 'novel',
  });

  useEffect(() => {
    if (project) {
      setForm({
        daily_goal: project.daily_goal || 1000,
        weekly_goal: project.weekly_goal || 5000,
        monthly_goal: project.monthly_goal || 20000,
        target_word_count: project.target_word_count || 80000,
        deadline: project.deadline || '',
        writing_mode: project.writing_mode || 'novel',
      });
    }
  }, [project, open]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Writing Goals</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Goal</Label>
              <Input
                type="number"
                value={form.daily_goal}
                onChange={e => setForm(f => ({ ...f, daily_goal: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Weekly Goal</Label>
              <Input
                type="number"
                value={form.weekly_goal}
                onChange={e => setForm(f => ({ ...f, weekly_goal: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly Goal</Label>
              <Input
                type="number"
                value={form.monthly_goal}
                onChange={e => setForm(f => ({ ...f, monthly_goal: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Word Count</Label>
              <Input
                type="number"
                value={form.target_word_count}
                onChange={e => setForm(f => ({ ...f, target_word_count: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Writing Mode</Label>
              <Select value={form.writing_mode} onValueChange={v => setForm(f => ({ ...f, writing_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novel">Novel</SelectItem>
                  <SelectItem value="screenplay">Screenplay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Goals</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
