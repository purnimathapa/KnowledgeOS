import { redirect } from "next/navigation";

type SubjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { id } = await params;
  redirect(`/dashboard?subject=${id}`);
}
