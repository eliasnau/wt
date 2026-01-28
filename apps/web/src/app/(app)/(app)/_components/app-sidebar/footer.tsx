import { SidebarFooter as SidebarFooterPrimitive } from '@/components/ui/sidebar'
import { OrganizationSelector } from './organization-selector';
import { cn } from '@/lib/utils';
import { UserButton } from './user-button';

export function SidebarFooter () {
  return (
    <SidebarFooterPrimitive className="px-2">
				<UserButton />
			</SidebarFooterPrimitive>
  )
}
