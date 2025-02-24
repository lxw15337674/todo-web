import { Button, ButtonProps } from "@/components/ui/button";

export function ScrollToTop({
    scrollTo = 0,
    ...props
}: ButtonProps & { minHeight?: number; scrollTo?: number }) {
    return (
        <>
            <Button
                onClick={() =>
                    window.scrollTo({
                        top: scrollTo,
                        behavior: "smooth",
                    })
                }
                {...props}
            />
        </>
    );
}