import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, supabase } from '../auth';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

export const SubscriptionProvider = ({ children }) => {
    const [subscription, setSubscription] = useState(null);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [planTier, setPlanTier] = useState('free');
    const [currentPlan, setCurrentPlan] = useState('price_free');
    const [hasStripeAccount, setHasStripeAccount] = useState(false);
    const [loading, setLoading] = useState(true);

    const refreshSubscription = React.useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setLoading(false);
                return;
            }

            const { data } = await api.get('/subscription/status');
            setSubscription(data.subscription);
            setTokenBalance(data.tokens);
            setPlanTier(data.plan);
            setCurrentPlan(data.currentPlan || 'price_free');
            setHasStripeAccount(data.hasStripeAccount || false);
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial check
        refreshSubscription();

        // Listen for auth changes to refresh or clear data
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                refreshSubscription();
            } else if (event === 'SIGNED_OUT') {
                setSubscription(null);
                setTokenBalance(0);
                setPlanTier('free');
                setCurrentPlan('price_free');
                setHasStripeAccount(false);
            }
        });

        const interval = setInterval(() => {
            refreshSubscription();
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            authListener.unsubscribe();
        };
    }, [refreshSubscription]);

    const value = {
        subscription,
        tokenBalance,
        planTier,
        currentPlan,
        hasStripeAccount,
        loading,
        refreshSubscription
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
