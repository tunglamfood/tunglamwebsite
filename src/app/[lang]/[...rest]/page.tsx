import { notFound } from "next/navigation";

/** Catch-all so unknown URLs render the localized 404 inside the site layout (with a real 404 status). */
export default function CatchAll() {
  notFound();
}
