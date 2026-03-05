import { NextResponse } from 'next/server';
import { kmeans } from 'ml-kmeans';
import { standardScale } from '@/lib/ml/standard-scaler';
import { requirePremium, requireRateLimit } from '@/lib/server-premium';

// density-clustering has no types, so we require it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DBSCAN = require('density-clustering').DBSCAN;

interface ClusteringRequest {
  array: number[][];
  algorithm: 'kmeans' | 'dbscan';
  normalize: boolean;
  params: {
    n_clusters?: number;
    eps?: number;
    min_samples?: number;
  };
}

export async function POST(request: Request) {
  // Check rate limit first
  const rateLimitResponse = await requireRateLimit('clustering');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check premium access
  const premiumCheck = await requirePremium();
  if (premiumCheck instanceof Response) {
    return premiumCheck;
  }

  try {
    const body: ClusteringRequest = await request.json();
    const { array, algorithm, normalize, params } = body;

    const data = normalize ? standardScale(array) : array;

    if (algorithm === 'kmeans') {
      const nClusters = params.n_clusters ?? 3;
      const result = kmeans(data, nClusters, { initialization: 'kmeans++' });

      // Compute inertia (sum of squared distances to nearest centroid)
      let inertia = 0;
      for (let i = 0; i < data.length; i++) {
        const centroid = result.centroids[result.clusters[i]];
        for (let j = 0; j < data[i].length; j++) {
          inertia += (data[i][j] - (centroid as number[])[j]) ** 2;
        }
      }

      return NextResponse.json({
        labels: result.clusters,
        centroids: result.centroids,
        inertia,
        n_clusters: nClusters,
      });
    } else if (algorithm === 'dbscan') {
      const eps = params.eps ?? 0.5;
      const minSamples = params.min_samples ?? 5;

      const dbscan = new DBSCAN();
      const clusters: number[][] = dbscan.run(data, eps, minSamples);

      // Convert cluster-groups format to sklearn-style labels array
      const labels = new Array(data.length).fill(-1);
      clusters.forEach((cluster: number[], clusterIdx: number) => {
        cluster.forEach((pointIdx: number) => {
          labels[pointIdx] = clusterIdx;
        });
      });

      return NextResponse.json({
        labels,
        n_clusters: clusters.length,
        eps,
        min_samples: minSamples,
      });
    }

    return NextResponse.json(
      { error: `Unknown algorithm: ${algorithm}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Clustering error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Clustering failed' },
      { status: 500 }
    );
  }
}
