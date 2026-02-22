// app/auth/signin/page.tsx
import { Suspense } from "react";
import SigninComponent from "./SigninComponent";

export const dynamic = 'force-dynamic'; // ensures page is not statically rendered

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="text-center text-2xl mx-auto h-screen flex items-center justify-center">Loading...</div>}>
      <SigninComponent />
    </Suspense>
  );
}
