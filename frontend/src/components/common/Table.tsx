import React from 'react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor = (item: any, idx: number) => item?.id ?? idx,
  emptyMessage = 'No records found.',
  isLoading = false,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading records...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-12 text-center text-sm text-neutral-500 bg-neutral-900/30 rounded-xl border border-neutral-800/80">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60', className)}>
      <table className="w-full text-left text-sm text-neutral-300">
        <thead className="bg-neutral-950/80 text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={cn(
                  'px-4 py-3.5 whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {data.map((row, rowIdx) => (
            <tr
              key={keyExtractor(row, rowIdx)}
              className="hover:bg-neutral-800/40 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={cn(
                    'px-4 py-3.5 whitespace-nowrap text-neutral-200',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                >
                  {col.cell
                    ? col.cell(row, rowIdx)
                    : col.accessorKey
                    ? (row[col.accessorKey] as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
