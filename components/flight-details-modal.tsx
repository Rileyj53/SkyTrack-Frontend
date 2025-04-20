import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plane, User } from "lucide-react"

interface FlightDetails {
  _id: string
  date: string
  start_time: string
  plane_reg: string
  plane_id: string
  student_name: string
  student_id: string
  instructor: string
  instructor_id: string
  duration: number
  type: string
  status: string
  school_id: string
  created_at: string
  updated_at: string
}

interface FlightDetailsModalProps {
  flight: FlightDetails | null
  isOpen: boolean
  onClose: () => void
}

export function FlightDetailsModal({ flight, isOpen, onClose }: FlightDetailsModalProps) {
  if (!flight) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Flight Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(flight.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{flight.start_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{flight.plane_reg}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{flight.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Instructor: {flight.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration: {flight.duration} hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={flight.status === "Completed" ? "default" : "secondary"}
                className={flight.status === "Completed" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {flight.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Type: {flight.type}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 