import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadSectionProps {
  beforeImage: File | null;
  afterImage: File | null;
  beforePreview: string | null;
  afterPreview: string | null;
  onBeforeImageChange: (file: File | null) => void;
  onAfterImageChange: (file: File | null) => void;
}

export const ImageUploadSection = ({
  beforeImage,
  afterImage,
  beforePreview,
  afterPreview,
  onBeforeImageChange,
  onAfterImageChange,
}: ImageUploadSectionProps) => {
  const onDropBefore = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onBeforeImageChange(file);
      }
    },
    [onBeforeImageChange]
  );

  const onDropAfter = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onAfterImageChange(file);
      }
    },
    [onAfterImageChange]
  );

  const {
    getRootProps: getBeforeRootProps,
    getInputProps: getBeforeInputProps,
    isDragActive: isBeforeDragActive,
  } = useDropzone({
    onDrop: onDropBefore,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5242880, // 5 MB
    multiple: false,
  });

  const {
    getRootProps: getAfterRootProps,
    getInputProps: getAfterInputProps,
    isDragActive: isAfterDragActive,
  } = useDropzone({
    onDrop: onDropAfter,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5242880, // 5 MB
    multiple: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilder</CardTitle>
        <CardDescription>
          Laden Sie Vorher- und Nachher-Bilder hoch (optional, max. 5 MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vorher-Bild */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Vorher-Bild</label>
          {!beforePreview ? (
            <div
              {...getBeforeRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-accent/50",
                isBeforeDragActive && "border-primary bg-accent/50"
              )}
            >
              <input {...getBeforeInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-base font-medium mb-1">📷 Vorher-Bild hochladen</p>
              <p className="text-sm text-muted-foreground">
                Drag & Drop oder Klicken
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WebP - Max. 5 MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative group">
                <img
                  src={beforePreview}
                  alt="Vorher-Bild Vorschau"
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg border-2 border-border bg-muted/30"
                />
                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-start justify-end p-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onBeforeImageChange(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Entfernen
                  </Button>
                </div>
              </div>
              
              {/* Image info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>✓ Bild hochgeladen</span>
              </div>
            </div>
          )}
        </div>

        {/* Nachher-Bild */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nachher-Bild</label>
          {!afterPreview ? (
            <div
              {...getAfterRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-accent/50",
                isAfterDragActive && "border-primary bg-accent/50"
              )}
            >
              <input {...getAfterInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-base font-medium mb-1">📷 Nachher-Bild hochladen</p>
              <p className="text-sm text-muted-foreground">
                Drag & Drop oder Klicken
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WebP - Max. 5 MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative group">
                <img
                  src={afterPreview}
                  alt="Nachher-Bild Vorschau"
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg border-2 border-border bg-muted/30"
                />
                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-start justify-end p-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onAfterImageChange(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Entfernen
                  </Button>
                </div>
              </div>
              
              {/* Image info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>✓ Bild hochgeladen</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
