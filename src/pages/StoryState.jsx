import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { countWords } from '@/lib/wordCount';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import PlayerStateCard from '@/components/state/PlayerStateCard';
import ObjectiveOverview from '@/components/state/ObjectiveOverview';
import MoveLog from '@/components/state/MoveLog';
import AssetLedger from '@/components/state/AssetLedger';
import CastCard from '@/components/state/CastCard';
import {
  ArrowLeft, Pen, BookOpen, Brain, BarChart3,
  FileText, Users, MapPin, Scroll, Swords, Target,
} from 'lucide-react';

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold mt-8 mb-4">
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      {children}
    </h3>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-muted-foreground italic">{children}</p>;
}

export default function StoryState() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
  });
  const { data: scenes = [] } = useQuery({
    queryKey: ['scenes', projectId],
    queryFn: () => base44.entities.Scene.filter({ project_id: projectId }),
  });
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => base44.entities.Character.filter({ project_id: projectId }),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', projectId],
    queryFn: () => base44.entities.Location.filter({ project_id: projectId }),
  });
  const { data: lore = [] } = useQuery({
    queryKey: ['lore', projectId],
    queryFn: () => base44.entities.LoreEntry.filter({ project_id: projectId }),
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players', projectId],
    queryFn: () => base44.entities.Player.filter({ project_id: projectId }),
  });
  const { data: objectives = [] } = useQuery({
    queryKey: ['objectives', projectId],
    queryFn: () => base44.entities.Objective.filter({ project_id: projectId }),
  });
  const { data: moves = [] } = useQuery({
    queryKey: ['moves', projectId],
    queryFn: () => base44.entities.Move.filter({ project_id: projectId }),
  });
  const { data: resources = [] } = useQuery({
    queryKey: ['resources', projectId],
    queryFn: () => base44.entities.Resource.filter({ project_id: projectId }),
  });
  const { data: connections = [] } = useQuery({
    queryKey: ['connections', projectId],
    queryFn: () => base44.entities.Connection.filter({ project_id: projectId }),
  });

  const totalWords = scenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
  const manuscriptProgress = project?.target_word_count
    ? Math.min(100, Math.round((totalWords / project.target_word_count) * 100))
    : 0;

  const roleOrder = ['protagonist', 'antagonist', 'ally', 'mentor', 'foil', 'supporting', 'minor'];
  const sortedCharacters = [...characters].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  );

  // Character connections (char-to-char)
  const charConnections = connections.filter(
    c => c.source_type === 'character' && c.target_type === 'character'
  );

  const recentScenes = [...scenes].sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || '')).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Story State</span>
        <span className="text-xs text-muted-foreground">— {project?.title}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <Pen className="h-3 w-3 mr-1" /> Write
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StrategicBoard', { id: projectId }))}>
          <Brain className="h-3 w-3 mr-1" /> Board
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('Analytics', { id: projectId }))}>
          <BarChart3 className="h-3 w-3 mr-1" /> Analytics
        </Button>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Manuscript Progress */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-4">Manuscript Progress</h2>
          <Progress value={manuscriptProgress} className="h-3 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBox label="Words" value={totalWords.toLocaleString()} icon={FileText} />
            <StatBox label="Characters" value={characters.length} icon={Users} />
            <StatBox label="Locations" value={locations.length} icon={MapPin} />
            <StatBox label="Lore" value={lore.length} icon={Scroll} />
            <StatBox label="Scenes" value={scenes.length} icon={FileText} />
          </div>
        </div>

        {/* Strategic State */}
        {players.length > 0 && (
          <>
            <SectionTitle icon={Swords}>Strategic State</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(p => <PlayerStateCard key={p.id} player={p} />)}
            </div>
          </>
        )}

        {/* Active Objectives */}
        {objectives.length > 0 && (
          <>
            <SectionTitle icon={Target}>Active Objectives</SectionTitle>
            <ObjectiveOverview objectives={objectives} players={players} />
          </>
        )}

        {/* Asset Ledger */}
        {resources.length > 0 && (
          <>
            <SectionTitle>Asset Ledger</SectionTitle>
            <AssetLedger resources={resources} players={players} />
          </>
        )}

        {/* Recent Moves */}
        {moves.length > 0 && (
          <>
            <SectionTitle icon={Swords}>Recent Moves</SectionTitle>
            <MoveLog moves={moves} players={players} />
          </>
        )}

        {/* The Cast */}
        {characters.length > 0 && (
          <>
            <SectionTitle icon={Users}>The Cast</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedCharacters.map(c => <CastCard key={c.id} character={c} />)}
            </div>
          </>
        )}

        {/* Relationship Web */}
        {charConnections.length > 0 && (
          <>
            <SectionTitle>Relationship Web</SectionTitle>
            <div className="space-y-1">
              {charConnections.map(conn => {
                const src = characters.find(c => c.id === conn.source_id);
                const tgt = characters.find(c => c.id === conn.target_id);
                return (
                  <div key={conn.id} className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50 text-xs">
                    <span className="font-medium">{src?.name || '?'}</span>
                    <span className="text-muted-foreground">—{conn.relationship_type}→</span>
                    <span className="font-medium">{tgt?.name || '?'}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">({conn.strength}%)</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recent Scenes */}
        {recentScenes.length > 0 && (
          <>
            <SectionTitle icon={FileText}>Recent Scenes</SectionTitle>
            <div className="space-y-2">
              {recentScenes.map(scene => (
                <div key={scene.id} className="flex items-center gap-3 px-3 py-2 rounded bg-muted/50">
                  <span className="text-xs font-medium flex-1 truncate">{scene.title}</span>
                  <span className="text-[10px] text-muted-foreground">{scene.word_count || 0} words</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{scene.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="bg-card border rounded-lg p-3 text-center">
      {Icon && <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />}
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
