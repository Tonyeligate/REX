import { redirect } from "next/navigation";

export default function DeprecatedJobDetailPage() {
  redirect("/admin/jobs");
}
