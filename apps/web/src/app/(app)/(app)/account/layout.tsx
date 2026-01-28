'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Shield, Building2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const accountNavItems = [
  {
    title: 'General',
    href: '/account',
    icon: User
  },
  {
    title: 'Security',
    href: '/account/security',
    icon: Shield
  },
  {
    title: 'Organizations',
    href: '/account/organizations',
    icon: Building2
  }
] as const

export default function AccountLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>{children}</>
  )
}
