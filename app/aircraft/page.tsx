import { Suspense } from "react"
import { Plane } from "lucide-react"
import { AircraftPage } from "@/components/aircraft-page"
import { Card, CardContent } from "@/components/ui/card"

export default function Aircraft() {
  console.log("Aircraft page component mounting")
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <Plane className="h-12 w-12 animate-pulse text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-lg font-medium text-muted-foreground">Loading aircraft data...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AircraftPage />
    </Suspense>
  )
}
