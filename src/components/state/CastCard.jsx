import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_META, CHARACTER_STATUS } from '@/lib/bibleMeta';
import { User } from 'lucide-react';

export default function CastCard({ character }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: character.color || '#6366f1' }}
        >
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{character.name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge className={`text-[8px] px-1 py-0 ${ROLE_META[character.role]?.color || ''}`}>
              {ROLE_META[character.role]?.label || character.role}
            </Badge>
            <Badge className={`text-[8px] px-1 py-0 ${CHARACTER_STATUS[character.status]?.color || ''}`}>
              {CHARACTER_STATUS[character.status]?.label || 'Active'}
            </Badge>
          </div>
          {character.summary && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{character.summary}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
