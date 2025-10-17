import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Eye, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CustomerSalutation, ProductCategory } from "@/types";
import { ImageUploadSection } from "@/components/review-form/ImageUploadSection";
import { RatingsSection } from "@/components/review-form/RatingSliders";
import { AdditionalInfoSection } from "@/components/review-form/AdditionalInfoSection";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  customer_salutation: z.enum(["Herr", "Frau"], {
    required_error: "Bitte wählen Sie eine Anrede",
  }),
  customer_firstname: z
    .string()
    .min(1, "Vorname ist erforderlich")
    .max(100, "Vorname ist zu lang"),
  customer_lastname: z
    .string()
    .min(1, "Nachname ist erforderlich")
    .max(100, "Nachname ist zu lang"),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, "PLZ muss genau 5 Ziffern enthalten"),
  city: z
    .string()
    .min(1, "Stadt ist erforderlich")
    .max(100, "Stadt ist zu lang"),
  installation_date: z.date({
    required_error: "Montagedatum ist erforderlich",
  }).refine((date) => date <= new Date(), {
    message: "Datum darf nicht in der Zukunft liegen",
  }),
  product_category: z.enum(
    [
      "Kaminofen",
      "Neubau Kaminanlage",
      "Austausch Kamineinsatz",
      "Kaminkassette",
      "Austausch Kachelofeneinsatz",
    ],
    {
      required_error: "Bitte wählen Sie eine Produktkategorie",
    }
  ),
});

type FormData = z.infer<typeof formSchema>;

interface ReviewFormProps {
  mode: "create" | "edit";
  existingData?: any;
  reviewId?: string;
}

const extractPathFromUrl = (url: string): string => {
  const parts = url.split("/review-images/");
  return parts[1] || "";
};

export const ReviewForm = ({ mode, existingData, reviewId }: ReviewFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [manualDateInput, setManualDateInput] = useState("");

  // Image states
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(
    existingData?.before_image_url || null
  );
  const [afterPreview, setAfterPreview] = useState<string | null>(
    existingData?.after_image_url || null
  );
  const [keepExistingBeforeImage, setKeepExistingBeforeImage] = useState(true);
  const [keepExistingAfterImage, setKeepExistingAfterImage] = useState(true);

  // Rating states
  const [ratings, setRatings] = useState({
    consultation: existingData?.rating_consultation || 5,
    fire_safety: existingData?.rating_fire_safety || 5,
    heating_performance: existingData?.rating_heating_performance || 5,
    aesthetics: existingData?.rating_aesthetics || 5,
    installation_quality: existingData?.rating_installation_quality || 5,
    service: existingData?.rating_service || 5,
  });

  const [optionalRatings, setOptionalRatings] = useState({
    fire_safety: existingData?.rating_fire_safety === null,
    heating_performance: existingData?.rating_heating_performance === null,
  });

  // Additional info states
  const [customerComment, setCustomerComment] = useState(existingData?.customer_comment || "");
  const [installedBy, setInstalledBy] = useState(existingData?.installed_by || "");
  const [internalNotes, setInternalNotes] = useState(existingData?.internal_notes || "");
  const [status, setStatus] = useState<"draft" | "published">(
    existingData?.status || "published"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: existingData
      ? {
          customer_salutation: existingData.customer_salutation,
          customer_firstname: existingData.customer_firstname,
          customer_lastname: existingData.customer_lastname,
          postal_code: existingData.postal_code,
          city: existingData.city,
          installation_date: new Date(existingData.installation_date),
          product_category: existingData.product_category,
        }
      : {
          installation_date: new Date(),
        },
  });

  const salutation = watch("customer_salutation");
  const category = watch("product_category");
  const installationDate = watch("installation_date");

  // Generate image previews for new uploads
  useEffect(() => {
    if (beforeImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBeforePreview(reader.result as string);
      };
      reader.readAsDataURL(beforeImage);
      setKeepExistingBeforeImage(false);
    }
  }, [beforeImage]);

  useEffect(() => {
    if (afterImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterPreview(reader.result as string);
      };
      reader.readAsDataURL(afterImage);
      setKeepExistingAfterImage(false);
    }
  }, [afterImage]);

  // Initialize manual date input in edit mode
  useEffect(() => {
    if (existingData?.installation_date) {
      const date = new Date(existingData.installation_date);
      const formatted = `${date.getDate().toString().padStart(2, "0")}.${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}.${date.getFullYear()}`;
      setManualDateInput(formatted);
    }
  }, [existingData]);

  // Parse date string in various formats to YYYY-MM-DD
  const parseDateString = (dateStr: string): string | null => {
    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY or D.M.YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        const year = match[3];

        // Validate date
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime())) {
          return null;
        }

        // Check if in future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
          return null;
        }

        return `${year}-${month}-${day}`;
      }
    }

    return null;
  };

  const handleManualDateInput = (value: string) => {
    setManualDateInput(value);

    if (value.trim() === "") {
      clearErrors("installation_date");
      return;
    }

    const parsedDate = parseDateString(value);

    if (parsedDate) {
      setValue("installation_date", new Date(parsedDate), {
        shouldValidate: true,
      });
      clearErrors("installation_date");
    } else {
      setError("installation_date", {
        type: "manual",
        message: "Ungültiges Datumsformat. Nutzen Sie TT.MM.JJJJ",
      });
    }
  };

  const handleDatePickerChange = (date: Date | undefined) => {
    if (date) {
      setValue("installation_date", date, { shouldValidate: true });
      const formatted = `${date.getDate().toString().padStart(2, "0")}.${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}.${date.getFullYear()}`;
      setManualDateInput(formatted);
    } else {
      setManualDateInput("");
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setValue("installation_date", today, { shouldValidate: true });
    const formatted = `${today.getDate().toString().padStart(2, "0")}.${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${today.getFullYear()}`;
    setManualDateInput(formatted);
  };

const shouldRegenerateSlug = (oldData: any, newData: FormData): boolean => {
    return (
      oldData.customer_lastname !== newData.customer_lastname ||
      oldData.city !== newData.city ||
      oldData.product_category !== newData.product_category ||
      new Date(oldData.installation_date).getFullYear() !==
        new Date(newData.installation_date).getFullYear()
    );
  };

  const generateSlug = (data: {
    product_category: string;
    customer_lastname: string;
    city: string;
    installation_date: Date;
  }): string => {
    const year = new Date(data.installation_date).getFullYear();

    const cleanText = (text: string) =>
      text
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const category = cleanText(data.product_category);
    const lastname = cleanText(data.customer_lastname);
    const city = cleanText(data.city);

    return `${category}-${lastname}-${city}-${year}`;
  };

  const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
    // Check if base slug exists
    let query = supabase.from("reviews").select("id").eq("slug", baseSlug);
    
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    
    const { data: existing } = await query.maybeSingle();

    if (!existing) {
      return baseSlug;
    }

    // Slug exists, add counter
    let counter = 2;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (true) {
      let checkQuery = supabase.from("reviews").select("id").eq("slug", uniqueSlug);
      
      if (excludeId) {
        checkQuery = checkQuery.neq("id", excludeId);
      }
      
      const { data: check } = await checkQuery.maybeSingle();

      if (!check) {
        return uniqueSlug;
      }

      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      console.log("=== SPEICHER-PROZESS START ===");
      console.log("Mode:", mode);

      // 1. Bilder hochladen
      console.log("1. Lade Bilder hoch...");
      let beforeImageUrl: string | null =
        mode === "edit" && keepExistingBeforeImage ? existingData?.before_image_url : null;
      let afterImageUrl: string | null =
        mode === "edit" && keepExistingAfterImage ? existingData?.after_image_url : null;

      // Handle before image
      if (beforeImage && !keepExistingBeforeImage) {
        // Delete old image if replacing
        if (mode === "edit" && existingData?.before_image_url) {
          const oldPath = extractPathFromUrl(existingData.before_image_url);
          if (oldPath) {
            await supabase.storage.from("review-images").remove([oldPath]);
            console.log("Old before image deleted:", oldPath);
          }
        }

        // Upload new image
        const beforePath = `before/${Date.now()}-${beforeImage.name}`;
        const { error: beforeError } = await supabase.storage
          .from("review-images")
          .upload(beforePath, beforeImage);

        if (beforeError) {
          throw new Error(`Vorher-Bild Upload fehlgeschlagen: ${beforeError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("review-images").getPublicUrl(beforePath);
        beforeImageUrl = publicUrl;
        console.log("Before image uploaded:", beforeImageUrl);
      }

      // Handle after image
      if (afterImage && !keepExistingAfterImage) {
        // Delete old image if replacing
        if (mode === "edit" && existingData?.after_image_url) {
          const oldPath = extractPathFromUrl(existingData.after_image_url);
          if (oldPath) {
            await supabase.storage.from("review-images").remove([oldPath]);
            console.log("Old after image deleted:", oldPath);
          }
        }

        // Upload new image
        const afterPath = `after/${Date.now()}-${afterImage.name}`;
        const { error: afterError } = await supabase.storage
          .from("review-images")
          .upload(afterPath, afterImage);

        if (afterError) {
          throw new Error(`Nachher-Bild Upload fehlgeschlagen: ${afterError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("review-images").getPublicUrl(afterPath);
        afterImageUrl = publicUrl;
        console.log("After image uploaded:", afterImageUrl);
      }

      // 2. Slug generieren und unique machen
      let slug: string;
      let slugChanged = false;
      
      if (mode === "create") {
        const baseSlug = generateSlug({
          product_category: data.product_category,
          customer_lastname: data.customer_lastname,
          city: data.city,
          installation_date: data.installation_date,
        });
        slug = await ensureUniqueSlug(baseSlug);
        console.log("2. Slug generiert:", slug);
      } else {
        // Edit mode: Check if slug needs regeneration
        if (shouldRegenerateSlug(existingData, data)) {
          const baseSlug = generateSlug({
            product_category: data.product_category,
            customer_lastname: data.customer_lastname,
            city: data.city,
            installation_date: data.installation_date,
          });
          slug = await ensureUniqueSlug(baseSlug, reviewId);
          slugChanged = slug !== existingData.slug;
          console.log("2. Slug geändert:", existingData.slug, "→", slug);
        } else {
          slug = existingData.slug;
          console.log("2. Slug beibehalten:", slug);
        }
      }

      // 3. Durchschnitt wird automatisch von der Datenbank berechnet (GENERATED COLUMN)
      console.log("3. Durchschnitt wird von DB berechnet (GENERATED COLUMN)");

      // 4. User ID holen
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("4. User ID:", user?.id);

      if (!user) {
        throw new Error("Sie müssen angemeldet sein");
      }

      // 5. Review-Daten vorbereiten
      const reviewData = {
        slug,
        status,
        customer_salutation: data.customer_salutation,
        customer_firstname: data.customer_firstname,
        customer_lastname: data.customer_lastname,
        postal_code: data.postal_code,
        city: data.city,
        installation_date: format(data.installation_date, "yyyy-MM-dd"),
        product_category: data.product_category,
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        rating_consultation: ratings.consultation,
        rating_fire_safety: optionalRatings.fire_safety ? null : ratings.fire_safety,
        rating_heating_performance: optionalRatings.heating_performance
          ? null
          : ratings.heating_performance,
        rating_aesthetics: ratings.aesthetics,
        rating_installation_quality: ratings.installation_quality,
        rating_service: ratings.service,
        customer_comment: customerComment || null,
        internal_notes: internalNotes || null,
        installed_by: installedBy || null,
        ...(mode === "create"
          ? { created_by: user.id }
          : { updated_by: user.id, updated_at: new Date().toISOString() }),
      };

      console.log("5. Review-Daten:", reviewData);

      // 6. In Datenbank speichern/aktualisieren
      console.log(`6. ${mode === "create" ? "Speichere" : "Aktualisiere"} in Datenbank...`);

      if (mode === "create") {
        const { data: insertedData, error: insertError } = await supabase
          .from("reviews")
          .insert(reviewData)
          .select()
          .single();

        if (insertError) {
          console.error("Database insert error:", insertError);
          throw new Error(`Datenbank-Fehler: ${insertError.message}`);
        }

        console.log("7. Erfolgreich gespeichert:", insertedData);
        toast.success("Bewertung erfolgreich gespeichert!");
      } else {
        const { error: updateError } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq("id", reviewId);

        if (updateError) {
          console.error("Database update error:", updateError);
          throw new Error(`Datenbank-Fehler: ${updateError.message}`);
        }

        console.log("7. Erfolgreich aktualisiert");
        
        if (slugChanged) {
          toast.success("Bewertung aktualisiert! URL wurde angepasst.");
        } else {
          toast.success("Bewertung erfolgreich aktualisiert!");
        }
      }

      console.log("=== SPEICHER-PROZESS ENDE ===");
      navigate("/admin/reviews");
    } catch (error: any) {
      console.error("=== SPEICHER-FEHLER ===", error);
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleOptionalToggle = (key: string, checked: boolean) => {
    setOptionalRatings((prev) => ({ ...prev, [key]: checked }));
    if (checked) {
      setRatings((prev) => ({ ...prev, [key]: 0 }));
    } else {
      setRatings((prev) => ({ ...prev, [key]: 5 }));
    }
  };

  const handleNextStep = () => {
    if (isValid) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Info Box für Edit-Mode */}
      {mode === "edit" && existingData && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Erstellt am:{" "}
                  {format(new Date(existingData.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                </p>
                {existingData.updated_at && (
                  <p className="text-sm text-muted-foreground">
                    Zuletzt bearbeitet:{" "}
                    {format(new Date(existingData.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="self-start sm:self-center">
                URL: /bewertung/{existingData.slug}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL-Hinweis für Edit-Mode */}
      {mode === "edit" && existingData && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>📎</span> Öffentliche URL
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              Aktuelle URL:{" "}
              <code className="px-2 py-1 bg-muted rounded text-foreground">
                /bewertung/{existingData.slug}
              </code>
            </p>
            <p className="text-xs text-muted-foreground">
              ℹ️ Die URL wird automatisch angepasst, wenn Sie Nachname, Stadt, Kategorie oder Jahr
              ändern.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div>
        <p className="text-muted-foreground mb-2">
          Schritt {currentStep} von 2:{" "}
          {currentStep === 1
            ? "Kundendaten und Produktkategorie"
            : "Bilder, Bewertungen und Zusatzinformationen"}
        </p>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 1 && (
          <>
            {/* Kundendaten Section */}
            <Card>
              <CardHeader>
                <CardTitle>Kundendaten</CardTitle>
                <CardDescription>Grundlegende Informationen zum Kunden</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Anrede */}
                <div className="space-y-2">
                  <Label className="text-base">
                    Anrede <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={salutation}
                    onValueChange={(value) =>
                      setValue("customer_salutation", value as CustomerSalutation, {
                        shouldValidate: true,
                      })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Herr" id="herr" />
                      <Label htmlFor="herr" className="cursor-pointer font-normal">
                        Herr
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Frau" id="frau" />
                      <Label htmlFor="frau" className="cursor-pointer font-normal">
                        Frau
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.customer_salutation && (
                    <p className="text-sm text-destructive">{errors.customer_salutation.message}</p>
                  )}
                </div>

                {/* Vorname */}
                <div className="space-y-2">
                  <Label htmlFor="firstname">
                    Vorname <span className="text-destructive">*</span>
                  </Label>
                  <Input id="firstname" placeholder="Max" {...register("customer_firstname")} />
                  {errors.customer_firstname && (
                    <p className="text-sm text-destructive">{errors.customer_firstname.message}</p>
                  )}
                </div>

                {/* Nachname */}
                <div className="space-y-2">
                  <Label htmlFor="lastname">
                    Nachname <span className="text-destructive">*</span>
                  </Label>
                  <Input id="lastname" placeholder="Mustermann" {...register("customer_lastname")} />
                  {errors.customer_lastname && (
                    <p className="text-sm text-destructive">{errors.customer_lastname.message}</p>
                  )}
                </div>

                {/* PLZ & Stadt */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">
                      PLZ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postal_code"
                      placeholder="12345"
                      maxLength={5}
                      {...register("postal_code")}
                    />
                    {errors.postal_code && (
                      <p className="text-sm text-destructive">{errors.postal_code.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Stadt <span className="text-destructive">*</span>
                    </Label>
                    <Input id="city" placeholder="Berlin" {...register("city")} />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                {/* Montagedatum */}
                <div className="space-y-2">
                  <Label>
                    Montagedatum <span className="text-destructive">*</span>
                  </Label>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Datepicker */}
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !installationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {installationDate ? (
                              format(installationDate, "PPP", { locale: de })
                            ) : (
                              <span>Datum wählen</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={installationDate}
                            onSelect={handleDatePickerChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Separator */}
                    <div className="flex items-center justify-center text-muted-foreground px-2 text-sm">
                      oder
                    </div>

                    {/* Manual input */}
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="z.B. 15.12.2024"
                        value={manualDateInput}
                        onChange={(e) => handleManualDateInput(e.target.value)}
                        className={cn(
                          "transition-colors",
                          manualDateInput && parseDateString(manualDateInput)
                            ? "border-green-500 focus-visible:ring-green-500"
                            : manualDateInput
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                      />
                    </div>

                    {/* Today button */}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleTodayClick}
                      className="whitespace-nowrap"
                    >
                      Heute
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Wählen Sie ein Datum per Kalender oder geben Sie es manuell ein (TT.MM.JJJJ)
                  </p>

                  {errors.installation_date && (
                    <p className="text-sm text-destructive">{errors.installation_date.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Produktkategorie Section */}
            <Card>
              <CardHeader>
                <CardTitle>Produktkategorie</CardTitle>
                <CardDescription>Welches Produkt wurde installiert?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label className="text-base">
                  Kategorie <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={category}
                  onValueChange={(value) =>
                    setValue("product_category", value as ProductCategory, {
                      shouldValidate: true,
                    })
                  }
                  className="space-y-3"
                >
                  {[
                    "Kaminofen",
                    "Neubau Kaminanlage",
                    "Austausch Kamineinsatz",
                    "Kaminkassette",
                    "Austausch Kachelofeneinsatz",
                  ].map((cat) => (
                    <div key={cat} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat} id={cat} />
                      <Label htmlFor={cat} className="cursor-pointer font-normal">
                        {cat}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.product_category && (
                  <p className="text-sm text-destructive">{errors.product_category.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button type="button" size="lg" onClick={handleNextStep} disabled={!isValid}>
                Weiter zu Bildern & Bewertungen
              </Button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* Back Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevStep}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zu Schritt 1
            </Button>

            {/* Image Upload Section */}
            <ImageUploadSection
              beforeImage={beforeImage}
              afterImage={afterImage}
              beforePreview={beforePreview}
              afterPreview={afterPreview}
              onBeforeImageChange={(file) => {
                setBeforeImage(file);
                if (file === null) {
                  setKeepExistingBeforeImage(false);
                }
              }}
              onAfterImageChange={(file) => {
                setAfterImage(file);
                if (file === null) {
                  setKeepExistingAfterImage(false);
                }
              }}
            />

            {/* Ratings Section */}
            <RatingsSection
              ratings={ratings}
              optionalRatings={optionalRatings}
              onRatingChange={handleRatingChange}
              onOptionalToggle={handleOptionalToggle}
            />

            {/* Additional Info Section */}
            <AdditionalInfoSection
              customerComment={customerComment}
              installedBy={installedBy}
              internalNotes={internalNotes}
              status={status}
              onCustomerCommentChange={setCustomerComment}
              onInstalledByChange={setInstalledBy}
              onInternalNotesChange={setInternalNotes}
              onStatusChange={setStatus}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="order-2 sm:order-1"
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <div className="flex gap-3 order-1 sm:order-2">
                <Button type="button" variant="secondary" disabled={!isValid || isSubmitting}>
                  <Eye className="mr-2 h-4 w-4" />
                  Vorschau
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? "Speichert..."
                    : mode === "edit"
                    ? "Änderungen speichern"
                    : "Speichern"}
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
