"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageHead, PageSkeleton } from "@/lib/page-templates";

export default function Home() {
  const { data: session, status } = useSession();
  const t = useTranslations("Index");

  return (
    <>
      <PageHead
        title={t("title")}
        description={t("description")}
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              {t("title")}
            </h1>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              {t("description")}
            </p>
            
            {status === "authenticated" && session ? (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t("welcomeBack", { name: session.user.name })}
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/boards"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {t("exploreBoards")}
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("viewProfile")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-10">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {t("getStarted")}
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("signIn")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-24">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Connect with your educational community
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900">Educational Discussions</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Join subject-specific boards and engage in meaningful discussions with peers and educators.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900">Verified Community</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Connect with a community of verified students, professors, and educational staff.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900">Resource Sharing</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Share and discover educational resources, study materials, and opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  );
}
