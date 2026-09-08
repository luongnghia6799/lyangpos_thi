import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useProductData() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await axios.get('/api/products');
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.items)) return data.items;
            if (Array.isArray(data?.products)) return data.products;
            if (Array.isArray(data?.data)) return data.data;
            return [];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes stale time
        gcTime: 1000 * 60 * 60, // 1 hour garbage collection time
    });
}

export function usePartnerData() {
    return useQuery({
        queryKey: ['partners'],
        queryFn: async () => {
            const { data } = await axios.get('/api/partners');
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.items)) return data.items;
            if (Array.isArray(data?.partners)) return data.partners;
            if (Array.isArray(data?.data)) return data.data;
            return [];
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
    });
}

export const useShippingSummary = () => {
    return useQuery({
        queryKey: ['shippingSummary'],
        queryFn: async () => {
            const { data } = await axios.get('/api/orders?shipping_status=Shipping&limit=1&page=1');
            return { total: data?.total || 0 };
        },
        refetchInterval: 30000,
        staleTime: 30000,
    });
};
