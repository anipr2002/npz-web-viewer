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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import ClusteringVisualization from "./ClusteringVisualization";
import PythonCodeButton from "../PythonCodeButton";
import { generateKMeansCode, generateDBSCANCode } from "@/lib/python-codegen";

interface ArrayData {
  size: any;
  ndim: number;
  dtype?: string;
  data: any[];
}

interface ClusteringPanelProps {
  arrayData: ArrayData;
  fileName?: string;
  arrayName?: string;
}

export default function ClusteringPanel({ arrayData, fileName = "data.npz", arrayName = "arr" }: ClusteringPanelProps) {
  const [algorithm, setAlgorithm] = useState("kmeans");
  const [normalize, setNormalize] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // K-means parameters
  const [nClusters, setNClusters] = useState(3);

  // DBSCAN parameters
  const [eps, setEps] = useState(0.5);
  const [minSamples, setMinSamples] = useState(5);

  const runClustering = async () => {
    setLoading(true);
    setError(null);

    try {
      const params =
        algorithm === "kmeans"
          ? { n_clusters: nClusters }
          : { eps, min_samples: minSamples };

      const response = await fetch(
        `/api/ml/clustering`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            array: arrayData.data,
            algorithm,
            normalize,
            params,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Clustering failed");
      }

      const data = await response.json();
      setResults(data);
      toast.success(
        `${algorithm.toUpperCase()} clustering completed successfully!`
      );
    } catch (err) {
      console.error("Clustering error:", err);
      const message = err instanceof Error ? err.message : "An error occurred during clustering";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="algorithm">Clustering Algorithm</Label>
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger id="algorithm">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kmeans">K-Means</SelectItem>
              <SelectItem value="dbscan">DBSCAN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="normalize"
            checked={normalize}
            onCheckedChange={setNormalize}
          />
          <Label htmlFor="normalize">Normalize Data</Label>
        </div>
      </div>

      {algorithm === "kmeans" && (
        <div>
          <Label htmlFor="n-clusters">Number of Clusters: {nClusters}</Label>
          <Slider
            id="n-clusters"
            min={2}
            max={10}
            step={1}
            value={[nClusters]}
            onValueChange={(value: number[]) => setNClusters(value[0])}
            className="py-4"
          />
        </div>
      )}

      {algorithm === "dbscan" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="eps">Epsilon (neighborhood size): {eps}</Label>
            <Slider
              id="eps"
              min={0.1}
              max={2}
              step={0.1}
              value={[eps]}
              onValueChange={(value: number[]) => setEps(value[0])}
              className="py-4"
            />
          </div>

          <div>
            <Label htmlFor="min-samples">Minimum Samples: {minSamples}</Label>
            <Slider
              id="min-samples"
              min={2}
              max={20}
              step={1}
              value={[minSamples]}
              onValueChange={(value: number[]) => setMinSamples(value[0])}
              className="py-4"
            />
          </div>
        </div>
      )}

      <Button onClick={runClustering} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Run Clustering"
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Clustering failed</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={runClustering} className="shrink-0">
              <RefreshCw className="mr-1 h-3 w-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="mb-4">
              <p className="font-medium">Results:</p>
              <p>Number of clusters: {results.n_clusters}</p>
              {algorithm === "kmeans" && (
                <p>
                  Inertia (sum of squared distances):{" "}
                  {results.inertia.toFixed(2)}
                </p>
              )}
            </div>

            <ClusteringVisualization
              data={arrayData.data}
              labels={results.labels}
              centroids={results.centroids}
              algorithm={algorithm}
            />

            <div className="mt-4">
              <PythonCodeButton
                generateCode={() =>
                  algorithm === "kmeans"
                    ? generateKMeansCode(fileName, arrayName, nClusters, normalize)
                    : generateDBSCANCode(fileName, arrayName, eps, minSamples, normalize)
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
