"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  Bell,
  ShoppingCart,
} from "lucide-react";
import { t } from "@/i18n";
import { useAlertCount } from "@/hooks/useAlertCount";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/inventory", icon: Package, labelKey: "nav.inventory" },
  { href: "/scan", icon: ScanLine, labelKey: "nav.scan" },
  { href: "/alerts", icon: Bell, labelKey: "nav.alerts", badge: true },
  { href: "/shopping-list", icon: ShoppingCart, labelKey: "nav.shoppingList" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const alertCount = useAlertCount();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
      <ul className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, labelKey, badge }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = badge && alertCount > 0;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors
                  ${isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                      {alertCount > 99 ? "99+" : alertCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">
                  {t(labelKey).split(" ")[0]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
