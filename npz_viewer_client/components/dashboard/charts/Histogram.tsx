import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface HistogramProps {
  data: any[];
}

function flattenAll(data: any[]): number[] {
  const result: number[] = [];
  function traverse(val: any) {
    if (Array.isArray(val)) {
      for (const item of val) traverse(item);
    } else if (typeof val === "number" && Number.isFinite(val)) {
      result.push(val);
    }
  }
  traverse(data);
  return result;
}

const NUM_BINS = 30;

export default function Histogram({ data }: HistogramProps) {
  const flat = flattenAll(data);

  if (flat.length === 0) {
    return <p className="text-sm text-muted-foreground">No finite values to plot.</p>;
  }

  let min = flat[0];
  let max = flat[0];
  for (const v of flat) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min || 1;
  const binWidth = range / NUM_BINS;
  const counts = new Array(NUM_BINS).fill(0);

  for (const v of flat) {
    let bin = Math.floor((v - min) / binWidth);
    if (bin >= NUM_BINS) bin = NUM_BINS - 1;
    counts[bin]++;
  }

  const labels = counts.map((_, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    if (Math.abs(lo) >= 1e4 || Math.abs(hi) >= 1e4) {
      return `${lo.toExponential(2)}`;
    }
    return `${lo.toFixed(3)}`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Count",
        data: counts,
        backgroundColor: "hsl(220, 70%, 60%)",
        borderColor: "hsl(220, 70%, 45%)",
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Value Distribution",
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Value" },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: "Count" },
      },
    },
  };

  return (
    <div style={{ height: 300, width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
