import { Suspense } from "react"
import { AircraftPage } from "@/components/aircraft-page"

export default function Aircraft() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AircraftPage />
    </Suspense>
  )
}
