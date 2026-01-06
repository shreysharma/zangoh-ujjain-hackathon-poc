"use client";

import { useState } from "react";

// Custom SVG icons to match the tickets header styling
function SearchIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" viewBox="0 0 20 20">
        <path
          d="M17.5 17.5L13.875 13.875M9.16667 5C11.4679 5 13.3333 6.86548 13.3333 9.16667M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
          stroke="#FFFAF4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.833333"
        />
      </svg>
    </div>
  );
}

function ChevronDownSmallIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" viewBox="0 0 20 20">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="#FFFAF4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.833333"
        />
      </svg>
    </div>
  );
}

function FilterLinesIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d="M6 12H18M3 6H21M9 18H15" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SwitchVerticalIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path
          d="M7 4V20M7 20L3 16M7 20L11 16M17 20V4M17 4L13 8M17 4L21 8"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

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
  onChange?: (checked: boolean) => void;
}

function ToggleSwitch({ label, enabled = true, onChange }: ToggleSwitchProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    onChange?.(next);
  };

  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer select-none" onClick={handleToggle}>
      <p className="font-['Switzer:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#f4f4f4] text-[16px] text-nowrap">
        {label}
      </p>
      <div
        className="bg-[rgba(0,0,0,0.3)] relative shrink-0 w-[48px] rounded-[999px] h-[24px] border border-[rgba(255,255,255,0.12)]"
      >
        <div
          className="bg-[#3ad278] absolute inset-[2px] rounded-[999px] transition-all"
          style={{ opacity: isEnabled ? 1 : 0 }}
        />
        <div
          className="bg-white absolute top-[2px] size-[20px] rounded-full transition-transform"
          style={{ transform: isEnabled ? "translateX(24px)" : "translateX(0px)" }}
        />
      </div>
    </div>
  );
}

function FilterButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[9px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
        <FilterLinesIcon />
      </div>
    </div>
  );
}

function SortButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[9px] relative rounded-[12px] shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
        <SwitchVerticalIcon />
      </div>
    </div>
  );
}

interface TicketHeaderProps {
  title?: string;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: (enabled: boolean) => void;
  timeRange?: string;
  onChangeTimeRange?: (value: string) => void;
}

export function TicketHeader({
  title = "Tickets",
  autoRefresh = true,
  onToggleAutoRefresh,
  timeRange = "07:00-19:00",
  onChangeTimeRange,
}: TicketHeaderProps) {
  const [range, setRange] = useState(timeRange);

  const handleRangeChange = (next: string) => {
    setRange(next);
    onChangeTimeRange?.(next);
  };

  return (
    <div className="h-[76px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pl-[24px] pr-0 py-[16px] relative size-full">
          {/* Title */}
          <div className="content-stretch flex items-center relative shrink-0">
            <p className="font-['General_Sans:Medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[28px] text-nowrap text-white tracking-[-0.64px]">
              {title}
            </p>
          </div>

          {/* Controls */}
          <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
            <SearchBar />
            <Dropdown value={range} onChange={handleRangeChange} />
            <ToggleSwitch
              label="Auto Refresh"
              enabled={autoRefresh}
              onChange={onToggleAutoRefresh}
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
