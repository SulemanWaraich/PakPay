// app/auth/signup/page.tsx
import { Suspense } from "react";
import SignupClient from "./SignupClient";

export const dynamic = 'force-dynamic'; // ensures page is not statically rendered

export default function SignupPage() {
  return (
    <Suspense fallback={ <div className="min-h-screen w-full flex items-center justify-center bg-background">
       <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

         {/* Spinner */}
         <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

         {/* Text */}
         <p className="text-sm font-medium text-muted-foreground">
           Loading your Signup Page…
         </p>
       </div>
     </div>}>
      <SignupClient />
    </Suspense>
  );
}
