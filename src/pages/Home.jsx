import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import StoryCard from '@/components/StoryCard';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { Plus, Search, BookOpen } from 'lucide-react';

export default function Home() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [editing, setEditing] = useState(null); // null or project object
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
    },
  });

  const filtered = useMemo(() => {
    let list = projects;
    if (tab === 'active') list = list.filter(p => !p.archived);
    else if (tab === 'archived') list = list.filter(p => p.archived);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.genre || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, tab, search]);

  function handleSave(formData) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleEdit(project) {
    setEditing(project);
    setDialogOpen(true);
  }

  function handleArchive(project) {
    updateMutation.mutate({ id: project.id, data: { archived: !project.archived } });
  }

  function handleNewProject() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Your Stories</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {search ? 'No matching stories' : 'No stories yet'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {search
              ? 'Try a different search term.'
              : 'Create your first project to start writing.'}
          </p>
          {!search && (
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Story
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(project => (
            <StoryCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone and will remove all chapters, scenes, and associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
