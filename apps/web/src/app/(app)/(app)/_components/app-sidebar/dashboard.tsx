'use client'

import { AnimateIcon } from '@/components/animate-ui/icons/icon'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  PieChart
} from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import type React from 'react'
import { useState } from 'react'
import { Blocks } from '@/components/animate-ui/icons/blocks'
import { ChartLine } from '@/components/animate-ui/icons/chart-line'
import { SlidersHorizontal } from '@/components/animate-ui/icons/sliders-horizontal'
import { LayoutDashboard } from '@/components/animate-ui/icons/layout-dashboard'
import { Users } from '@/components/animate-ui/icons/users'

export type NavRoute = {
  id: string
  title: string
  icon?: React.ReactNode
  link: string
  subs?: {
    title: string
    link: string
    icon?: React.ReactNode
  }[]
}

const routes: NavRoute[] = [
  {
    id: 'home',
    title: 'Home',
    icon: <LayoutDashboard className='size-4' />,
    link: '/dashboard'
  },
  {
    id: 'Members',
    title: 'Members',
    icon: <Users className='size-4' size={16} />,
    link: '/dashboard/members'
  },
  {
    id: 'groups',
    title: 'Groups',
    icon: <Blocks className='size-4' />,
    link: '/dashboard/groups'
  },
  {
    id: 'statistics',
    title: 'Statistics',
    icon: <ChartLine className='size-4' />,
    link: '/dashboard/statistics/overview',
    subs: [
      {
        title: 'Overview',
        link: '/dashboard/statistics/overview',
        icon: <PieChart className='size-4' />
      },
      {
        title: 'Compare Months',
        link: '/dashboard/statistics/range',
        icon: <PieChart className='size-4' />
      }
    ]
  },
  {
    id: 'events',
    title: 'Events',
    icon: <Calendar className='size-4' />,
    link: '/dashboard/events'
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: <DollarSign className='size-4' />,
    link: '/dashboard/finance/batches',
    subs: [
      { title: 'Payment Batches', link: '/dashboard/finance/batches' },
      { title: 'Generate SEPA', link: '#' },
      { title: 'History', link: '#' }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <SlidersHorizontal className='size-4' />,
    link: '/dashboard/settings',
    subs: [
      { title: 'General', link: '/dashboard/settings/general' },
      { title: 'Users', link: '/dashboard/settings/members' },
      { title: 'SEPA', link: '/dashboard/settings/sepa' },
      { title: 'Billing', link: '#' }
    ]
  }
]

export function DashboardLayout () {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null)
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {routes.map(route => {
            const isOpen = !isCollapsed && openCollapsible === route.id
            const hasSubRoutes = !!route.subs?.length

            return (
              <SidebarMenuItem key={route.id}>
                {hasSubRoutes ? (
                  <Collapsible
                    open={isOpen}
                    onOpenChange={open =>
                      setOpenCollapsible(open ? route.id : null)
                    }
                    className='w-full'
                  >
                    <CollapsibleTrigger
                      render={props => (
                        <AnimateIcon animateOnHover>
                          <SidebarMenuButton
                            {...props}
                            className={cn(
                              'flex w-full items-center rounded-lg px-2 transition-colors',
                              isOpen
                                ? 'bg-sidebar-muted text-foreground'
                                : 'text-muted-foreground hover:bg-sidebar-muted hover:text-foreground',
                              isCollapsed && 'justify-center'
                            )}
                          >
                            {route.icon}
                            {!isCollapsed && (
                              <span className='ml-2 flex-1 text-sm font-medium'>
                                {route.title}
                              </span>
                            )}
                            {!isCollapsed && hasSubRoutes && (
                              <span className='ml-auto'>
                                {isOpen ? (
                                  <ChevronUp className='size-4' />
                                ) : (
                                  <ChevronDown className='size-4' />
                                )}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </AnimateIcon>
                      )}
                    />

                    {!isCollapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub className='my-1 ml-3.5 '>
                          {route.subs?.map(subRoute => (
                            <SidebarMenuSubItem
                              key={`${route.id}-${subRoute.title}`}
                              className='h-auto'
                            >
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={subRoute.link as Route}
                                  prefetch={true}
                                  className='flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground'
                                >
                                  {subRoute.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <AnimateIcon animateOnHover>
                    <SidebarMenuButton tooltip={route.title} asChild>
                      <Link
                        href={route.link as Route}
                        prefetch={true}
                        className={cn(
                          'flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        {route.icon}
                        {!isCollapsed && (
                          <span className='ml-2 text-sm font-medium'>
                            {route.title}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </AnimateIcon>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  )
}
