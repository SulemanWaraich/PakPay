// app/auth/signup/page.tsx
import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = 'force-dynamic'; // ensures page is not statically rendered

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupClient />
    </Suspense>
  );
}
