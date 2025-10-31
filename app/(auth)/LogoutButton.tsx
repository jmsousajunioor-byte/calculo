"use client"
export function LogoutButton() {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }
  return (
    <button onClick={logout} className="rounded-full border border-slate-300 px-3 py-1 text-xs">Sair</button>
  )
}

