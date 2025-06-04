import { Button } from './button';

const PricingCard = ({
  tier,
  price,
  isHighlighted = false,
  features,
}: {
  tier: string;
  price: number;
  isHighlighted?: boolean;
  features: string[];
}) => {
  return (
    <div
      className={`relative flex flex-col gap-3 rounded-[37px] p-4 ${
        isHighlighted
          ? 'border border-white bg-gradient-to-b from-[#FFA756] via-[#F68441] to-[#EE602C]'
          : 'bg-[#DCDCDC]'
      }`}
    >
      <div className="space-y-8 rounded-[28px] bg-[#F5F5F5] p-4 px-4 pb-20 shadow-[0px_95px_27px_0px_rgba(0,0,0,0.00),_0px_61px_24px_0px_rgba(0,0,0,0.03),_0px_34px_21px_0px_rgba(0,0,0,0.11),_0px_15px_15px_0px_rgba(0,0,0,0.19),_0px_4px_8px_0px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col">
          <h3 className="flex w-fit items-center justify-center rounded-[9999px] border border-[#DCDCDC] bg-white px-[14.32px] py-1 font-medium text-[18px] text-gray-900">
            {tier}
          </h3>
          <div className="mt-2 flex items-baseline">
            <span className="font-bold text-[40px]">$</span>
            <span className="font-bold text-[40px]">{price}</span>
            <span className="ml-1 text-gray-500">/month</span>
          </div>
        </div>

        <Button className="w-full bg-gray-900 px-6 py-4 font-medium text-md text-white shadow-sm transition-colors hover:bg-gray-800">
          Get Started
        </Button>

        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                className="mr-3 h-5 w-5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                />
              </svg>
              <span className="text-[14px] text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function Pricing() {
  const hobbyFeatures = [
    'Access to basic analytics reports',
    'Up to 10,000 data points per month',
    'Email support',
    'Community forum access',
    'Cancel anytime',
  ];

  const promiseFeatures = [
    'Access to basic analytics reports',
    'Up to 10,000 data points per month',
    'Email support',
    'Community forum access',
    'Cancel anytime',
    'Access to basic analytics reports',
    'Up to 10,000 data points per month',
    'Email support',
    'Community forum access',
    'Cancel anytime',
  ];

  const proFeatures = [
    'Access to basic analytics reports',
    'Up to 10,000 data points per month',
    'Email support',
    'Community forum access',
    'Cancel anytime',
  ];

  return (
    <div id="pricing" className="mx-auto max-w-7xl px-4 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 font-bold text-4xl">
          <span className="text-orange-500">Simple</span> Pricing for Everyone
        </h2>
        <p className="mx-auto max-w-2xl text-gray-600">
          Here, we are going to make the middle one much more attractive than
          the rest of the pricing tiers so you buy what we want you to buy
        </p>
      </div>
      <div className="grid items-center gap-4 md:grid-cols-3">
        <PricingCard tier="Hobby" price={99} features={hobbyFeatures} />
        <PricingCard
          tier="Promise"
          price={299}
          features={promiseFeatures}
          isHighlighted
        />
        <PricingCard tier="Pro" price={199} features={proFeatures} />
      </div>
    </div>
  );
}
