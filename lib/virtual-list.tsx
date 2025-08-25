"use client";

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  memo,
  ReactNode
} from 'react';
import { useIsMobile } from '@/components/ui/use-mobile';

// Tipos
interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  // Otimizações mobile
  enableMobileOptimizations?: boolean;
  throttleMs?: number;
  // Infinite scroll
  hasNextPage?: boolean;
  loadMore?: () => void;
  loadingComponent?: ReactNode;
  // Scroll restoration
  scrollToIndex?: number;
  scrollToAlignment?: 'auto' | 'center' | 'end' | 'start';
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: string | number;
    minWidth?: number;
    render?: (value: any, item: T, index: number) => ReactNode;
  }>;
  rowHeight: number;
  height: number;
  stickyHeader?: boolean;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  // Mobile specific
  mobileBreakpoint?: number;
  mobileColumns?: string[]; // Colunas a mostrar em mobile
}

// Hook para cálculos de virtualização
function useVirtualization<T>({
  items,
  height,
  itemHeight,
  overscan = 5,
  enableMobileOptimizations = true,
  throttleMs = 16
}: {
  items: T[];
  height: number;
  itemHeight: number | ((index: number, item: T) => number);
  overscan?: number;
  enableMobileOptimizations?: boolean;
  throttleMs?: number;
}) {
  const isMobile = useIsMobile();
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  // Ajustar overscan para mobile (menos itens para economizar memória)
  const effectiveOverscan = useMemo(() => {
    if (!enableMobileOptimizations) return overscan;
    return isMobile ? Math.min(overscan, 3) : overscan;
  }, [overscan, isMobile, enableMobileOptimizations]);

  // Calcular altura total
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    
    // Para altura dinâmica, estimar baseado na média
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += itemHeight(i, items[i]);
    }
    return total;
  }, [items, itemHeight]);

  // Calcular itens visíveis
  const visibleItems = useMemo((): VirtualItem[] => {
    if (items.length === 0) return [];

    const containerHeight = height;
    let startIndex = 0;
    let endIndex = 0;
    let currentHeight = 0;

    if (typeof itemHeight === 'number') {
      // Altura fixa - cálculo simples
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight),
        items.length - 1
      );
    } else {
      // Altura dinâmica - cálculo mais complexo
      for (let i = 0; i < items.length; i++) {
        const height = itemHeight(i, items[i]);
        if (currentHeight + height > scrollTop && startIndex === 0) {
          startIndex = i;
        }
        currentHeight += height;
        if (currentHeight > scrollTop + containerHeight) {
          endIndex = i;
          break;
        }
      }
      endIndex = Math.min(endIndex || items.length - 1, items.length - 1);
    }

    // Aplicar overscan
    const virtualStartIndex = Math.max(0, startIndex - effectiveOverscan);
    const virtualEndIndex = Math.min(items.length - 1, endIndex + effectiveOverscan);

    const virtualItems: VirtualItem[] = [];
    let itemStart = 0;

    // Calcular posições
    for (let i = 0; i < virtualStartIndex; i++) {
      const size = typeof itemHeight === 'number' ? itemHeight : itemHeight(i, items[i]);
      itemStart += size;
    }

    for (let i = virtualStartIndex; i <= virtualEndIndex; i++) {
      const size = typeof itemHeight === 'number' ? itemHeight : itemHeight(i, items[i]);
      virtualItems.push({
        index: i,
        start: itemStart,
        end: itemStart + size,
        size
      });
      itemStart += size;
    }

    return virtualItems;
  }, [items, height, itemHeight, scrollTop, effectiveOverscan]);

  // Throttled scroll handler para mobile
  const throttledScrollHandler = useMemo(() => {
    if (!enableMobileOptimizations || !isMobile) {
      return (e: Event) => {
        const target = e.target as HTMLDivElement;
        setScrollTop(target.scrollTop);
      };
    }

    let timeoutId: NodeJS.Timeout;
    return (e: Event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const target = e.target as HTMLDivElement;
        setScrollTop(target.scrollTop);
      }, throttleMs);
    };
  }, [enableMobileOptimizations, isMobile, throttleMs]);

  // Scroll to index
  const scrollToIndex = useCallback((
    index: number, 
    alignment: 'auto' | 'center' | 'end' | 'start' = 'auto'
  ) => {
    if (!scrollElementRef.current) return;

    let targetScrollTop = 0;
    
    if (typeof itemHeight === 'number') {
      targetScrollTop = index * itemHeight;
    } else {
      for (let i = 0; i < index; i++) {
        targetScrollTop += itemHeight(i, items[i]);
      }
    }

    // Ajustar baseado no alinhamento
    const itemSize = typeof itemHeight === 'number' ? itemHeight : itemHeight(index, items[index]);
    
    switch (alignment) {
      case 'center':
        targetScrollTop -= (height - itemSize) / 2;
        break;
      case 'end':
        targetScrollTop -= height - itemSize;
        break;
      case 'start':
      default:
        // Mantém targetScrollTop como está
        break;
    }

    scrollElementRef.current.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }, [items, itemHeight, height]);

  return {
    visibleItems,
    totalHeight,
    scrollElementRef,
    throttledScrollHandler,
    scrollToIndex,
    scrollTop
  };
}

// Componente de Lista Virtual
export const VirtualList = memo(function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = "",
  onScroll,
  enableMobileOptimizations = true,
  throttleMs = 16,
  hasNextPage = false,
  loadMore,
  loadingComponent,
  scrollToIndex,
  scrollToAlignment = 'auto'
}: VirtualListProps<T>) {
  const {
    visibleItems,
    totalHeight,
    scrollElementRef,
    throttledScrollHandler,
    scrollToIndex: scrollToIndexFn
  } = useVirtualization({
    items,
    height,
    itemHeight,
    overscan,
    enableMobileOptimizations,
    throttleMs
  });

  // Infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    throttledScrollHandler(e.nativeEvent);
    onScroll?.(e.currentTarget.scrollTop);

    // Check for infinite scroll
    if (hasNextPage && loadMore) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    }
  }, [throttledScrollHandler, onScroll, hasNextPage, loadMore]);

  // Scroll to index effect
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      scrollToIndexFn(scrollToIndex, scrollToAlignment);
    }
  }, [scrollToIndex, scrollToAlignment, scrollToIndexFn]);

  return (
    <div 
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const style: React.CSSProperties = {
            position: 'absolute',
            top: virtualItem.start,
            height: virtualItem.size,
            width: '100%'
          };

          return (
            <div key={virtualItem.index} style={style}>
              {renderItem(item, virtualItem.index, style)}
            </div>
          );
        })}
        
        {/* Loading indicator for infinite scroll */}
        {hasNextPage && loadingComponent && (
          <div 
            style={{ 
              position: 'absolute',
              top: totalHeight,
              width: '100%',
              height: 50
            }}
          >
            {loadingComponent}
          </div>
        )}
      </div>
    </div>
  );
});

// Componente de Tabela Virtual
export const VirtualTable = memo(function VirtualTable<T>({
  data,
  columns,
  rowHeight,
  height,
  stickyHeader = true,
  onRowClick,
  className = "",
  mobileBreakpoint = 768,
  mobileColumns
}: VirtualTableProps<T>) {
  const isMobile = useIsMobile();
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const isMobileView = windowWidth < mobileBreakpoint;
  const effectiveColumns = isMobileView && mobileColumns 
    ? columns.filter(col => mobileColumns.includes(col.key))
    : columns;

  const renderRow = useCallback((item: unknown, index: number, style: React.CSSProperties) => {
    const typedItem = item as T;
    return (
      <div 
        className={`flex border-b border-slate-700 hover:bg-slate-700/50 ${onRowClick ? 'cursor-pointer' : ''}`}
        style={style}
        onClick={() => onRowClick?.(typedItem, index)}
      >
        {effectiveColumns.map((column, colIndex) => {
          const value = (typedItem as any)[column.key];
          const content = column.render ? column.render(value, typedItem, index) : String(value);
          
          return (
            <div
              key={String(column.key)}
              className="flex items-center px-2 sm:px-4 py-2 text-sm text-white"
              style={{
                width: column.width || `${100 / effectiveColumns.length}%`,
                minWidth: column.minWidth || (isMobileView ? '80px' : '120px'),
                flexShrink: 0
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  }, [effectiveColumns, onRowClick, isMobileView]);

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      {stickyHeader && (
        <div className="flex bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
          {effectiveColumns.map((column) => (
            <div
              key={String(column.key)}
              className="flex items-center px-2 sm:px-4 py-3 text-sm font-medium text-slate-300"
              style={{
                width: column.width || `${100 / effectiveColumns.length}%`,
                minWidth: column.minWidth || (isMobileView ? '80px' : '120px'),
                flexShrink: 0
              }}
            >
              {column.header}
            </div>
          ))}
        </div>
      )}

      {/* Virtual List */}
      <VirtualList
        items={data}
        height={height - (stickyHeader ? 49 : 0)} // Subtrair altura do header
        itemHeight={rowHeight}
        renderItem={renderRow}
        enableMobileOptimizations={true}
      />
    </div>
  );
});

// Hook para pagination virtual (útil para grandes datasets)
export function useVirtualPagination<T>(
  data: T[],
  pageSize: number = 50
) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));

  const totalPages = Math.ceil(data.length / pageSize);
  
  const loadedData = useMemo(() => {
    const result: T[] = [];
    loadedPages.forEach(page => {
      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, data.length);
      result.push(...data.slice(startIndex, endIndex));
    });
    return result;
  }, [data, pageSize, loadedPages]);

  const loadPage = useCallback((page: number) => {
    setLoadedPages(prev => new Set([...prev, page]));
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = Math.max(...Array.from(loadedPages)) + 1;
    if (nextPage < totalPages) {
      loadPage(nextPage);
    }
  }, [loadedPages, totalPages, loadPage]);

  const hasNextPage = useMemo(() => {
    const maxLoadedPage = Math.max(...Array.from(loadedPages));
    return maxLoadedPage < totalPages - 1;
  }, [loadedPages, totalPages]);

  return {
    loadedData,
    currentPage,
    totalPages,
    hasNextPage,
    loadMore,
    loadPage,
    setCurrentPage
  };
}

// Export default nomeado
const VirtualListComponents = {
  VirtualList,
  VirtualTable,
  useVirtualization,
  useVirtualPagination
};

export default VirtualListComponents;