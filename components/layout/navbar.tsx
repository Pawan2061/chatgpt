"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Crown,
  Share,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onNewChat?: () => void;
  className?: string;
}

export function Navbar({ onNewChat, className }: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-user-menu]")) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest("[data-model-menu]")) {
        setIsModelMenuOpen(false);
      }
      if (!target.closest("[data-more-menu]")) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleNewChat = () => {
    onNewChat?.();
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-neutral-800/50 bg-[#171717]/95 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left Section - Hamburger Menu */}
        <div className="flex items-center" data-model-menu>
          <Button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            variant="ghost"
            className="h-8 px-3 text-white  hover:bg-[#FFFFFF26] hover:text-white rounded-lg flex items-center gap-2 relative"
          >
            <span className="text-lg font-medium">ChatGPT</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {/* Model Dropdown Menu */}
          {isModelMenuOpen && (
            <div className="absolute top-12 left-30 transform -translate-x-1/2 w-80 bg-[#2a2a2a] border border-neutral-700/50 rounded-xl shadow-2xl py-2 z-50">
              {/* Model Options */}
              <div className="px-4 py-2">
                <div className="text-white text-sm font-medium mb-3">
                  Choose a model
                </div>

                {/* GPT-4o */}
                <div className="flex items-center justify-between p-3 hover:bg-neutral-700/50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        GPT-4o
                      </div>
                      <div className="text-neutral-400 text-xs">
                        Our smartest model
                      </div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>

                {/* GPT-4o mini */}
                <div className="flex items-center justify-between p-3 hover:bg-neutral-700/50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        GPT-4o mini
                      </div>
                      <div className="text-neutral-400 text-xs">
                        Great for everyday tasks
                      </div>
                    </div>
                  </div>
                </div>

                {/* O1 Preview */}
                <div className="flex items-center justify-between p-3 hover:bg-neutral-700/50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">o1</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        o1-preview
                      </div>
                      <div className="text-neutral-400 text-xs">
                        Reasoning model for hard problems
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="h-8 px-3 text-sm font-medium text-white bg-[#373669] hover:bg-[#373669]/80 hover:text-white rounded-full flex items-center gap-1.5"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="sm"
            >
              <path d="M17.665 10C17.665 10.6877 17.1785 11.2454 16.5488 11.3945L16.4219 11.4189C14.7098 11.6665 13.6129 12.1305 12.877 12.8623C12.1414 13.5938 11.6742 14.6843 11.4238 16.3887C11.3197 17.0973 10.7182 17.665 9.96484 17.665C9.27085 17.665 8.68836 17.1772 8.53613 16.5215C8.12392 14.7459 7.6623 13.619 6.95703 12.8652C6.31314 12.1772 5.39414 11.7268 3.88672 11.4688L3.57715 11.4199C2.88869 11.319 2.33496 10.734 2.33496 10C2.33496 9.26603 2.88869 8.681 3.57715 8.58008L3.88672 8.53125C5.39414 8.27321 6.31314 7.82277 6.95703 7.13477C7.6623 6.38104 8.12392 5.25413 8.53613 3.47852L8.56934 3.35742C8.76133 2.76356 9.31424 2.33496 9.96484 2.33496C10.7182 2.33497 11.3197 2.9027 11.4238 3.61133L11.5283 4.22266C11.7954 5.58295 12.2334 6.49773 12.877 7.1377C13.6129 7.86952 14.7098 8.33351 16.4219 8.58105C17.1119 8.68101 17.665 9.26667 17.665 10Z"></path>
            </svg>{" "}
            Get Plus
          </Button>
        </div>

        {/* Center Section - ChatGPT Brand with Model Selector */}

        {/* Right Section - Share, More Menu, and User Profile */}
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex h-8 px-3 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg text-sm"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>

          {/* More Menu */}
          <div className="relative" data-more-menu>
            <Button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>

            {/* More Dropdown Menu */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#2a2a2a] border border-neutral-700/50 rounded-xl shadow-2xl py-2 z-50">
                <button
                  onClick={handleNewChat}
                  className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  New chat
                </button>
                <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="border-t border-neutral-700/50 my-1"></div>
                <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm sm:hidden">
                  <Share className="h-4 w-4" />
                  Share
                </button>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" data-user-menu>
            <Button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-neutral-800/50"
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                P
              </div>
            </Button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#2a2a2a] border border-neutral-700/50 rounded-xl shadow-2xl py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                      P
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        Pawan Pandey
                      </div>
                      <div className="text-neutral-400 text-xs">Free plan</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Upgrade plan
                  </button>

                  <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm">
                    <User className="h-4 w-4" />
                    My profile
                  </button>

                  <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>

                  <div className="border-t border-neutral-700/50 my-1"></div>

                  <button className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700/50 flex items-center gap-3 text-sm">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
