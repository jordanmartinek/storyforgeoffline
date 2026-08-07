import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { countWords, readingTime } from '@/lib/wordCount';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

/**
 * Classify a line of text for the visual ladder.
 * Returns: 'dialogue' | 'action' | 'empty'
 */
function classifyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';

  // Dialogue: contains quotation marks (straight or curly)
  if (/[""\u201C\u201D]/.test(trimmed)) return 'dialogue';

  return 'action';
}

/**
 * ManuscriptEditor with visual flow ladder on the left gutter.
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
  const [scrollTop, setScrollTop] = useState(0);
  const saveTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const ladderRef = useRef(null);

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

  // Sync scroll between textarea and ladder
  function handleScroll(e) {
    setScrollTop(e.target.scrollTop);
    if (ladderRef.current) {
      ladderRef.current.scrollTop = e.target.scrollTop;
    }
  }

  // Build the ladder: one rung per line
  const lines = useMemo(() => {
    return content.split('\n').map(line => classifyLine(line));
  }, [content]);

  // Calculate line height to match textarea
  // The textarea uses font-display text-lg leading-relaxed = ~28.8px line height
  const LINE_HEIGHT = 28.8; // matches text-lg (1.125rem = 18px) * leading-relaxed (1.75) ≈ 31.5px... we'll use CSS var

  const words = countWords(content);
  const reading = readingTime(words);

  // Stats for the legend
  const dialogueLines = lines.filter(l => l === 'dialogue').length;
  const actionLines = lines.filter(l => l === 'action').length;
  const totalLines = dialogueLines + actionLines;
  const dialoguePct = totalLines > 0 ? Math.round((dialogueLines / totalLines) * 100) : 0;

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a scene to start writing</p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 flex flex-col', `writing-${writingMode}`)}>
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-4xl mx-auto h-full">
          <div
            className="rounded-lg overflow-hidden flex h-full"
            style={{ border: '1px solid hsl(var(--border))', minHeight: '500px', background: 'hsl(var(--card))' }}
          >
            {/* Visual Ladder (left gutter) */}
            <div
              ref={ladderRef}
              className="w-3 shrink-0 overflow-hidden bg-muted/30 border-r border-border/50"
              style={{ paddingTop: '24px' }} // match textarea padding-top (p-6 = 24px)
              aria-hidden="true"
            >
              <div className="flex flex-col">
                {lines.map((type, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-full transition-colors',
                      type === 'dialogue' && 'bg-blue-400 dark:bg-blue-500',
                      type === 'action' && 'bg-amber-300 dark:bg-amber-600',
                      type === 'empty' && 'bg-transparent',
                    )}
                    style={{
                      height: `${LINE_HEIGHT}px`,
                      // Add slight gap between rungs for the "ladder" look
                      marginBottom: '0.5px',
                      borderRadius: '1px',
                      opacity: type === 'empty' ? 0.15 : 0.7,
                    }}
                    title={
                      type === 'dialogue' ? `Line ${i + 1}: Dialogue` :
                      type === 'action' ? `Line ${i + 1}: Narrative` :
                      `Line ${i + 1}: Empty`
                    }
                  />
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onScroll={handleScroll}
              className="w-full h-full min-h-[500px] p-6 bg-transparent resize-none outline-none font-display text-lg leading-relaxed flex-1"
              placeholder="Begin writing your scene..."
              spellCheck={false}
              style={{ lineHeight: `${LINE_HEIGHT}px` }}
            />
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{words.toLocaleString()} words</span>
          <span>{reading} min read</span>
          {totalLines > 0 && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-blue-400" />
                {dialoguePct}% dialogue
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-amber-300" />
                {100 - dialoguePct}% narrative
              </span>
            </span>
          )}
          {issueCount > 0 && (
            <span className="text-amber-600 font-medium">
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
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
