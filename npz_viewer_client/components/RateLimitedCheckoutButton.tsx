"use client";

import { useState, ReactNode } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RateLimitedCheckoutButtonProps {
  className?: string;
  children: ReactNode;
}

export default function RateLimitedCheckoutButton({
  className,
  children,
}: RateLimitedCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const generateCheckout = useAction(api.polar.generateCheckoutLink);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await generateCheckout({
        origin: window.location.origin,
        successUrl: window.location.href,
      });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create checkout session";
      if (message.includes("Rate limit")) {
        toast.error(message, { duration: 5000 });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
