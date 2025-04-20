export default function AdminPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Admin Dashboard</h2>
      </div>
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium">Welcome to the System Admin Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            This is where you'll manage system-wide settings and configurations.
          </p>
        </div>
      </div>
    </div>
  )
} 