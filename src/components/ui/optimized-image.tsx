import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    quality?: number;
    className?: string;
}

export function OptimizedImage({
    src,
    alt,
    width,
    height,
    quality = 80,
    className,
    ...props
}: OptimizedImageProps) {
    const [error, setError] = useState(false);

    // Helper to optimize Supabase URLs
    const getOptimizedUrl = (url: string) => {
        if (!url || error) return url;

        // Check if it's a Supabase Storage URL
        if (url.includes("supabase.co/storage/v1/object/public")) {
            const params = new URLSearchParams();
            if (width) params.append("width", width.toString());
            if (height) params.append("height", height.toString());
            params.append("quality", quality.toString());
            params.append("format", "webp");
            params.append("resize", "cover");

            // Switch from /object/public to /render/image/public to enable on-the-fly transformations
            const renderUrl = url.replace("/object/public", "/render/image/public");

            return `${renderUrl}?${params.toString()}`;
        }

        return url;
    };

    return (
        <img
            src={getOptimizedUrl(src)}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            className={cn("transition-opacity duration-300", className, {
                "opacity-0": false, // Could add loading state logic here
            })}
            onError={(e) => {
                setError(true);
                // Fallback to original src if transformation fails
                e.currentTarget.src = src;
            }}
            {...props}
        />
    );
}
