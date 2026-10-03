import { createSharedPathnamesNavigation } from "next-intl/navigation";
import { locales } from "./site";

export const { Link, usePathname, useRouter, redirect } =
  createSharedPathnamesNavigation({ locales, localePrefix: "as-needed" });
