"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import Head from "next/head";

/**
 * Base page skeleton component
 * Use this for loading states
 */
export function PageSkeleton({ title = "Loading..." }) {
  return (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 bg-gray-200 rounded-md animate-pulse w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-4/6"></div>
        <div className="h-12 bg-gray-200 rounded-md animate-pulse w-full mt-6"></div>
      </div>
    </div>
  );
}

/**
 * Page Head component for SEO
 */
export function PageHead({ title, description, keywords }) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
    </Head>
  );
}

/**
 * Example page template showing required components:
 * - Head for meta tags
 * - Skeleton loading state
 * - Translated words
 * 
 * Example usage for new pages:
 * 
 * File: app/example-page/page.js (kebab-case filename)
 * ```
 * "use client";
 * 
 * import { PageHead, PageSkeleton } from "@/lib/page-templates";
 * import { useTranslations } from "next-intl";
 * import { Suspense } from "react";
 * 
 * export default function ExamplePage() {
 *   const t = useTranslations("ExamplePage");
 *   
 *   return (
 *     <>
 *       <PageHead 
 *         title={t("pageTitle")}
 *         description={t("pageDescription")}
 *       />
 *       
 *       <Suspense fallback={<PageSkeleton />}>
 *         <main className="container mx-auto p-4">
 *           <h1 className="text-2xl font-bold">{t("heading")}</h1>
 *           <p>{t("content")}</p>
 *         </main>
 *       </Suspense>
 *     </>
 *   );
 * }
 * ```
 */ 