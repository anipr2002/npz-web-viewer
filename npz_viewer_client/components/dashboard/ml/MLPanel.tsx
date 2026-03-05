"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClusteringPanel from "./ClusteringPanel";
import DimensionalityReductionPanel from "./DimensionalityReductionPanel";
import PremiumGate from "@/components/PremiumGate";

interface ArrayData {
  size: any;
  ndim: number;
  dtype?: string;
  data: any[];
}

interface MLPanelProps {
  arrayData: ArrayData;
  fileName: string;
  arrayName: string;
}

export default function MLPanel({
  arrayData,
  fileName,
  arrayName,
}: MLPanelProps) {
  const [activeTab, setActiveTab] = useState("clustering");

  // Check if the data is suitable for ML (2D array)
  const isValidForML = arrayData.ndim === 2;

  if (!isValidForML) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Machine Learning</CardTitle>
          <CardDescription>
            Machine learning features are only available for 2D arrays.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <PremiumGate feature="ML Features">
      <Card>
        <CardHeader>
          <CardTitle>Machine Learning</CardTitle>
          <CardDescription>
            Apply machine learning algorithms to your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clustering">Clustering</TabsTrigger>
              <TabsTrigger value="dimensionality">
                Dimensionality Reduction
              </TabsTrigger>
            </TabsList>
            <TabsContent value="clustering">
              <ClusteringPanel arrayData={arrayData} fileName={fileName} arrayName={arrayName} />
            </TabsContent>
            <TabsContent value="dimensionality">
              <DimensionalityReductionPanel arrayData={arrayData} fileName={fileName} arrayName={arrayName} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PremiumGate>
  );
}
