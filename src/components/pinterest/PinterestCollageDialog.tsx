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

/**
 * Zeichnet ein einzelnes Polaroid-Foto: weißer Rahmen, leichter Schatten,
 * inneres Bild (optional grayscale) – gedreht um `rotationDeg`.
 * Anschließend wird das rote VORHER/NACHHER-Label am unteren Rand
 * (leicht überlappend) gezeichnet.
 */
function drawPolaroid(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotationDeg: number,
  grayscale: boolean,
  label: string,
) {
  const T = PINTEREST_TEMPLATE;
  const frame = 18; // weißer Rand
  const totalW = w + frame * 2;
  const totalH = h + frame * 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // Schatten
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = T.colors.polaroid;
  drawRoundedRect(ctx, -totalW / 2, -totalH / 2, totalW, totalH, 10);
  ctx.fill();
  ctx.restore();

  // Inneres Bild (geclippt)
  ctx.save();
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.clip();
  drawCover(ctx, img, -w / 2, -h / 2, w, h, grayscale);
  ctx.restore();

  // Rotes Label unten links (überlappt Rahmen leicht)
  ctx.font = T.fonts.label;
  const padX = 22;
  const padY = 10;
  const metrics = ctx.measureText(label);
  const labelW = metrics.width + padX * 2;
  const labelH = 56;
  const labelX = -totalW / 2 + 24;
  const labelY = totalH / 2 - labelH / 2 - 6;

  // Subtiler Schatten unter Label
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = T.colors.accent;
  drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 6);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = T.colors.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, labelX + padX, labelY + labelH / 2 + 1);

  ctx.restore();
}

/** Geschwungener weißer Pfeil von Punkt A nach Punkt B (Kurve nach unten). */
function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;

  // Kurve nach unten ausweichend
  const cx1 = ax + (bx - ax) * 0.1;
  const cy1 = ay + (by - ay) * 0.85;
  const cx2 = ax + (bx - ax) * 0.45;
  const cy2 = by + 60;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, bx, by);
  ctx.stroke();

  // Pfeilspitze
  const tipAngle = Math.atan2(by - cy2, bx - cx2);
  const tipLen = 38;
  const tipSpread = 0.5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(
    bx - tipLen * Math.cos(tipAngle - tipSpread),
    by - tipLen * Math.sin(tipAngle - tipSpread),
  );
  ctx.moveTo(bx, by);
  ctx.lineTo(
    bx - tipLen * Math.cos(tipAngle + tipSpread),
    by - tipLen * Math.sin(tipAngle + tipSpread),
  );
  ctx.stroke();
  ctx.restore();
}

/** Zeichnet das Kamindoktor-Logo (Schriftzug) oben rechts. */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const T = PINTEREST_TEMPLATE;

  // "der" – kursiv, klein
  ctx.fillStyle = T.colors.text;
  ctx.font = T.fonts.logoSerif;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("der", x, y);

  // "KAMIN" – groß, mit Farbverlauf rot→gelb (Markenfeuer)
  ctx.font = T.fonts.logoBold;
  const kaminText = "KAMIN";
  const kaminW = ctx.measureText(kaminText).width;
  const kaminX = x - kaminW;
  const kaminY = y + 80;

  const grad = ctx.createLinearGradient(0, kaminY - 70, 0, kaminY + 10);
  grad.addColorStop(0, T.colors.flameYellow);
  grad.addColorStop(0.55, "#ff7a00");
  grad.addColorStop(1, T.colors.accent);
  ctx.fillStyle = grad;
  ctx.textAlign = "left";
  ctx.fillText(kaminText, kaminX, kaminY);

  // "DOKTOR" – klein, weiß, rechts darunter
  ctx.font = T.fonts.logoSmall;
  ctx.fillStyle = T.colors.text;
  ctx.textAlign = "right";
  ctx.fillText("DOKTOR", x, kaminY + 42);
}

/** Renders the Pinterest collage onto the given canvas. */
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

  // 1) Schwarzer Hintergrund
  ctx.fillStyle = T.colors.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2) Warmer Flammen-Glow links unten (radial)
  const glow = ctx.createRadialGradient(
    -80,
    CANVAS_HEIGHT + 100,
    50,
    -80,
    CANVAS_HEIGHT + 100,
    1100,
  );
  glow.addColorStop(0, T.colors.glowInner);
  glow.addColorStop(1, T.colors.glowOuter);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Sekundärer kleiner Glow oben rechts (dezent)
  const glow2 = ctx.createRadialGradient(
    CANVAS_WIDTH + 100,
    -50,
    20,
    CANVAS_WIDTH + 100,
    -50,
    600,
  );
  glow2.addColorStop(0, "rgba(255,120,30,0.18)");
  glow2.addColorStop(1, "rgba(255,80,10,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 3) Ember-Partikel
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const r = Math.random() * 2.2 + 0.4;
    const alpha = Math.random() * 0.5 + 0.1;
    ctx.fillStyle = `rgba(255, ${130 + Math.random() * 90}, 40, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4) Logo oben rechts (Schriftzug)
  drawLogo(ctx, CANVAS_WIDTH - T.safeZone, T.safeZone + 60);

  // 5) Roter Headline-Badge unter Logo (AI-Titel, auto-fit)
  const badgeMaxW = 760;
  const badgePadX = 28;
  const badgePadY = 16;
  const fitted = fitHeadline(
    ctx,
    title,
    badgeMaxW - badgePadX * 2,
    T.fonts.headlineMax,
    T.fonts.headlineMin,
  );
  const badgeLineH = fitted.fontSize * 1.18;
  const badgeH = badgeLineH * fitted.lines.length + badgePadY * 2;
  // Badge-Breite an längste Zeile anpassen
  ctx.font = `bold ${fitted.fontSize}px "Helvetica Neue", Arial, sans-serif`;
  const widest = Math.max(...fitted.lines.map((l) => ctx.measureText(l).width));
  const badgeW = Math.min(badgeMaxW, widest + badgePadX * 2);
  const badgeX = CANVAS_WIDTH - T.safeZone - badgeW;
  const badgeY = T.safeZone + 240;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = T.colors.accent;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = T.colors.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `bold ${fitted.fontSize}px "Helvetica Neue", Arial, sans-serif`;
  fitted.lines.forEach((line, i) => {
    ctx.fillText(
      line,
      badgeX + badgeW / 2,
      badgeY + badgePadY + fitted.fontSize + i * badgeLineH - 4,
    );
  });

  // 6) Bilder laden
  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  // 7) VORHER (oben links, gekippt -5°)
  const beforeW = 460;
  const beforeH = 460;
  const beforeCx = T.safeZone + beforeW / 2 + 20;
  const beforeCy = T.safeZone + beforeH / 2 + 60;
  drawPolaroid(ctx, beforeImg, beforeCx, beforeCy, beforeW, beforeH, -5, true, "VORHER");

  // 8) NACHHER (unten rechts, gekippt +3°, etwas größer)
  const afterW = 700;
  const afterH = 580;
  const afterCx = CANVAS_WIDTH - T.safeZone - afterW / 2 + 10;
  const afterCy = CANVAS_HEIGHT - T.safeZone - afterH / 2 - 80;
  drawPolaroid(ctx, afterImg, afterCx, afterCy, afterW, afterH, 3, false, "NACHHER");

  // 9) Geschwungener Pfeil VORHER → NACHHER
  drawCurvedArrow(
    ctx,
    beforeCx - 100,
    beforeCy + beforeH / 2 + 40,
    afterCx - afterW / 2 - 30,
    afterCy - afterH / 2 + 60,
  );

  // 10) Stadt + Kategorie dezent unten links
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = T.fonts.city;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    `${category}  ·  ${city}`,
    T.safeZone,
    CANVAS_HEIGHT - T.safeZone + 20,
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