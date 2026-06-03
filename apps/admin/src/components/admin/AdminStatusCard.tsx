import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminStatusCard({
  title,
  ok,
  detail,
}: {
  title: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-stone-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Badge variant={ok ? "default" : "destructive"}>
          {ok ? "OK" : "Not configured"}
        </Badge>
        {detail ? (
          <p className="text-xs text-stone-500">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
