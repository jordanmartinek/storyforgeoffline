import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { htmlToPlainText, buildProofreadPrompt, buildImageryPrompt, PROOF_SCHEMA, IMAGERY_SCHEMA } from '@/lib/writingAssistant';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import FormattingAssistant from './FormattingAssistant';
import {
  RefreshCw, Loader2, Check, Copy, Wand2, CheckCircle, AlertCircle,
} from 'lucide-react';

export default function WritingAssistant({ content, writingMode, editorApi }) {
  const [tab, setTab] = useState('format');
  const [autoMode, setAutoMode] = useState(false);

  // Proofread state
  const [corrections, setCorrections] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);

  // Imagery state
  const [suggestions, setSuggestions] = useState([]);
  const [imageryLoading, setImageryLoading] = useState(false);

  async function runProofread() {
    setProofLoading(true);
    try {
      const text = htmlToPlainText(content);
      if (!text || text.length < 20) {
        setCorrections([]);
        return;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildProofreadPrompt(text.slice(0, 3000)),
        response_json_schema: PROOF_SCHEMA,
      });
      setCorrections(res?.corrections || []);
    } catch (err) {
      console.error('Proofread error:', err);
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

  function applyFix(original, corrected) {
    if (editorApi?.replaceText) {
      editorApi.replaceText(original, corrected);
      setCorrections(prev => prev.filter(c => c.original !== original));
    }
  }

  function applyAllFixes() {
    corrections.forEach(c => {
      if (editorApi?.replaceText) {
        editorApi.replaceText(c.original, c.corrected);
      }
    });
    setCorrections([]);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

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
          <TabsTrigger value="proofread" className="flex-1 text-xs">Proofread</TabsTrigger>
          <TabsTrigger value="imagery" className="flex-1 text-xs">Imagery</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="mt-3">
          <FormattingAssistant content={content} writingMode={writingMode} />
        </TabsContent>

        <TabsContent value="proofread" className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">~3 credits per check</p>
            <Button variant="outline" size="sm" onClick={runProofread} disabled={proofLoading}>
              {proofLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {proofLoading ? 'Checking...' : 'Recheck'}
            </Button>
          </div>

          {corrections.length > 0 && (
            <Button variant="secondary" size="sm" className="w-full text-xs" onClick={applyAllFixes}>
              <CheckCircle className="h-3 w-3 mr-1" /> Auto-fix All ({corrections.length})
            </Button>
          )}

          {corrections.length === 0 && !proofLoading && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Click Recheck to analyze your text.
            </p>
          )}

          {corrections.map((c, i) => (
            <Card key={i} className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs line-through text-red-500">{c.original}</p>
                  <p className="text-xs text-green-600 font-medium">{c.corrected}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => applyFix(c.original, c.corrected)}>
                  <Check className="h-3 w-3 mr-1" /> Apply
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="imagery" className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">~3 credits per check</p>
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
                  {s.effect && (
                    <p className="text-xs text-muted-foreground mt-1">{s.effect}</p>
                  )}
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
