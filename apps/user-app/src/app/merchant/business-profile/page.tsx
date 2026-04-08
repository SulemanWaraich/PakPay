"use client";

import { useEffect, useRef, useState } from "react";
import { Image, CheckCircle2 } from "lucide-react";
import { showToast } from "../../lib/toastMessage";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

const BusinessProfileSettings = () => {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("RETAIL");
  const [address, setAddress] = useState("");
  const [kycStatus, setKycStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">(
    "PENDING"
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // KYC Document states
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLocked = kycStatus === "VERIFIED";
  const router = useRouter();


  useEffect(() => {
  return () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  };
}, [logoPreview]);

  // Fetch merchant profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/merchant", { cache: "no-store" });
       
        if (res.status === 401) {
          router.push("/auth/signin");
          return; // stop executing
        }

 
          
       if (!res.ok) {
          const data = await res.text();
          throw new Error(data || "Failed to load business profile");
        }

        const data = await res.json();
        setBusinessName(data.businessName || "");
        setCategory(data.category || "RETAIL");
        setAddress(data.address || "");
        setKycStatus(data.kycStatus);
        setLogoPreview(data.logoUrl || null);
        setIdDocumentPreview(data.idDocumentUrl || null);
        setBusinessLicensePreview(data.businessLicenseUrl || null);
        setAddressProofPreview(data.addressProofUrl || null);
      } catch {
        setError("Failed to load business profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

 const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleIdDocumentSelect = (file: File) => {
    setIdDocumentFile(file);
    setIdDocumentPreview(URL.createObjectURL(file));
  };

  const handleBusinessLicenseSelect = (file: File) => {
    setBusinessLicenseFile(file);
    setBusinessLicensePreview(URL.createObjectURL(file));
  };

  const handleAddressProofSelect = (file: File) => {
    setAddressProofFile(file);
    setAddressProofPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
     if (isLocked) {
      return showToast("success", "✅ Profile locked after verification. Changes are not allowed.");
    }

    if (!businessName || !address) {
      setError("Business name and address are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("category", category);
      formData.append("address", address);

      if (logoFile) {
        formData.append("logo", logoFile);
      }
      if (idDocumentFile) {
        formData.append("idDocument", idDocumentFile);
      }
      if (businessLicenseFile) {
        formData.append("businessLicense", businessLicenseFile);
      }
      if (addressProofFile) {
        formData.append("addressProof", addressProofFile);
      }

      const res = await fetch("/api/qr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      showToast("success", "Business profile saved. Verification pending.");
      setKycStatus("PENDING");
    } catch {
      setError("Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

        {/* Spinner */}
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

        {/* Text */}
        <p className="text-sm font-medium text-muted-foreground">
          Loading business profile…
        </p>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl w-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[800px] bg-card rounded-xl shadow-card border-t-4 border-t-primary">
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <h1 className="text-xl font-medium">Business Profile Settings</h1>
        </div>

        <div className="px-8 py-8">
          {/* Header */}
          <div className="flex gap-6 mb-8">
            <div className="flex flex-col items-center gap-3">
             <div
                onClick={() => fileRef.current?.click()}
                className="w-28 h-28 rounded-xl bg-muted border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                disabled={isLocked}
                onChange={(e) =>
                  e.target.files && handleLogoSelect(e.target.files[0])
                }
              />

              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={isLocked}>
                Change Logo
              </Button>
            </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{businessName || "—"}</h2>
                {kycStatus === "VERIFIED" && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                KYC Status:{" "}
                <span className="font-medium">{kycStatus}</span>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5 mx-8">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}  disabled={isLocked}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">Retail & E-commerce</SelectItem>
                  <SelectItem value="FOOD">Food & Beverage</SelectItem>
                  <SelectItem value="SERVICES">Professional Services</SelectItem>
                  <SelectItem value="TECH">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter business address"
                disabled={isLocked}
              />
            </div>

            {/* KYC Documents Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">KYC Verification Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload the following documents to complete your KYC verification process.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ID Document */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Document</label>
                  <div
                    onClick={() => !isLocked && document.getElementById('idDocument')?.click()}
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {idDocumentPreview ? (
                      <img src={idDocumentPreview} alt="ID Document" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">ID Document</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="idDocument"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    disabled={isLocked}
                    onChange={(e) => e.target.files && handleIdDocumentSelect(e.target.files[0])}
                  />
                </div>

                {/* Business License */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business License</label>
                  <div
                    onClick={() => !isLocked && document.getElementById('businessLicense')?.click()}
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {businessLicensePreview ? (
                      <img src={businessLicensePreview} alt="Business License" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Business License</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="businessLicense"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    disabled={isLocked}
                    onChange={(e) => e.target.files && handleBusinessLicenseSelect(e.target.files[0])}
                  />
                </div>

                {/* Address Proof */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address Proof</label>
                  <div
                    onClick={() => !isLocked && document.getElementById('addressProof')?.click()}
                    className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {addressProofPreview ? (
                      <img src={addressProofPreview} alt="Address Proof" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Address Proof</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="addressProof"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    disabled={isLocked}
                    onChange={(e) => e.target.files && handleAddressProofSelect(e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8 mr-4">
            <Button onClick={handleSave} disabled={saving || isLocked}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
            
           {isLocked && (
            <p className="text-sm text-green-600 mt-4 mb-2 ml-2">
              ✅ Profile locked after verification
            </p>
          )}

           {!isLocked && (
            <p className="text-sm text-muted-foreground mt-4 mb-2 ml-2">
              Your business is under verification. QR code will be available after approval.
            </p>
          )}
        </div>
      </div>
  );
};

export default BusinessProfileSettings;

