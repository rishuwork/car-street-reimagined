import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, Upload, X, Pen } from "lucide-react";

interface FormData {
  // Step 1 - Vehicle identification
  inputMethod: "details" | "vin";
  year: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  // Step 2 - Vehicle details
  odometer: string;
  exteriorColor: string;
  interiorColor: string;
  transmission: string;
  // Step 3 - Condition
  hasExteriorDamage: boolean | null;
  hasInteriorDamage: boolean | null;
  hasAccidents: boolean | null;
  hasMechanicalIssues: boolean | null;
  hasWarningLights: boolean | null;
  numberOfKeys: string;
  // Step 4 - Name
  firstName: string;
  lastName: string;
  // Step 5 - Contact
  email: string;
  phone: string;
  // Images
  images: File[];
  imageUrls: string[];
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, i) => (currentYear + 1 - i).toString());

const makes = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "GMC", "Genesis", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep",
  "Kia", "Land Rover", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

const colors = ["Black", "Gray", "Silver", "White", "Blue", "Green", "Red", "Brown", "Gold", "Beige", "Orange", "Other"];

const SellMyCar = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    inputMethod: "details",
    year: "",
    make: "",
    model: "",
    trim: "",
    vin: "",
    odometer: "",
    exteriorColor: "",
    interiorColor: "",
    transmission: "",
    hasExteriorDamage: null,
    hasInteriorDamage: null,
    hasAccidents: null,
    hasMechanicalIssues: null,
    hasWarningLights: null,
    numberOfKeys: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    images: [],
    imageUrls: [],
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps + 1));
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    
    updateFormData({
      images: [...formData.images, ...newFiles],
      imageUrls: [...formData.imageUrls, ...newUrls],
    });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(formData.imageUrls[index]);
    updateFormData({ images: newImages, imageUrls: newUrls });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (formData.inputMethod === "vin") {
          return formData.vin.length >= 17;
        }
        return formData.year !== "" && formData.make !== "" && formData.model !== "";
      case 2:
        return formData.odometer !== "" && formData.transmission !== "";
      case 3:
        return (
          formData.hasExteriorDamage !== null &&
          formData.hasInteriorDamage !== null &&
          formData.hasAccidents !== null &&
          formData.hasMechanicalIssues !== null &&
          formData.hasWarningLights !== null &&
          formData.numberOfKeys !== ""
        );
      case 4:
        return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
      case 5:
        return formData.email.trim() !== "" && formData.phone.trim() !== "";
      default:
        return true;
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of formData.images) {
      const fileName = `appraisal-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from("vehicle-images")
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      
      // Create appraisal data object
      const appraisalData = {
        inputMethod: formData.inputMethod,
        vehicle: {
          year: formData.year,
          make: formData.make,
          model: formData.model,
          trim: formData.trim,
          vin: formData.vin,
        },
        details: {
          odometer: formData.odometer,
          exteriorColor: formData.exteriorColor,
          interiorColor: formData.interiorColor,
          transmission: formData.transmission,
        },
        condition: {
          hasExteriorDamage: formData.hasExteriorDamage,
          hasInteriorDamage: formData.hasInteriorDamage,
          hasAccidents: formData.hasAccidents,
          hasMechanicalIssues: formData.hasMechanicalIssues,
          hasWarningLights: formData.hasWarningLights,
          numberOfKeys: formData.numberOfKeys,
        },
        images: uploadedImageUrls,
        submissionType: "appraisal",
      };
      
      const message = `Vehicle Appraisal Request\n\nVehicle: ${formData.year} ${formData.make} ${formData.model} ${formData.trim}\nVIN: ${formData.vin || "Not provided"}\nOdometer: ${formData.odometer} km\nImages: ${uploadedImageUrls.length} uploaded`;
      
      const { error } = await supabase.from("contact_submissions").insert({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        message,
        notes: JSON.stringify(appraisalData),
        status: "new",
      });
      
      if (error) throw error;
      
      toast.success("Your appraisal request has been submitted!");
      setCurrentStep(totalSteps + 1); // Success step
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleSummary = () => {
    if (formData.inputMethod === "vin" && formData.vin) {
      return `VIN: ${formData.vin}`;
    }
    if (formData.year && formData.make && formData.model) {
      return `Your ${formData.year} ${formData.make} ${formData.model}`;
    }
    return null;
  };

  const vehicleSummary = getVehicleSummary();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Sell Your Car | Get a Free Appraisal"
        description="Get a fair offer for your vehicle. Skip the hassle of private sales - sell your car to Car Street for cash today."
        url="https://carstreet.ca/sell-my-car"
      />
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {currentStep <= totalSteps ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress Header */}
                <div className="mb-6 text-center">
                  {currentStep > 1 && vehicleSummary && (
                    <div className="border rounded-lg p-4 mb-4 relative">
                      <p className="font-semibold text-muted-foreground">{vehicleSummary}</p>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="absolute right-3 top-3 bg-primary text-primary-foreground p-2 rounded-full"
                      >
                        <Pen className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    Steps to complete: {currentStep} / {totalSteps}
                  </p>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Step 1: Vehicle Identification */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-heading font-bold mb-2">
                        The Hassle-Free Way to Sell Your Car in Canada
                      </h2>
                      <p className="text-muted-foreground">Enter vehicle details or VIN to get an offer.</p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        variant={formData.inputMethod === "details" ? "default" : "outline"}
                        onClick={() => updateFormData({ inputMethod: "details" })}
                      >
                        Vehicle Details
                      </Button>
                      <Button
                        variant={formData.inputMethod === "vin" ? "default" : "outline"}
                        onClick={() => updateFormData({ inputMethod: "vin" })}
                      >
                        VIN
                      </Button>
                    </div>

                    {formData.inputMethod === "vin" ? (
                      <div>
                        <Label>Vehicle Identification Number (VIN)</Label>
                        <Input
                          value={formData.vin}
                          onChange={(e) => updateFormData({ vin: e.target.value.toUpperCase() })}
                          placeholder="Enter 17-character VIN"
                          maxLength={17}
                          className="uppercase"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Year *</Label>
                          <Select value={formData.year} onValueChange={(v) => updateFormData({ year: v })}>
                            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Make *</Label>
                          <Select value={formData.make} onValueChange={(v) => updateFormData({ make: v })}>
                            <SelectTrigger><SelectValue placeholder="Make" /></SelectTrigger>
                            <SelectContent>
                              {makes.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Model *</Label>
                          <Input
                            value={formData.model}
                            onChange={(e) => updateFormData({ model: e.target.value })}
                            placeholder="e.g. Camry, Civic, F-150"
                          />
                        </div>
                        <div>
                          <Label>Trim (optional)</Label>
                          <Input
                            value={formData.trim}
                            onChange={(e) => updateFormData({ trim: e.target.value })}
                            placeholder="e.g. LE, EX, XLT"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={!validateStep(1)}
                      onClick={nextStep}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Step 2: Vehicle Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label>Odometer Reading (KM) *</Label>
                      <Input
                        type="number"
                        value={formData.odometer}
                        onChange={(e) => updateFormData({ odometer: e.target.value })}
                        placeholder="e.g. 75000"
                      />
                    </div>
                    <div>
                      <Label>Exterior Colour</Label>
                      <Select value={formData.exteriorColor} onValueChange={(v) => updateFormData({ exteriorColor: v })}>
                        <SelectTrigger><SelectValue placeholder="Exterior Colour" /></SelectTrigger>
                        <SelectContent>
                          {colors.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Interior Colour</Label>
                      <Select value={formData.interiorColor} onValueChange={(v) => updateFormData({ interiorColor: v })}>
                        <SelectTrigger><SelectValue placeholder="Interior Colour" /></SelectTrigger>
                        <SelectContent>
                          {colors.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Transmission *</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={formData.transmission === "automatic" ? "default" : "outline"}
                          onClick={() => updateFormData({ transmission: "automatic" })}
                          className="flex-1"
                        >
                          Automatic
                        </Button>
                        <Button
                          type="button"
                          variant={formData.transmission === "manual" ? "default" : "outline"}
                          onClick={() => updateFormData({ transmission: "manual" })}
                          className="flex-1"
                        >
                          Manual
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={prevStep} className="flex-1">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button className="flex-1" disabled={!validateStep(2)} onClick={nextStep}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Condition */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {[
                      { key: "hasExteriorDamage", label: "Does your vehicle have any existing exterior damage?" },
                      { key: "hasInteriorDamage", label: "Does your vehicle have any existing interior damage?" },
                      { key: "hasAccidents", label: "Does your vehicle have any accidents or claims in its history?" },
                      { key: "hasMechanicalIssues", label: "Does your vehicle have any known mechanical issues?" },
                      { key: "hasWarningLights", label: "Does your vehicle currently have any warning lights on?" },
                    ].map(({ key, label }) => (
                      <div key={key} className="border-b pb-4">
                        <p className="font-medium mb-3">{label}</p>
                        <RadioGroup
                          value={formData[key as keyof FormData]?.toString() || ""}
                          onValueChange={(v) => updateFormData({ [key]: v === "true" })}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`${key}-yes`} />
                            <Label htmlFor={`${key}-yes`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`${key}-no`} />
                            <Label htmlFor={`${key}-no`}>No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}

                    <div>
                      <Label>How many keys do you have? *</Label>
                      <Select value={formData.numberOfKeys} onValueChange={(v) => updateFormData({ numberOfKeys: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Key</SelectItem>
                          <SelectItem value="2">2 Keys</SelectItem>
                          <SelectItem value="3+">3+ Keys</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={prevStep} className="flex-1">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button className="flex-1" disabled={!validateStep(3)} onClick={nextStep}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Name */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-heading font-bold text-center">What is your name?</h3>
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={prevStep} className="flex-1">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button className="flex-1" disabled={!validateStep(4)} onClick={nextStep}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: Contact + Images */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-heading font-bold text-center">Your Offer Is Ready!</h3>
                    <p className="text-center text-muted-foreground">
                      Please share your contact information so we can provide you with your offer. 
                      Once received, a member of our team will reach out to confirm the details.
                    </p>

                    <div>
                      <Label>Email Address *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <Label>Upload Vehicle Images (optional)</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload photos of your vehicle to help us provide a more accurate offer.
                      </p>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      
                      {formData.imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {formData.imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square">
                              <img
                                src={url}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      By clicking "Submit," you confirm that you've read and agree to the Car Street Terms of Use.
                    </p>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={prevStep} className="flex-1">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!validateStep(5) || isSubmitting}
                        onClick={handleSubmit}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Success Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold mb-4">Thank You!</h2>
              <p className="text-muted-foreground mb-8">
                Your vehicle appraisal request has been submitted. Our team will review your information 
                and get back to you with an offer within 24-48 hours.
              </p>
              <Button onClick={() => navigate("/")}>Return to Home</Button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SellMyCar;
