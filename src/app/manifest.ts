import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "FeedGym",
        short_name: "FeedGym",
        description: "Tu Red Social Fitness",
        start_url: "/",
        display: "standalone",
        background_color: "#09090b", // zinc-950
        theme_color: "#09090b",
        orientation: "portrait",
        icons: [
            {
                src: "/icon.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
