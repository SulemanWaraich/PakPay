"use client";

import { useEffect, useRef, useState } from "react";
import { Image, CheckCircle2 } from "lucide-react";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  return () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  };
}, [logoPreview]);

  // Fetch merchant profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/qr");
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        setBusinessName(data.businessName || "");
        setCategory(data.category || "RETAIL");
        setAddress(data.address || "");
        setKycStatus(data.kycStatus);
        setLogoPreview(data.logoUrl || null);
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

  const handleSave = async () => {
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

      const res = await fetch("/api/qr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      alert("Business profile saved. Verification pending.");
      setKycStatus("PENDING");
    } catch {
      setError("Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading business profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[700px] bg-card rounded-xl shadow-card border-t-4 border-t-primary">
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
                onChange={(e) =>
                  e.target.files && handleLogoSelect(e.target.files[0])
                }
              />

              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
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
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
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
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {kycStatus !== "VERIFIED" && (
            <p className="text-sm text-muted-foreground mt-4">
              Your business is under verification. QR code will be available
              after approval.
            </p>
          )}
        </div>
      </div>
  );
};

export default BusinessProfileSettings;

