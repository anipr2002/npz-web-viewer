"use client";

import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import Table2D from "./Table2d";
import PythonCodeButton from "../PythonCodeButton";
import { generateSliceCode } from "@/lib/python-codegen";

interface SliceExplorerProps {
  data: any[];
  shape: number[];
  fileName?: string;
  arrayName?: string;
}

function sliceND(data: any[], indices: number[]): number[][] {
  let result: any = data;
  for (const idx of indices) result = result[idx];
  return result as number[][];
}

export default function SliceExplorer({ data, shape, fileName = "data.npz", arrayName = "arr" }: SliceExplorerProps) {
  // Outer axes = all except last 2
  const outerAxes = shape.slice(0, shape.length - 2);
  const [indices, setIndices] = useState<number[]>(outerAxes.map(() => 0));

  const sliced = sliceND(data, indices);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {outerAxes.map((axisSize, axisIdx) => (
          <div key={axisIdx} className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              Axis {axisIdx} [{indices[axisIdx]}/{axisSize - 1}]
            </span>
            <Slider
              min={0}
              max={axisSize - 1}
              step={1}
              value={[indices[axisIdx]]}
              onValueChange={([val]) => {
                setIndices((prev) => {
                  const next = [...prev];
                  next[axisIdx] = val;
                  return next;
                });
              }}
              className="flex-1"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-muted-foreground">
          Slice [{indices.map((i) => i).join(", ")}, :, :]
        </span>
        <PythonCodeButton
          generateCode={() =>
            generateSliceCode(fileName, arrayName, indices, shape)
          }
        />
      </div>
      <Table2D data={sliced} fileName="slice" />
    </div>
  );
}
