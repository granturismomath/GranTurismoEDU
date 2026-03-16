import { redirect } from 'next/navigation'

// /dashboard 根目錄自動導向探索商城
export default function DashboardPage() {
  redirect('/dashboard/explore')
}
