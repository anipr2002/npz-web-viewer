import { NextResponse } from 'next/server';
import { PCA } from 'ml-pca';
import { requirePremium, requireRateLimit } from '@/lib/server-premium';

interface DimReductionRequest {
  array: number[][];
  algorithm: string;
  params: {
    n_components: number;
  };
}

export async function POST(request: Request) {
  // Check rate limit first
  const rateLimitResponse = await requireRateLimit('dimensionalityReduction');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check premium access
  const premiumCheck = await requirePremium();
  if (premiumCheck instanceof Response) {
    return premiumCheck;
  }

  try {
    const body: DimReductionRequest = await request.json();
    const { array, algorithm, params } = body;

    if (algorithm === 'pca') {
      const nComponents = params.n_components ?? 2;

      const pca = new PCA(array);
      const reduced = pca.predict(array, { nComponents });
      const explainedVariance = pca.getExplainedVariance().slice(0, nComponents);

      return NextResponse.json({
        reduced_data: reduced.to2DArray(),
        explained_variance: explainedVariance,
        n_components: nComponents,
      });
    }

    return NextResponse.json(
      { error: `Unknown algorithm: ${algorithm}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Dimensionality reduction error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Dimensionality reduction failed',
      },
      { status: 500 }
    );
  }
}
