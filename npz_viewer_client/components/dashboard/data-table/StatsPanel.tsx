"use client";

import React, { useMemo } from "react";

interface StatsPanelProps {
  data: any[];
  shape: number[];
  ndim: number;
  dtype: string;
}

function flattenData(data: any[]): number[] {
  const result: number[] = [];
  function traverse(val: any) {
    if (Array.isArray(val)) {
      for (const item of val) traverse(item);
    } else {
      result.push(val as number);
    }
  }
  traverse(data);
  return result;
}

function computeStats(flat: number[]) {
  let nanCount = 0;
  let infCount = 0;
  const finite: number[] = [];

  for (const v of flat) {
    if (Number.isNaN(v)) {
      nanCount++;
    } else if (!Number.isFinite(v)) {
      infCount++;
    } else {
      finite.push(v);
    }
  }

  if (finite.length === 0) {
    return { min: NaN, max: NaN, mean: NaN, std: NaN, median: NaN, nanCount, infCount };
  }

  let min = finite[0];
  let max = finite[0];
  let sum = 0;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / finite.length;

  let variance = 0;
  for (const v of finite) {
    variance += (v - mean) ** 2;
  }
  const std = Math.sqrt(variance / finite.length);

  const sorted = [...finite].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { min, max, mean, std, median, nanCount, infCount };
}

function fmt(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n > 0 ? "+Inf" : "-Inf";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) return n.toExponential(4);
  return n.toPrecision(6).replace(/\.?0+$/, "");
}

const DTYPE_FRIENDLY: Record<string, string> = {
  "<f4": "float32",
  ">f4": "float32",
  "<f8": "float64",
  ">f8": "float64",
  "<i2": "int16",
  ">i2": "int16",
  "<i4": "int32",
  ">i4": "int32",
  "<i8": "int64",
  ">i8": "int64",
  "|i1": "int8",
  "<u2": "uint16",
  ">u2": "uint16",
  "<u4": "uint32",
  ">u4": "uint32",
  "<u8": "uint64",
  ">u8": "uint64",
  "|u1": "uint8",
  "|b1": "bool",
};

export default function StatsPanel({ data, shape, ndim, dtype }: StatsPanelProps) {
  const stats = useMemo(() => {
    const flat = flattenData(data);
    return { ...computeStats(flat), total: flat.length };
  }, [data]);

  const friendlyDtype = DTYPE_FRIENDLY[dtype] ?? dtype;

  const items: { label: string; value: string }[] = [
    { label: "dtype", value: friendlyDtype },
    { label: "shape", value: `[${shape.join(", ")}]` },
    { label: "ndim", value: String(ndim) },
    { label: "total", value: stats.total.toLocaleString() },
    { label: "min", value: fmt(stats.min) },
    { label: "max", value: fmt(stats.max) },
    { label: "mean", value: fmt(stats.mean) },
    { label: "std", value: fmt(stats.std) },
    { label: "median", value: fmt(stats.median) },
    { label: "NaN", value: String(stats.nanCount) },
    { label: "Inf", value: String(stats.infCount) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {items.map(({ label, value }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
        >
          <span className="text-muted-foreground font-medium">{label}</span>
          <span className="font-mono text-foreground">{value}</span>
        </span>
      ))}
    </div>
  );
}
