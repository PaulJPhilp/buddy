"use client"

import { cn } from "@/lib/utils"
import { BarChart2Icon, XIcon } from "lucide-react"

interface DashboardCardProps {
    isOpen: boolean
    onCloseAction: () => void
}

const tokenData = {
    input: {
        name: "Input Tokens",
        thread: 876,
        today: 2345,
        week: 12543,
        month: 45678
    },
    output: {
        name: "Output Tokens",
        thread: 1432,
        today: 3456,
        week: 23456,
        month: 78901
    },
    total: {
        name: "Total Tokens",
        thread: 2308,
        today: 5801,
        week: 35999,
        month: 124579
    },
    cost: {
        name: "Total Cost",
        thread: 2308 * 0.0001,
        today: 5801 * 0.0001,
        week: 35999 * 0.0001,
        month: 124579 * 0.0001
    }
}

export function DashboardCard({ isOpen, onCloseAction }: DashboardCardProps) {
    return (
        <div
            className={`absolute inset-x-0 top-0 bg-white border-b shadow-sm transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
        >
            <div className="p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <BarChart2Icon className="h-3 w-3 text-primary" />
                        <h3 className="text-[8pt] font-medium">Dashboard</h3>
                    </div>
                    <button
                        onClick={onCloseAction}
                        className="text-muted-foreground hover:text-foreground"
                        type="button"
                    >
                        <XIcon className="h-3 w-3" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[6pt] mb-3">
                    <div className="bg-muted/20 p-2 rounded">
                        <div className="font-medium mb-1">Total Messages</div>
                        <div className="text-primary">2,345</div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                        <div className="font-medium mb-1">Response Time</div>
                        <div className="text-primary">1.2s avg</div>
                    </div>
                </div>
                <div className="text-[6pt]">
                    <div className="font-medium mb-1.5">Token Consumption</div>
                    <div className="bg-muted/20 rounded overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-center p-1.5 font-medium w-[100px]">Type</th>
                                    <th className="text-right p-1.5 font-medium">Thread</th>
                                    <th className="text-right p-1.5 font-medium">Today</th>
                                    <th className="text-right p-1.5 font-medium">This Week</th>
                                    <th className="text-right p-1.5 font-medium">This Month</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(tokenData).map(([id, data]) => (
                                    <tr key={id} className="border-b border-border/50 last:border-0">
                                        <td className="p-1.5 text-center">{data.name}</td>
                                        <td className="text-right p-1.5">
                                            {id === 'cost'
                                                ? `$${data.thread.toFixed(3)}`
                                                : data.thread.toLocaleString()
                                            }
                                        </td>
                                        <td className="text-right p-1.5">
                                            {id === 'cost'
                                                ? `$${data.today.toFixed(3)}`
                                                : data.today.toLocaleString()
                                            }
                                        </td>
                                        <td className="text-right p-1.5">
                                            {id === 'cost'
                                                ? `$${data.week.toFixed(3)}`
                                                : data.week.toLocaleString()
                                            }
                                        </td>
                                        <td className="text-right p-1.5">
                                            {id === 'cost' ? (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded",
                                                    data.month > 10 && "bg-yellow-200 text-yellow-900 font-medium"
                                                )}>
                                                    ${data.month.toFixed(3)}
                                                </span>
                                            ) : (
                                                data.month.toLocaleString()
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
} 