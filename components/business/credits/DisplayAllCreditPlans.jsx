'use client'

import useGetCreditPlans from '@/hooks/business/credit-plans/useGetCreditPlans';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useRouter } from 'next/navigation';

const GridItem = ({
  area,
  icon,
  title,
  description
}) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01} />
        <div
          className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-full p-2 justify-center items-center text-center flex">
              {icon}
            </div>
            <div className="space-y-3">
              <h3
                className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white">
                {title}
              </h3>
              <h2
                className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default function DisplayAllCreditPlans() {
    const { data: creditPlans, isLoading } = useGetCreditPlans();
    const t = useTranslations('Credits');
    const router = useRouter();
    const orderId = "baifan1366"
    
    if (isLoading) {
        return (
            <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-3 lg:gap-4">
                {[1, 2, 3].map((item) => (
                    <li key={item} className="min-h-[14rem] list-none">
                        <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
                            <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
                                <div className="relative flex flex-1 flex-col justify-between gap-3">
                                    <div className="w-full p-2 justify-center items-center text-center flex">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                    </div>
                                    <div className="space-y-3">
                                        <Skeleton className="h-6 w-24 mx-auto" />
                                        <Skeleton className="h-4 w-16 mx-auto" />
                                    </div>
                                    <div className="flex flex-col items-center space-y-3 mt-3">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        )
    }
    
    // 只显示一次性支付的积分套餐
    const oneTimePlans = creditPlans.filter(plan => plan.billing_cycle === 'one_time');
    
    return (
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-3 lg:gap-4">
            {oneTimePlans.map((plan) => (
                <GridItem
                    key={plan.id}
                    area=""
                    icon={
                        <Image 
                            src="/credit-icon.png" 
                            alt="Credits" 
                            width={64} 
                            height={64} 
                            style={{
                                width: '64px',
                                height: '64px',
                            }}
                            priority
                        />
                    }
                    title={
                        <div className="flex flex-col items-center">
                            <p className="text-3xl font-bold">{plan.credit_amount}</p>
                            <p className="text-sm text-gray-500">{t('credits')}</p>
                        </div>
                    }
                    description={
                        <div className="flex flex-col items-center space-y-3">
                            {plan.is_discounted ? (
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-sm line-through">
                                        {plan.currency} {plan.original_price}
                                    </p>                                
                                    <p className="text-lg font-bold text-orange-500">
                                        {plan.currency} {plan.discount_price}
                                    </p>                                
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <p className="text-lg font-bold text-orange-500">
                                        {plan.currency} {plan.original_price}
                                    </p>
                                </div>
                            )}
                            
                            <Button 
                                variant="orange" 
                                className="w-full"
                                onClick={() => router.push(`/business/payments-and-credits/buy-credits/checkout?planId=${plan.id}&orderId=${orderId}`)}
                            >
                                {t('buy')}
                            </Button>
                        </div>
                    }
                />
            ))}
        </ul>
    );
}