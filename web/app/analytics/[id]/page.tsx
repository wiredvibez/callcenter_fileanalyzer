import { redirect } from 'next/navigation';

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  // Redirect to the summary page with session context
  redirect(`/summary?session=${params.id}`);
}

