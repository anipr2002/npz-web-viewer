"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DimensionalityVisualization from "./DimensionalityVisualization";

interface ArrayData {
  size: any;
  ndim: number;
  data: any[];
}

interface DimensionalityReductionPanelProps {
  arrayData: ArrayData;
}

export default function DimensionalityReductionPanel({
  arrayData,
}: DimensionalityReductionPanelProps) {
  const [algorithm, setAlgorithm] = useState("pca");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // PCA parameters
  const [nComponents, setNComponents] = useState(2);

  const runDimensionalityReduction = async () => {
    setLoading(true);

    try {
      const params = { n_components: nComponents };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ml/dimensionality_reduction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            array: arrayData.data,
            algorithm,
            params,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Dimensionality reduction failed");
      }

      const data = await response.json();
      setResults(data);
      toast.success(`${algorithm.toUpperCase()} completed successfully!`);
    } catch (error) {
      console.error("Dimensionality reduction error:", error);
      toast.error("An error occurred during dimensionality reduction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="algorithm">Dimensionality Reduction Algorithm</Label>
        <Select value={algorithm} onValueChange={setAlgorithm}>
          <SelectTrigger id="algorithm">
            <SelectValue placeholder="Select algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pca">
              Principal Component Analysis (PCA)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {algorithm === "pca" && (
        <div>
          <Label htmlFor="n-components">
            Number of Components: {nComponents}
          </Label>
          <Slider
            id="n-components"
            min={2}
            max={Math.min(5, arrayData.size[1])}
            step={1}
            value={[nComponents]}
            onValueChange={(value: number[]) => setNComponents(value[0])}
            className="py-4"
          />
        </div>
      )}

      <Button
        onClick={runDimensionalityReduction}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Run Dimensionality Reduction"
        )}
      </Button>

      {results && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="mb-4">
              <p className="font-medium">Results:</p>
              <p>Components: {results.n_components}</p>
              {algorithm === "pca" && (
                <div>
                  <p>Explained Variance Ratio:</p>
                  <ul className="list-disc pl-5">
                    {results.explained_variance.map(
                      (variance: number, index: number) => (
                        <li key={index}>
                          Component {index + 1}: {(variance * 100).toFixed(2)}%
                        </li>
                      )
                    )}
                  </ul>
                  <p className="mt-2">
                    Total Explained Variance:{" "}
                    {(
                      results.explained_variance.reduce(
                        (a: number, b: number) => a + b,
                        0
                      ) * 100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              )}
            </div>

            <DimensionalityVisualization
              reducedData={results.reduced_data}
              algorithm={algorithm}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
