import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Login — Webinar Admin',
}

export default function AdminLoginPage() {
  return <LoginForm />
}
