import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Fehlende authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/admin/login?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? "");
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("Keine Weiterleitung erhalten."); }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "Eine App";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {error ? (
          <CardContent className="p-6 text-destructive">Anfrage konnte nicht geladen werden: {error}</CardContent>
        ) : !details ? (
          <CardContent className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{clientName} mit Der Kamindoktor verbinden</CardTitle>
              <CardDescription>Angemeldet als {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {clientName} kann die freigegebenen Werkzeuge dieser App in Ihrem Namen nutzen. Ihre bestehenden Berechtigungen bleiben unverändert.
              </p>
              <div className="flex gap-2">
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1">Erlauben</Button>
                <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">Abbrechen</Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
