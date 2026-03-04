import React, { useMemo, memo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Table2DProps {
  data: number[][];
  fileName: string;
}

const ROW_DISPLAY_LIMIT = 500;

// A memoized row component to avoid unnecessary re-renders when its props do not change
const MemoizedTableRow: React.FC<{ row: number[] }> = memo(({ row }) => {
  return (
    <TableRow>
      {row.map((cell, cellIndex) => (
        <TableCell key={cellIndex} className="text-center">
          {typeof cell === "number" ? cell.toFixed(4) : cell}
        </TableCell>
      ))}
    </TableRow>
  );
});

const Table2D: React.FC<Table2DProps> = ({ data }) => {
  const [showAll, setShowAll] = useState(false);

  const isTruncated = data.length > ROW_DISPLAY_LIMIT;
  const displayData = showAll ? data : data.slice(0, ROW_DISPLAY_LIMIT);

  // Memoize header cells so they are only recalculated if the data changes
  const headerCells = useMemo(
    () =>
      data[0].map((_, colIndex) => (
        <TableHead key={colIndex} className="text-center">
          Column {colIndex + 1}
        </TableHead>
      )),
    [data]
  );

  // Memoize table rows
  const tableRows = useMemo(
    () =>
      displayData.map((row, rowIndex) => (
        <MemoizedTableRow key={rowIndex} row={row} />
      )),
    [displayData]
  );

  return (
    <div>
      {isTruncated && (
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <span>
            Showing {showAll ? data.length : ROW_DISPLAY_LIMIT} of {data.length} rows
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show fewer rows" : "Show all rows"}
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>{headerCells}</TableRow>
        </TableHeader>
        <TableBody>{tableRows}</TableBody>
      </Table>
    </div>
  );
};

export default memo(Table2D);
