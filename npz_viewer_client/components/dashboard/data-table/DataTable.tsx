"use client";

import { useEffect, useState } from "react";
import { downloadCSV } from "@/utils/csv-utils";
import Table2D from "./Table2d";
import MultiDimensionalArray from "./MultiDimensionalArray";
import StatsPanel from "./StatsPanel";
import SliceExplorer from "./SliceExplorer";
import ComparePanel from "./ComparePanel";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, GitCompare } from "lucide-react";
import PythonCodeButton from "../PythonCodeButton";
import {
  generateStatsCode,
  getChartCodeGenerator,
} from "@/lib/python-codegen";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LineChart from "../charts/chart";
import ScatterPlot from "../charts/scatterplot";
import GrayscaleImage from "../charts/greyscale";
import Scatter3D from "../charts/scatter3d";
import Surface3D from "../charts/surface3d";
import Histogram from "../charts/Histogram";
import MLPanel from "../ml/MLPanel";

interface ArrayData {
  size: any;
  ndim: number;
  dtype: string;
  data: any[];
}

interface DataTableProps {
  data: Record<string, Record<string, ArrayData>>;
}

function ChartRenderer({
  arrayData,
  chartType,
}: {
  arrayData: ArrayData;
  chartType: string | null;
}) {
  if (!chartType) return null;

  switch (chartType) {
    case "scatter":
      return <ScatterPlot data={arrayData.data} />;
    case "line":
      return <LineChart data={arrayData.data} />;
    case "grayscale":
      return <GrayscaleImage data={arrayData.data} />;
    case "scatter3d":
      return <Scatter3D data={arrayData.data} />;
    case "surface3d":
      return <Surface3D data={arrayData.data} />;
    case "histogram":
      return <Histogram data={arrayData.data} />;
    default:
      return null;
  }
}

function countTotalArrays(data: Record<string, Record<string, ArrayData>>) {
  let count = 0;
  for (const arrays of Object.values(data)) count += Object.keys(arrays).length;
  return count;
}

export default function DataTable({ data }: DataTableProps) {
  const [chartType, setChartType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedArrayKey, setSelectedArrayKey] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const firstFile = Object.keys(data)[0];
      setSelectedFile(firstFile);

      if (Object.keys(data[firstFile]).length > 0) {
        const firstArray = Object.keys(data[firstFile])[0];
        setSelectedArrayKey(firstArray);
      }
    }
    setCompareMode(false);
  }, [data]);

  const totalArrays = countTotalArrays(data);

  function ArrayCopyBtn({ data }: { data: any[] }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
      const text = JSON.stringify(data);
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Array copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="flex items-center space-x-1"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compare mode toggle */}
      {totalArrays >= 2 && (
        <div className="flex justify-end">
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode((prev) => !prev)}
            className="flex items-center gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {compareMode ? "Exit Comparison" : "Compare Arrays"}
          </Button>
        </div>
      )}

      {compareMode ? (
        <ComparePanel data={data} />
      ) : (
        <div>
          {Object.entries(data).map(([fileName, arrays]) => (
            <div key={fileName} className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                {fileName}
              </h3>
              {Object.entries(arrays).map(([arrayName, arrayData]) => {
                const buttonId = `${fileName}-${arrayName}`;

                return (
                  <div
                    key={buttonId}
                    className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    onClick={() => {
                      setSelectedFile(fileName);
                      setSelectedArrayKey(arrayName);
                    }}
                  >
                    <h4 className="text-md font-medium mb-2 text-gray-900 dark:text-white">
                      {arrayName}
                    </h4>

                    {/* Stats Panel */}
                    <StatsPanel
                      data={arrayData.data}
                      shape={arrayData.size}
                      ndim={arrayData.ndim}
                      dtype={arrayData.dtype ?? ""}
                    />

                    {arrayData.ndim === 2 ? (
                      <div>
                        <div className="flex w-full items-center justify-between mb-4">
                          <div className="flex space-x-2">
                            <ArrayCopyBtn data={arrayData.data} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                downloadCSV(arrayData.data, buttonId);
                              }}
                            >
                              <Download className="h-4 w-4" />
                              <span>Download CSV</span>
                            </Button>

                            <PythonCodeButton
                              generateCode={() => {
                                if (chartType) {
                                  const gen = getChartCodeGenerator(chartType);
                                  if (gen) return gen(fileName, arrayName);
                                }
                                return generateStatsCode(
                                  fileName,
                                  arrayName,
                                  arrayData.dtype ?? ""
                                );
                              }}
                            />

                            <Select
                              value={chartType || ""}
                              onValueChange={(value) =>
                                setChartType(value || null)
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select chart type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="line">Line Chart</SelectItem>
                                <SelectItem value="scatter">
                                  Scatter Plot
                                </SelectItem>
                                <SelectItem value="grayscale">
                                  Grayscale Image
                                </SelectItem>
                                <SelectItem value="scatter3d">
                                  3D Scatter
                                </SelectItem>
                                <SelectItem value="surface3d">
                                  3D Surface
                                </SelectItem>
                                <SelectItem value="histogram">
                                  Histogram
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {chartType && (
                          <div className="mb-4">
                            <ChartRenderer
                              arrayData={arrayData}
                              chartType={chartType}
                            />
                          </div>
                        )}

                        <Table2D data={arrayData.data} fileName={buttonId} />

                        {/* ML Panel for each 2D array */}
                        <div className="mt-6">
                          <MLPanel
                            arrayData={arrayData}
                            fileName={fileName}
                            arrayName={arrayName}
                          />
                        </div>
                      </div>
                    ) : arrayData.ndim >= 3 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-start mb-2">
                          <ArrayCopyBtn data={arrayData.data} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Slice Explorer
                          </p>
                          <SliceExplorer data={arrayData.data} shape={arrayData.size} fileName={fileName} arrayName={arrayName} />
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Full nested view
                          </summary>
                          <div className="mt-2">
                            <MultiDimensionalArray data={arrayData.data} depth={0} />
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-start mb-4">
                          <ArrayCopyBtn data={arrayData.data} />
                        </div>
                        <MultiDimensionalArray data={arrayData.data} depth={0} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
