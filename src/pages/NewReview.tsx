import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CustomerSalutation, ProductCategory } from "@/types";

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
  const [formData, setFormData] = useState<FormData | null>(null);

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

  const onSubmit = (data: FormData) => {
    console.log("Form data:", data);
    setFormData(data);
    // TODO: Navigate to next step (images & ratings)
    // navigate("/admin/reviews/new/details");
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
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
              Schritt 1: Kundendaten und Produktkategorie
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="order-2 sm:order-1"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="order-1 sm:order-2"
              >
                Weiter zu Bildern & Bewertungen
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewReview;
