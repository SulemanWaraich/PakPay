// app/auth/signin/page.tsx
import { Suspense } from "react";
import SigninComponent from "./SigninComponent";

export const dynamic = 'force-dynamic'; // ensures page is not statically rendered

export default function SigninPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninComponent />
    </Suspense>
  );
}
