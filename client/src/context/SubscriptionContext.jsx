import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, supabase } from '../auth';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

export const SubscriptionProvider = ({ children }) => {
    const [subState, setSubState] = useState({
        subscription: null,
        tokenBalance: 0,
        planTier: 'free',
        currentPlan: 'price_free',
        hasStripeAccount: false,
        stripePriceIds: null,
        loading: true
    });

    const refreshSubscription = React.useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setSubState(prev => ({
                    ...prev,
                    subscription: null,
                    planTier: 'free',
                    currentPlan: 'price_free',
                    loading: false
                }));
                return;
            }

            const { data } = await api.get('/subscription/status');
            setSubState({
                subscription: data.subscription,
                tokenBalance: data.tokens,
                planTier: data.plan,
                currentPlan: data.currentPlan || 'price_free',
                hasStripeAccount: data.hasStripeAccount || false,
                stripePriceIds: data.stripePriceIds || null,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
            setSubState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        // Initial check
        refreshSubscription();

        // Listen for auth changes to refresh or clear data
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setSubState(prev => ({ ...prev, loading: true }));
                refreshSubscription();
            } else if (event === 'SIGNED_OUT') {
                setSubState({
                    subscription: null,
                    tokenBalance: 0,
                    planTier: 'free',
                    currentPlan: 'price_free',
                    hasStripeAccount: false,
                    stripePriceIds: null,
                    loading: false
                });
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
        ...subState,
        refreshSubscription
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
