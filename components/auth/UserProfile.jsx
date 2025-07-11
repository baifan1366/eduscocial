"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function UserProfile() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Sign in
        </Link>
        <Link
          href="/auth/register"
          className="text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      <button
        className="flex items-center space-x-2 focus:outline-none"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              {session.user.name ? session.user.name[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {session.user.name}
        </span>
        <svg
          className="h-5 w-5 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-10 w-48 py-1 mt-2 bg-white rounded-md shadow-lg z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setShowDropdown(false)}
          >
            Your Profile
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setShowDropdown(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => {
              setShowDropdown(false);
              signOut({ callbackUrl: "/auth/login" });
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 