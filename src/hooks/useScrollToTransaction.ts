import { useEffect, useRef } from 'react';

export const useScrollToTransaction = (isLoading: boolean) => {
    const wasLoadingRef = useRef(true);

    useEffect(() => {
        if (wasLoadingRef.current && !isLoading) {
            setTimeout(() => {
                const editedTransactionId = sessionStorage.getItem('editedTransactionId');
                if (editedTransactionId) {
                    const element = document.getElementById(`transaction-${editedTransactionId}`);
                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                    sessionStorage.removeItem('editedTransactionId');
                    sessionStorage.removeItem('editedTransactionPage');
                }
            }, 0);
        }
        wasLoadingRef.current = isLoading;
    }, [isLoading]);
};
