"use client";

import tw from "tailwind-styled-components";
import { LayoutDashboard, Users, Banknote, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Container>
      <Brand>
        LoanFlow
      </Brand>

      <Nav>
        <NavItem href="/dashboard" $active={pathname === "/dashboard"}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavItem>

        <NavItem href="/customers" $active={pathname === "/customers"}>
          <Users size={18} />
          Customers
        </NavItem>

        <NavItem href="/collections" $active={pathname === "/collections"}>
          <FileText size={18} />
          Collections
        </NavItem>

        <NavItem href="/loans" $active={pathname === "/loans"}>
          <Banknote size={18} />
          Loans
        </NavItem>


        <NavItem href="/ai-insights" $active={pathname === "/ai-insights"}>
          <FileText size={18} />
          Ai Insights
        </NavItem>

        <NavItem href="/settings" $active={pathname === "/settings"}>
          <Settings size={18} />
          Settings
        </NavItem>
      </Nav>

      <Footer>
        v1.0 • Loan Management System
      </Footer>
    </Container>
  );
}

/* ================= STYLE ================= */

const Container = tw.div`
h-screen w-64 bg-white border-r border-zinc-200
flex flex-col p-5
`;

const Brand = tw.h1`
text-2xl font-bold text-blue-600 mb-8
`;

const Nav = tw.div`
flex flex-col gap-2 flex-1
`;

const NavItem = tw(Link) <{ $active?: boolean }>`
flex items-center gap-3 px-4 py-3 rounded-xl
text-sm font-medium transition cursor-pointer

${(p) =>
    p.$active
      ? "bg-blue-50 text-blue-600"
      : "text-zinc-600 hover:bg-zinc-100"}
`;

const Footer = tw.div`
text-xs text-zinc-400 pt-4 border-t border-zinc-100
`;