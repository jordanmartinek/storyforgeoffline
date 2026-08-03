import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ROLE_META, CHARACTER_STATUS } from '@/lib/bibleMeta';
import { Search, User, MapPin, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

export default function ReferencePanel({ projectId }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());

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

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const q = search.toLowerCase();
  const filteredChars = characters.filter(c => c.name.toLowerCase().includes(q));
  const filteredLocs = locations.filter(l => l.name.toLowerCase().includes(q));
  const filteredLore = lore.filter(l => l.name.toLowerCase().includes(q));

  function getConnections(entityType, entityId) {
    return connections.filter(
      c => (c.source_type === entityType && c.source_id === entityId) ||
           (c.target_type === entityType && c.target_id === entityId)
    );
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm mb-2">Reference</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bible..."
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Characters */}
          {filteredChars.length > 0 && (
            <Section icon={User} title="Characters" count={filteredChars.length}>
              {filteredChars.map(c => (
                <RefItem
                  key={c.id}
                  name={c.name}
                  badge={ROLE_META[c.role]?.label}
                  badgeClass={ROLE_META[c.role]?.color}
                  expanded={expanded.has(c.id)}
                  onToggle={() => toggleExpand(c.id)}
                >
                  {c.summary && <p className="text-xs text-muted-foreground">{c.summary}</p>}
                  {c.current_objective && (
                    <p className="text-xs"><strong>Goal:</strong> {c.current_objective}</p>
                  )}
                  <ConnectionsList conns={getConnections('character', c.id)} />
                </RefItem>
              ))}
            </Section>
          )}

          {/* Locations */}
          {filteredLocs.length > 0 && (
            <Section icon={MapPin} title="Locations" count={filteredLocs.length}>
              {filteredLocs.map(l => (
                <RefItem
                  key={l.id}
                  name={l.name}
                  badge={l.type}
                  expanded={expanded.has(l.id)}
                  onToggle={() => toggleExpand(l.id)}
                >
                  {l.summary && <p className="text-xs text-muted-foreground">{l.summary}</p>}
                  <ConnectionsList conns={getConnections('location', l.id)} />
                </RefItem>
              ))}
            </Section>
          )}

          {/* Lore */}
          {filteredLore.length > 0 && (
            <Section icon={BookOpen} title="Lore" count={filteredLore.length}>
              {filteredLore.map(l => (
                <RefItem
                  key={l.id}
                  name={l.name}
                  badge={l.category?.replace('_', ' ')}
                  expanded={expanded.has(l.id)}
                  onToggle={() => toggleExpand(l.id)}
                >
                  {l.summary && <p className="text-xs text-muted-foreground">{l.summary}</p>}
                  <ConnectionsList conns={getConnections('lore', l.id)} />
                </RefItem>
              ))}
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium">{title}</span>
        <span className="text-[10px] text-muted-foreground">({count})</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function RefItem({ name, badge, badgeClass, expanded, onToggle, children }) {
  return (
    <div className="border rounded-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/50"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="text-xs font-medium flex-1 truncate">{name}</span>
        {badge && (
          <Badge variant="outline" className={`text-[9px] ${badgeClass || ''}`}>
            {badge}
          </Badge>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function ConnectionsList({ conns }) {
  if (!conns || conns.length === 0) return null;
  return (
    <div className="mt-1">
      <p className="text-[10px] text-muted-foreground font-medium">Connections:</p>
      {conns.slice(0, 5).map(c => (
        <p key={c.id} className="text-[10px] text-muted-foreground ml-2">
          — {c.relationship_type}
        </p>
      ))}
    </div>
  );
}
