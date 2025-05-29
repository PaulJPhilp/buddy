"use client";
import { Sidebar, SidebarItem, SidebarSection } from "@ui/components/ui/sidebar";
import { HelpCircle, MessageCircle, Settings } from "lucide-react";
import React from "react";

interface AppSidebarProps {
  isOpen: boolean;
  onToggleAction: () => void;
}

export function AppSidebar({ isOpen, onToggleAction }: AppSidebarProps) {
  return (
    <Sidebar
      isCollapsed={!isOpen}
      onToggle={onToggleAction}
      expandedWidth={"120px"}
      collapsedWidth={"0px"}
      className={isOpen ? "w-[120px] sm:w-[120px] lg:w-[120px] border-r bg-muted/40" : "w-0 hidden"}
    >

      <SidebarSection title="">

      </SidebarSection>
    </Sidebar>
  );
}
