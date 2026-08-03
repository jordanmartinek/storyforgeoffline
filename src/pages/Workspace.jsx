import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { todayStr } from '@/lib/writingStats';
import { countWords } from '@/lib/wordCount';
import { Button } from '@/components/ui/button';
import ChapterPanel from '@/components/workspace/ChapterPanel';
import ManuscriptEditor from '@/components/workspace/ManuscriptEditor';
import WritingDashboard from '@/components/workspace/WritingDashboard';
import WritingAssistant from '@/components/workspace/WritingAssistant';
import ReferencePanel from '@/components/workspace/ReferencePanel';
import GoalsDialog from '@/components/workspace/GoalsDialog';
import ScreenplayToolbar from '@/components/workspace/ScreenplayToolbar';
import {
  ArrowLeft, BarChart3, BookOpen, Brain, FileText,
  Settings, Maximize2, Minimize2, Moon, Sun, Pen,
} from 'lucide-react';

export default function Workspace() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // UI state
  const [activeSceneId, setActiveSceneId] = useState(null);
  const [rightPanel, setRightPanel] = useState('dashboard'); // dashboard | assistant | reference | null
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  // Session tracking refs
  const sessionStartTotal = useRef(0);
  const sessionStartTime = useRef(Date.now());
  const lastFlushTotal = useRef(0);
  const lastFlushTime = useRef(Date.now());
  const celebratedRef = useRef(false);
  const editorApiRef = useRef(null);
  const [liveWords, setLiveWords] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Data queries
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', projectId],
    queryFn: () => base44.entities.Chapter.filter({ project_id: projectId }),
  });

  const { data: scenes = [] } = useQuery({
    queryKey: ['scenes', projectId],
    queryFn: () => base44.entities.Scene.filter({ project_id: projectId }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => base44.entities.WritingSession.filter({ project_id: projectId }),
  });

  const updateProject = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  // Live tick for dashboard timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      setLiveSeconds(elapsed);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Active scene
  const activeScene = scenes.find(s => s.id === activeSceneId);
  const writingMode = project?.writing_mode || 'novel';

  function handleWordCountChange(wc) {
    setLiveWords(wc - sessionStartTotal.current);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  function handleGoalsSave(data) {
    updateProject.mutate(data);
    setGoalsOpen(false);
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      {!fullscreen && (
        <header className="h-12 border-b flex items-center px-4 gap-3 shrink-0 bg-background/95 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Pen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm truncate max-w-[200px]">{project.title}</span>
          </div>

          <div className="flex-1" />

          {/* Nav buttons */}
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StoryBible', { id: projectId }))}>
            <BookOpen className="h-3 w-3 mr-1" /> Bible
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('StrategicBoard', { id: projectId }))}>
            <Brain className="h-3 w-3 mr-1" /> Board
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(createPageUrl('Analytics', { id: projectId }))}>
            <BarChart3 className="h-3 w-3 mr-1" /> Analytics
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="icon" onClick={() => setGoalsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setFocusMode(!focusMode)}>
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </header>
      )}

      {/* Screenplay Toolbar */}
      {writingMode === 'screenplay' && !fullscreen && (
        <ScreenplayToolbar onInsertElement={(format, id) => {/* handled by editor */}} />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        {!focusMode && !fullscreen && (
          <ChapterPanel
            projectId={projectId}
            chapters={chapters}
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
          />
        )}

        {/* Center editor */}
        <ManuscriptEditor
          scene={activeScene}
          projectId={projectId}
          writingMode={writingMode}
          onWordCountChange={handleWordCountChange}
          onReady={(api) => { editorApiRef.current = api; }}
        />

        {/* Right panel */}
        {!focusMode && !fullscreen && rightPanel && (
          <>
            {rightPanel === 'dashboard' && (
              <WritingDashboard
                project={project}
                sessions={sessions}
                liveWords={liveWords}
                liveSeconds={liveSeconds}
              />
            )}
            {rightPanel === 'assistant' && (
              <WritingAssistant
                content={activeScene?.content || ''}
                writingMode={writingMode}
                editorApi={editorApiRef.current}
              />
            )}
            {rightPanel === 'reference' && (
              <ReferencePanel projectId={projectId} />
            )}
          </>
        )}
      </div>

      {/* Right panel toggle tabs */}
      {!focusMode && !fullscreen && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pr-1 z-10">
          <Button
            variant={rightPanel === 'dashboard' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 rounded-l-md rounded-r-none"
            onClick={() => setRightPanel(rightPanel === 'dashboard' ? null : 'dashboard')}
          >
            <BarChart3 className="h-3 w-3" />
          </Button>
          <Button
            variant={rightPanel === 'assistant' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 rounded-l-md rounded-r-none"
            onClick={() => setRightPanel(rightPanel === 'assistant' ? null : 'assistant')}
          >
            <Brain className="h-3 w-3" />
          </Button>
          <Button
            variant={rightPanel === 'reference' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 rounded-l-md rounded-r-none"
            onClick={() => setRightPanel(rightPanel === 'reference' ? null : 'reference')}
          >
            <FileText className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Goals dialog */}
      <GoalsDialog
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        project={project}
        onSave={handleGoalsSave}
      />
    </div>
  );
}
