import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../app/lib/utils";

type KycStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";

export type KycProgressTrackerProps = {
  kycStatus: KycStatus;
  businessName: string | null;
  kycReviewNote: string | null;
};

type StepState = "complete" | "current" | "upcoming" | "rejected";

function StepIndicator({ state }: { state: StepState }) {
  if (state === "complete") {
    return <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" aria-hidden />;
  }
  if (state === "rejected") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700"
        aria-hidden
      >
        !
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className="relative flex h-6 w-6 shrink-0 items-center justify-center"
        aria-hidden
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
        <span className="relative inline-flex h-6 w-6 rounded-full border-2 border-green-600 bg-green-50" />
      </span>
    );
  }
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-50"
      aria-hidden
    />
  );
}

function Connector({ complete }: { complete: boolean }) {
  return (
    <div
      className={cn(
        "mx-2 hidden h-0.5 flex-1 sm:block",
        complete ? "bg-green-500" : "bg-gray-200",
      )}
    />
  );
}

export default function KycProgressTracker({
  kycStatus,
  businessName,
  kycReviewNote,
}: KycProgressTrackerProps) {
  if (kycStatus === "VERIFIED") {
    return null;
  }

  const step1Complete =
    businessName != null && String(businessName).trim().length > 0;
  const step2Complete =
    kycStatus === "SUBMITTED" || kycStatus === "REJECTED";

  const step1State: StepState = step1Complete ? "complete" : "current";
  let step2State: StepState = "upcoming";
  if (step2Complete) step2State = "complete";
  else if (step1Complete) step2State = "current";

  let step3State: StepState = "upcoming";
  if (kycStatus === "REJECTED") step3State = "rejected";
  else if (kycStatus === "SUBMITTED") step3State = "current";

  return (
    <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50/80 to-white shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Complete verification to accept payments
        </h2>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Step 1 */}
          <div className="flex flex-1 flex-col gap-2 sm:min-w-0">
            <div className="flex items-center gap-2">
              <StepIndicator state={step1State} />
              <p
                className={cn(
                  "text-sm font-medium",
                  step1State === "current" ? "text-green-800" : "text-gray-700",
                )}
              >
                Set up business profile
              </p>
            </div>
            {step1State === "complete" ? (
              <p className="pl-8 text-xs text-green-700">Complete</p>
            ) : (
              <Link
                href="/merchant/profile"
                className="pl-8 text-sm text-green-700 hover:underline"
              >
                Complete your profile →
              </Link>
            )}
          </div>

          <Connector complete={step1Complete} />

          {/* Step 2 */}
          <div className="flex flex-1 flex-col gap-2 sm:min-w-0">
            <div className="flex items-center gap-2">
              <StepIndicator state={step2State} />
              <p
                className={cn(
                  "text-sm font-medium",
                  step2State === "current" ? "text-green-800" : "text-gray-700",
                )}
              >
                Submit KYC documents
              </p>
            </div>
            {step2State === "complete" ? (
              <p className="pl-8 text-xs text-green-700">Submitted</p>
            ) : step2State === "current" ? (
              <Link
                href="/merchant/kyc"
                className="pl-8 text-sm text-green-700 hover:underline"
              >
                Upload documents →
              </Link>
            ) : (
              <p className="pl-8 text-xs text-gray-400">Pending previous step</p>
            )}
          </div>

          <Connector complete={step2Complete} />

          {/* Step 3 */}
          <div className="flex flex-1 flex-col gap-2 sm:min-w-0">
            <div className="flex items-center gap-2">
              <StepIndicator state={step3State} />
              <p
                className={cn(
                  "text-sm font-medium",
                  step3State === "current"
                    ? "text-green-800"
                    : step3State === "rejected"
                      ? "text-red-800"
                      : "text-gray-700",
                )}
              >
                Get verified &amp; receive QR code
              </p>
            </div>
            {kycStatus === "SUBMITTED" && (
              <p className="pl-8 text-xs text-amber-700">
                Under review · Usually within 24 hours
              </p>
            )}
            {kycStatus === "REJECTED" && (
              <div className="pl-8 space-y-1">
                <p className="text-xs text-red-700">Verification rejected</p>
                {kycReviewNote?.trim() ? (
                  <p className="text-xs text-gray-600">{kycReviewNote}</p>
                ) : null}
                <Link
                  href="/merchant/kyc"
                  className="text-sm text-green-700 hover:underline"
                >
                  Resubmit documents →
                </Link>
              </div>
            )}
            {kycStatus === "PENDING" && step2Complete && (
              <p className="pl-8 text-xs text-gray-500">Waiting for document submission</p>
            )}
            {kycStatus === "PENDING" && !step2Complete && (
              <p className="pl-8 text-xs text-gray-400">Complete earlier steps first</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
