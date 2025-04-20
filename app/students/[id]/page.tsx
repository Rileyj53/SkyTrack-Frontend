import { StudentDetailPage } from "@/components/student-detail-page"

export default function StudentDetail({ params }: { params: { id: string } }) {
  return <StudentDetailPage studentId={params.id} />
}
