import * as React from 'react';

import { Button } from '@/components/ui/button';

export function ScrollToTop({
    minHeight = 0,
    scrollTo = 0,
    ...props
}: React.ComponentProps<typeof Button> & { minHeight?: number; scrollTo?: number }) {
    return (
            <Button
            className=" bottom-4 right-4 z-50 ml-auto"
                onClick={() =>
                    window.scrollTo({
                        top: scrollTo,
                        behavior: "smooth",
                    })
                }
                {...props}
        />
    );
}
