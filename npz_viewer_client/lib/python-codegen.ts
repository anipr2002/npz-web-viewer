// Pure functions that generate Python code strings for various operations.

export function generateStatsCode(
  fileName: string,
  arrayName: string,
  dtype: string
): string {
  return `import numpy as np

data = np.load('${fileName}')
arr = data['${arrayName}']

print(f"Shape: {arr.shape}")
print(f"Dtype: {arr.dtype}")
print(f"Min: {arr.min()}")
print(f"Max: {arr.max()}")
print(f"Mean: {arr.mean():.6f}")
print(f"Std: {arr.std():.6f}")
print(f"Median: {np.median(arr):.6f}")
`;
}

export function generateLineChartCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

for i, row in enumerate(arr):
    plt.plot(row, label=f'Row {i}')

plt.title('${arrayName}')
plt.xlabel('Column Index')
plt.ylabel('Value')
plt.legend()
plt.show()
`;
}

export function generateScatterPlotCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

if arr.shape[1] >= 2:
    plt.scatter(arr[:, 0], arr[:, 1], alpha=0.6)
    plt.xlabel('Column 0')
    plt.ylabel('Column 1')
else:
    plt.scatter(range(len(arr)), arr[:, 0], alpha=0.6)
    plt.xlabel('Index')
    plt.ylabel('Value')

plt.title('${arrayName}')
plt.show()
`;
}

export function generateGrayscaleCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

plt.imshow(arr, cmap='gray')
plt.colorbar()
plt.title('${arrayName}')
plt.show()
`;
}

export function generateHistogramCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

plt.hist(arr.flatten(), bins=50, edgecolor='black', alpha=0.7)
plt.title('${arrayName} - Histogram')
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.show()
`;
}

export function generateScatter3DCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

rows, cols = arr.shape
X, Y = np.meshgrid(range(cols), range(rows))

ax.scatter(X.flatten(), Y.flatten(), arr.flatten(), c=arr.flatten(), cmap='viridis', alpha=0.6)
ax.set_xlabel('Column')
ax.set_ylabel('Row')
ax.set_zlabel('Value')
ax.set_title('${arrayName}')
plt.show()
`;
}

export function generateSurface3DCode(
  fileName: string,
  arrayName: string
): string {
  return `import numpy as np
import matplotlib.pyplot as plt

data = np.load('${fileName}')
arr = data['${arrayName}']

fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

rows, cols = arr.shape
X, Y = np.meshgrid(range(cols), range(rows))

ax.plot_surface(X, Y, arr, cmap='viridis', edgecolor='none')
ax.set_xlabel('Column')
ax.set_ylabel('Row')
ax.set_zlabel('Value')
ax.set_title('${arrayName}')
plt.show()
`;
}

export function generateKMeansCode(
  fileName: string,
  arrayName: string,
  nClusters: number,
  normalize: boolean
): string {
  return `import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
${normalize ? "from sklearn.preprocessing import StandardScaler\n" : ""}
data = np.load('${fileName}')
arr = data['${arrayName}']

${normalize ? "scaler = StandardScaler()\nX = scaler.fit_transform(arr)" : "X = arr"}

kmeans = KMeans(n_clusters=${nClusters}, random_state=42)
labels = kmeans.fit_predict(X)

plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1],
            c='red', marker='x', s=200, linewidths=2, label='Centroids')
plt.title('K-Means Clustering (k=${nClusters})')
plt.legend()
plt.show()

print(f"Inertia: {kmeans.inertia_:.2f}")
`;
}

export function generateDBSCANCode(
  fileName: string,
  arrayName: string,
  eps: number,
  minSamples: number,
  normalize: boolean
): string {
  return `import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import DBSCAN
${normalize ? "from sklearn.preprocessing import StandardScaler\n" : ""}
data = np.load('${fileName}')
arr = data['${arrayName}']

${normalize ? "scaler = StandardScaler()\nX = scaler.fit_transform(arr)" : "X = arr"}

dbscan = DBSCAN(eps=${eps}, min_samples=${minSamples})
labels = dbscan.fit_predict(X)

n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
print(f"Number of clusters: {n_clusters}")

plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.title(f'DBSCAN (eps=${eps}, min_samples=${minSamples}) - {n_clusters} clusters')
plt.show()
`;
}

export function generatePCACode(
  fileName: string,
  arrayName: string,
  nComponents: number
): string {
  return `import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

data = np.load('${fileName}')
arr = data['${arrayName}']

pca = PCA(n_components=${nComponents})
reduced = pca.fit_transform(arr)

print(f"Explained variance ratio: {pca.explained_variance_ratio_}")
print(f"Total explained variance: {sum(pca.explained_variance_ratio_):.4f}")

plt.scatter(reduced[:, 0], reduced[:, 1], alpha=0.6)
plt.xlabel(f'PC1 ({pca.explained_variance_ratio_[0]*100:.1f}%)')
plt.ylabel(f'PC2 ({pca.explained_variance_ratio_[1]*100:.1f}%)')
plt.title('PCA - First 2 Components')
plt.show()
`;
}

export function generateSliceCode(
  fileName: string,
  arrayName: string,
  sliceIndices: number[],
  shape: number[]
): string {
  const sliceNotation = sliceIndices.map((i) => i.toString()).join(", ") + ", :, :";
  return `import numpy as np

data = np.load('${fileName}')
arr = data['${arrayName}']

# Shape: ${JSON.stringify(shape)}
sliced = arr[${sliceNotation}]
print(f"Slice shape: {sliced.shape}")
print(sliced)
`;
}

export function getChartCodeGenerator(
  chartType: string
): ((fileName: string, arrayName: string) => string) | null {
  switch (chartType) {
    case "line":
      return generateLineChartCode;
    case "scatter":
      return generateScatterPlotCode;
    case "grayscale":
      return generateGrayscaleCode;
    case "histogram":
      return generateHistogramCode;
    case "scatter3d":
      return generateScatter3DCode;
    case "surface3d":
      return generateSurface3DCode;
    default:
      return null;
  }
}
