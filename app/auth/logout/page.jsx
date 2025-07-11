"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      if (session) {
        await signOut({ redirect: false });
      }
      router.push("/auth/login");
      router.refresh();
    }

    logout();
  }, [session, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Signing you out...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we log you out.
          </p>
          <div className="mt-6 flex justify-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 