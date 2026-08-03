import React, { useState, useMemo } from 'react';
import { analyzeManuscript } from '@/lib/formatAssistant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const SEVERITY_META = {
  warning: { icon: AlertTriangle, color: 'text-amber-500', badge: 'bg-amber-100 text-amber-800' },
  info: { icon: Info, color: 'text-blue-500', badge: 'bg-blue-100 text-blue-800' },
  error: { icon: AlertCircle, color: 'text-red-500', badge: 'bg-red-100 text-red-800' },
};

export default function FormattingAssistant({ content, writingMode }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [runKey, setRunKey] = useState(0);

  const issues = useMemo(() => {
    return analyzeManuscript(content, writingMode);
  }, [content, writingMode, runKey]);

  const visibleIssues = issues.filter((_, i) => !dismissed.has(i));

  function dismiss(index) {
    setDismissed(prev => new Set([...prev, index]));
  }

  function recheck() {
    setDismissed(new Set());
    setRunKey(k => k + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Format Analysis</h4>
        <Button variant="ghost" size="sm" onClick={recheck} className="text-xs">
          <RefreshCw className="h-3 w-3 mr-1" /> Recheck
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Local analysis (no credits used). Found {visibleIssues.length} suggestion{visibleIssues.length !== 1 ? 's' : ''}.
      </p>

      {visibleIssues.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No formatting issues found. Nice work!
        </div>
      )}

      <div className="space-y-2">
        {issues.map((issue, i) => {
          if (dismissed.has(i)) return null;
          const meta = SEVERITY_META[issue.severity] || SEVERITY_META.info;
          const Icon = meta.icon;
          return (
            <Card key={i} className="p-3 relative">
              <button
                onClick={() => dismiss(i)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[10px] ${meta.badge}`}>
                      {issue.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs">{issue.message}</p>
                  {issue.excerpt && (
                    <p className="text-xs text-muted-foreground mt-1 italic truncate">
                      "{issue.excerpt}"
                    </p>
                  )}
                  {issue.details && (
                    <p className="text-xs text-muted-foreground mt-1">{issue.details}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
