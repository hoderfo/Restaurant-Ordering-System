"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart with a label list"

const chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Chrome",
        color: "var(--chart-1)",
    },
    safari: {
        label: "Safari",
        color: "var(--chart-2)",
    },
    firefox: {
        label: "Firefox",
        color: "var(--chart-3)",
    },
    edge: {
        label: "Edge",
        color: "var(--chart-4)",
    },
    other: {
        label: "Other",
        color: "var(--chart-5)",
    },
}

export function PieChartDashboard() {
    return (
        <div className="flex flex-col gap-4">
            <ChartContainer
                config={chartConfig}
                className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px] w-full"
            >
                <PieChart>
                    <ChartTooltip
                        content={<ChartTooltipContent nameKey="visitors" hideLabel />}
                    />
                    <Pie data={chartData} dataKey="visitors">
                        <LabelList
                            dataKey="browser"
                            className="fill-background"
                            stroke="none"
                            fontSize={12}
                            formatter={(value) =>
                                chartConfig[value]?.label
                            }
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-2 text-sm text-center sm:text-left">
                <div className="flex items-center gap-2 leading-none font-medium justify-center sm:justify-start">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none flex justify-center sm:justify-start">
                    Showing total visitors for the last 6 months
                </div>
            </div>
        </div>
    )
}
