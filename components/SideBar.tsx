// "use client";

// import tw from "tailwind-styled-components";
// import { LayoutDashboard, Users, Banknote, FileText, Settings } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// export default function Sidebar() {
//   const pathname = usePathname();

//   return (
//     <Container>
//       <Brand>
//         LoanFlow
//       </Brand>

//       <Nav>
//         <NavItem href="/dashboard" $active={pathname === "/dashboard"}>
//           <LayoutDashboard size={18} />
//           Dashboard
//         </NavItem>

//         <NavItem href="/customers" $active={pathname === "/customers"}>
//           <Users size={18} />
//           Customers
//         </NavItem>

//         <NavItem href="/collections" $active={pathname === "/collections"}>
//           <FileText size={18} />
//           Collections
//         </NavItem>

//         <NavItem href="/loans" $active={pathname === "/loans"}>
//           <Banknote size={18} />
//           Loans
//         </NavItem>

//         <NavItem href="/ai-insights" $active={pathname === "/ai-insights"}>
//           <FileText size={18} />
//           Ai Insights
//         </NavItem>

//         <NavItem href="/settings" $active={pathname === "/settings"}>
//           <Settings size={18} />
//           Settings
//         </NavItem>
//       </Nav>

//       <Footer>
//         v1.0 • Loan Management System
//       </Footer>
//     </Container>
//   );
// }

// /* ================= STYLE ================= */

// const Container = tw.div`
// h-screen w-64 bg-white border-r border-zinc-200
// flex flex-col p-5
// `;

// const Brand = tw.h1`
// text-2xl font-bold text-blue-600 mb-8
// `;

// const Nav = tw.div`
// flex flex-col gap-2 flex-1
// `;

// const NavItem = tw(Link) <{ $active?: boolean }>`
// flex items-center gap-3 px-4 py-3 rounded-xl
// text-sm font-medium transition cursor-pointer

// ${(p) =>
//     p.$active
//       ? "bg-blue-50 text-blue-600"
//       : "text-zinc-600 hover:bg-zinc-100"}
// `;

// const Footer = tw.div`
// text-xs text-zinc-400 pt-4 border-t border-zinc-100
// `;

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Banknote,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menu = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Collections", href: "/collections", icon: FileText },
  { title: "Loans", href: "/loans", icon: Banknote },
  { title: "AI Insights", href: "/ai-insights", icon: FileText },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "officer" | null>(null);

  useEffect(() => {
    async function loadUserRole() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setRole(null);
          return;
        }

        setRole(data.user?.role ?? null);
      } catch {
        setRole(null);
      }
    }

    void loadUserRole();
  }, []);

  const visibleMenu = role === "officer"
    ? menu.filter((item) => item.href === "/collections")
    : menu;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <Sidebar>
      {/* BRAND */}
      <SidebarContent>
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-primary">LoanFlow</h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-4">
              {visibleMenu.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <div className="space-y-3 border-t p-4">
          <Button
            type="button"
            variant="destructive"
            className="w-full justify-start gap-2 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </Button>

          <div className="text-xs text-muted-foreground">
            v1.0 • Loan Management System
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
