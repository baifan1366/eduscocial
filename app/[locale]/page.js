
import { redirect } from "next/navigation";

export default async function LocalePage({ params }) {
  const { locale } = (await params);
  redirect(`/${locale}/home`);
}
