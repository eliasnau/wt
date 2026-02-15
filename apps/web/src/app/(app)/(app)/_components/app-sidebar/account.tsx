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
  Building2,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import type React from 'react'
import { useState } from 'react'
import { SlidersHorizontal } from '@/components/animate-ui/icons/sliders-horizontal'
import { User } from '@/components/animate-ui/icons/user'
import { ChevronLeft } from '@/components/animate-ui/icons/chevron-left'

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
    id: 'general',
    title: 'General',
    icon: <User className='size-4' />,
    link: '/account'
  },
  {
    id: 'customization',
    title: 'Customization',
    icon: <SlidersHorizontal className='size-4' />,
    link: '/account/customization'
  },
  {
    id: 'security',
    title: 'Sicherheit',
    icon: <Shield className='size-4' size={16} />,
    link: '/account/security'
  },
  {
    id: 'organizations',
    title: 'Organizations',
    icon: <Building2 className='size-4' size={16} />,
    link: '/account/organizations '
  }
]

export function AccountSidebar () {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null)
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenuItem>
          <AnimateIcon animateOnHover>
            <SidebarMenuButton tooltip='Dashboard' asChild>
              <Link
                href={'/dashboard'}
                prefetch={true}
                className={cn(
                  'flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
                style={{
                  // Center text "Dashboard" only, icon remains at start
                  justifyContent: isCollapsed ? 'center' : 'start',
                  width: '100%'
                }}
              >
                <ChevronLeft />
                {!isCollapsed && (
                  <span className='ml-2 text-sm font-medium'>
                    Zurück zum Dashboard
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </AnimateIcon>
        </SidebarMenuItem>
      </SidebarGroup>
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
