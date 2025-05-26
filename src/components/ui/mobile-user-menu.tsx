import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";

interface MobileUserMenuProps {
  user: any;
  profile: any;
  signOut: () => void;
}

export function MobileUserMenu({ user, profile, signOut }: MobileUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative md:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 border border-blue-100"
      >
        <UserCircle2 className="h-5 w-5 text-blue-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800 truncate">
                {profile?.display_name || user.email}
              </p>
              {profile?.role && (
                <p className="text-xs text-blue-600 font-semibold">
                  {ROLE_LABELS[profile.role]}
                </p>
              )}
            </div>
            <Link 
              to="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}