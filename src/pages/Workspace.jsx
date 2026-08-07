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
  const [rightPanel, setRightPanel] = useState('dashboard');
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  // Session tracking refs
  const sessionStartTime = useRef(Date.now());
  const sessionStartWordCount = useRef(0); // total project words when session started
  const currentWordCount = useRef(0); // current total project words (updated by editor)
  const lastFlushTime = useRef(Date.now());
  const lastFlushedWords = useRef(0);
  const celebratedRef = useRef(false);
  const editorApiRef = useRef(null);
  const flushIntervalRef = useRef(null);

  // Live display state (for dashboard)
  const [liveWords, setLiveWords] = useState(0);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Writing assistant issue count (for editor footer)
  const [issueCount, setIssueCount] = useState(0);

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

  // ─── Session flush logic ──────────────────────────────────────────────────────
  // Calculates delta words and elapsed time, then upserts today's WritingSession.

  const flushSession = useCallback(async () => {
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - sessionStartTime.current) / 1000);
    const wordsWritten = Math.max(0, currentWordCount.current - sessionStartWordCount.current);

    // Only flush if there's been actual writing activity
    if (wordsWritten === 0 && elapsedSinceStart < 60) return;

    const today = todayStr();

    try {
      // Find or create today's session
      const existingSessions = await base44.entities.WritingSession.filter({
        project_id: projectId,
      });
      const todaySession = existingSessions.find(s => s.date === today);

      if (todaySession) {
        // Update existing session — add delta since last flush
        const deltaWords = Math.max(0, currentWordCount.current - lastFlushedWords.current);
        const deltaSeconds = Math.floor((now - lastFlushTime.current) / 1000);
        const newWordsWritten = (todaySession.words_written || 0) + deltaWords;
        const newDuration = (todaySession.duration_seconds || 0) + deltaSeconds;
        const newWpm = newDuration > 60 ? Math.round(newWordsWritten / (newDuration / 60)) : 0;

        await base44.entities.WritingSession.update(todaySession.id, {
          words_written: newWordsWritten,
          duration_seconds: newDuration,
          wpm: newWpm,
          last_words: currentWordCount.current,
        });
      } else {
        // Create new session for today
        const wpm = elapsedSinceStart > 60 ? Math.round(wordsWritten / (elapsedSinceStart / 60)) : 0;
        await base44.entities.WritingSession.create({
          project_id: projectId,
          date: today,
          words_written: wordsWritten,
          duration_seconds: elapsedSinceStart,
          wpm: wpm,
          start_words: sessionStartWordCount.current,
          last_words: currentWordCount.current,
        });
      }

      // Update project total word count
      const allScenes = await base44.entities.Scene.filter({ project_id: projectId });
      const totalWords = allScenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
      const progress = project?.target_word_count
        ? Math.min(100, Math.round((totalWords / project.target_word_count) * 100))
        : 0;
      await base44.entities.Project.update(projectId, {
        word_count: totalWords,
        progress: progress,
      });

      // Update flush markers
      lastFlushTime.current = now;
      lastFlushedWords.current = currentWordCount.current;

      // Invalidate queries so dashboard refreshes
      qc.invalidateQueries({ queryKey: ['sessions', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (err) {
      console.error('Failed to flush writing session:', err);
    }
  }, [projectId, project, qc]);

  // Initialize session start word count from scenes
  useEffect(() => {
    if (scenes.length > 0) {
      const total = scenes.reduce((sum, s) => sum + (s.word_count || 0), 0);
      sessionStartWordCount.current = total;
      currentWordCount.current = total;
      lastFlushedWords.current = total;
    }
  }, [scenes.length > 0]); // only on first load

  // Flush every 60 seconds
  useEffect(() => {
    flushIntervalRef.current = setInterval(() => {
      flushSession();
    }, 60000);
    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, [flushSession]);

  // Flush on unmount (navigate away)
  useEffect(() => {
    return () => {
      flushSession();
    };
  }, [flushSession]);

  // Flush on beforeunload (tab close / refresh)
  useEffect(() => {
    function handleBeforeUnload() {
      flushSession();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushSession]);

  // Live tick for dashboard timer (update display every 5s)
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

  // Called by ManuscriptEditor when word count changes
  function handleWordCountChange(newSceneWordCount) {
    // Recalculate total project word count
    const otherScenesWords = scenes
      .filter(s => s.id !== activeSceneId)
      .reduce((sum, s) => sum + (s.word_count || 0), 0);
    const newTotal = otherScenesWords + newSceneWordCount;

    currentWordCount.current = newTotal;
    setLiveWords(Math.max(0, newTotal - sessionStartWordCount.current));
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

      {writingMode === 'screenplay' && !fullscreen && (
        <ScreenplayToolbar onInsertElement={(format, id) => {}} />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {!focusMode && !fullscreen && (
          <ChapterPanel
            projectId={projectId}
            chapters={chapters}
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
          />
        )}

        <ManuscriptEditor
          scene={activeScene}
          projectId={projectId}
          writingMode={writingMode}
          onWordCountChange={handleWordCountChange}
          onReady={(api) => { editorApiRef.current = api; }}
          issueCount={issueCount}
        />

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
                onIssueCount={setIssueCount}
              />
            )}
            {rightPanel === 'reference' && (
              <ReferencePanel projectId={projectId} />
            )}
          </>
        )}
      </div>

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

      <GoalsDialog
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        project={project}
        onSave={handleGoalsSave}
      />
    </div>
  );
}
