"use client";

import { useState } from "react";
import Link from "next/link";
import { DesktopLayout } from "@/components/layout/desktop-layout";
import { TicketHeader } from "@/components/tickets/ticket-header";

// ============================================================================
// SVG PATHS
// ============================================================================
const svgPaths = {
  p1116500: "M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z",
  p16f7a900: "M31.25 16.5C31.25 20.5731 27.9481 23.875 23.875 23.875C19.8019 23.875 16.5 20.5731 16.5 16.5C16.5 12.4269 19.8019 9.125 23.875 9.125C27.9481 9.125 31.25 12.4269 31.25 16.5Z",
  p1a816e00: "M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z",
  p1b738d00: "M9.125 9.125H23.875C19.8019 9.125 16.5 12.4269 16.5 16.5C16.5 20.5731 19.8019 23.875 23.875 23.875H9.125C5.0519 23.875 1.75 20.5731 1.75 16.5C1.75 12.4269 5.0519 9.125 9.125 9.125Z",
  p1c542000: "M6.30984 17.5C7.42218 16.9665 8.67497 16.6667 10 16.6667C11.325 16.6667 12.5778 16.9665 13.6902 17.5M5.66667 14.1667H14.3333C15.7335 14.1667 16.4335 14.1667 16.9683 13.8942C17.4387 13.6545 17.8212 13.272 18.0609 12.8016C18.3333 12.2669 18.3333 11.5668 18.3333 10.1667V6.5C18.3333 5.09987 18.3333 4.3998 18.0609 3.86502C17.8212 3.39462 17.4387 3.01217 16.9683 2.77248C16.4335 2.5 15.7335 2.5 14.3333 2.5H5.66667C4.26654 2.5 3.56647 2.5 3.03169 2.77248C2.56129 3.01217 2.17883 3.39462 1.93915 3.86502C1.66667 4.3998 1.66667 5.09987 1.66667 6.5V10.1667C1.66667 11.5668 1.66667 12.2669 1.93915 12.8016C2.17883 13.272 2.56129 13.6545 3.03169 13.8942C3.56647 14.1667 4.26654 14.1667 5.66667 14.1667Z",
  p1ee18b80: "M17.5 17.5L13.875 13.875M9.16667 5C11.4679 5 13.3333 6.86548 13.3333 9.16667M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z",
  p2953b100: "M15.6061 12.2727C15.5052 12.5012 15.4751 12.7547 15.5197 13.0004C15.5643 13.2462 15.6814 13.473 15.8561 13.6515L15.9015 13.697C16.0424 13.8377 16.1541 14.0048 16.2304 14.1887C16.3066 14.3727 16.3459 14.5698 16.3459 14.7689C16.3459 14.9681 16.3066 15.1652 16.2304 15.3492C16.1541 15.5331 16.0424 15.7002 15.9015 15.8409C15.7608 15.9818 15.5937 16.0935 15.4098 16.1698C15.2258 16.246 15.0287 16.2853 14.8295 16.2853C14.6304 16.2853 14.4333 16.246 14.2493 16.1698C14.0654 16.0935 13.8983 15.9818 13.7576 15.8409L13.7121 15.7955C13.5336 15.6208 13.3068 15.5036 13.0611 15.4591C12.8153 15.4145 12.5618 15.4446 12.3333 15.5455C12.1093 15.6415 11.9182 15.8009 11.7836 16.0042C11.649 16.2074 11.5767 16.4456 11.5758 16.6894V16.8182C11.5758 17.22 11.4161 17.6054 11.132 17.8896C10.8478 18.1737 10.4624 18.3333 10.0606 18.3333C9.65876 18.3333 9.27338 18.1737 8.98923 17.8896C8.70509 17.6054 8.54545 17.22 8.54545 16.8182V16.75C8.53959 16.4992 8.45842 16.2561 8.31251 16.052C8.16659 15.848 7.96268 15.6926 7.72727 15.6061C7.49878 15.5052 7.24531 15.4751 6.99955 15.5197C6.7538 15.5643 6.52703 15.6814 6.34848 15.8561L6.30303 15.9015C6.16231 16.0424 5.99521 16.1541 5.81127 16.2304C5.62734 16.3066 5.43017 16.3459 5.23106 16.3459C5.03195 16.3459 4.83478 16.3066 4.65085 16.2304C4.46691 16.1541 4.29981 16.0424 4.15909 15.9015C4.01822 15.7608 3.90646 15.5937 3.83021 15.4098C3.75396 15.2258 3.71472 15.0287 3.71472 14.8295C3.71472 14.6304 3.75396 14.4333 3.83021 14.2493C3.90646 14.0654 4.01822 13.8983 4.15909 13.7576L4.20455 13.7121C4.37919 13.5336 4.49635 13.3068 4.54091 13.0611C4.58547 12.8153 4.55539 12.5618 4.45455 12.3333C4.35851 12.1093 4.19906 11.9182 3.99581 11.7836C3.79256 11.649 3.55438 11.5767 3.31061 11.5758H3.18182C2.77997 11.5758 2.39459 11.4161 2.11044 11.132C1.8263 10.8478 1.66667 10.4624 1.66667 10.0606C1.66667 9.65876 1.8263 9.27338 2.11044 8.98923C2.39459 8.70509 2.77997 8.54545 3.18182 8.54545H3.25C3.50075 8.53959 3.74394 8.45842 3.94795 8.31251C4.15196 8.16659 4.30736 7.96268 4.39394 7.72727C4.49478 7.49878 4.52487 7.24531 4.48031 6.99955C4.43575 6.7538 4.31859 6.52703 4.14394 6.34848L4.09848 6.30303C3.95761 6.16231 3.84586 5.99521 3.76961 5.81127C3.69336 5.62734 3.65411 5.43017 3.65411 5.23106C3.65411 5.03195 3.69336 4.83478 3.76961 4.65085C3.84586 4.46691 3.95761 4.29981 4.09848 4.15909C4.2392 4.01822 4.40631 3.90646 4.59024 3.83021C4.77418 3.75396 4.97134 3.71472 5.17045 3.71472C5.36957 3.71472 5.56673 3.75396 5.75067 3.83021C5.9346 3.90646 6.10171 4.01822 6.24242 4.15909L6.28788 4.20455C6.46642 4.37919 6.69319 4.49635 6.93895 4.54091C7.1847 4.58547 7.43817 4.55539 7.66667 4.45455H7.72727C7.95134 4.35851 8.14244 4.19906 8.27704 3.99581C8.41164 3.79256 8.48388 3.55438 8.48485 3.31061V3.18182C8.48485 2.77997 8.64448 2.39459 8.92863 2.11044C9.21277 1.8263 9.59816 1.66667 10 1.66667C10.4018 1.66667 10.7872 1.8263 11.0714 2.11044C11.3555 2.39459 11.5152 2.77997 11.5152 3.18182V3.25C11.5161 3.49378 11.5884 3.73195 11.723 3.9352C11.8576 4.13845 12.0487 4.29791 12.2727 4.39394C12.5012 4.49478 12.7547 4.52487 13.0004 4.48031C13.2462 4.43575 13.473 4.31859 13.6515 4.14394L13.697 4.09848C13.8377 3.95761 14.0048 3.84586 14.1887 3.76961C14.3727 3.69336 14.5698 3.65411 14.7689 3.65411C14.9681 3.65411 15.1652 3.69336 15.3492 3.76961C15.5331 3.84586 15.7002 3.95761 15.8409 4.09848C15.9818 4.2392 16.0935 4.40631 16.1698 4.59024C16.246 4.77418 16.2853 4.97134 16.2853 5.17045C16.2853 5.36957 16.246 5.56673 16.1698 5.75067C16.0935 5.9346 15.9818 6.10171 15.8409 6.24242L15.7955 6.28788C15.6208 6.46642 15.5036 6.69319 15.4591 6.93895C15.4145 7.1847 15.4446 7.43817 15.5455 7.66667V7.72727C15.6415 7.95134 15.8009 8.14244 16.0042 8.27704C16.2074 8.41164 16.4456 8.48388 16.6894 8.48485H16.8182C17.22 8.48485 17.6054 8.64448 17.8896 8.92863C18.1737 9.21277 18.3333 9.59816 18.3333 10C18.3333 10.4018 18.1737 10.7872 17.8896 11.0714C17.6054 11.3555 17.22 11.5152 16.8182 11.5152H16.75C16.5062 11.5161 16.268 11.5884 16.0648 11.723C15.8615 11.8576 15.7021 12.0487 15.6061 12.2727Z",
  p2f81c180: "M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5M7.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5H7.5",
  p32201100: "M7 4V20M7 20L3 16M7 20L11 16M17 20V4M17 4L13 8M17 4L21 8",
  p3b27f100: "M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z",
  p3d5cad80: "M21 12L9 12M21 6L9 6M21 18L9 18M5 12C5 12.5523 4.55228 13 4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12ZM5 6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6C3 5.44772 3.44772 5 4 5C4.55228 5 5 5.44772 5 6ZM5 18C5 18.5523 4.55228 19 4 19C3.44772 19 3 18.5523 3 18C3 17.4477 3.44772 17 4 17C4.55228 17 5 17.4477 5 18Z",
  p3d96f400: "M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z",
  p6a1b298: "M23.875 23.875H9.125C5.0519 23.875 1.75 20.5731 1.75 16.5C1.75 12.4269 5.0519 9.125 9.125 9.125H23.875M23.875 23.875C27.9481 23.875 31.25 20.5731 31.25 16.5C31.25 12.4269 27.9481 9.125 23.875 9.125M23.875 23.875C19.8019 23.875 16.5 20.5731 16.5 16.5C16.5 12.4269 19.8019 9.125 23.875 9.125",
  pa5d9000: "M9 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z",
};

// ============================================================================
// TYPES
// ============================================================================
export type StatusType = "open" | "in-progress" | "resolved";
export type SeverityType = "high" | "medium" | "low";

export interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: SeverityType;
  area: string;
  sla: string[];
  assignee: string;
  status: StatusType;
  sessionCount: number;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================
function SearchIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p1ee18b80} stroke="#FFFAF4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
      </svg>
    </div>
  );
}

function ChevronDownSmallIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d="M5 7.5L10 12.5L15 7.5" stroke="#FFFAF4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
      </svg>
    </div>
  );
}

function FilterLinesIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d="M6 12H18M3 6H21M9 18H15" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SwitchVerticalIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p32201100} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PlusIcon() {
  return (
    <div className="relative shrink-0 size-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <path d="M7 1V13M1 7H13" stroke="#151518" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function DotsVerticalIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p3d96f400} stroke="#BDBDBD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d={svgPaths.p1a816e00} stroke="#BDBDBD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d={svgPaths.p1116500} stroke="#BDBDBD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

function ArrowNarrowUpRightIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d="M6 18L18 6M18 6H10M18 6V14" stroke="#6BA4FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================
function Avatar({ initials = "DA", color = "#f67965" }: { initials?: string; color?: string }) {
  return (
    <div className="bg-[#fffaf4] overflow-clip relative rounded-[12px] shrink-0 size-[40px]">
      <div 
        className="absolute flex flex-col font-['Switzer:Regular',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[16px] text-center text-nowrap top-1/2 translate-x-[-50%] translate-y-[-50%] uppercase"
        style={{ color }}
      >
        <p className="leading-[24px]">{initials}</p>
      </div>
    </div>
  );
}

function SearchBar() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="content-stretch flex flex-col items-start max-h-[40px] min-h-[40px] relative shrink-0 w-[288px]">
      <div className="bg-[rgba(255,255,255,0.05)] h-[40px] relative rounded-[12px] shrink-0 w-full hover:bg-[rgba(255,255,255,0.08)] transition-colors">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative size-full">
            <SearchIcon />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search"
              className="basis-0 font-['Switzer:Regular',sans-serif] grow h-[24px] leading-[24px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-white text-[16px] bg-transparent border-none outline-none placeholder:text-[#c7c7c7] focus:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface DropdownProps {
  value: string;
  placeholder?: string;
  options?: string[];
  onChange?: (value: string) => void;
}

function Dropdown({ value, placeholder, options = ["07:00-19:00", "19:00-07:00", "00:00-24:00"], onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (option: string) => {
    setSelectedValue(option);
    onChange?.(option);
    setIsOpen(false);
  };

  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <div 
        className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="font-['Switzer:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#f4f4f4] text-[16px] text-nowrap">
          {selectedValue || placeholder}
        </p>
        <ChevronDownSmallIcon />
      </div>
      
      {isOpen && (
        <div className="absolute top-full mt-1 bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-[12px] overflow-hidden z-10 min-w-[140px]">
          {options.map((option, index) => (
            <div
              key={index}
              className="px-[16px] py-[8px] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              onClick={() => handleSelect(option)}
            >
              <p className="font-['Switzer:Regular',sans-serif] leading-[24px] text-[#f4f4f4] text-[16px]">
                {option}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

function ToggleSwitch({ label, enabled: initialEnabled = true, onChange }: ToggleSwitchProps) {
  const [enabled, setEnabled] = useState(initialEnabled);

  const handleClick = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onChange?.(newValue);
  };

  return (
    <div 
      className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors"
      onClick={handleClick}
    >
      <p className="font-['Switzer:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#f4f4f4] text-[16px] text-nowrap">
        {label}
      </p>
      {/* Toggle Button */}
      <div className="relative shrink-0 w-[44px] h-[24px]">
        <div 
          className={`absolute inset-0 rounded-full transition-colors ${enabled ? 'bg-[#57C11D]' : 'bg-[#999999]'}`}
        />
        <div 
          className={`absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
        />
      </div>
    </div>
  );
}

function FilterButton() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
        <FilterLinesIcon />
        <ChevronDownSmallIcon />
      </div>
    </div>
  );
}

function SortButton() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
        <SwitchVerticalIcon />
        <ChevronDownSmallIcon />
      </div>
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return (
    <div
      className="bg-[#f7f7f7] content-stretch flex gap-[8px] items-center justify-center max-h-[40px] min-h-[40px] px-[12px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[#e7e7e7] transition-colors"
      onClick={onClick}
    >
      <div aria-hidden="true" className="absolute border border-[#151518] border-solid inset-0 pointer-events-none rounded-[12px]" />
      {children}
    </div>
  );
}

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

function Checkbox({ checked = false, onChange }: CheckboxProps) {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
        <div 
          className="relative rounded-[4px] shrink-0 size-[20px] cursor-pointer"
          onClick={() => onChange?.(!checked)}
        >
          <div 
            aria-hidden="true" 
            className={`absolute border ${checked ? "border-white bg-white/20" : "border-[#fffaf4]"} border-solid inset-0 pointer-events-none rounded-[4px]`}
          />
          {checked && (
            <svg className="absolute inset-0 m-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

const statusConfig = {
  open: {
    color: "#0072E4",
    bg: "#d2e8f7",
    label: "Open",
  },
  "in-progress": {
    color: "#ECB900",
    bg: "#f7eed2",
    label: "In-progress",
  },
  resolved: {
    color: "#43A011",
    bg: "#dff7d2",
    label: "Resolved",
  },
};

interface StatusBadgeProps {
  status: StatusType;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="content-stretch flex gap-[3px] items-center justify-center px-[8px] py-[2px] relative rounded-[6px] shrink-0" style={{ backgroundColor: config.bg }}>
      <div className="relative shrink-0 size-[6px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
          <circle cx="4" cy="4" fill={config.color} r="4" />
        </svg>
      </div>
      <p className="font-['General_Sans:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#101012] text-[11px] text-nowrap tracking-[-0.22px]">
        {config.label}
      </p>
    </div>
  );
}

const severityConfig = {
  high: {
    bg: "#f7d2d2",
    label: "High",
  },
  medium: {
    bg: "#f7eed2",
    label: "Medium",
  },
  low: {
    bg: "#dff7d2",
    label: "Low",
  },
};

interface SeverityBadgeProps {
  severity: SeverityType;
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <div className="content-stretch flex gap-[3px] items-center justify-center px-[8px] py-[2px] relative rounded-[6px] shrink-0" style={{ backgroundColor: config.bg }}>
      <p className="font-['General_Sans:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#101012] text-[11px] text-nowrap tracking-[-0.22px]">
        {config.label}
      </p>
    </div>
  );
}

interface TagProps {
  text: string;
}

function Tag({ text }: TagProps) {
  return (
    <div className="bg-[#e1e2f8] content-stretch flex gap-[3px] items-center justify-center px-[6px] py-[1px] relative rounded-[6px] shrink-0">
      <p className="font-['General_Sans:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#3840eb] text-[10px] text-nowrap tracking-[-0.2px]">
        {text}
      </p>
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
function GlobalHeader() {
  const [timeRange, setTimeRange] = useState("07:00-19:00");

  return (
    <div className="h-[76px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pl-[24px] pr-0 py-[16px] relative size-full">
          {/* Title */}
          <div className="content-stretch flex items-center relative shrink-0">
            <p className="font-['General_Sans:Medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[28px] text-nowrap text-white tracking-[-0.64px]">
              Tickets
            </p>
          </div>

          {/* Controls */}
          <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
            <SearchBar />
            <Dropdown value={timeRange} onChange={setTimeRange} />
            <ToggleSwitch 
              label="Auto Refresh" 
              enabled={true}
              onChange={(enabled) => console.log("Auto refresh:", enabled)} 
            />
            <FilterButton />
            <SortButton />
            <Avatar initials="DA" color="#f67965" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TABLE COMPONENTS
// ============================================================================
interface TableHeaderProps {
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

function TableHeader({ allSelected, onSelectAll }: TableHeaderProps) {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="content-stretch flex gap-[8px] items-start px-[12px] py-[6px] relative w-full">
        <Checkbox checked={allSelected} onChange={onSelectAll} />

        <div className="basis-0 content-stretch flex grow items-start justify-between min-h-px min-w-px relative self-stretch shrink-0">
          {/* Ticket ID */}
          <div className="content-stretch flex items-start max-w-[100px] relative shrink-0 w-[90px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-nowrap text-white tracking-[-0.2px]">
              Ticket ID
            </p>
          </div>

          {/* Title */}
          <div className="content-stretch flex flex-col items-start max-w-[140px] relative shrink-0 w-[120px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px] w-full">
              Title
            </p>
          </div>

          {/* Category */}
          <div className="content-stretch flex flex-col items-start max-w-[130px] relative shrink-0 w-[110px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px] w-full">
              Category
            </p>
          </div>

          {/* Severity */}
          <div className="content-start flex flex-wrap gap-[6px] h-full items-start max-w-[120px] relative shrink-0 w-[100px]">
            <p className="basis-0 font-['General_Sans_Variable:Semibold',sans-serif] grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px]">
              Severity
            </p>
          </div>

          {/* Area */}
          <div className="content-stretch flex flex-col items-start max-w-[130px] relative shrink-0 w-[110px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px] w-full">
              Area
            </p>
          </div>

          {/* SLA */}
          <div className="content-stretch flex items-start max-w-[150px] relative shrink-0 w-[130px]">
            <p className="basis-0 font-['General_Sans_Variable:Semibold',sans-serif] grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px]">
              SLA
            </p>
          </div>

          {/* Assignee */}
          <div className="content-stretch flex flex-col items-start max-w-[140px] relative shrink-0 w-[120px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px] w-full">
              Assignee
            </p>
          </div>

          {/* Status */}
          <div className="content-start flex flex-wrap gap-[6px] h-full items-start max-w-[120px] relative shrink-0 w-[100px]">
            <p className="basis-0 font-['General_Sans_Variable:Semibold',sans-serif] grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[11px] text-white tracking-[-0.2px]">
              Status
            </p>
          </div>

          {/* Session Count */}
          <div className="content-stretch flex items-start max-w-[60px] relative shrink-0 w-[60px]">
            <p className="font-['General_Sans_Variable:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[11px] text-nowrap text-white tracking-[-0.2px]">
              Session Count
            </p>
          </div>
        </div>

        <DotsVerticalIcon />
      </div>
    </div>
  );
}

interface TicketRowProps {
  ticket: Ticket;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}

function TicketRow({ ticket, selected, onSelect }: TicketRowProps) {
  const detailHref = `/tickets/${encodeURIComponent(ticket.id.replace(/^#/, ""))}`;

  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="content-stretch flex gap-[8px] items-start px-[12px] py-[6px] relative w-full">
        <Checkbox checked={selected} onChange={onSelect} />

        <div className="basis-0 content-stretch flex grow items-start justify-between min-h-px min-w-px relative self-stretch shrink-0">
          {/* Ticket ID */}
          <div className="content-stretch flex items-start max-w-[100px] relative shrink-0 w-[90px]">
            <p className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] text-nowrap tracking-[-0.24px]">
              {ticket.id}
            </p>
          </div>

          {/* Title */}
          <div className="content-stretch flex flex-col items-start max-w-[140px] relative shrink-0 w-[120px]">
            <p className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] tracking-[-0.24px] w-full">
              {ticket.title}
            </p>
          </div>

          {/* Category */}
          <div className="content-stretch flex flex-col items-start max-w-[130px] relative shrink-0 w-[110px]">
            <p className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] tracking-[-0.24px] w-full">
              {ticket.category}
            </p>
          </div>

          {/* Severity */}
          <div className="content-stretch flex items-start max-w-[120px] relative shrink-0 w-[100px]">
            <SeverityBadge severity={ticket.severity} />
          </div>

          {/* Area */}
          <div className="content-stretch flex flex-col items-start max-w-[130px] relative shrink-0 w-[110px]">
            <div className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] tracking-[-0.24px] w-full whitespace-pre-line">
              {ticket.area}
            </div>
          </div>

          {/* SLA */}
          <div className="content-stretch flex flex-col gap-[4px] items-start max-w-[150px] relative shrink-0 w-[130px]">
            {ticket.sla.map((tag, index) => (
              <Tag key={index} text={tag} />
            ))}
          </div>

          {/* Assignee */}
          <div className="content-stretch flex flex-col items-start max-w-[140px] relative shrink-0 w-[120px]">
            <p className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] tracking-[-0.24px] w-full">
              {ticket.assignee}
            </p>
          </div>

          {/* Status */}
          <div className="content-stretch flex items-start max-w-[120px] relative shrink-0 w-[100px]">
            <StatusBadge status={ticket.status} />
          </div>

          {/* Session Count */}
          <div className="content-stretch flex items-start justify-center max-w-[60px] relative shrink-0 w-[60px]">
            <p className="font-['Switzer_Variable:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#e9e8e8] text-[13px] text-nowrap tracking-[-0.24px]">
              {ticket.sessionCount}
            </p>
          </div>
        </div>

        <Link
          href={detailHref}
          className="shrink-0 p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label={`Open ${ticket.id} details`}
        >
          <ArrowNarrowUpRightIcon />
        </Link>
      </div>
    </div>
  );
}

interface TicketTableProps {
  tickets: Ticket[];
}

function TicketTable({ tickets }: TicketTableProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(tickets.map((ticket) => ticket.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, id]);
    } else {
      setSelectedTickets(selectedTickets.filter((ticketId) => ticketId !== id));
    }
  };

  const allSelected = selectedTickets.length === tickets.length && tickets.length > 0;

  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[16px] w-full h-full">
      <div className="flex flex-col gap-[8px] items-start p-[16px] relative h-full">
        {/* Header with Actions */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between pb-[6px] pt-0 px-[12px] relative w-full">
              <p className="font-['General_Sans:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                All Tickets
              </p>
              <Button>
                <div className="flex flex-col font-['General_Sans:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#151518] text-[14px] text-nowrap tracking-[-0.28px]">
                  <p className="leading-[20px]">Actions</p>
                </div>
                <PlusIcon />
              </Button>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <TableHeader 
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
        />

        {/* Divider */}
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-0.5px_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1120 1">
              <path d="M0 0.5H1120" stroke="#EAEAEA" />
            </svg>
          </div>
        </div>

        {/* Ticket Rows with spacing */}
        <div className="flex flex-col gap-[24px] w-full">
          {tickets.length === 0 ? (
            <div className="text-[#e9e8e8] text-sm px-[12px] py-[8px]">No tickets available.</div>
          ) : (
            tickets.map((ticket) => (
              <TicketRow 
                key={ticket.id} 
                ticket={ticket}
                selected={selectedTickets.includes(ticket.id)}
                onSelect={(checked) => handleSelectTicket(ticket.id, checked)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function TicketsPage() {
  const [tickets] = useState<Ticket[]>([]);

  return (
    <DesktopLayout showTopActions={false}>
      <div className="min-h-screen bg-[#262626] flex flex-col gap-[12px] p-[12px] md:p-[16px] overflow-hidden">
        <TicketHeader />
        <div className="flex-1 overflow-auto">
          <TicketTable tickets={tickets} />
        </div>
      </div>
    </DesktopLayout>
  );
}
