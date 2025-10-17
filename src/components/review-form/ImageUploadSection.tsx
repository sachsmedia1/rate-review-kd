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
            <div className="relative">
              <img
                src={beforePreview}
                alt="Vorher"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => onBeforeImageChange(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
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
            <div className="relative">
              <img
                src={afterPreview}
                alt="Nachher"
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => onAfterImageChange(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
