import React, { useMemo, memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface Table2DProps {
  data: number[][];
  fileName: string;
}

const ROW_HEIGHT = 36;
const COL_WIDTH = 100;
const HEADER_HEIGHT = 36;
const MAX_TABLE_HEIGHT = 600;

const Table2D: React.FC<Table2DProps> = ({ data }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = data.length;
  const colCount = data[0]?.length ?? 0;

  const tableHeight = Math.min(
    rowCount * ROW_HEIGHT + HEADER_HEIGHT,
    MAX_TABLE_HEIGHT
  );

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COL_WIDTH,
    overscan: 10,
  });

  const totalWidth = colVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">
        {rowCount} rows x {colCount} columns
      </div>
      <div
        ref={parentRef}
        className="overflow-auto border rounded-md"
        style={{ height: tableHeight, maxWidth: "100%" }}
      >
        <div
          style={{
            width: totalWidth,
            height: totalHeight + HEADER_HEIGHT,
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              height: HEADER_HEIGHT,
              zIndex: 10,
            }}
            className="bg-muted"
          >
            {colVirtualizer.getVirtualItems().map((virtualCol) => (
              <div
                key={virtualCol.key}
                className="absolute top-0 flex items-center justify-center text-xs font-medium text-muted-foreground border-b border-r"
                style={{
                  left: virtualCol.start,
                  width: virtualCol.size,
                  height: HEADER_HEIGHT,
                }}
              >
                Col {virtualCol.index + 1}
              </div>
            ))}
          </div>

          {/* Body */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              className="absolute left-0"
              style={{
                top: virtualRow.start + HEADER_HEIGHT,
                height: virtualRow.size,
                width: totalWidth,
              }}
            >
              {colVirtualizer.getVirtualItems().map((virtualCol) => {
                const value = data[virtualRow.index][virtualCol.index];
                return (
                  <div
                    key={virtualCol.key}
                    className="absolute top-0 flex items-center justify-center text-sm border-b border-r tabular-nums"
                    style={{
                      left: virtualCol.start,
                      width: virtualCol.size,
                      height: virtualRow.size,
                    }}
                  >
                    {typeof value === "number" ? value.toFixed(4) : value}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(Table2D);
