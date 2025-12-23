import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../auth';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    return useContext(SubscriptionContext);
};

export const SubscriptionProvider = ({ children }) => {
    const [subscription, setSubscription] = useState(null);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [planTier, setPlanTier] = useState('free');
    const [currentPlan, setCurrentPlan] = useState('price_free');
    const [loading, setLoading] = useState(true);

    const refreshSubscription = React.useCallback(async () => {
        try {
            const { data } = await api.get('/subscription/status');
            setSubscription(data.subscription);
            setTokenBalance(data.tokens);
            setPlanTier(data.plan);
            setCurrentPlan(data.currentPlan || 'price_free');
        } catch (error) {
            console.error('Failed to fetch subscription status:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch if authenticated (api wrapper should handle auth headers)
        // We can check if we have a session token or let the API call fail/return 401
        refreshSubscription();

        // Poll every 5 minutes or on focus could be added here
        const interval = setInterval(refreshSubscription, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const value = {
        subscription,
        tokenBalance,
        planTier,
        currentPlan,
        loading,
        refreshSubscription
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};
