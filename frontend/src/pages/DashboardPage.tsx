import { TranscriptionHistory } from '../components/TranscriptionHistory'
import { UploadCard } from '../components/UploadCard'

export function DashboardPage() {
  return (
    <div className="space-y-10">
      <UploadCard />
      <TranscriptionHistory />
    </div>
  )
}
