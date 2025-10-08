import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStartSetup: () => void;
}

export function WelcomeScreen({ onStartSetup }: WelcomeScreenProps) {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col items-center justify-center bg-[#0A0A0A]">
      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h2 className="text-5xl font-bold text-white">
            fluster
          </h2>
          <div className="h-1 w-12 bg-white/20 mx-auto rounded-full"></div>
          <p className="text-xl text-white/60">we put games on your not so phone</p>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="mt-8 bg-white/[0.08] border-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.12] rounded-full px-8"
          onClick={onStartSetup}
        >
          <ArrowRight size={16} className="mr-2" />
          Get Started
        </Button>
      </div>
    </div>
  );
}
