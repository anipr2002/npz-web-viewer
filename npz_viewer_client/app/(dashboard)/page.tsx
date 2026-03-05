import FileUploader from "@/components/dashboard/file-uploader/FileUploader";
import { GithubIcon, Bug, Coffee } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BgNoiseWrapper from "@/components/ui/texture-wrapper";
import Script from "next/script";
import AuthButton from "@/components/AuthButton";
import RevenueGoal from "@/components/dashboard/RevenueGoal";

export default function Home() {
  return (
    <BgNoiseWrapper url="/cult-noise.png">
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* JSON-LD structured data for better SEO */}
        <Script
          id="schema-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "NPZ Viewer",
              applicationCategory: "DataVisualizationApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "A modern web tool for visualizing and exploring .npy and .npz files with 3D plots, machine learning integration, and data analysis features.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "25",
              },
              featureList: [
                "3D Scatter Plot",
                "3D Surface Plot",
                "Scatter Plot",
                "Line Chart",
                "Grayscale Image",
                "K-means clustering",
                "DBSCAN clustering",
                "Principal Component Analysis (PCA)",
              ],
              screenshot: "https://npz-web-viewer.vercel.app/og-image.jpg",
              url: "https://npz-web-viewer.vercel.app",
            }),
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <RevenueGoal />
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <AuthButton />
          </div>

          <div className="text-center mb-12">
            <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">NPZ Viewer</span>
              <span className="block text-indigo-600 dark:text-indigo-400">
                Visualize Your Data
              </span>
            </div>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Upload and explore your NumPy array files (.npy/.npz) with our
              modern, intuitive viewer.
            </p>
          </div>

          <div className="relative">
            <FileUploader />
          </div>

          <footer className="mt-16 text-center">
            <Link
              className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
              href="https://github.com/anipr2002/npz-web-viewer"
            >
              <GithubIcon className="h-4 w-4" />
              <span>View on GitHub</span>
            </Link>
            <Link
              href={
                "https://github.com/anipr2002/npz-web-viewer/issues/new?template=Blank+issue"
              }
            >
              <Button
                className="mt-5 text-gray-500"
                variant={"outline"}
                size={"sm"}
              >
                <Bug
                  size={14}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                Report bugs
              </Button>
            </Link>
            <Link href={process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_URL!}>
              <Button
                variant={"outline"}
                size={"sm"}
                className="mt-5 ml-4 text-gray-500"
              >
                <Coffee className="h-4 w-4" />
                Buy me a coffee
              </Button>
            </Link>
          </footer>
        </div>
      </main>
    </BgNoiseWrapper>
  );
}
