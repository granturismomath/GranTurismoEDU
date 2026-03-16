import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileForm from './ProfileForm'

// ─────────────────────────────────────────────────────────────
// Server Component — 在伺服器端一次撈齊所有使用者資料，
// 直接以 props 傳入 ProfileForm，徹底消除 client-side loading 閃爍。
// ─────────────────────────────────────────────────────────────
export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, grade, gender, birthday, district, school, parent_name, parent_phone')
    .eq('id', user.id)
    .single()

  return (
    <ProfileForm
      initialData={{
        email:        user.email             ?? '',
        name:         profile?.name          ?? '',
        grade:        profile?.grade         ?? '',
        gender:       profile?.gender        ?? '',
        birthday:     profile?.birthday      ?? '',
        district:     profile?.district      ?? '',
        school:       profile?.school        ?? '',
        parent_name:  profile?.parent_name   ?? '',
        parent_phone: profile?.parent_phone  ?? '',
      }}
    />
  )
}
