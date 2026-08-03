import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Plus, ChevronRight, ChevronDown, FileText, Trash2, GripVertical,
} from 'lucide-react';

export default function ChapterPanel({
  projectId, chapters, scenes, activeSceneId, onSelectScene,
}) {
  const qc = useQueryClient();
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingSceneTo, setAddingSceneTo] = useState(null);
  const [newSceneTitle, setNewSceneTitle] = useState('');

  const createChapter = useMutation({
    mutationFn: (data) => base44.entities.Chapter.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chapters', projectId] }),
  });

  const createScene = useMutation({
    mutationFn: (data) => base44.entities.Scene.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenes', projectId] }),
  });

  const deleteChapter = useMutation({
    mutationFn: (id) => base44.entities.Chapter.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapters', projectId] });
      qc.invalidateQueries({ queryKey: ['scenes', projectId] });
    },
  });

  const deleteScene = useMutation({
    mutationFn: (id) => base44.entities.Scene.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenes', projectId] }),
  });

  function toggleChapter(id) {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddChapter(e) {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    createChapter.mutate({
      project_id: projectId,
      title: newChapterTitle.trim(),
      order: chapters.length,
    });
    setNewChapterTitle('');
  }

  function handleAddScene(e, chapterId) {
    e.preventDefault();
    if (!newSceneTitle.trim()) return;
    const chapterScenes = scenes.filter(s => s.chapter_id === chapterId);
    createScene.mutate({
      project_id: projectId,
      chapter_id: chapterId,
      title: newSceneTitle.trim(),
      order: chapterScenes.length,
    });
    setNewSceneTitle('');
    setAddingSceneTo(null);
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm mb-2">Chapters</h3>
        <form onSubmit={handleAddChapter} className="flex gap-1">
          <Input
            value={newChapterTitle}
            onChange={e => setNewChapterTitle(e.target.value)}
            placeholder="New chapter..."
            className="h-8 text-xs"
          />
          <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 shrink-0">
            <Plus className="h-3 w-3" />
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedChapters.map(chapter => {
            const isExpanded = expandedChapters.has(chapter.id);
            const chapterScenes = scenes
              .filter(s => s.chapter_id === chapter.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={chapter.id}>
                <div className="flex items-center gap-1 group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    {isExpanded
                      ? <ChevronDown className="h-3 w-3" />
                      : <ChevronRight className="h-3 w-3" />
                    }
                  </Button>
                  <span className="text-sm font-medium truncate flex-1">
                    {chapter.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => setAddingSceneTo(chapter.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() => deleteChapter.mutate(chapter.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {chapterScenes.map(scene => (
                      <button
                        key={scene.id}
                        onClick={() => onSelectScene(scene.id)}
                        className={cn(
                          'flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-left group/scene',
                          activeSceneId === scene.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate flex-1">{scene.title}</span>
                        <span className="text-[10px] opacity-60">
                          {scene.word_count || 0}w
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover/scene:opacity-100 text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteScene.mutate(scene.id); }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </button>
                    ))}
                    {addingSceneTo === chapter.id && (
                      <form onSubmit={(e) => handleAddScene(e, chapter.id)} className="px-2 py-1">
                        <Input
                          autoFocus
                          value={newSceneTitle}
                          onChange={e => setNewSceneTitle(e.target.value)}
                          onBlur={() => setAddingSceneTo(null)}
                          placeholder="Scene title..."
                          className="h-7 text-xs"
                        />
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
