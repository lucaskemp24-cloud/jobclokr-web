"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

const officeNavigation: NavigationItem[] = [
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

const employeeNavigation: NavigationItem[] = [
  {
    href: "/employee-portal",
    label: "Employee Portal",
    icon: "📱",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const savedUser = loadAuthUser();

    if (!savedUser) {
      setAuthLoaded(true);
      router.replace("/login");
      return;
    }

    setUser(savedUser);
    setAuthLoaded(true);
  }, [router]);

  if (!authLoaded) {
    return (
      <aside className="min-h-screen w-56 bg-slate-950 p-5 text-white">
        <div className="text-2xl font-bold text-blue-500">
          JobClokr
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems = isOfficeUser(user)
    ? officeNavigation
    : employeeNavigation;

  return (
    <aside className="min-h-screen w-56 shrink-0 bg-slate-950 px-5 py-6 text-white">
      <Link
        href={isOfficeUser(user) ? "/" : "/employee-portal"}
        className="mb-10 block text-3xl font-bold text-blue-500"
      >
        JobClokr
      </Link>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-10 text-xs text-slate-500">
        Signed in as
        <p className="mt-1 font-medium text-slate-300">
          {user.name}
        </p>
      </div>
    </aside>
  );
}