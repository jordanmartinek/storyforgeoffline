import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { gradientFor } from '@/lib/storyCovers';
import { createPageUrl } from '@/utils';
import { Pencil, Trash2, Archive, BookOpen } from 'lucide-react';

export default function StoryCard({ project, onEdit, onDelete, onArchive }) {
  const navigate = useNavigate();
  const gradient = gradientFor(project.genre);
  const progress = project.progress || 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Cover gradient */}
      <div
        className={`h-32 bg-gradient-to-br ${gradient} relative`}
        onClick={() => navigate(createPageUrl('Workspace', { id: project.id }))}
      >
        {project.cover_image_url && (
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-semibold text-lg truncate drop-shadow">
            {project.title}
          </h3>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {project.genre && (
            <Badge variant="secondary" className="text-xs">
              {project.genre}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs capitalize">
            {project.status || 'planning'}
          </Badge>
        </div>

        {project.synopsis && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {project.synopsis}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{(project.word_count || 0).toLocaleString()} words</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onArchive(project); }}
          >
            <Archive className="h-3 w-3 mr-1" /> {project.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(project); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
