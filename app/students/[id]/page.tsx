import { StudentDetailPage } from "@/components/student-detail-page"

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudentDetailPage studentId={id} />
}
