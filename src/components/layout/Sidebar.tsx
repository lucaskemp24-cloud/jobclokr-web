"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  isOfficeUser,
  loadAuthUser,
  type AuthUser,
} from "@/lib/auth";

type NavigationItem = {
  href: string;
  label: string;
  icon: string;
};

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const officeNavigation: NavigationItem[] =
  [
    {
      href: "/",
      label: "Dashboard",
      icon: "📊",
    },
    {
      href: "/customers",
      label: "Customers",
      icon: "👥",
    },
    {
      href: "/projects",
      label: "Projects",
      icon: "📁",
    },
    {
      href: "/employees",
      label: "Employees",
      icon: "👷",
    },
    {
      href: "/schedule",
      label: "Schedule",
      icon: "🗓️",
    },
    {
      href: "/time",
      label: "Time",
      icon: "⏰",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: "📈",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: "⚙️",
    },
  ];

const employeeNavigation: NavigationItem[] =
  [
    {
      href: "/employee-portal",
      label: "Employee Portal",
      icon: "📱",
    },
  ];

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(
      null
    );

  const [authLoaded, setAuthLoaded] =
    useState(false);

  useEffect(() => {
    const savedUser =
      loadAuthUser();

    if (!savedUser) {
      setAuthLoaded(true);

      router.replace(
        "/login"
      );

      return;
    }

    setUser(savedUser);
    setAuthLoaded(true);
  }, [router]);

  if (!authLoaded) {
    return (
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 bg-slate-950 p-5 text-white lg:block">
        <div className="text-2xl font-bold text-blue-500">
          JobClokr
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems =
    isOfficeUser(user)
      ? officeNavigation
      : employeeNavigation;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-slate-950 px-5 py-6 text-white shadow-xl transition-transform duration-200 lg:w-56 lg:translate-x-0 lg:shadow-none ${
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-full"
      }`}
    >
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={
            isOfficeUser(user)
              ? "/"
              : "/employee-portal"
          }
          onClick={
            onMobileClose
          }
          className="block text-3xl font-bold text-blue-500"
        >
          JobClokr
        </Link>

        <button
          type="button"
          onClick={
            onMobileClose
          }
          className="rounded-lg p-2 text-2xl text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <nav className="space-y-2">
        {navigationItems.map(
          (item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname ===
                    item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                onClick={
                  onMobileClose
                }
                className={`flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-6 text-center"
                >
                  {
                    item.icon
                  }
                </span>

                <span>
                  {
                    item.label
                  }
                </span>
              </Link>
            );
          }
        )}
      </nav>

      <div className="mt-auto pt-8 text-xs text-slate-500">
        Signed in as

        <p className="mt-1 font-medium text-slate-300">
          {user.name}
        </p>
      </div>
    </aside>
  );
}