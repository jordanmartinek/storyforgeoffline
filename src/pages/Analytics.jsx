import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import SessionHistoryChart from '@/components/analytics/SessionHistoryChart';
import StoryProgression from '@/components/analytics/StoryProgression';
import MoveOutcomeChart from '@/components/analytics/MoveOutcomeChart';
import PacingHeatmap from '@/components/analytics/PacingHeatmap';
import { ArrowLeft, Pen, BookOpen, Brain, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => base44.entities.WritingSession.filter({ project_id: projectId }),
  });
  const { data: scenes = [] } = useQuery({
    queryKey: ['scenes', projectId],
    queryFn: () => base44.entities.Scene.filter({ project_id: projectId }),
  });
  const { data: moves = [] } = useQuery({
    queryKey: ['moves', projectId],
    queryFn: () => base44.entities.Move.filter({ project_id: projectId }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Analytics</span>
        <span className="text-xs text-muted-foreground">— {project?.title}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <Pen className="h-3 w-3 mr-1" /> Write
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StoryBible', { id: projectId }))}>
          <BookOpen className="h-3 w-3 mr-1" /> Bible
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StrategicBoard', { id: projectId }))}>
          <Brain className="h-3 w-3 mr-1" /> Board
        </Button>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <SessionHistoryChart sessions={sessions} />
        <StoryProgression project={project} scenes={scenes} />
        <MoveOutcomeChart moves={moves} />
        <PacingHeatmap sessions={sessions} moves={moves} />
      </div>
    </div>
  );
}
