import React, { useState } from 'react';
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
  AlertCircle, AlertTriangle, Info,
} from 'lucide-react';

const SEVERITY_STYLES = {
  error: { icon: AlertCircle, color: 'text-red-500', badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  info: { icon: Info, color: 'text-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
};

export default function WritingAssistant({ content, writingMode, editorApi }) {
  const [tab, setTab] = useState('format');
  const [autoMode, setAutoMode] = useState(false);

  // Proofread state
  const [corrections, setCorrections] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  // Imagery state
  const [suggestions, setSuggestions] = useState([]);
  const [imageryLoading, setImageryLoading] = useState(false);

  function runProofread() {
    setProofLoading(true);
    setDismissed(new Set());
    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 5) {
        setCorrections([]);
        return;
      }
      const issues = checkSpellingAndGrammar(text);
      setCorrections(issues);
    } catch (err) {
      console.error('Proofread error:', err);
      setCorrections([]);
    } finally {
      setProofLoading(false);
    }
  }

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
    if (editorApi?.replaceText && corrected !== original) {
      editorApi.replaceText(original, corrected);
    }
    setDismissed(prev => new Set([...prev, index]));
  }

  function dismissIssue(index) {
    setDismissed(prev => new Set([...prev, index]));
  }

  function applyAllFixes() {
    corrections.forEach((c, i) => {
      if (!dismissed.has(i) && c.corrected && c.corrected !== c.original && editorApi?.replaceText) {
        editorApi.replaceText(c.original, c.corrected);
      }
    });
    setCorrections([]);
    setDismissed(new Set());
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  const visibleCorrections = corrections.filter((_, i) => !dismissed.has(i));
  const errorCount = visibleCorrections.filter(c => c.severity === 'error').length;
  const warningCount = visibleCorrections.filter(c => c.severity === 'warning').length;
  const infoCount = visibleCorrections.filter(c => c.severity === 'info').length;

  return (
    <div className="w-80 border-l bg-card overflow-y-auto scrollbar-thin p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Writing Assistant</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full h-4 w-4 inline-flex items-center justify-center">
                {visibleCorrections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="imagery" className="flex-1 text-xs">Imagery</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="mt-3">
          <FormattingAssistant content={content} writingMode={writingMode} />
        </TabsContent>

        <TabsContent value="proofread" className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Local scan (instant, free)</p>
            <Button variant="outline" size="sm" onClick={runProofread} disabled={proofLoading}>
              {proofLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Scan
            </Button>
          </div>

          {corrections.length > 0 && visibleCorrections.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {errorCount > 0 && (
                <Badge className="text-[9px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {infoCount} note{infoCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          {visibleCorrections.filter(c => c.corrected && c.corrected !== c.original).length > 0 && (
            <Button variant="secondary" size="sm" className="w-full text-xs" onClick={applyAllFixes}>
              <CheckCircle className="h-3 w-3 mr-1" /> Auto-fix All ({visibleCorrections.filter(c => c.corrected !== c.original).length})
            </Button>
          )}

          {corrections.length === 0 && !proofLoading && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Click Scan to check spelling and grammar.</p>
              <p className="text-[10px] text-muted-foreground mt-1">Runs locally — instant, no API needed.</p>
            </div>
          )}

          {corrections.length > 0 && visibleCorrections.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-green-600 font-medium">All clear!</p>
            </div>
          )}

          {visibleCorrections.map((c) => {
            const realIdx = corrections.indexOf(c);
            const meta = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.info;
            const Icon = meta.icon;
            const canFix = c.corrected && c.corrected !== c.original;
            return (
              <Card key={realIdx} className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                  <div className="flex-1 min-w-0">
                    {canFix && (
                      <>
                        <p className="text-xs line-through text-red-500/80 break-words">{c.original}</p>
                        <p className="text-xs text-green-600 font-medium break-words">{c.corrected}</p>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
                    <Badge className={`text-[8px] mt-1 ${meta.badge}`}>{c.severity}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canFix && (
                    <Button size="sm" variant="ghost" className="text-xs h-6 text-green-600" onClick={() => applyFix(c.original, c.corrected, realIdx)}>
                      <Check className="h-3 w-3 mr-1" /> Fix
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-6 text-muted-foreground" onClick={() => dismissIssue(realIdx)}>
                    Dismiss
                  </Button>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="imagery" className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Requires LLM API</p>
            <Button variant="outline" size="sm" onClick={runImagery} disabled={imageryLoading}>
              {imageryLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
              {imageryLoading ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>

          {suggestions.length === 0 && !imageryLoading && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Click Regenerate for imagery suggestions.
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
