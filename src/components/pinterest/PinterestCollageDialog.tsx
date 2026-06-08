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

/**
 * Pinterest Template V1 "Vorher/Nachher Vertikal" (Standard)
 * --------------------------------------------------
 * Klassisches vertikales Vorher/Nachher-Layout, 2:3 (1200x1800), PNG-Export,
 * Safe-Zone 96 px, Auto-Fit Headline, Gradient-Overlay für Kontrast.
 * Wird wieder als Standard verwendet, bis ein Master-Template hochgeladen wird.
 */
const PINTEREST_TEMPLATE = {
  width: 1200,
  height: 1800,
  safeZone: 96,
  colors: {
    bg: "#000000",
    glowInner: "rgba(255,120,30,0.5)",
    glowOuter: "rgba(255,80,10,0)",
    accent: "#e63329",
    accentDark: "#b8231b",
    flameYellow: "#ffb800",
    text: "#ffffff",
    frame: "#ffffff",
  },
  fonts: {
    brand: 'bold 44px "Helvetica Neue", Arial, sans-serif',
    label: 'bold 32px "Helvetica Neue", Arial, sans-serif',
    headlineMax: 76,
    headlineMin: 44,
    city: '600 32px "Helvetica Neue", Arial, sans-serif',
  },
  imageHeight: 720,
  arrowSize: 84,
  badge: { w: 180, h: 58, radius: 8 },
  frameRadius: 16,
} as const;

const CANVAS_WIDTH = PINTEREST_TEMPLATE.width;
const CANVAS_HEIGHT = PINTEREST_TEMPLATE.height;

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

/** Roter Label-Badge (VORHER/NACHHER) zentriert auf einer Position. */
function drawLabelBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
) {
  const T = PINTEREST_TEMPLATE;
  const { w, h, radius } = T.badge;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = T.colors.accent;
  drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, radius);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = T.colors.text;
  ctx.font = T.fonts.label;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
}

/** Vertikaler Pfeil zwischen Vorher- und Nachher-Bild. */
function drawDownArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) {
  const T = PINTEREST_TEMPLATE;
  ctx.save();
  ctx.fillStyle = T.colors.accent;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size / 2);
  ctx.lineTo(cx - size / 2, cy - size / 2);
  ctx.lineTo(cx + size / 2, cy - size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Renders the Pinterest collage onto the given canvas (V1 Vertikal). */
async function renderCollage(
  canvas: HTMLCanvasElement,
  beforeUrl: string,
  afterUrl: string,
  category: string,
  city: string,
  title: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const T = PINTEREST_TEMPLATE;

  // 1) Hintergrund + warmer Glow
  ctx.fillStyle = T.colors.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const glow = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT,
    100,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT,
    1300,
  );
  glow.addColorStop(0, T.colors.glowInner);
  glow.addColorStop(1, T.colors.glowOuter);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2) Ember-Partikel
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const r = Math.random() * 2.2 + 0.4;
    const alpha = Math.random() * 0.5 + 0.1;
    ctx.fillStyle = `rgba(255, ${130 + Math.random() * 90}, 40, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3) Brand oben zentriert
  ctx.fillStyle = T.colors.text;
  ctx.font = T.fonts.brand;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("DER KAMINDOKTOR", CANVAS_WIDTH / 2, T.safeZone + 50);

  // 4) Bilder laden
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  // 5) Layout: Vorher oben, Pfeil mittig, Nachher unten
  const imgW = CANVAS_WIDTH - T.safeZone * 2;
  const imgH = T.imageHeight;
  const topY = T.safeZone + 110;
  const arrowCy = topY + imgH + 60;
  const bottomY = arrowCy + 60;

  // Vorher
  ctx.save();
  drawRoundedRect(ctx, T.safeZone, topY, imgW, imgH, T.frameRadius);
  ctx.clip();
  drawCover(ctx, beforeImg, T.safeZone, topY, imgW, imgH, true);
  ctx.restore();
  ctx.strokeStyle = T.colors.frame;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, T.safeZone, topY, imgW, imgH, T.frameRadius);
  ctx.stroke();
  drawLabelBadge(ctx, "VORHER", T.safeZone + T.badge.w / 2 + 18, topY + 18);

  // Pfeil
  drawDownArrow(ctx, CANVAS_WIDTH / 2, arrowCy, T.arrowSize);

  // Nachher
  ctx.save();
  drawRoundedRect(ctx, T.safeZone, bottomY, imgW, imgH, T.frameRadius);
  ctx.clip();
  drawCover(ctx, afterImg, T.safeZone, bottomY, imgW, imgH, false);
  ctx.restore();
  ctx.strokeStyle = T.colors.frame;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, T.safeZone, bottomY, imgW, imgH, T.frameRadius);
  ctx.stroke();
  drawLabelBadge(ctx, "NACHHER", T.safeZone + T.badge.w / 2 + 18, bottomY + 18);

  // 6) Footer mit dunklem Gradient-Overlay + Headline + Stadt
  const footerH = 360;
  const footerY = CANVAS_HEIGHT - footerH;
  const fGrad = ctx.createLinearGradient(0, footerY, 0, CANVAS_HEIGHT);
  fGrad.addColorStop(0, "rgba(0,0,0,0)");
  fGrad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, footerY, CANVAS_WIDTH, footerH);

  // Headline (auto-fit, max 2 Zeilen)
  const maxW = CANVAS_WIDTH - T.safeZone * 2;
  const fitted = fitHeadline(
    ctx,
    title,
    maxW,
    T.fonts.headlineMax,
    T.fonts.headlineMin,
  );
  const lineH = fitted.fontSize * 1.15;
  const headlineBlockH = lineH * fitted.lines.length;
  const headlineStartY = CANVAS_HEIGHT - T.safeZone - 60 - headlineBlockH + fitted.fontSize;
  ctx.font = `bold ${fitted.fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = T.colors.text;
  ctx.textAlign = "center";
  fitted.lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, headlineStartY + i * lineH);
  });

  // Stadt + Kategorie
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = T.fonts.city;
  ctx.textAlign = "center";
  ctx.fillText(`${category}  ·  ${city}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - T.safeZone - 10);
}

/**
 * Findet die größtmögliche Fontsize, bei der die Headline in max. 2 Zeilen passt.
 */
function fitHeadline(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number,
): { lines: string[]; fontSize: number } {
  for (let size = maxFontSize; size >= minFontSize; size -= 2) {
    ctx.font = `bold ${size}px "Helvetica Neue", Arial, sans-serif`;
    const lines = wrapText(ctx, title, maxWidth, 2);
    const fits = lines.every((l) => ctx.measureText(l).width <= maxWidth);
    if (fits && lines.length <= 2) return { lines, fontSize: size };
  }
  // Fallback: minFontSize + harte Kürzung
  ctx.font = `bold ${minFontSize}px "Helvetica Neue", Arial, sans-serif`;
  const lines = wrapText(ctx, title, maxWidth, 2);
  if (lines.length === 2 && ctx.measureText(lines[1]).width > maxWidth) {
    lines[1] = lines[1].substring(0, 38).trimEnd() + "…";
  }
  return { lines, fontSize: minFontSize };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length === maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
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