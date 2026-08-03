import React from 'react';
import { Button } from '@/components/ui/button';
import { Clapperboard, User, MessageSquare, Italic, ArrowRight } from 'lucide-react';

/**
 * ScreenplayToolbar — buttons for formatting screenplay elements.
 */
export default function ScreenplayToolbar({ onInsertElement }) {
  const elements = [
    { id: 'scene_heading', label: 'Scene Heading', icon: Clapperboard, format: 'h2' },
    { id: 'character', label: 'Character', icon: User, format: 'bold_center' },
    { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, format: 'blockquote' },
    { id: 'parenthetical', label: 'Parenthetical', icon: Italic, format: 'italic' },
    { id: 'transition', label: 'Transition', icon: ArrowRight, format: 'bold_right' },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
      {elements.map(el => (
        <Button
          key={el.id}
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => onInsertElement?.(el.format, el.id)}
        >
          <el.icon className="h-3 w-3" />
          {el.label}
        </Button>
      ))}
    </div>
  );
}
