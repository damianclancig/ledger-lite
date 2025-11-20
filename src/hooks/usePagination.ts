import { useState, useCallback, useMemo, useEffect } from 'react';

export const usePagination = (totalItems: number, initialPage: number = 1, initialItemsPerPage: number = 10) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    const totalPages = useMemo(() =>
        Math.max(1, Math.ceil(totalItems / itemsPerPage)),
        [totalItems, itemsPerPage]
    );

    const startIndex = useMemo(() =>
        (currentPage - 1) * itemsPerPage,
        [currentPage, itemsPerPage]
    );

    const endIndex = useMemo(() =>
        startIndex + itemsPerPage,
        [startIndex, itemsPerPage]
    );

    // Reset to page 1 if current page exceeds total pages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    const nextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const previousPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    }, []);

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        startIndex,
        endIndex,
        setCurrentPage,
        setItemsPerPage: changeItemsPerPage,
        nextPage,
        previousPage,
        goToPage,
    };
};
