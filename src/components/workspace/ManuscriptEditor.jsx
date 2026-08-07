import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { countWords, readingTime } from '@/lib/wordCount';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

/**
 * ManuscriptEditor with inline error highlighting.
 * Renders a contentEditable div with colored underlines for detected issues.
 */
export default function ManuscriptEditor({
  scene,
  projectId,
  writingMode,
  onWordCountChange,
  onReady,
  issues = [], // array of {position, length, severity} from spellcheck
  onClickIssue, // callback when user clicks an underlined issue
}) {
  const qc = useQueryClient();
  const [content, setContent] = useState(scene?.content || '');
  const [saveStatus, setSaveStatus] = useState('saved');
  const saveTimerRef = useRef(null);
  const editorRef = useRef(null);
  const isComposing = useRef(false);

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
        getContent() {
          return content;
        },
      });
    }
  }, [onReady, content]);

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

  function handleChange(e) {
    const value = e.target.value;
    setContent(value);
    scheduleSave(value);
  }

  // Build highlighted HTML from plain text + issues
  const highlightedHtml = useMemo(() => {
    if (!issues || issues.length === 0 || !content) return null;

    const plainText = content; // since we use a textarea, content IS plain text
    let result = '';
    let lastIdx = 0;

    // Sort issues by position
    const sorted = [...issues].sort((a, b) => a.position - b.position);

    for (const issue of sorted) {
      const start = issue.position;
      const end = start + issue.length;

      // Bounds check
      if (start < lastIdx || start >= plainText.length) continue;
      if (end > plainText.length) continue;

      // Add text before this issue
      result += escapeHtml(plainText.slice(lastIdx, start));

      // Add highlighted span
      const underlineColor =
        issue.severity === 'error' ? '#ef4444' :
        issue.severity === 'warning' ? '#f59e0b' : '#3b82f6';

      const issueText = escapeHtml(plainText.slice(start, end));
      result += `<mark class="issue-highlight" data-idx="${issues.indexOf(issue)}" style="background:transparent;text-decoration:wavy underline ${underlineColor};text-decoration-skip-ink:none;text-underline-offset:3px;cursor:pointer;" title="${escapeHtml(issue.reason)}">${issueText}</mark>`;

      lastIdx = end;
    }

    // Add remaining text
    result += escapeHtml(plainText.slice(lastIdx));

    return result;
  }, [content, issues]);

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
        <div className="max-w-4xl mx-auto relative">
          {/* Highlighted overlay (read-only, shows underlines) */}
          {highlightedHtml && (
            <div
              className="absolute inset-0 p-6 pointer-events-none font-display text-lg leading-relaxed whitespace-pre-wrap break-words text-transparent"
              style={{ minHeight: '500px', border: '1px solid transparent', borderRadius: 'var(--radius)' }}
              aria-hidden="true"
            >
              <div
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                className="pointer-events-auto"
                onClick={(e) => {
                  const mark = e.target.closest('mark.issue-highlight');
                  if (mark && onClickIssue) {
                    const idx = parseInt(mark.dataset.idx, 10);
                    onClickIssue(idx);
                  }
                }}
              />
            </div>
          )}

          {/* Actual editor */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid hsl(var(--border))', minHeight: '500px', background: 'hsl(var(--card))' }}
          >
            <textarea
              ref={editorRef}
              value={content}
              onChange={handleChange}
              className={cn(
                'w-full h-full min-h-[500px] p-6 bg-transparent resize-none outline-none font-display text-lg leading-relaxed',
                highlightedHtml ? 'caret-foreground' : ''
              )}
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
          {issues.length > 0 && (
            <span className="text-amber-600 font-medium">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
