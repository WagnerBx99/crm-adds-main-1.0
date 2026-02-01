"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Kanban,
  PaintBucket,
  LayoutDashboard,
  UserCheck,
  ExternalLink,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

const navItems: NavItem[] = [
  { id: "kanban", label: "Pipeline Kanban", href: "/", icon: Kanban },
  { id: "personalizacao", label: "Personalizacao", href: "/personalization", icon: PaintBucket },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { id: "contatos", label: "Contatos", href: "/contacts", icon: UserCheck },
  { id: "tiny", label: "Integracao Tiny", href: "/tiny", icon: ExternalLink, permission: "view_tiny" },
];

const bottomItems: NavItem[] = [
  { id: "configuracoes", label: "Configuracoes", href: "/settings", icon: Settings, permission: "view_settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { canAccess } = useAuth();
  const [hovering, setHovering] = useState(false);

  const isExpanded = !collapsed || hovering;

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || canAccess(item.permission)
  );

  const filteredBottomItems = bottomItems.filter(
    (item) => !item.permission || canAccess(item.permission)
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out",
          isExpanded ? "w-60" : "w-[60px]"
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border px-4",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          {isExpanded ? (
            <>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">C</span>
                </div>
                <span className="font-semibold text-sidebar-foreground">CRM ADDS</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggle}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <nav className="p-2 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        !isExpanded && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {isExpanded && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2">
          {filteredBottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      !isExpanded && "justify-center"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}
