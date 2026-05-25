import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination) return null;

    const { currentPage, totalPages } = pagination;

    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="hidden lg:flex"
            >
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline text-xs">Previous</span>
            </Button>

            <div className="flex items-center justify-center px-4 text-sm font-medium">
                Page {currentPage} of {totalPages}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <span className="mr-1 hidden sm:inline text-xs">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden lg:flex"
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default Pagination;
