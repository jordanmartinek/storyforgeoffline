import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import PlayerList from '@/components/board/PlayerList';
import PlayerDetail from '@/components/board/PlayerDetail';
import MoveTimeline from '@/components/board/MoveTimeline';
import RelationshipMap from '@/components/board/RelationshipMap';
import ChainReactionMap from '@/components/board/ChainReactionMap';
import ChessboardView from '@/components/board/ChessboardView';
import RefereeDialog from '@/components/board/RefereeDialog';
import {
  ArrowLeft, Pen, BookOpen, BarChart3, Brain,
  LayoutGrid, GitBranch, Link2, Grid3X3, Gavel,
} from 'lucide-react';

const VIEWS = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'relations', label: 'Relations', icon: Link2 },
  { id: 'chain', label: 'Chain', icon: GitBranch },
  { id: 'chess', label: 'Chess', icon: Grid3X3 },
];

export default function StrategicBoard() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState('board');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [refereeOpen, setRefereeOpen] = useState(false);

  // Data queries
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
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
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => base44.entities.Character.filter({ project_id: projectId }),
  });
  const { data: lore = [] } = useQuery({
    queryKey: ['lore', projectId],
    queryFn: () => base44.entities.LoreEntry.filter({ project_id: projectId }),
  });
  const { data: connections = [] } = useQuery({
    queryKey: ['connections', projectId],
    queryFn: () => base44.entities.Connection.filter({ project_id: projectId }),
  });

  // Mutations
  const createPlayer = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players', projectId] }),
  });
  const updatePlayer = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Player.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players', projectId] }),
  });
  const deletePlayer = useMutation({
    mutationFn: async (id) => {
      // Cascade delete
      const playerObjs = objectives.filter(o => o.player_id === id);
      const playerMoves = moves.filter(m => m.player_id === id);
      const playerRes = resources.filter(r => r.player_id === id);
      await Promise.all([
        ...playerObjs.map(o => base44.entities.Objective.delete(o.id)),
        ...playerMoves.map(m => base44.entities.Move.delete(m.id)),
        ...playerRes.map(r => base44.entities.Resource.delete(r.id)),
      ]);
      await base44.entities.Player.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players', projectId] });
      qc.invalidateQueries({ queryKey: ['objectives', projectId] });
      qc.invalidateQueries({ queryKey: ['moves', projectId] });
      qc.invalidateQueries({ queryKey: ['resources', projectId] });
      setSelectedPlayer(null);
    },
  });
  const createObjective = useMutation({
    mutationFn: (data) => base44.entities.Objective.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectives', projectId] }),
  });
  const deleteObjective = useMutation({
    mutationFn: (id) => base44.entities.Objective.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objectives', projectId] }),
  });
  const createResource = useMutation({
    mutationFn: (data) => base44.entities.Resource.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources', projectId] }),
  });
  const deleteResource = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources', projectId] }),
  });
  const createMove = useMutation({
    mutationFn: (data) => base44.entities.Move.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moves', projectId] }),
  });
  const deleteMove = useMutation({
    mutationFn: (id) => base44.entities.Move.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moves', projectId] }),
  });

  function handleCreatePlayer() {
    createPlayer.mutate({
      project_id: projectId,
      name: 'New Player',
      side: 'neutral',
      status: 'active',
      initiative: 50, pressure: 50, morale: 50, threat_level: 50, victory_progress: 0,
    });
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Brain className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Strategic Board</span>
        <span className="text-xs text-muted-foreground">— {project?.title}</span>
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {VIEWS.map(v => (
            <Button
              key={v.id}
              variant={view === v.id ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setView(v.id)}
            >
              <v.icon className="h-3 w-3" />
              {v.label}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="text-xs gap-1 ml-2" onClick={() => setRefereeOpen(true)}>
          <Gavel className="h-3 w-3" /> Referee
        </Button>

        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <Pen className="h-3 w-3 mr-1" /> Write
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StoryBible', { id: projectId }))}>
          <BookOpen className="h-3 w-3 mr-1" /> Bible
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {view === 'board' && (
          <>
            <PlayerList players={players} selected={selectedPlayer} onSelect={setSelectedPlayer} onCreate={handleCreatePlayer} />
            <PlayerDetail
              player={selectedPlayer}
              objectives={objectives}
              resources={resources}
              projectId={projectId}
              onSave={(id, data) => updatePlayer.mutate({ id, data })}
              onDelete={(id) => deletePlayer.mutate(id)}
              onCreateObjective={(data) => createObjective.mutate(data)}
              onDeleteObjective={(id) => deleteObjective.mutate(id)}
              onCreateResource={(data) => createResource.mutate(data)}
              onDeleteResource={(id) => deleteResource.mutate(id)}
            />
            <MoveTimeline
              moves={moves}
              players={players}
              objectives={objectives}
              projectId={projectId}
              onCreate={(data) => createMove.mutate({ project_id: projectId, ...data })}
              onDelete={(id) => deleteMove.mutate(id)}
            />
          </>
        )}
        {view === 'relations' && (
          <RelationshipMap characters={characters} lore={lore} connections={connections} />
        )}
        {view === 'chain' && (
          <ChainReactionMap moves={moves} objectives={objectives} players={players} />
        )}
        {view === 'chess' && (
          <ChessboardView
            players={players}
            moves={moves}
            onCreate={(data) => createMove.mutate({ project_id: projectId, ...data })}
          />
        )}
      </div>

      {/* Referee Dialog */}
      <RefereeDialog
        open={refereeOpen}
        onOpenChange={setRefereeOpen}
        players={players}
        objectives={objectives}
        moves={moves}
        resources={resources}
      />
    </div>
  );
}
