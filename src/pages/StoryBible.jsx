import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import CharacterList from '@/components/bible/CharacterList';
import CharacterDetail from '@/components/bible/CharacterDetail';
import LocationList from '@/components/bible/LocationList';
import LocationDetail from '@/components/bible/LocationDetail';
import LoreList from '@/components/bible/LoreList';
import LoreDetail from '@/components/bible/LoreDetail';
import { ArrowLeft, BookOpen, Pen, Brain, BarChart3 } from 'lucide-react';

const ENTITY_MAP = {
  character: 'Character',
  location: 'Location',
  lore: 'LoreEntry',
};

export default function StoryBible() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('characters');
  const [selectedChar, setSelectedChar] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [selectedLore, setSelectedLore] = useState(null);

  // Queries
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
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

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', projectId],
    queryFn: () => base44.entities.Connection.filter({ project_id: projectId }),
  });

  // Mutations
  function createItem(entityKey, defaults = {}) {
    const entityName = ENTITY_MAP[entityKey];
    return base44.entities[entityName].create({ project_id: projectId, ...defaults });
  }

  const updateMutation = useMutation({
    mutationFn: ({ entityKey, id, data }) =>
      base44.entities[ENTITY_MAP[entityKey]].update(id, data),
    onSuccess: (_, { entityKey }) => {
      const qk = entityKey === 'character' ? 'characters' : entityKey === 'location' ? 'locations' : 'lore';
      qc.invalidateQueries({ queryKey: [qk, projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ entityKey, id }) => {
      // Delete connections first
      const toDelete = connections.filter(
        c => (c.source_type === entityKey && c.source_id === id) ||
             (c.target_type === entityKey && c.target_id === id)
      );
      await Promise.all(toDelete.map(c => base44.entities.Connection.delete(c.id)));
      await base44.entities[ENTITY_MAP[entityKey]].delete(id);
    },
    onSuccess: (_, { entityKey }) => {
      const qk = entityKey === 'character' ? 'characters' : entityKey === 'location' ? 'locations' : 'lore';
      qc.invalidateQueries({ queryKey: [qk, projectId] });
      qc.invalidateQueries({ queryKey: ['connections', projectId] });
      if (entityKey === 'character') setSelectedChar(null);
      if (entityKey === 'location') setSelectedLoc(null);
      if (entityKey === 'lore') setSelectedLore(null);
    },
  });

  const createConnMutation = useMutation({
    mutationFn: (data) => base44.entities.Connection.create({ project_id: projectId, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections', projectId] }),
  });

  const deleteConnMutation = useMutation({
    mutationFn: (id) => base44.entities.Connection.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections', projectId] }),
  });

  async function handleCreateCharacter() {
    const item = await createItem('character', { name: 'New Character', role: 'supporting' });
    qc.invalidateQueries({ queryKey: ['characters', projectId] });
    setSelectedChar(item);
  }

  async function handleCreateLocation() {
    const item = await createItem('location', { name: 'New Location', type: 'other' });
    qc.invalidateQueries({ queryKey: ['locations', projectId] });
    setSelectedLoc(item);
  }

  async function handleCreateLore() {
    const item = await createItem('lore', { name: 'New Lore Entry', category: 'other' });
    qc.invalidateQueries({ queryKey: ['lore', projectId] });
    setSelectedLore(item);
  }

  const allEntities = { character: characters, location: locations, lore: lore };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Workspace', { id: projectId }))}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Story Bible</span>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left: List panel */}
        <div className="w-72 border-r p-4 overflow-y-auto scrollbar-thin">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="characters" className="flex-1 text-xs">Characters</TabsTrigger>
              <TabsTrigger value="locations" className="flex-1 text-xs">Locations</TabsTrigger>
              <TabsTrigger value="lore" className="flex-1 text-xs">Lore</TabsTrigger>
            </TabsList>

            <TabsContent value="characters">
              <CharacterList
                characters={characters}
                selected={selectedChar}
                onSelect={setSelectedChar}
                onCreate={handleCreateCharacter}
              />
            </TabsContent>

            <TabsContent value="locations">
              <LocationList
                locations={locations}
                selected={selectedLoc}
                onSelect={setSelectedLoc}
                onCreate={handleCreateLocation}
              />
            </TabsContent>

            <TabsContent value="lore">
              <LoreList
                lore={lore}
                selected={selectedLore}
                onSelect={setSelectedLore}
                onCreate={handleCreateLore}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Detail panel */}
        {tab === 'characters' && (
          <CharacterDetail
            character={selectedChar}
            onSave={(id, data) => updateMutation.mutate({ entityKey: 'character', id, data })}
            onDelete={(id) => deleteMutation.mutate({ entityKey: 'character', id })}
            connections={connections}
            allEntities={allEntities}
            onCreateConnection={(data) => createConnMutation.mutate(data)}
            onDeleteConnection={(id) => deleteConnMutation.mutate(id)}
          />
        )}
        {tab === 'locations' && (
          <LocationDetail
            location={selectedLoc}
            onSave={(id, data) => updateMutation.mutate({ entityKey: 'location', id, data })}
            onDelete={(id) => deleteMutation.mutate({ entityKey: 'location', id })}
            connections={connections}
            allEntities={allEntities}
            onCreateConnection={(data) => createConnMutation.mutate(data)}
            onDeleteConnection={(id) => deleteConnMutation.mutate(id)}
          />
        )}
        {tab === 'lore' && (
          <LoreDetail
            lore={selectedLore}
            onSave={(id, data) => updateMutation.mutate({ entityKey: 'lore', id, data })}
            onDelete={(id) => deleteMutation.mutate({ entityKey: 'lore', id })}
            connections={connections}
            allEntities={allEntities}
            onCreateConnection={(data) => createConnMutation.mutate(data)}
            onDeleteConnection={(id) => deleteConnMutation.mutate(id)}
          />
        )}
      </div>
    </div>
  );
}
