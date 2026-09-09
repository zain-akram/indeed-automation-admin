import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotesCard({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-h-24 overflow-y-auto text-sm break-words whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  );
}
