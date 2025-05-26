import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PAGE_METADATA } from "./breadcrumbs";

interface SectionContextProps {
  currentPath: string;
}

export function SectionContext({ currentPath }: SectionContextProps) {
  const metadata = PAGE_METADATA[currentPath] || {
    title: "Page",
    section: "Application",
    description: "Page description"
  };
  
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-6 pb-4 border-b border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800">{metadata.title}</h1>
      {!isMobile && (
        <p className="text-gray-500 mt-1">{metadata.description}</p>
      )}
    </div>
  );
}