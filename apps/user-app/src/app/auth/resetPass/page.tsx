// app/auth/resetPass/page.tsx
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = 'force-dynamic'; // ensures page is not statically rendered

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
