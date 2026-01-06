"use client";

import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";

const chartData = [
  { category: "Waste", value: 35, fill: "#0072E4" },
  { category: "Transport", value: 25, fill: "#C90D0D" },
  { category: "Security", value: 20, fill: "#ECB900" },
  { category: "Traffic", value: 15, fill: "#43A011" },
  { category: "Other", value: 5, fill: "#D6D6D6" },
];

export function CategoryPieChart() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[216px] items-start justify-between min-w-[200px] overflow-clip p-[24px] relative rounded-[16px] shrink-0 w-full max-w-[360px]">
      <div className="content-stretch flex flex-col grow items-start justify-between w-full">
        <div className="content-stretch flex h-[36px] items-center">
          <p className="text-[#101012] text-[24px] tracking-[-0.456px]">Categories</p>
        </div>
        <div className="content-stretch flex gap-[16px] items-start w-full">
          <div className="h-[92px] w-[92px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={28}
                  outerRadius={46}
                  strokeWidth={0}
                  cx="50%"
                  cy="50%"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-1 gap-4 text-[12px] text-[#101012]">
            <div className="flex flex-col gap-4">
              <LegendItem label="Waste" color="#0072E4" />
              <LegendItem label="Transport" color="#C90D0D" />
              <LegendItem label="Security" color="#ECB900" />
            </div>
            <div className="flex flex-col gap-4">
              <LegendItem label="Traffic" color="#43A011" />
              <LegendItem label="Other" color="#D6D6D6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-[4px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
