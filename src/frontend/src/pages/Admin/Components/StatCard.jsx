import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const StatCard = ({ label, value, sub, icon: Icon, trend, trendUp }) => {
    return (
        <Card className="shadow-sm border border-border bg-card hover:bg-muted/50 transition-colors duration-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {label}
                        </p>
                        <div className="space-y-0.5">
                            <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                {value}
                            </h3>
                            {sub && (
                                <p className="text-xs text-muted-foreground/80">
                                    {sub}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-2 rounded-md bg-muted text-foreground">
                        <Icon className="size-5" />
                    </div>
                </div>

                {trend && (
                    <div className="mt-4 flex items-center gap-2">
                        {trendUp !== undefined ? (
                            <div className={cn(
                                "flex items-center text-xs font-medium",
                                trendUp ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {trendUp ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                                {trend}
                            </div>
                        ) : (
                            <Badge variant="secondary" className="text-[10px] font-medium h-5 bg-muted border-none">
                                {trend}
                            </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">vs period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;
