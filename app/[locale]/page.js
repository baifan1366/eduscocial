
import { redirect } from "next/navigation";

export default async function LocalePage({ params }) {
  const { locale } = (await params);
  //locale include business or admin
  if (locale.includes("business")) {
    redirect(`/${locale}/home`);
  } else if (locale.includes("admin")) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/home`);
  }
}
