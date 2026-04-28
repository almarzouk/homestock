"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  Bell,
  TrendingUp,
  ShoppingCart,
  Settings,
  Home,
} from "lucide-react";
import { t } from "@/i18n";
import UserMenu from "./UserMenu";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/inventory", icon: Package, labelKey: "nav.inventory" },
  { href: "/scan", icon: ScanLine, labelKey: "nav.scan" },
  { href: "/alerts", icon: Bell, labelKey: "nav.alerts" },
  { href: "/movements", icon: TrendingUp, labelKey: "nav.movements" },
  { href: "/shopping-list", icon: ShoppingCart, labelKey: "nav.shoppingList" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">HomeStock</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ href, icon: Icon, labelKey }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  {t(labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <UserMenu />
      </div>
    </aside>
  );
}
