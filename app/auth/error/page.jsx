"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Define error messages
  const errorMessages = {
    default: "An error occurred during authentication.",
    AccessDenied: "You do not have permission to access this resource.",
    CredentialsSignin: "Invalid email or password. Please try again.",
    OAuthSignInError: "Error signing in with OAuth provider.",
    OAuthCallbackError: "Error processing OAuth callback.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    EmailCreateAccount: "Could not create email account.",
    Verification: "The verification link is invalid or has expired.",
    Configuration: "There is a problem with the server configuration.",
  };

  const message = errorMessages[error] || errorMessages.default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          
          <p className="mt-2 text-lg text-gray-600">
            {message}
          </p>
          
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 