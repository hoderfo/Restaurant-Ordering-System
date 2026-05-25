import React from "react"
import { SearchX } from "lucide-react"
import { cn } from "@/lib/utils"

const EmptyState = ({ 
  title = "No results found", 
  description = "Try adjusting your search or filters to find what you're looking for.", 
  icon: Icon = SearchX,
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-4 group-hover:scale-110 transition-transform">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
        {description}
      </p>
    </div>
  )
}

export { EmptyState }
