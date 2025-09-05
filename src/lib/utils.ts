import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function animateNumber(
    target: number,
    setter: (value: number) => void,
    duration = 500,
    initialValue = 0,
    easing: (t: number) => number = (t) => 1 - Math.pow(1 - t, 3)
) {
    const startValue = initialValue;
    const change = target - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        const currentValue = startValue + change * easedProgress;
        setter(Math.round(currentValue));

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            setter(target);
        }
    };

    requestAnimationFrame(animate);
}
