import NegotiationSimulator from "@/components/NegotiationSimulator";

export const metadata = {
  title: "Salary Negotiation Simulator",
  description: "Practice your salary negotiation skills in a realistic AI environment.",
};

export default function NegotiationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Negotiation <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">Simulator</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Hone your counter-offer skills with a realistic AI hiring manager and live coaching.
          </p>
        </div>
        <NegotiationSimulator />
      </div>
    </div>
  );
}
