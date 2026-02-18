import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader, Star } from 'lucide-react';
import { api, supabase } from '../auth';
import { useSubscription } from '../context/SubscriptionContext';
import Navbar from '../components/Navbar';
import Breadcrumbs from '../components/Breadcrumbs';

const PricingPage = () => {
    const navigate = useNavigate();
    const { currentPlan, stripePriceIds, loading: isSubLoading, planTier } = useSubscription();
    const [loading, setLoading] = useState(null);
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const handleUpgrade = async (priceId) => {
        setLoading(priceId);
        try {
            const response = await api.post('/subscription/create-checkout', { priceId });
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('Failed to start upgrade. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    if (isSubLoading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Ultra-robust plan matching helper
    const checkIsCurrent = (targetPriceId, currentId, monthlyStripe, yearlyStripe, tier) => {
        if (!currentId) return false;

        const normalizedCardId = String(targetPriceId).toLowerCase().trim();
        const normalizedCurrentId = String(currentId).toLowerCase().trim();
        const normalizedMonthly = String(monthlyStripe || '').toLowerCase().trim();
        const normalizedYearly = String(yearlyStripe || '').toLowerCase().trim();

        // 1. Direct internal ID match (e.g., 'price_pro_monthly')
        if (normalizedCurrentId === normalizedCardId) return true;

        // 2. Fallback 'pro' string match (defaults to Monthly)
        if (normalizedCurrentId === 'pro' && normalizedCardId === 'price_pro_monthly') return true;

        // 3. Raw Stripe ID match
        if (normalizedCardId === 'price_pro_monthly' && normalizedMonthly && normalizedCurrentId === normalizedMonthly) return true;
        if (normalizedCardId === 'price_pro_yearly' && normalizedYearly && normalizedCurrentId === normalizedYearly) return true;

        // 4. Legacy/Unknown Pro Plan Logic
        if (tier === 'pro') {
            const isStrictYearly = normalizedCurrentId === 'price_pro_yearly' || (normalizedYearly && normalizedCurrentId === normalizedYearly);

            if (normalizedCardId === 'price_pro_monthly' && !isStrictYearly) return true;
            if (normalizedCardId === 'price_pro_yearly' && isStrictYearly) return true;
        }

        return false;
    };

    // Prevent accidental downgrades
    const checkIsDowngrade = (targetPriceId, currentId, monthlyStripe, yearlyStripe, tier) => {
        if (!currentId || tier === 'free') return false;

        const normalizedCardId = String(targetPriceId || 'price_free').toLowerCase().trim();
        const normalizedCurrentId = String(currentId).toLowerCase().trim();
        const normalizedYearly = String(yearlyStripe || '').toLowerCase().trim();

        const isCurrentYearly = normalizedCurrentId === 'price_pro_yearly' || (normalizedYearly && normalizedCurrentId === normalizedYearly);

        // If on Yearly, both Monthly and Free are downgrades
        if (isCurrentYearly) {
            return normalizedCardId === 'price_pro_monthly' || normalizedCardId === 'price_free';
        }

        // If on Pro (likely Monthly), Free is a downgrade
        if (tier === 'pro') {
            return normalizedCardId === 'price_free';
        }

        return false;
    };

    const PlanCard = ({ title, price, features, priceId, recommended, tokens, isCurrent, isDowngrade }) => (
        <div className={`relative p-8 bg-white rounded-2xl border ${isCurrent ? 'border-teal-500 shadow-xl ring-2 ring-teal-500/20' : (recommended ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200 shadow-sm')} flex flex-col transition-all duration-300`}>
            {(isCurrent || (recommended && !isCurrent)) && (
                <div className={`absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 ${isCurrent ? 'bg-teal-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white text-xs font-bold uppercase rounded-full shadow-md z-10 flex items-center gap-1`}>
                    {isCurrent ? <Check className="w-3 h-3 text-white" /> : null}
                    {isCurrent ? 'Current Plan' : 'Most Popular'}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">{price}</span>
                {price !== 'Free' && <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>}
            </div>
            <div className="mt-2 text-sm text-gray-500">{tokens} AI Tokens / month</div>
            <ul className="mt-6 space-y-4 flex-1">
                {features.map((feature) => (
                    <li key={feature} className="flex">
                        <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                        <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                <button
                    onClick={() => priceId ? handleUpgrade(priceId) : navigate('/trees')}
                    disabled={loading !== null || isCurrent || isSubLoading || isDowngrade}
                    className={`w-full block bg-gradient-to-r ${isCurrent ? 'from-teal-600 to-teal-700' : (recommended ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'from-gray-800 to-gray-900 hover:from-black hover:to-gray-800')} border border-transparent rounded-md py-3 text-sm font-semibold text-white text-center shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading === priceId ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : (
                        isCurrent ? 'Active Plan' : (
                            isDowngrade ? 'Included' : (
                                priceId ? (
                                    (currentPlan && currentPlan !== 'price_free' && currentPlan !== 'free') ? 'Switch Plan' : 'Upgrade Now'
                                ) : 'Get Started'
                            )
                        )
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar user={user} />
            <Breadcrumbs items={[{ label: 'Pricing' }]} />
            <div className="pb-12 sm:pb-24 pt-6">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                            Choose the right plan for your journey
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Unlock advanced AI features, unlimited visualizations, and premium exports.
                        </p>
                    </div>
                    <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
                        <PlanCard
                            title="Free"
                            price="Free"
                            tokens="50"
                            isCurrent={!currentPlan || currentPlan === 'price_free' || currentPlan === 'free'}
                            isDowngrade={checkIsDowngrade('price_free', currentPlan, stripePriceIds?.monthly, stripePriceIds?.yearly, planTier)}
                            features={['Basic Tree Visualizations', 'Up to 50 Family Members', '50 AI Credits/mo', 'Community Support']}
                        />
                        <PlanCard
                            title="Pro Monthly"
                            price="$4.99"
                            tokens="1,000"
                            priceId="price_pro_monthly"
                            recommended={true}
                            isCurrent={checkIsCurrent('price_pro_monthly', currentPlan, stripePriceIds?.monthly, stripePriceIds?.yearly, planTier)}
                            isDowngrade={checkIsDowngrade('price_pro_monthly', currentPlan, stripePriceIds?.monthly, stripePriceIds?.yearly, planTier)}
                            features={['Advanced Graph Views', 'Unlimited Family Members', '1,000 AI Credits/mo', 'Map & Heatmap Analytics', 'Priority Support']}
                        />
                        <PlanCard
                            title="Pro Yearly"
                            price="$49.99"
                            tokens="12,000"
                            priceId="price_pro_yearly"
                            isCurrent={checkIsCurrent('price_pro_yearly', currentPlan, stripePriceIds?.monthly, stripePriceIds?.yearly, planTier)}
                            isDowngrade={checkIsDowngrade('price_pro_yearly', currentPlan, stripePriceIds?.monthly, stripePriceIds?.yearly, planTier)}
                            features={['Advanced Graph Views', 'Unlimited Family Members', '12,000 AI Credits/yr', 'Map & Heatmap Analytics', 'Priority Support', 'Two months free']}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
