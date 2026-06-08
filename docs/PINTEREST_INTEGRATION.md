# Pinterest Integration - Workflow & Technische Spezifikation

## Status: Phase 1 abgeschlossen ✅ – Phase 2/3 ausstehend

### Fortschritt
- ✅ DB-Felder migriert (`pinterest_pin_id`, `pinterest_pin_url`, `pinterest_collage_url`, `pinned_at`)
- ✅ Pinterest-Board-URL pro Kategorie im `CategorySEOEditor` (bereits vorher vorhanden)
- ✅ Edge Function `generate-pinterest-title` (Lovable AI Gateway, Gemini Flash)
- ✅ Canvas-basierter Collage-Generator `PinterestCollageDialog`
- ✅ Admin-only Action `PinterestAdminAction` auf `ReviewDetail`
- ⏳ Logo + Hintergrund-Template vom Kunden (Phase 2)
- ⏳ Pinterest Developer Account + OAuth Token (Phase 3)
- ⏳ Edge Function `create-pinterest-pin` (Phase 3)
- ⏳ Persistenz: Collage in R2 hochladen + Pin-Daten in `reviews` speichern (Phase 3)

## Übersicht

Automatische Erstellung von Pinterest Pins für veröffentlichte Bewertungen mit KI-optimierten Titeln und konsistenten Bild-Collagen.

---

## Workflow

1. **Admin klickt "Pin erstellen"** (Button auf Review-Detailseite)
2. **KI generiert Pinterest-Titel** (Edge Function → Lovable AI)
3. **Collage wird im Browser erstellt** (Canvas/Fabric.js)
4. **Admin prüft Vorschau** und passt ggf. Titel an
5. **Collage wird gespeichert** (R2 Storage)
6. **Pin wird erstellt** (Pinterest API Edge Function)

---

## Collage-Design (Option B: Festes Template)

### Layout-Elemente
- **Hintergrund**: Dunkler Hintergrund mit Feuer-Partikeln
- **Before-Bild**: Schwarz-weiß, leicht geneigt, oben-links
- **After-Bild**: Farbig, leicht geneigt, unten-rechts  
- **Pfeil**: Verbindet Before → After
- **Logo**: Oben-rechts mit Kategorie-Text
- **Labels**: "VORHER" / "NACHHER" Badges

### Technische Umsetzung
- Canvas API oder Fabric.js im Browser
- Automatische Schwarz-Weiß-Konvertierung für Before-Bild
- Feste Positionen für 100% Konsistenz
- Export als PNG (1000x1500px für Pinterest)

---

## KI-Titel-Generierung

### Prompt-Konzept
```
Generiere einen ansprechenden Pinterest-Titel für:
- Kategorie: {product_category}
- Stadt: {city}
- Beschreibung: {description_seo}

Der Titel soll:
- Emotional und einladend sein
- Max. 100 Zeichen
- Keywords für SEO enthalten
- Zum Klicken animieren
```

### Beispiele
- ❌ "Kaminofen in München" (langweilig)
- ✅ "Traumhafter Kaminofen verleiht Münchner Wohnzimmer gemütliche Wärme"
- ✅ "Moderner Kamineinsatz: So wurde dieses Berliner Zuhause zur Wohlfühloase"

---

## Pinterest API Integration

### Benötigte Credentials
- [ ] Pinterest Developer Account
- [ ] Pinterest App erstellen
- [ ] OAuth 2.0 Access Token

### API Endpoints
- `POST /pins` - Pin erstellen
- `GET /boards` - Verfügbare Boards abrufen

### Edge Function: `create-pinterest-pin`
```typescript
// Geplante Struktur
{
  title: string,           // KI-generierter Titel
  description: string,     // SEO-Beschreibung + Hashtags
  link: string,           // URL zur Bewertungsseite
  board_id: string,       // Ziel-Board (aus Kategorie-Einstellungen)
  media_source: {
    source_type: "image_url",
    url: string           // R2-URL der Collage
  }
}
```

---

## Benötigte Assets

### Vom Kunden bereitzustellen
- [ ] **Logo** (transparent PNG, min. 500x500px)
- [ ] **Hintergrund-Template** (dunkler Hintergrund mit Feuer-Partikeln)
  - Alternativ: Kann generiert werden

### Technisch zu erstellen
- [ ] Collage-Generator Komponente
- [ ] Edge Function für Titel-Generierung
- [ ] Edge Function für Pinterest API
- [ ] Pinterest Board-Zuordnung pro Kategorie (bereits vorbereitet in CategorySEOEditor)

---

## Datenbank-Erweiterungen

### reviews Tabelle
```sql
-- Bereits vorhanden oder zu ergänzen:
pinterest_pin_id TEXT,        -- ID des erstellten Pins
pinterest_pin_url TEXT,       -- URL zum Pin
pinterest_collage_url TEXT,   -- URL zur gespeicherten Collage
pinned_at TIMESTAMP           -- Zeitpunkt des Pinnens
```

### seo_settings.category_seo_content
```typescript
// Bereits hinzugefügt:
pinterest_board?: string  // Board-URL pro Kategorie
```

---

## UI-Komponenten

### ReviewDetail.tsx - Erweiterung
- "Pin erstellen" Button (nur wenn before/after Bilder vorhanden)
- Status-Anzeige wenn bereits gepinnt
- Link zum erstellten Pin

### PinterestPinDialog.tsx - Neu
- Collage-Vorschau
- Titel-Bearbeitung
- Board-Auswahl
- "Pin erstellen" Action

---

## Nächste Schritte

1. [ ] Assets vom Kunden erhalten (Logo, Hintergrund)
2. [ ] Pinterest Developer Account einrichten
3. [ ] Collage-Generator implementieren
4. [ ] Edge Functions erstellen
5. [ ] UI-Integration

---

*Zuletzt aktualisiert: Januar 2026*
