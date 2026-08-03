import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { countWords, readingTime } from '@/lib/wordCount';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

// ReactQuill would be imported in production:
// import ReactQuill from 'react-quill-new';

/**
 * ManuscriptEditor - Rich text editor with autosave.
 * Uses ReactQuill in production; placeholder div here for structure.
 */
export default function ManuscriptEditor({
  scene,
  projectId,
  writingMode,
  onWordCountChange,
  onReady,
}) {
  const qc = useQueryClient();
  const [content, setContent] = useState(scene?.content || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const saveTimerRef = useRef(null);
  const quillRef = useRef(null);

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

  function scheduleSave(html) {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!scene) return;
      const wc = countWords(html);
      setSaveStatus('saving');
      saveMutation.mutate({
        id: scene.id,
        data: { content: html, word_count: wc },
      });
      if (onWordCountChange) onWordCountChange(wc);
    }, 1500);
  }

  function handleChange(value) {
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
      {/* Editor area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* In production this would be ReactQuill */}
          <div
            className="ql-container ql-snow"
            style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', minHeight: '500px' }}
          >
            <textarea
              ref={quillRef}
              value={content}
              onChange={e => handleChange(e.target.value)}
              className="w-full h-full min-h-[500px] p-6 bg-transparent resize-none outline-none font-display text-lg leading-relaxed"
              placeholder="Begin writing your scene..."
            />
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{words.toLocaleString()} words</span>
          <span>{reading} min read</span>
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
