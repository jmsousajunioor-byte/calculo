import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function Page() {
  const session = await getSession()
  if (session?.user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}

