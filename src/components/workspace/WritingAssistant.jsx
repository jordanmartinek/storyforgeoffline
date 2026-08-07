import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { htmlToPlainText, buildImageryPrompt, IMAGERY_SCHEMA } from '@/lib/writingAssistant';
import { checkSpellingAndGrammar } from '@/lib/spellcheck';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FormattingAssistant from './FormattingAssistant';
import {
  RefreshCw, Loader2, Check, Copy, Wand2, CheckCircle,
  AlertCircle, AlertTriangle, Info, Sparkles, X,
} from 'lucide-react';

const SEVERITY_STYLES = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'border-l-red-500', badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Spelling' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'Grammar' },
  style: { icon: Sparkles, color: 'text-blue-500', bg: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Style' },
  info: { icon: Info, color: 'text-slate-500', bg: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', label: 'Note' },
};

export default function WritingAssistant({
  content,
  writingMode,
  editorApi,
  onIssuesChange, // callback to send issues to parent (for inline highlighting)
  highlightedIssueIdx, // which issue the user clicked in the editor
}) {
  const [tab, setTab] = useState('proofread');
  const [autoMode, setAutoMode] = useState(true); // default ON for better UX

  // Proofread state
  const [corrections, setCorrections] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const autoScanTimer = useRef(null);
  const lastScannedText = useRef('');
  const issueRefs = useRef({});

  // Imagery state
  const [suggestions, setSuggestions] = useState([]);
  const [imageryLoading, setImageryLoading] = useState(false);

  // Auto-scan: debounced 2s after content changes
  useEffect(() => {
    if (!autoMode || tab !== 'proofread') return;

    const text = htmlToPlainText(content);
    if (!text || text.length < 10 || text === lastScannedText.current) return;

    if (autoScanTimer.current) clearTimeout(autoScanTimer.current);
    autoScanTimer.current = setTimeout(() => {
      runProofread();
    }, 2000);

    return () => {
      if (autoScanTimer.current) clearTimeout(autoScanTimer.current);
    };
  }, [content, autoMode, tab]);

  // Scroll to highlighted issue when user clicks in editor
  useEffect(() => {
    if (highlightedIssueIdx != null && issueRefs.current[highlightedIssueIdx]) {
      issueRefs.current[highlightedIssueIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedIssueIdx]);

  const runProofread = useCallback(async () => {
    setProofLoading(true);
    setDismissed(new Set());
    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 5) {
        setCorrections([]);
        if (onIssuesChange) onIssuesChange([]);
        return;
      }
      lastScannedText.current = text;
      const issues = await checkSpellingAndGrammar(text);
      setCorrections(issues);
      if (onIssuesChange) onIssuesChange(issues);
    } catch (err) {
      console.error('Proofread error:', err);
      setCorrections([]);
      if (onIssuesChange) onIssuesChange([]);
    } finally {
      setProofLoading(false);
    }
  }, [content, onIssuesChange]);

  async function runImagery() {
    setImageryLoading(true);
    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 20) {
        setSuggestions([]);
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildImageryPrompt(text.slice(0, 2000)),
        response_json_schema: IMAGERY_SCHEMA,
      });
      setSuggestions(res?.suggestions || []);
    } catch (err) {
      console.error('Imagery error:', err);
    } finally {
      setImageryLoading(false);
    }
  }

  function applyFix(original, corrected, index) {
    if (editorApi?.replaceText && corrected && corrected !== original) {
      editorApi.replaceText(original, corrected);
    }
    setDismissed(prev => new Set([...prev, index]));
    // Update issues for inline highlights
    const remaining = corrections.filter((_, i) => i !== index && !dismissed.has(i));
    if (onIssuesChange) onIssuesChange(remaining);
  }

  function applyReplacement(original, replacement, index) {
    if (editorApi?.replaceText && replacement && replacement !== original) {
      editorApi.replaceText(original, replacement);
    }
    setDismissed(prev => new Set([...prev, index]));
    const remaining = corrections.filter((_, i) => i !== index && !dismissed.has(i));
    if (onIssuesChange) onIssuesChange(remaining);
  }

  function dismissIssue(index) {
    setDismissed(prev => new Set([...prev, index]));
    const remaining = corrections.filter((_, i) => i !== index && !dismissed.has(i));
    if (onIssuesChange) onIssuesChange(remaining);
  }

  function applyAllFixes() {
    corrections.forEach((c, i) => {
      if (!dismissed.has(i) && c.corrected && c.corrected !== c.original && editorApi?.replaceText) {
        editorApi.replaceText(c.original, c.corrected);
      }
    });
    setCorrections([]);
    setDismissed(new Set());
    if (onIssuesChange) onIssuesChange([]);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  const visibleCorrections = corrections.filter((_, i) => !dismissed.has(i));
  const errorCount = visibleCorrections.filter(c => c.severity === 'error').length;
  const warningCount = visibleCorrections.filter(c => c.severity === 'warning').length;
  const styleCount = visibleCorrections.filter(c => c.severity === 'style').length;

  return (
    <div className="w-80 border-l bg-card overflow-y-auto scrollbar-thin flex flex-col h-full">
      <div className="p-4 pb-2 border-b shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Writing Assistant</h3>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <span>{autoMode ? 'Auto' : 'Manual'}</span>
            <button
              onClick={() => setAutoMode(!autoMode)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoMode ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="format" className="flex-1 text-xs">Format</TabsTrigger>
            <TabsTrigger value="proofread" className="flex-1 text-xs">
              Proofread
              {visibleCorrections.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full min-w-[16px] h-4 px-1 inline-flex items-center justify-center">
                  {visibleCorrections.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="imagery" className="flex-1 text-xs">Imagery</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {tab === 'format' && (
          <FormattingAssistant content={content} writingMode={writingMode} />
        )}

        {tab === 'proofread' && (
          <div className="space-y-3">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {proofLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                <p className="text-[10px] text-muted-foreground">
                  {proofLoading ? 'Scanning...' : autoMode ? 'Auto-scanning' : 'Manual mode'}
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={runProofread} disabled={proofLoading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${proofLoading ? 'animate-spin' : ''}`} />
                Scan
              </Button>
            </div>

            {/* Summary */}
            {visibleCorrections.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {errorCount > 0 && (
                  <Badge className="text-[9px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {errorCount} spelling
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {warningCount} grammar
                  </Badge>
                )}
                {styleCount > 0 && (
                  <Badge className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {styleCount} style
                  </Badge>
                )}
              </div>
            )}

            {/* Fix all */}
            {visibleCorrections.filter(c => c.corrected && c.corrected !== c.original).length > 1 && (
              <Button variant="secondary" size="sm" className="w-full text-xs h-7" onClick={applyAllFixes}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Fix All ({visibleCorrections.filter(c => c.corrected && c.corrected !== c.original).length})
              </Button>
            )}

            {/* Empty state */}
            {corrections.length === 0 && !proofLoading && (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {autoMode ? 'No issues detected' : 'Click Scan to check'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Uses LanguageTool (free, no API key)
                </p>
              </div>
            )}

            {/* All dismissed */}
            {corrections.length > 0 && visibleCorrections.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-green-600 font-medium">All resolved!</p>
              </div>
            )}

            {/* Issue cards */}
            {visibleCorrections.map((c) => {
              const realIdx = corrections.indexOf(c);
              const meta = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.info;
              const Icon = meta.icon;
              const canFix = c.corrected && c.corrected !== c.original;
              const isHighlighted = highlightedIssueIdx === realIdx;

              return (
                <Card
                  key={realIdx}
                  ref={(el) => { issueRefs.current[realIdx] = el; }}
                  className={cn(
                    'p-3 border-l-4 transition-all',
                    meta.bg,
                    isHighlighted && 'ring-2 ring-primary shadow-md'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      {/* Context: show the erroneous text */}
                      <p className="text-xs font-mono bg-muted/50 rounded px-1.5 py-0.5 mb-1.5 break-words">
                        <span className="line-through text-red-500/90">{c.original}</span>
                        {canFix && (
                          <span className="text-green-600 ml-1">→ {c.corrected}</span>
                        )}
                      </p>

                      {/* Explanation */}
                      <p className="text-[11px] text-foreground/80 leading-snug">{c.reason}</p>

                      {/* Multiple replacement options */}
                      {c.replacements && c.replacements.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.replacements.map((rep, ri) => (
                            <button
                              key={ri}
                              onClick={() => applyReplacement(c.original, rep, realIdx)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                            >
                              {rep}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category badge */}
                      <Badge className={`text-[8px] mt-1.5 ${meta.badge}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    {/* Dismiss X */}
                    <button
                      onClick={() => dismissIssue(realIdx)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  {canFix && (!c.replacements || c.replacements.length <= 1) && (
                    <div className="mt-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => applyFix(c.original, c.corrected, realIdx)}
                      >
                        <Check className="h-3 w-3 mr-1" /> Fix
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'imagery' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Requires LLM API</p>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={runImagery} disabled={imageryLoading}>
                {imageryLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                {imageryLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>

            {suggestions.length === 0 && !imageryLoading && (
              <p className="text-center text-sm text-muted-foreground py-6">
                Click Generate for imagery suggestions.
              </p>
            )}

            {suggestions.map((s, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] mb-1 capitalize">{s.type}</Badge>
                    <p className="text-sm font-medium">{s.suggestion}</p>
                    {s.effect && <p className="text-xs text-muted-foreground mt-1">{s.effect}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyText(s.suggestion)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
