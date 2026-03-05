"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatsPanel from "./StatsPanel";
import Table2D from "./Table2d";

interface ArrayData {
  size: number[];
  ndim: number;
  dtype: string;
  data: any[];
}

interface ComparePanelProps {
  data: Record<string, Record<string, ArrayData>>;
}

function buildOptions(data: Record<string, Record<string, ArrayData>>) {
  const options: { label: string; fileKey: string; arrayKey: string }[] = [];
  for (const [fileName, arrays] of Object.entries(data)) {
    for (const arrayName of Object.keys(arrays)) {
      options.push({ label: `${fileName} / ${arrayName}`, fileKey: fileName, arrayKey: arrayName });
    }
  }
  return options;
}

function ArrayColumn({
  label,
  options,
  selected,
  onSelect,
  arrayData,
}: {
  label: string;
  options: { label: string; fileKey: string; arrayKey: string }[];
  selected: string;
  onSelect: (val: string) => void;
  arrayData: ArrayData | null;
}) {
  return (
    <div className="flex-1 min-w-0 space-y-3">
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select array…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={`${opt.fileKey}/${opt.arrayKey}`} value={`${opt.fileKey}/${opt.arrayKey}`}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {arrayData && (
        <div className="space-y-2">
          <StatsPanel
            data={arrayData.data}
            shape={arrayData.size}
            ndim={arrayData.ndim}
            dtype={arrayData.dtype}
          />
          {arrayData.ndim === 2 ? (
            <Table2D data={arrayData.data} fileName={selected} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Non-2D array — shape {JSON.stringify(arrayData.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePanel({ data }: ComparePanelProps) {
  const options = buildOptions(data);
  const [leftKey, setLeftKey] = useState(
    options.length > 0 ? `${options[0].fileKey}/${options[0].arrayKey}` : ""
  );
  const [rightKey, setRightKey] = useState(
    options.length > 1 ? `${options[1].fileKey}/${options[1].arrayKey}` : ""
  );

  function resolve(key: string): ArrayData | null {
    if (!key) return null;
    const slash = key.indexOf("/");
    const fileKey = key.slice(0, slash);
    const arrayKey = key.slice(slash + 1);
    return data[fileKey]?.[arrayKey] ?? null;
  }

  return (
    <div className="flex gap-6 overflow-x-auto">
      <ArrayColumn
        label="Array A"
        options={options}
        selected={leftKey}
        onSelect={setLeftKey}
        arrayData={resolve(leftKey)}
      />
      <div className="w-px bg-border shrink-0" />
      <ArrayColumn
        label="Array B"
        options={options}
        selected={rightKey}
        onSelect={setRightKey}
        arrayData={resolve(rightKey)}
      />
    </div>
  );
}
