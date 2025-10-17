import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Flame, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const setupSchema = z.object({
  firstname: z.string().min(1, { message: "Vorname ist erforderlich" }).max(100),
  lastname: z.string().min(1, { message: "Nachname ist erforderlich" }).max(100),
  email: z.string().email({ message: "Ungültige E-Mail-Adresse" }).max(255),
  password: z.string().min(8, { message: "Passwort muss mindestens 8 Zeichen lang sein" }),
});

const Setup = () => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkIfUsersExist();
  }, []);

  const checkIfUsersExist = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-first-admin', {
        body: { action: 'check' }
      });

      if (error) {
        console.error('Error checking users:', error);
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Konnte nicht prüfen, ob bereits Benutzer existieren",
        });
        return;
      }

      setHasUsers(data.hasUsers);
    } catch (error) {
      console.error('Error checking users:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmed) {
      toast({
        variant: "destructive",
        title: "Bestätigung erforderlich",
        description: "Bitte bestätigen Sie die Erstellung des Admin-Accounts",
      });
      return;
    }

    // Validate input
    try {
      setupSchema.parse({ firstname, lastname, email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validierungsfehler",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Call the edge function to create admin user
      const { data, error } = await supabase.functions.invoke('setup-first-admin', {
        body: {
          action: 'setup',
          email,
          password,
          firstname,
          lastname
        }
      });

      if (error || data.error) {
        const errorMessage = data?.error || error?.message || "Ein Fehler ist aufgetreten";
        toast({
          variant: "destructive",
          title: "Setup fehlgeschlagen",
          description: errorMessage,
        });
        return;
      }

      // Show success message
      toast({
        title: "Setup erfolgreich!",
        description: "Admin-Account wurde erstellt. Sie werden angemeldet...",
      });

      // Auto-login the user
      setTimeout(async () => {
        const loginResult = await signIn(email, password);
        if (loginResult.session) {
          navigate("/admin/dashboard");
        } else {
          toast({
            variant: "destructive",
            title: "Auto-Login fehlgeschlagen",
            description: "Bitte melden Sie sich manuell an",
          });
          navigate("/admin/login");
        }
      }, 1000);

    } catch (error) {
      console.error('Setup error:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Prüfe System-Status...</p>
        </div>
      </div>
    );
  }

  if (hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Setup bereits abgeschlossen</CardTitle>
              <CardDescription className="text-muted-foreground">
                Es existieren bereits Benutzer im System
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Die Erst-Installation wurde bereits durchgeführt. Bitte melden Sie sich mit Ihrem Account an.
            </p>
            <Link to="/admin/login">
              <Button className="w-full">
                Zur Anmeldung
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Flame className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Erste Einrichtung</CardTitle>
            <CardDescription className="text-muted-foreground">
              Erstellen Sie den ersten Administrator-Account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">Vorname</Label>
              <Input
                id="firstname"
                type="text"
                placeholder="Max"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Nachname</Label>
              <Input
                id="lastname"
                type="text"
                placeholder="Mustermann"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kamindoktor.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort (min. 8 Zeichen)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-4 bg-card/50">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Ich erstelle den ersten Admin-Account
                </label>
                <p className="text-sm text-muted-foreground">
                  Dieser Account erhält volle Administrator-Rechte
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !confirmed}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Admin-Account erstellen
            </Button>

            <div className="pt-4 border-t border-border/50">
              <Link to="/admin/login">
                <Button variant="ghost" className="w-full" type="button">
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
