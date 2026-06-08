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
 * Pinterest Template "Vorher/Nachher Vertikal" (V1)
 * --------------------------------------------------
 * Pinterest Best Practices:
 *  - Seitenverhältnis 2:3 (Pflicht für volle Feed-Höhe)
 *  - Auflösung 1200x1800 px (Retina-scharf)
 *  - Safe-Zone 96 px allseitig (Pinterest beschneidet Ecken im Feed)
 *  - Headline max. 2 Zeilen, Auto-Fontsize, hoher Kontrast via Overlay
 *  - Export als PNG (Text & Logo bleiben knackig)
 */
const PINTEREST_TEMPLATE = {
  width: 1200,
  height: 1800,
  safeZone: 96,
  colors: {
    bgTop: "#1a0a05",
    bgMid: "#2d1208",
    bgBottom: "#0a0503",
    accent: "#ff6b1a",
    accentSoft: "#ffa366",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.75)",
    badgeDark: "#000000",
  },
  fonts: {
    brand: 'bold 44px "Helvetica Neue", Arial, sans-serif',
    category: '600 28px "Helvetica Neue", Arial, sans-serif',
    badge: 'bold 26px "Helvetica Neue", Arial, sans-serif',
    headlineMax: 76, // wird via Auto-Fit verkleinert
    headlineMin: 44,
    city: '600 32px "Helvetica Neue", Arial, sans-serif',
  },
  image: {
    width: 960, // (1200 - 2*120) – etwas mehr Innen-Padding als Safe-Zone für Optik
    height: 620,
    radius: 20,
    frameWidth: 8,
  },
  layout: {
    headerY: 110,
    beforeY: 200,
    arrowGap: 40,
    footerHeadlineOffset: 90, // Abstand After-Bild → Headline
    headlineLineHeight: 1.18,
    citySpacing: 56,
  },
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

  const T = PINTEREST_TEMPLATE;

  // Hintergrund-Gradient (tief warm)
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, T.colors.bgTop);
  bg.addColorStop(0.5, T.colors.bgMid);
  bg.addColorStop(1, T.colors.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtile Ember-Partikel
  for (let i = 0; i < 110; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const r = Math.random() * 2 + 0.5;
    const alpha = Math.random() * 0.4 + 0.1;
    ctx.fillStyle = `rgba(255, ${120 + Math.random() * 80}, 30, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header (Brand + Kategorie) – innerhalb Safe-Zone
  ctx.fillStyle = T.colors.accent;
  ctx.font = T.fonts.brand;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("🔥 DER KAMINDOKTOR", T.safeZone, T.layout.headerY);

  ctx.fillStyle = T.colors.textMuted;
  ctx.font = T.fonts.category;
  ctx.textAlign = "right";
  ctx.fillText(category, CANVAS_WIDTH - T.safeZone, T.layout.headerY - 4);

  // Load images in parallel
  const [beforeImg, afterImg] = await Promise.all([loadImage(beforeUrl), loadImage(afterUrl)]);

  // Bild-Maße
  const imgW = T.image.width;
  const imgH = T.image.height;
  const imgX = (CANVAS_WIDTH - imgW) / 2;
  const beforeY = T.layout.beforeY;
  const arrowH = 95;
  const afterY = beforeY + imgH + T.layout.arrowGap + arrowH + T.layout.arrowGap;

  // BEFORE image (grayscale, with frame)
  ctx.save();
  drawRoundedRect(
    ctx,
    imgX - T.image.frameWidth,
    beforeY - T.image.frameWidth,
    imgW + T.image.frameWidth * 2,
    imgH + T.image.frameWidth * 2,
    T.image.radius + 4,
  );
  ctx.fillStyle = T.colors.accent;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, imgX, beforeY, imgW, imgH, T.image.radius);
  ctx.clip();
  drawCover(ctx, beforeImg, imgX, beforeY, imgW, imgH, true);
  ctx.restore();

  // VORHER badge
  ctx.fillStyle = T.colors.badgeDark;
  drawRoundedRect(ctx, imgX + 24, beforeY + 24, 180, 58, 10);
  ctx.fill();
  ctx.fillStyle = T.colors.text;
  ctx.font = T.fonts.badge;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VORHER", imgX + 24 + 90, beforeY + 24 + 29);

  // Pfeil zwischen den Bildern (nach unten)
  const arrowCx = CANVAS_WIDTH / 2;
  const arrowY = beforeY + imgH + T.layout.arrowGap;
  ctx.fillStyle = T.colors.accent;
  ctx.beginPath();
  ctx.moveTo(arrowCx - 48, arrowY);
  ctx.lineTo(arrowCx + 48, arrowY);
  ctx.lineTo(arrowCx + 48, arrowY + 30);
  ctx.lineTo(arrowCx + 84, arrowY + 30);
  ctx.lineTo(arrowCx, arrowY + 95);
  ctx.lineTo(arrowCx - 84, arrowY + 30);
  ctx.lineTo(arrowCx - 48, arrowY + 30);
  ctx.closePath();
  ctx.fill();

  // AFTER image (color)
  ctx.save();
  drawRoundedRect(
    ctx,
    imgX - T.image.frameWidth,
    afterY - T.image.frameWidth,
    imgW + T.image.frameWidth * 2,
    imgH + T.image.frameWidth * 2,
    T.image.radius + 4,
  );
  ctx.fillStyle = T.colors.accent;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, imgX, afterY, imgW, imgH, T.image.radius);
  ctx.clip();
  drawCover(ctx, afterImg, imgX, afterY, imgW, imgH, false);
  ctx.restore();

  // NACHHER badge
  ctx.fillStyle = T.colors.accent;
  drawRoundedRect(ctx, imgX + 24, afterY + 24, 200, 58, 10);
  ctx.fill();
  ctx.fillStyle = T.colors.text;
  ctx.font = T.fonts.badge;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NACHHER", imgX + 24 + 100, afterY + 24 + 29);

  // ----- Footer-Bereich: Headline mit Auto-Fit + dunkles Overlay -----
  const footerTop = afterY + imgH + T.layout.arrowGap;
  const footerBottom = CANVAS_HEIGHT - T.safeZone;
  const footerHeight = footerBottom - footerTop;
  const maxTextWidth = CANVAS_WIDTH - T.safeZone * 2;

  // Dunkles Gradient-Overlay für garantierten Kontrast hinter Headline
  const overlay = ctx.createLinearGradient(0, footerTop - 30, 0, CANVAS_HEIGHT);
  overlay.addColorStop(0, "rgba(0,0,0,0)");
  overlay.addColorStop(0.35, "rgba(0,0,0,0.55)");
  overlay.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, footerTop - 30, CANVAS_WIDTH, CANVAS_HEIGHT - (footerTop - 30));

  // Auto-Fit Headline: starte mit headlineMax, verkleinere bis ≤2 Zeilen passen
  const fittedTitle = fitHeadline(
    ctx,
    title,
    maxTextWidth,
    T.fonts.headlineMax,
    T.fonts.headlineMin,
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = T.colors.text;
  ctx.font = `bold ${fittedTitle.fontSize}px "Helvetica Neue", Arial, sans-serif`;

  const lineHeight = fittedTitle.fontSize * T.layout.headlineLineHeight;
  const totalTextH = lineHeight * fittedTitle.lines.length + T.layout.citySpacing;
  const startY = footerTop + (footerHeight - totalTextH) / 2 + fittedTitle.fontSize;

  fittedTitle.lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * lineHeight);
  });

  // City-Label
  ctx.fillStyle = T.colors.accentSoft;
  ctx.font = T.fonts.city;
  ctx.fillText(
    `📍 ${city}`,
    CANVAS_WIDTH / 2,
    startY + fittedTitle.lines.length * lineHeight + T.layout.citySpacing - 16,
  );
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