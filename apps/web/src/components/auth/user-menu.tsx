import { Button } from "@matdesk/ui/components/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@matdesk/ui/components/menu";
import { Skeleton } from "@matdesk/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon, MoonIcon, ShieldIcon, SunIcon, UserIcon } from "lucide-react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";

export default function UserMenu() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, isPending, signOut } = useAuth();

  // The session is hydrated from the server, so this only shows on the rare
  // path where it isn't resolved yet (e.g. a fresh client-side navigation).
  if (isPending) {
    return (
      <Button aria-label="Loading account" disabled variant="ghost">
        <UserAvatar className="size-6" loading />
        <Skeleton className="h-4 w-20" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Link to="/sign-in">
        <Button variant="outline">Anmelden</Button>
      </Link>
    );
  }

  return (
    <Menu>
      <MenuTrigger aria-label="Account menu" render={<Button variant="ghost" />}>
        <UserAvatar className="size-6" image={user.image} name={user.name} seed={user.id} />
        {user.name}
      </MenuTrigger>
      <MenuPopup align="end" className="bg-card">
        <MenuGroup>
          <MenuGroupLabel>My Account</MenuGroupLabel>
          <MenuItem render={<Link to="/account/profile" />}>
            <UserIcon />
            Account
          </MenuItem>
          {user.role === "admin" ? (
            <MenuItem render={<Link to="/admin" />}>
              <ShieldIcon />
              Admin
            </MenuItem>
          ) : null}
          <MenuSub>
            <MenuSubTrigger>
              <SunIcon aria-hidden="true" className="hidden dark:block" />
              <MoonIcon aria-hidden="true" className="block dark:hidden" />
              Theme
            </MenuSubTrigger>
            <MenuSubPopup>
              <MenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as typeof theme)}
              >
                <MenuRadioItem value="light">Light</MenuRadioItem>
                <MenuRadioItem value="dark">Dark</MenuRadioItem>
                <MenuRadioItem value="system">System</MenuRadioItem>
              </MenuRadioGroup>
            </MenuSubPopup>
          </MenuSub>
          <MenuSeparator />
          <MenuItem
            variant="destructive"
            onClick={() => {
              signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
          >
            <LogOutIcon />
            Sign Out
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
