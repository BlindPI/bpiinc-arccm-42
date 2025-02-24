
"use client"

import {
  EllipsisVertical,
  UserX
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { RemoveMember } from "./Remove"
import type { TeamMember } from "@/types/user-management"

interface OptionsProps {
  member: TeamMember;
}

export const Options = ({ member }: OptionsProps) => {
  const [removeOpen, setRemoveOpen] = useState(false)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRemoveOpen(true)}>
            <UserX className="mr-2 h-4 w-4" />
            <span>Remove member</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveMember 
        member={member} 
        open={removeOpen} 
        onClose={() => setRemoveOpen(false)} 
      />
    </div>
  )
}
