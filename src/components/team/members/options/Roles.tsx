
"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const RoleSelector = ({
  selected = 'member',
  setSelected
}: {
  selected?: string
  setSelected?: (value: string) => void
}) => {
  const roles = [
    "admin",
    "manager",
    "member"
  ]

  return (
    <Select defaultValue={selected} onValueChange={setSelected}>
      <SelectTrigger className="w-full capitalize">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Roles</SelectLabel>
          {roles.map(role => (
            <SelectItem className="capitalize" key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export { RoleSelector }
