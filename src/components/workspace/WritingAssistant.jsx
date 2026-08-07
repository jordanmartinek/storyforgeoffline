import React, { useState, useEffect, useRef, useCallback } from 'react';
import { htmlToPlainText } from '@/lib/writingAssistant';
import { checkSpellingAndGrammar } from '@/lib/spellcheck';
import { generateImagerySuggestions } from '@/lib/imageryAssistant';
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
  onIssueCount, // callback: (number) => void — just the count for the footer
}) {
  const [tab, setTab] = useState('proofread');
  const [autoMode, setAutoMode] = useState(false); // default OFF to prevent crashes on load

  // Proofread state
  const [corrections, setCorrections] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const autoScanTimer = useRef(null);
  const lastScannedText = useRef('');
  const isMounted = useRef(true);

  // Imagery state
  const [suggestions, setSuggestions] = useState([]);
  const [imageryLoading, setImageryLoading] = useState(false);

  // Track mount state to prevent setState after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Auto-scan: debounced 3s after content changes (only if panel is open + auto on)
  useEffect(() => {
    if (!autoMode || tab !== 'proofread') return;
    if (!content || content.length < 10) return;

    const text = htmlToPlainText(content);
    if (!text || text.length < 10 || text === lastScannedText.current) return;

    if (autoScanTimer.current) clearTimeout(autoScanTimer.current);
    autoScanTimer.current = setTimeout(() => {
      doScan();
    }, 3000);

    return () => {
      if (autoScanTimer.current) clearTimeout(autoScanTimer.current);
    };
  }, [content, autoMode, tab]);

  async function doScan() {
    if (proofLoading) return; // don't stack scans
    setProofLoading(true);
    setDismissed(new Set());

    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 5) {
        if (isMounted.current) {
          setCorrections([]);
          if (onIssueCount) onIssueCount(0);
        }
        return;
      }

      lastScannedText.current = text;
      const issues = await checkSpellingAndGrammar(text);

      // Validate: make sure issues is a proper array of objects
      const validIssues = Array.isArray(issues)
        ? issues.filter(i => i && typeof i === 'object' && typeof i.original === 'string')
        : [];

      if (isMounted.current) {
        setCorrections(validIssues);
        if (onIssueCount) onIssueCount(validIssues.length);
      }
    } catch (err) {
      console.error('[WritingAssistant] Scan error:', err);
      if (isMounted.current) {
        setCorrections([]);
        if (onIssueCount) onIssueCount(0);
      }
    } finally {
      if (isMounted.current) {
        setProofLoading(false);
      }
    }
  }

  async function runImagery() {
    setImageryLoading(true);
    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 30) {
        setSuggestions([]);
        return;
      }
      const results = generateImagerySuggestions(text);
      if (isMounted.current) {
        setSuggestions(results);
      }
    } catch (err) {
      console.error('Imagery error:', err);
      if (isMounted.current) setSuggestions([]);
    } finally {
      if (isMounted.current) setImageryLoading(false);
    }
  }

  function applyFix(correction, index) {
    if (editorApi?.replaceText && correction.corrected && correction.corrected !== correction.original) {
      editorApi.replaceText(correction.original, correction.corrected);
    }
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  function applyReplacement(correction, replacement, index) {
    if (editorApi?.replaceText && replacement && replacement !== correction.original) {
      editorApi.replaceText(correction.original, replacement);
    }
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  function dismissIssue(index) {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  function applyAllFixes() {
    const toFix = corrections.filter((c, i) => !dismissed.has(i) && c.corrected && c.corrected !== c.original);
    // Apply in reverse order so positions don't shift
    const sorted = [...toFix].sort((a, b) => (b.position || 0) - (a.position || 0));
    for (const c of sorted) {
      if (editorApi?.replaceText) {
        editorApi.replaceText(c.original, c.corrected);
      }
    }
    setCorrections([]);
    setDismissed(new Set());
    if (onIssueCount) onIssueCount(0);
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text);
  }

  const visibleCorrections = corrections.filter((_, i) => !dismissed.has(i));
  const errorCount = visibleCorrections.filter(c => c.severity === 'error').length;
  const warningCount = visibleCorrections.filter(c => c.severity === 'warning').length;
  const styleCount = visibleCorrections.filter(c => c.severity === 'style').length;

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {proofLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                <p className="text-[10px] text-muted-foreground">
                  {proofLoading ? 'Scanning...' : autoMode ? 'Auto (3s delay)' : 'Click Scan'}
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={doScan} disabled={proofLoading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${proofLoading ? 'animate-spin' : ''}`} />
                Scan
              </Button>
            </div>

            {/* Summary badges */}
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

            {/* Empty / all-clear states */}
            {corrections.length === 0 && !proofLoading && (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {lastScannedText.current ? 'No issues found!' : 'Click Scan to check your writing'}
                </p>
              </div>
            )}

            {corrections.length > 0 && visibleCorrections.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-green-600 font-medium">All resolved!</p>
              </div>
            )}

            {/* Issue cards */}
            {visibleCorrections.map((c, visibleIdx) => {
              const realIdx = corrections.indexOf(c);
              const meta = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.info;
              const Icon = meta.icon;
              const canFix = c.corrected && c.corrected !== c.original;
              const hasMultipleReplacements = Array.isArray(c.replacements) && c.replacements.length > 1;

              return (
                <Card
                  key={`${realIdx}-${c.original}`}
                  className={`p-3 border-l-4 ${meta.bg}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      {/* Show the error + fix */}
                      {canFix ? (
                        <p className="text-xs font-mono bg-muted/50 rounded px-1.5 py-0.5 mb-1.5 break-words">
                          <span className="line-through text-red-500/80">{c.original}</span>
                          <span className="text-green-600 ml-1">→ {c.corrected}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-mono bg-muted/50 rounded px-1.5 py-0.5 mb-1.5 break-words">
                          {c.original}
                        </p>
                      )}

                      <p className="text-[11px] text-foreground/80 leading-snug">{c.reason}</p>

                      {/* Multiple replacements */}
                      {hasMultipleReplacements && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.replacements.map((rep, ri) => (
                            <button
                              key={ri}
                              onClick={() => applyReplacement(c, rep, realIdx)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                            >
                              {rep}
                            </button>
                          ))}
                        </div>
                      )}

                      <Badge className={`text-[8px] mt-1.5 ${meta.badge}`}>{meta.label}</Badge>
                    </div>

                    <button onClick={() => dismissIssue(realIdx)} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Single fix button */}
                  {canFix && !hasMultipleReplacements && (
                    <div className="mt-2">
                      <Button
                        size="sm" variant="ghost"
                        className="text-xs h-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => applyFix(c, realIdx)}
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
              <p className="text-xs text-muted-foreground">Local analysis (instant)</p>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={runImagery} disabled={imageryLoading}>
                {imageryLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                {imageryLoading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {suggestions.length === 0 && !imageryLoading && (
              <div className="text-center py-6">
                <Wand2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Click Analyze for imagery suggestions.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Weak verbs, show-don't-tell, metaphors, sensory gaps</p>
              </div>
            )}

            {suggestions.map((s, i) => (
              <Card key={i} className="p-3 border-l-4 border-l-violet-500">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] mb-1.5 capitalize bg-violet-50 text-violet-700 dark:bg-violet-900 dark:text-violet-200">{s.type}</Badge>
                    <p className="text-[11px] leading-snug font-medium">{s.suggestion}</p>
                    {s.effect && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 italic">{s.effect}</p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyText(s.suggestion)}>
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
