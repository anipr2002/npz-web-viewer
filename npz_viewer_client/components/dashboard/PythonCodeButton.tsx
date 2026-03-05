"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Lock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import PythonCodeModal from "./PythonCodeModal";

interface PythonCodeButtonProps {
  generateCode: () => string;
}

export default function PythonCodeButton({
  generateCode,
}: PythonCodeButtonProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const { isSignedIn } = useAuth();
  const premium = useQuery(api.polar.isPremium, isSignedIn ? {} : "skip");
  const isPremium = premium === true;

  const handleClick = () => {
    if (!isPremium) {
      toast.error("Python Code Generation is a Pro feature. Upgrade to unlock!");
      return;
    }
    setCode(generateCode());
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="flex items-center gap-1"
      >
        <Code2 className="h-4 w-4" />
        <span>Python</span>
        {!isPremium && <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />}
      </Button>
      <PythonCodeModal code={code} open={open} onOpenChange={setOpen} />
    </>
  );
}
