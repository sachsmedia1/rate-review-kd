import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Eye, Save } from "lucide-react";
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

const NewReview = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Image states
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  // Rating states
  const [ratings, setRatings] = useState({
    consultation: 5,
    fire_safety: 5,
    heating_performance: 5,
    aesthetics: 5,
    installation_quality: 5,
    service: 5,
  });

  // Optional ratings (fire_safety and heating_performance can be not applicable)
  const [optionalRatings, setOptionalRatings] = useState({
    fire_safety: false,
    heating_performance: false,
  });

  // Additional info states
  const [customerComment, setCustomerComment] = useState("");
  const [installedBy, setInstalledBy] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      installation_date: new Date(),
    },
  });

  const salutation = watch("customer_salutation");
  const category = watch("product_category");
  const installationDate = watch("installation_date");

  // Generate image previews
  useEffect(() => {
    if (beforeImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBeforePreview(reader.result as string);
      };
      reader.readAsDataURL(beforeImage);
    } else {
      setBeforePreview(null);
    }
  }, [beforeImage]);

  useEffect(() => {
    if (afterImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterPreview(reader.result as string);
      };
      reader.readAsDataURL(afterImage);
    } else {
      setAfterPreview(null);
    }
  }, [afterImage]);

  const generateSlug = (data: {
    product_category: string;
    customer_lastname: string;
    city: string;
    installation_date: Date;
  }): string => {
    const year = new Date(data.installation_date).getFullYear();
    
    const cleanText = (text: string) => text
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const category = cleanText(data.product_category);
    const lastname = cleanText(data.customer_lastname);
    const city = cleanText(data.city);
    
    return `${category}-${lastname}-${city}-${year}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      console.log('=== SPEICHER-PROZESS START ===');
      
      // 1. Bilder hochladen
      console.log('1. Lade Bilder hoch...');
      let beforeImageUrl: string | null = null;
      let afterImageUrl: string | null = null;
      
      if (beforeImage) {
        console.log('Uploading before image:', beforeImage.name);
        const beforePath = `before/${Date.now()}-${beforeImage.name}`;
        const { data: beforeData, error: beforeError } = await supabase.storage
          .from('review-images')
          .upload(beforePath, beforeImage);
        
        if (beforeError) {
          console.error('Before image upload error:', beforeError);
          throw new Error(`Vorher-Bild Upload fehlgeschlagen: ${beforeError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(beforePath);
        beforeImageUrl = publicUrl;
        console.log('Before image uploaded:', beforeImageUrl);
      }
      
      if (afterImage) {
        console.log('Uploading after image:', afterImage.name);
        const afterPath = `after/${Date.now()}-${afterImage.name}`;
        const { data: afterData, error: afterError } = await supabase.storage
          .from('review-images')
          .upload(afterPath, afterImage);
        
        if (afterError) {
          console.error('After image upload error:', afterError);
          throw new Error(`Nachher-Bild Upload fehlgeschlagen: ${afterError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(afterPath);
        afterImageUrl = publicUrl;
        console.log('After image uploaded:', afterImageUrl);
      }
      
      // 2. Slug generieren
      const slug = generateSlug({
        product_category: data.product_category,
        customer_lastname: data.customer_lastname,
        city: data.city,
        installation_date: data.installation_date
      });
      console.log('2. Slug generiert:', slug);
      
      // 3. Durchschnitt wird automatisch von der Datenbank berechnet (GENERATED COLUMN)
      console.log('3. Durchschnitt wird von DB berechnet (GENERATED COLUMN)');
      
      // 4. User ID holen
      const { data: { user } } = await supabase.auth.getUser();
      console.log('4. User ID:', user?.id);
      
      if (!user) {
        throw new Error('Sie müssen angemeldet sein');
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
        rating_heating_performance: optionalRatings.heating_performance ? null : ratings.heating_performance,
        rating_aesthetics: ratings.aesthetics,
        rating_installation_quality: ratings.installation_quality,
        rating_service: ratings.service,
        customer_comment: customerComment || null,
        internal_notes: internalNotes || null,
        installed_by: installedBy || null,
        created_by: user.id
      };
      
      console.log('5. Review-Daten:', reviewData);
      
      // 6. In Datenbank speichern
      console.log('6. Speichere in Datenbank...');
      const { data: insertedData, error: insertError } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        throw new Error(`Datenbank-Fehler: ${insertError.message}`);
      }
      
      console.log('7. Erfolgreich gespeichert:', insertedData);
      console.log('=== SPEICHER-PROZESS ENDE ===');
      
      // Success
      toast.success('Bewertung erfolgreich gespeichert!');
      navigate('/admin/dashboard');
      
    } catch (error: any) {
      console.error('=== SPEICHER-FEHLER ===', error);
      toast.error(error.message || 'Speichern fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
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
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Neue Bewertung erstellen</h1>
            <p className="text-muted-foreground">
              Schritt {currentStep} von 2: {currentStep === 1 ? 'Kundendaten und Produktkategorie' : 'Bilder, Bewertungen und Zusatzinformationen'}
            </p>
            {/* Progress Bar */}
            <div className="mt-4 w-full bg-muted rounded-full h-2">
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
                <CardDescription>
                  Grundlegende Informationen zum Kunden
                </CardDescription>
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
                    <p className="text-sm text-destructive">
                      {errors.customer_salutation.message}
                    </p>
                  )}
                </div>

                {/* Vorname */}
                <div className="space-y-2">
                  <Label htmlFor="firstname">
                    Vorname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstname"
                    placeholder="Max"
                    {...register("customer_firstname")}
                  />
                  {errors.customer_firstname && (
                    <p className="text-sm text-destructive">
                      {errors.customer_firstname.message}
                    </p>
                  )}
                </div>

                {/* Nachname */}
                <div className="space-y-2">
                  <Label htmlFor="lastname">
                    Nachname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastname"
                    placeholder="Mustermann"
                    {...register("customer_lastname")}
                  />
                  {errors.customer_lastname && (
                    <p className="text-sm text-destructive">
                      {errors.customer_lastname.message}
                    </p>
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
                      <p className="text-sm text-destructive">
                        {errors.postal_code.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Stadt <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Berlin"
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Montagedatum */}
                <div className="space-y-2">
                  <Label>
                    Montagedatum <span className="text-destructive">*</span>
                  </Label>
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
                        onSelect={(date) =>
                          setValue("installation_date", date as Date, {
                            shouldValidate: true,
                          })
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.installation_date && (
                    <p className="text-sm text-destructive">
                      {errors.installation_date.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Produktkategorie Section */}
            <Card>
              <CardHeader>
                <CardTitle>Produktkategorie</CardTitle>
                <CardDescription>
                  Welches Produkt wurde installiert?
                </CardDescription>
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
                  <p className="text-sm text-destructive">
                    {errors.product_category.message}
                  </p>
                )}
              </CardContent>
            </Card>

                {/* Next Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNextStep}
                    disabled={!isValid}
                  >
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
              onBeforeImageChange={setBeforeImage}
              onAfterImageChange={setAfterImage}
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!isValid || isSubmitting}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Vorschau
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Speichert..." : "Speichern"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewReview;
