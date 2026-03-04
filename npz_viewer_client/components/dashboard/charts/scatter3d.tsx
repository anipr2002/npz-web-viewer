"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Provide a loading fallback for the Plot component
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <ScatterSkeleton />,
});

interface Scatter3DProps {
  data: number[][];
}

const ScatterSkeleton = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">3D Scatter Plot Skeleton</h2>
      <div className="w-full h-64 bg-gray-100 rounded-lg p-4 relative overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gray-300 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};
export default function Scatter3D({ data }: Scatter3DProps) {
  const [clientData, setClientData] = useState<{
    x: number[];
    y: number[];
    z: number[];
  }>();

  useEffect(() => {
    if (!data) return;

    // Transform data to 3D points
    const numRows = data.length;
    const numCols = data[0]?.length || 0;
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        x.push(col);
        y.push(row);
        z.push(data[row][col]);
      }
    }

    setClientData({ x, y, z });
  }, [data]);

  // If clientData is not yet set, show a loading skeleton
  if (!clientData) {
    return <ScatterSkeleton />;
  }

  return (
    <Plot
      data={[
        {
          x: clientData.x,
          y: clientData.y,
          z: clientData.z,
          mode: "markers",
          marker: {
            size: 5,
            color: clientData.z,
            colorscale: "Viridis",
            showscale: true,
          },
          type: "scatter3d",
        },
      ]}
      layout={{
        title: "3D Scatter Plot",
        scene: {
          xaxis: { title: "Columns" },
          yaxis: { title: "Rows" },
          zaxis: { title: "Values" },
        },
        height: 600,
        width: 800,
      }}
    />
  );
}
