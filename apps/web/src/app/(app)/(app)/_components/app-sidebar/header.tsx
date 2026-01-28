import { SidebarHeader as SidebarHeaderPrimitive, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { OrganizationSelector } from './organization-selector';
import { cn } from '@/lib/utils';

export function SidebarHeader () {
  const { state } = useSidebar()

  const isCollapsed = state === "collapsed";


  return (
    <SidebarHeaderPrimitive
      className={cn(
        'flex md:pt-3.5',
        isCollapsed
          ? 'flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start'
          : 'flex-row items-center justify-between'
      )}
    >
      <OrganizationSelector />

        <SidebarTrigger className='hidden md:block'/>
    </SidebarHeaderPrimitive>
  )
}
