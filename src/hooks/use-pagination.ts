
import { useState } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationResult {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  paginatedData: <T>(data: T[]) => T[];
  startIndex: number;
  endIndex: number;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  itemsPerPage = 10
}: UsePaginationProps): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(itemsPerPage);
  
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  
  // Ensure currentPage is within bounds
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };
  
  const setItemsPerPage = (count: number) => {
    setPerPage(count);
    // Reset to page 1 when changing items per page
    setCurrentPage(1);
  };
  
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  
  const paginatedData = <T>(data: T[]): T[] => {
    return data.slice(startIndex, endIndex);
  };
  
  return {
    currentPage,
    itemsPerPage: perPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    setItemsPerPage,
    paginatedData,
    startIndex,
    endIndex
  };
}
