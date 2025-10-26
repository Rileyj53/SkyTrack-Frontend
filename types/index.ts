export interface Student {
  _id: string
  user_id: {
    first_name: string
    last_name: string
  }
}

export interface Instructor {
  _id: string
  user_id: {
    first_name: string
    last_name: string
  }
}

export interface Schedule {
  _id: string
  school_id: string
  plane_id: string
  instructor_id: string
  student_id: string
  date: string
  start_time: string
  end_time: string
  flight_type: string
  status: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
} 