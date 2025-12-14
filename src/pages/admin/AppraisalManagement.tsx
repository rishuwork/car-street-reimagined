import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, FileText, Car, ExternalLink } from "lucide-react";

type ContactSubmission = Tables<"contact_submissions">;

interface AppraisalData {
  inputMethod?: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
    vin?: string;
  };
  details?: {
    odometer?: string;
    exteriorColor?: string;
    interiorColor?: string;
    transmission?: string;
  };
  condition?: {
    hasExteriorDamage?: boolean;
    hasInteriorDamage?: boolean;
    hasAccidents?: boolean;
    hasMechanicalIssues?: boolean;
    hasWarningLights?: boolean;
    numberOfKeys?: string;
  };
  images?: string[];
  submissionType?: string;
  _adminNotes?: string;
}

export default function AppraisalManagement() {
  const [appraisals, setAppraisals] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppraisal, setSelectedAppraisal] = useState<ContactSubmission | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  useEffect(() => {
    loadAppraisals();
  }, []);

  const loadAppraisals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load appraisals");
    } else {
      // Filter only appraisal submissions
      const appraisalData = (data || []).filter((submission) => {
        try {
          const parsed = JSON.parse(submission.notes || "");
          return parsed.submissionType === "appraisal";
        } catch {
          return submission.message.includes("Vehicle Appraisal");
        }
      });
      setAppraisals(appraisalData);
    }
    setIsLoading(false);
  };

  const parseAppraisalData = (notes: string | null): AppraisalData | null => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  const getAdminNotes = (notes: string | null): string => {
    if (!notes) return "";
    try {
      const parsed = JSON.parse(notes);
      return parsed._adminNotes || "";
    } catch {
      return notes;
    }
  };

  const handleOpenDialog = (appraisal: ContactSubmission) => {
    setSelectedAppraisal(appraisal);
    setStatus(appraisal.status);
    setNotes(getAdminNotes(appraisal.notes));
    setIsDialogOpen(true);
  };

  const handleViewDetails = (appraisal: ContactSubmission) => {
    setSelectedAppraisal(appraisal);
    setViewDetailsOpen(true);
  };

  const handleUpdateAppraisal = async () => {
    if (!selectedAppraisal) return;

    setIsUpdating(true);

    let notesToSave: string | null = notes.trim() || null;
    const existingData = parseAppraisalData(selectedAppraisal.notes);

    if (existingData) {
      if (notes.trim()) {
        notesToSave = JSON.stringify({
          ...existingData,
          _adminNotes: notes.trim()
        });
      } else {
        notesToSave = selectedAppraisal.notes;
      }
    }

    const { error } = await supabase
      .from("contact_submissions")
      .update({
        status,
        notes: notesToSave,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedAppraisal.id);

    if (error) {
      toast.error("Failed to update appraisal");
    } else {
      toast.success("Appraisal updated successfully");
      setIsDialogOpen(false);
      loadAppraisals();
    }
    setIsUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "contacted":
        return "bg-yellow-500";
      case "converted":
        return "bg-green-500";
      case "processed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const renderAppraisalDetails = (data: AppraisalData | null) => {
    if (!data) return null;

    return (
      <div className="space-y-4 text-sm">
        {data.vehicle && (
          <div>
            <h4 className="font-semibold text-base mb-2">Vehicle Information</h4>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Year:</span> {data.vehicle.year || "N/A"}</p>
              <p><span className="font-medium">Make:</span> {data.vehicle.make || "N/A"}</p>
              <p><span className="font-medium">Model:</span> {data.vehicle.model || "N/A"}</p>
              <p><span className="font-medium">Trim:</span> {data.vehicle.trim || "N/A"}</p>
              <p className="col-span-2"><span className="font-medium">VIN:</span> {data.vehicle.vin || "N/A"}</p>
            </div>
          </div>
        )}

        {data.details && (
          <div>
            <h4 className="font-semibold text-base mb-2">Vehicle Details</h4>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Odometer:</span> {data.details.odometer ? `${parseInt(data.details.odometer).toLocaleString()} km` : "N/A"}</p>
              <p><span className="font-medium">Transmission:</span> {data.details.transmission || "N/A"}</p>
              <p><span className="font-medium">Exterior Color:</span> {data.details.exteriorColor || "N/A"}</p>
              <p><span className="font-medium">Interior Color:</span> {data.details.interiorColor || "N/A"}</p>
            </div>
          </div>
        )}

        {data.condition && (
          <div>
            <h4 className="font-semibold text-base mb-2">Condition</h4>
            <div className="space-y-1">
              <p><span className="font-medium">Exterior Damage:</span> {data.condition.hasExteriorDamage ? "Yes" : "No"}</p>
              <p><span className="font-medium">Interior Damage:</span> {data.condition.hasInteriorDamage ? "Yes" : "No"}</p>
              <p><span className="font-medium">Accidents/Claims:</span> {data.condition.hasAccidents ? "Yes" : "No"}</p>
              <p><span className="font-medium">Mechanical Issues:</span> {data.condition.hasMechanicalIssues ? "Yes" : "No"}</p>
              <p><span className="font-medium">Warning Lights:</span> {data.condition.hasWarningLights ? "Yes" : "No"}</p>
              <p><span className="font-medium">Number of Keys:</span> {data.condition.numberOfKeys || "N/A"}</p>
            </div>
          </div>
        )}

        {data.images && data.images.length > 0 && (
          <div>
            <h4 className="font-semibold text-base mb-2">Uploaded Images ({data.images.length})</h4>
            <div className="grid grid-cols-3 gap-2">
              {data.images.map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={`Vehicle image ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Vehicle Appraisals</h1>
        <p className="text-muted-foreground">Manage vehicle appraisal requests from customers looking to sell</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading appraisals...</div>
      ) : appraisals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No appraisal requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appraisals.map((appraisal) => {
            const appraisalData = parseAppraisalData(appraisal.notes);
            const vehicleInfo = appraisalData?.vehicle;
            const adminNotes = getAdminNotes(appraisal.notes);

            return (
              <Card key={appraisal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{appraisal.name}</CardTitle>
                        <Badge variant="outline" className="bg-orange-50">Appraisal</Badge>
                      </div>
                      {vehicleInfo && (
                        <p className="text-sm font-medium mt-1">
                          {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.trim}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(appraisal.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appraisal.status)}>{appraisal.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {appraisal.email}
                    </div>
                    {appraisal.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {appraisal.phone}
                      </div>
                    )}
                  </div>

                  {appraisalData?.images && appraisalData.images.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{appraisalData.images.length} images uploaded</span>
                    </div>
                  )}

                  {adminNotes && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <span className="font-medium text-sm">Your Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{adminNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Dialog open={viewDetailsOpen && selectedAppraisal?.id === appraisal.id} onOpenChange={(open) => {
                      setViewDetailsOpen(open);
                      if (!open) setSelectedAppraisal(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleViewDetails(appraisal)} size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Vehicle Appraisal Details</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="mb-4 pb-4 border-b">
                            <h3 className="font-semibold mb-2">Contact Information</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p><span className="font-medium">Name:</span> {appraisal.name}</p>
                              <p><span className="font-medium">Email:</span> {appraisal.email}</p>
                              <p><span className="font-medium">Phone:</span> {appraisal.phone}</p>
                            </div>
                          </div>
                          {renderAppraisalDetails(appraisalData)}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogOpen && selectedAppraisal?.id === appraisal.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) setSelectedAppraisal(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog(appraisal)} size="sm">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Appraisal Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="processed">Processed</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Notes / Comments</label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes about this appraisal..."
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleUpdateAppraisal} disabled={isUpdating} className="w-full">
                            {isUpdating ? "Updating..." : "Save Changes"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
