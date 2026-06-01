import { redirect } from "next/navigation";

export default function MerchantKycRedirect() {
  redirect("/merchant/business-profile");
}
