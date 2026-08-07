import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { countWords, readingTime } from '@/lib/wordCount';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

/**
 * ManuscriptEditor - textarea with autosave.
 * Issues are shown in the sidebar WritingAssistant, not inline (to avoid crashes).
 */
export default function ManuscriptEditor({
  scene,
  projectId,
  writingMode,
  onWordCountChange,
  onReady,
  issueCount = 0,
}) {
  const qc = useQueryClient();
  const [content, setContent] = useState(scene?.content || '');
  const [saveStatus, setSaveStatus] = useState('saved');
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setContent(scene?.content || '');
    setSaveStatus('saved');
  }, [scene?.id]);

  // Expose replaceText for WritingAssistant
  useEffect(() => {
    if (onReady) {
      onReady({
        replaceText(original, replacement) {
          setContent(prev => {
            const updated = prev.replace(original, replacement);
            scheduleSave(updated);
            return updated;
          });
        },
      });
    }
  }, [onReady]);

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Scene.update(id, data),
    onSuccess: () => {
      setSaveStatus('saved');
      qc.invalidateQueries({ queryKey: ['scenes', projectId] });
    },
    onError: () => setSaveStatus('unsaved'),
  });

  function scheduleSave(text) {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!scene) return;
      const wc = countWords(text);
      setSaveStatus('saving');
      saveMutation.mutate({
        id: scene.id,
        data: { content: text, word_count: wc },
      });
      if (onWordCountChange) onWordCountChange(wc);
    }, 1500);
  }

  function handleChange(e) {
    const value = e.target.value;
    setContent(value);
    scheduleSave(value);
  }

  const words = countWords(content);
  const reading = readingTime(words);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a scene to start writing</p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 flex flex-col', `writing-${writingMode}`)}>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid hsl(var(--border))', minHeight: '500px', background: 'hsl(var(--card))' }}
          >
            <textarea
              value={content}
              onChange={handleChange}
              className="w-full h-full min-h-[500px] p-6 bg-transparent resize-none outline-none font-display text-lg leading-relaxed"
              placeholder="Begin writing your scene..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{words.toLocaleString()} words</span>
          <span>{reading} min read</span>
          {issueCount > 0 && (
            <span className="text-amber-600 font-medium">
              {issueCount} issue{issueCount !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {saveStatus === 'saved' && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-amber-500">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}
