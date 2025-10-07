
import { PricingTable } from "@clerk/clerk-react"


const Plan = () => {
  return (
    <>
      <div className="max-w-2xl mx-auto  h-screen bg-black text-white  my-[120px]">
        <div className="text-center">
          <h2 className="text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 text-5xl md:text-7xl font-bold tracking-tight bg-clip-text  text-[42px]">
            Choose Your Plan
          </h2>
          <p className="text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 text-md md:text-sm font-bold tracking-tight bg-clip-text  max-w-lg mx-auto">
            Start for free and scale up as you grow. Find the perfect plan for
            your content creation needs.
          </p>
        </div>

        <div className="mt-14 max-sm:mx-8">
          <PricingTable />
        </div>
      </div>
    </>
  );
};

export default Plan;
