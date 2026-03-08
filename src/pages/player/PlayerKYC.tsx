import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Shield, CheckCircle, FileText, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getKycStatus, submitKyc } from "@/api/player";
import { useAuth } from "@/contexts/AuthContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT_TYPES = "image/jpeg,image/png,image/jpg";

const PlayerKYC = () => {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [hasDocument, setHasDocument] = useState(false);
  const [docType, setDocType] = useState("Citizenship");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canUpload = kycStatus === "rejected" || (kycStatus === "pending" && !hasDocument);

  useEffect(() => {
    getKycStatus()
      .then((res) => {
        const data = res as { kyc_status?: string; kyc_reject_reason?: string; has_document?: boolean };
        setKycStatus(data.kyc_status ?? "pending");
        setRejectReason(data.kyc_reject_reason ?? "");
        setHasDocument(!!data.has_document);
      })
      .catch(() => {});
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    if (!chosen.type.match(/^image\/(jpeg|png|jpg)$/i)) {
      toast({ title: "Please upload a JPG or PNG image.", variant: "destructive" });
      return;
    }
    if (chosen.size > MAX_FILE_SIZE) {
      toast({ title: "File must be under 5MB.", variant: "destructive" });
      return;
    }
    setFile(chosen);
    toast({ title: "Document selected.", description: "Ready to submit." });
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: "Please upload a document", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("kyc_document", file);
      formData.append("document_type", docType);
      await submitKyc(formData);
      setFile(null);
      setKycStatus("pending");
      setHasDocument(true);
      await refreshUser?.();
      toast({ title: "KYC submitted successfully!", description: "We'll review it within 24 hours." });
    } catch (e: unknown) {
      const err = e as { detail?: string };
      toast({ title: err?.detail ?? "Submission failed.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      <h2 className="font-gaming font-bold text-xl neon-text tracking-wider">KYC VERIFICATION</h2>

      <Card className="gaming-card">
        <CardContent className="p-6 text-center space-y-4">
          <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${kycStatus === "approved" ? "bg-success/10" : "gold-gradient neon-glow-sm"}`}>
            {kycStatus === "approved" ? <CheckCircle className="h-8 w-8 text-success" /> : <Shield className="h-8 w-8 text-primary-foreground" />}
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Verification Status</p>
            <div className="mt-1"><StatusBadge status={kycStatus} /></div>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {kycStatus === "approved"
              ? "Your identity has been verified. You can now withdraw funds."
              : kycStatus === "pending" && hasDocument
                ? "Your document is under review. You cannot submit another document until we respond."
                : kycStatus === "rejected"
                  ? "Your previous submission was rejected. Please upload a valid document again."
                  : "Please upload a valid government ID to verify your identity. This is required for withdrawals."}
          </p>
          {kycStatus === "rejected" && rejectReason && (
            <p className="text-xs text-destructive max-w-sm mx-auto">Reason: {rejectReason}</p>
          )}
        </CardContent>
      </Card>

      {canUpload && (
        <Card className="gaming-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option>Citizenship</option>
                <option>Passport</option>
                <option>Driving License</option>
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={handleUploadClick}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleUploadClick(); } }}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {file ? (
                <>
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p className="text-sm font-medium text-success truncate max-w-full px-2">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-xs text-muted-foreground">Tap to upload or take a photo</p>
                  <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                </>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={!file || submitting} className="w-full gold-gradient text-primary-foreground font-gaming tracking-wider h-11 neon-glow-sm">
              {submitting ? "Submitting…" : "SUBMIT FOR REVIEW"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerKYC;
