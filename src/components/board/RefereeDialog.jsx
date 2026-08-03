import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, Gavel } from 'lucide-react';

const SEVERITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const CATEGORY_ICONS = {
  momentum: '⚡',
  stalemate: '⏸️',
  threat: '⚠️',
  contradiction: '❌',
  information: 'ℹ️',
  suggestion: '💡',
};

export default function RefereeDialog({ open, onOpenChange, players, objectives, moves, resources }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    try {
      // Serialize game state
      const stateText = buildGameStateText(players, objectives, moves, resources);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic game referee analyzing a story's conflict dynamics. Examine the current game state and provide observations about the balance of power, momentum shifts, potential contradictions, and strategic suggestions.

GAME STATE:
${stateText}

Provide categorized observations.`,
        response_json_schema: {
          type: 'object',
          properties: {
            observations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['momentum', 'stalemate', 'threat', 'contradiction', 'information', 'suggestion'] },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  title: { type: 'string' },
                  detail: { type: 'string' },
                },
                required: ['category', 'severity', 'title', 'detail'],
              },
            },
          },
          required: ['observations'],
        },
      });
      setObservations(res?.observations || []);
    } catch (err) {
      console.error('Referee analysis failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" /> Strategic Referee
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">AI analyzes the game state for imbalances, contradictions, and suggestions (~3 credits).</p>
          <Button size="sm" onClick={runAnalysis} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            {loading ? 'Analyzing...' : observations.length > 0 ? 'Re-run' : 'Analyze'}
          </Button>
        </div>

        <ScrollArea className="max-h-[50vh]">
          {observations.length === 0 && !loading && (
            <p className="text-center py-10 text-muted-foreground">Click Analyze to get a strategic assessment.</p>
          )}
          <div className="space-y-2">
            {observations.map((obs, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{CATEGORY_ICONS[obs.category] || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{obs.title}</span>
                      <Badge className={`text-[9px] ${SEVERITY_COLORS[obs.severity] || ''}`}>{obs.severity}</Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">{obs.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{obs.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function buildGameStateText(players, objectives, moves, resources) {
  let text = '## Players\n';
  players.forEach(p => {
    text += `- ${p.name} (${p.side}, ${p.status}): Initiative=${p.initiative}, Pressure=${p.pressure}, Morale=${p.morale}, Threat=${p.threat_level}, Victory=${p.victory_progress}\n`;
    if (p.current_strategy) text += `  Strategy: ${p.current_strategy}\n`;
  });
  text += '\n## Objectives\n';
  objectives.forEach(o => {
    const owner = players.find(p => p.id === o.player_id)?.name || 'shared';
    text += `- [${o.status}] ${o.title} (${o.type}, ${o.progress}%) — Owner: ${owner}\n`;
  });
  text += '\n## Recent Moves\n';
  const recentMoves = moves.slice(-10);
  recentMoves.forEach(m => {
    const mover = players.find(p => p.id === m.player_id)?.name || '?';
    text += `- ${mover}: "${m.title}" → ${m.outcome} (risk: ${m.risk})\n`;
    if (m.consequences) text += `  Consequences: ${m.consequences}\n`;
  });
  text += '\n## Resources\n';
  resources.forEach(r => {
    const owner = players.find(p => p.id === r.player_id)?.name || '?';
    text += `- ${owner}: ${r.name} (${r.category}, ${r.status})\n`;
  });
  return text;
}
