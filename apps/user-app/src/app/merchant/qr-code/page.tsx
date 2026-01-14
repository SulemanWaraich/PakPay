"use client";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { useRef, useCallback } from "react";

const Index = () => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "pakpay-merchant-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PakPay Merchant QR Code",
          text: "Scan this QR code to pay via PakPay",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      alert("Web Share API is not supported in your browser. Please use the download button instead.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 mx-auto">
      {/* Main Card */}
      <div className="w-full max-w-xl bg-card rounded-2xl border-2 border-pakpay-light shadow-pakpay-card p-8">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground text-center mb-8">
          Merchant QR Code
        </h1>

        {/* QR Code Container */}
        <div className="flex justify-center mb-8">
          <div 
            ref={qrRef}
            className="relative bg-pakpay-pale border-2 border-pakpay-light rounded-xl p-6"
          >
            <QRCodeSVG
              value="https://pakpay.com/pay/merchant-123456"
              size={240}
              level="M"
              includeMargin={false}
              bgColor="transparent"
              fgColor="hsl(140, 25%, 15%)"
            />
            {/* PakPay Logo Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-pakpay-pale px-2 py-0.5 text-pakpay-medium font-semibold text-sm tracking-wide">
                PakPay
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-pakpay-button text-foreground font-medium py-3.5 px-6 rounded-full shadow-pakpay-button transition-all duration-200 hover:brightness-95 hover:shadow-lg active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            <span>Download QR Code</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-pakpay-button text-foreground font-medium py-3.5 px-6 rounded-full shadow-pakpay-button transition-all duration-200 hover:brightness-95 hover:shadow-lg active:scale-[0.98]"
          >
            <Share2 className="w-5 h-5" />
            <span>Share QR Code</span>
          </button>
        </div>

        {/* How to Use Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            How to Use
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-pakpay-medium mt-1.5">•</span>
              <span>Scan the code with any payment app to make a secure payment.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pakpay-medium mt-1.5">•</span>
              <span>Display this QR code at your point of sale for quick transactions.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
