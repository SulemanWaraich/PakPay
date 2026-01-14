"use client";
import { useState } from "react";
import { Image, CheckCircle2, ChevronDown } from "lucide-react";
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
  const [businessName, setBusinessName] = useState("PakMart Solutions");
  const [category, setCategory] = useState("retail");
  const [address, setAddress] = useState("123 Fintech Avenue, Lahore, Pakistan");

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30 pointer-events-none" />
      
      {/* Main Card */}
      <div className="relative w-full max-w-[700px] bg-card rounded-xl shadow-card border-t-4 border-t-primary">
        {/* Card Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <h1 className="text-xl font-medium text-card-foreground">
            Business Profile Settings
          </h1>
        </div>

        {/* Card Content */}
        <div className="px-8 py-8">
          {/* Business Info Section */}
          <div className="flex gap-6 mb-8">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
                <Image className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center leading-tight">
                  Upload<br />Logo
                </span>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5"
              >
                Change Logo
              </Button>
            </div>

            {/* Business Details */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-card-foreground">
                  PakMart Solutions
                </h2>
                <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Merchant</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Business Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Business Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Enter business name"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                  <SelectItem value="services">Professional Services</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Address
              </label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-[100px] rounded-lg border-border bg-card focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y"
                placeholder="Enter business address"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button
              className="h-11 px-8 bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg shadow-sm transition-all"
            >
              Save Changes
            </Button>
            <Button
              variant="secondary"
              className="h-11 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileSettings;
