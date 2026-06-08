import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinterestCollageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  category: string;
  city: string;
  description?: string;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1500;

/** Loads an image with CORS enabled so canvas remains exportable. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${url}`));
    img.src = url;
  });
}

/** Draws an image centered + cover-cropped into a destination rect. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  grayscale = false
) {
  const ir = img.width / img.height;
  const dr = dw / dh;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > dr) {
    sw = img.height * dr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dr;
    sy = (img.height - sh) / 2;
  }
  ctx.save();
  if (grayscale) ctx.filter = "grayscale(100%) contrast(1.1)";
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Renders the Pinterest collage onto the given canvas. */
async function renderCollage(
  canvas: HTMLCanvasElement,
  beforeUrl: string,
  afterUrl: string,
  category: string,
  city: string,
  title: string
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Background gradient (deep warm)
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#1a0a05");
  bg.addColorStop(0.5, "#2d1208");
  bg.addColorStop(1, "#0a0503");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle ember particles
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const r = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.4 + 0.1;
    ctx.fillStyle = `rgba(255, ${120 + Math.random() * 80}, 30, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header brand bar
  ctx.fillStyle = "#ff6b1a";
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🔥 DER KAMINDOKTOR", 60, 90);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(category, CANVAS_WIDTH - 60, 88);

  // Load images in parallel
  const [beforeImg, afterImg] = await Promise.all([loadImage(beforeUrl), loadImage(afterUrl)]);

  // Image dimensions
  const imgW = 760;
  const imgH = 520;
  const imgX = (CANVAS_WIDTH - imgW) / 2;
  const beforeY = 160;
  const afterY = 730;

  // BEFORE image (grayscale, with frame)
  ctx.save();
  drawRoundedRect(ctx, imgX - 6, beforeY - 6, imgW + 12, imgH + 12, 18);
  ctx.fillStyle = "#ff6b1a";
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, imgX, beforeY, imgW, imgH, 14);
  ctx.clip();
  drawCover(ctx, beforeImg, imgX, beforeY, imgW, imgH, true);
  ctx.restore();

  // VORHER badge
  ctx.fillStyle = "#000";
  drawRoundedRect(ctx, imgX + 20, beforeY + 20, 160, 50, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VORHER", imgX + 100, beforeY + 45);

  // Arrow between (downward)
  const arrowCx = CANVAS_WIDTH / 2;
  const arrowY = beforeY + imgH + 30;
  ctx.fillStyle = "#ff6b1a";
  ctx.beginPath();
  ctx.moveTo(arrowCx - 40, arrowY);
  ctx.lineTo(arrowCx + 40, arrowY);
  ctx.lineTo(arrowCx + 40, arrowY + 25);
  ctx.lineTo(arrowCx + 70, arrowY + 25);
  ctx.lineTo(arrowCx, arrowY + 80);
  ctx.lineTo(arrowCx - 70, arrowY + 25);
  ctx.lineTo(arrowCx - 40, arrowY + 25);
  ctx.closePath();
  ctx.fill();

  // AFTER image (color)
  ctx.save();
  drawRoundedRect(ctx, imgX - 6, afterY - 6, imgW + 12, imgH + 12, 18);
  ctx.fillStyle = "#ff6b1a";
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, imgX, afterY, imgW, imgH, 14);
  ctx.clip();
  drawCover(ctx, afterImg, imgX, afterY, imgW, imgH, false);
  ctx.restore();

  // NACHHER badge
  ctx.fillStyle = "#ff6b1a";
  drawRoundedRect(ctx, imgX + 20, afterY + 20, 180, 50, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NACHHER", imgX + 110, afterY + 45);

  // Footer: title + city
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px system-ui, sans-serif";

  // Wrap title into max 2 lines
  const maxWidth = CANVAS_WIDTH - 120;
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length === 2) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < 2) lines.push(current);
  if (lines.length === 2 && ctx.measureText(lines[1]).width > maxWidth) {
    lines[1] = lines[1].substring(0, 40).trimEnd() + "...";
  }

  const titleY = afterY + imgH + 70;
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, titleY + i * 44);
  });

  ctx.fillStyle = "#ff6b1a";
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(`📍 ${city}`, CANVAS_WIDTH / 2, titleY + lines.length * 44 + 36);
}

export function PinterestCollageDialog({
  open,
  onOpenChange,
  reviewId,
  beforeImageUrl,
  afterImageUrl,
  category,
  city,
  description,
}: PinterestCollageDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Generate title via AI when dialog opens
  useEffect(() => {
    if (!open || title) return;
    void generateTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-render collage when title changes
  useEffect(() => {
    if (!open || !title || !beforeImageUrl || !afterImageUrl) return;
    void renderToCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, beforeImageUrl, afterImageUrl]);

  const generateTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pinterest-title", {
        body: { category, city, description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTitle(data?.title || `${category} in ${city}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Titel konnte nicht generiert werden";
      toast.error(msg);
      // Fallback
      setTitle(`Traumhafter ${category} in ${city} – Vorher-Nachher Verwandlung`);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const renderToCanvas = async () => {
    if (!canvasRef.current || !beforeImageUrl || !afterImageUrl) return;
    setIsRendering(true);
    setRenderError(null);
    try {
      await renderCollage(canvasRef.current, beforeImageUrl, afterImageUrl, category, city, title);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Collage konnte nicht erstellt werden";
      setRenderError(msg);
      console.error("Collage render error:", err);
    } finally {
      setIsRendering(false);
    }
  };

  const downloadCollage = () => {
    if (!canvasRef.current) return;
    try {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pinterest-${reviewId}.png`;
      link.href = url;
      link.click();
      toast.success("Collage heruntergeladen");
    } catch (err) {
      toast.error("Download fehlgeschlagen (Bilder ggf. nicht CORS-freigegeben)");
      console.error(err);
    }
  };

  const missingImages = !beforeImageUrl || !afterImageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Pinterest Collage erstellen</DialogTitle>
          <DialogDescription className="text-gray-400">
            Vorher/Nachher-Collage mit KI-generiertem Titel für Pinterest.
          </DialogDescription>
        </DialogHeader>

        {missingImages ? (
          <div className="p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm">
            Es werden sowohl ein Vorher- als auch ein Nachher-Bild benötigt, um eine Collage zu erstellen.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pinterest-title">Pinterest Titel (max. 100 Zeichen)</Label>
              <div className="flex gap-2">
                <Input
                  id="pinterest-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.substring(0, 100))}
                  placeholder={isGeneratingTitle ? "KI generiert Titel..." : "Titel eingeben"}
                  disabled={isGeneratingTitle}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  variant="outline"
                  onClick={generateTitle}
                  disabled={isGeneratingTitle}
                  title="Neuen Titel generieren"
                >
                  {isGeneratingTitle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">{title.length}/100 Zeichen</p>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-black">
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              )}
              {renderError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-4 text-center text-sm text-red-300">
                  {renderError}
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ maxHeight: "60vh", objectFit: "contain" }}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={renderToCanvas}
                variant="outline"
                disabled={isRendering || !title}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Vorschau aktualisieren
              </Button>
              <Button
                onClick={downloadCollage}
                disabled={isRendering || !!renderError}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Als PNG herunterladen
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">
              Phase 1: Manueller Download. Phase 3 wird automatisch an Pinterest senden.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}