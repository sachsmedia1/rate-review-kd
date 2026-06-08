import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImageIcon, CheckCircle2 } from "lucide-react";
import { PinterestCollageDialog } from "./PinterestCollageDialog";

interface PinterestAdminActionProps {
  reviewId: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  category: string;
  city: string;
  description?: string;
  pinterestPinUrl?: string | null;
  pinnedAt?: string | null;
}

/**
 * Admin-only call-to-action shown on ReviewDetail pages to create a
 * Pinterest collage. Hidden for non-admins (returns null).
 */
export function PinterestAdminAction(props: PinterestAdminActionProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      setIsAdmin(!!data?.some(r => r.role === "admin"));
      setChecked(true);
    };
    void check();
    return () => { cancelled = true; };
  }, []);

  if (!checked || !isAdmin) return null;

  const hasImages = !!props.beforeImageUrl && !!props.afterImageUrl;

  return (
    <>
      <section
        className="bg-[#1a1a1a] border border-orange-500/30 rounded-lg p-4 md:p-6 mb-8"
        aria-label="Admin-Aktionen"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📌 Pinterest
              <span className="text-xs font-normal text-gray-400">(nur Admin sichtbar)</span>
            </h3>
            {props.pinnedAt ? (
              <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Bereits gepinnt am {new Date(props.pinnedAt).toLocaleDateString("de-DE")}
                {props.pinterestPinUrl && (
                  <a
                    href={props.pinterestPinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-orange-400 hover:underline"
                  >
                    Pin öffnen ↗
                  </a>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                {hasImages
                  ? "Erstelle eine Vorher/Nachher-Collage mit KI-Titel."
                  : "Vorher- und Nachher-Bild erforderlich."}
              </p>
            )}
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!hasImages}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {props.pinnedAt ? "Collage neu erstellen" : "Pinterest Collage erstellen"}
          </Button>
        </div>
      </section>

      <PinterestCollageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reviewId={props.reviewId}
        beforeImageUrl={props.beforeImageUrl}
        afterImageUrl={props.afterImageUrl}
        category={props.category}
        city={props.city}
        description={props.description}
      />
    </>
  );
}