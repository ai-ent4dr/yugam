import { redirect } from "next/navigation";

export default async function LegacyResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/analysis/${id}`);
}
