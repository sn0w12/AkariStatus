import { Analytics } from "@/components/analytics";
import Uptime from "@/components/uptime";
import RuntimeStatsCard from "@/components/runtime-stats";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Akari Status",
    description: "Real-time status and analytics for Akari",
    openGraph: {
        title: "Akari Status",
        description: "Real-time status and analytics for Akari",
        images: "https://raw.githubusercontent.com/sn0w12/Akari/refs/heads/master/public/img/icon.png",
    },
    twitter: {
        title: "Akari Status",
        description: "Real-time status and analytics for Akari",
        card: "summary_large_image",
        images: "https://raw.githubusercontent.com/sn0w12/Akari/refs/heads/master/public/img/icon.png",
    },
};

export default async function Home() {
    return (
        <div className="min-h-screen p-8 text-foreground relative">
            <Image
                src="/bg.webp"
                alt="Background"
                fill
                className="object-cover -z-10 opacity-25"
            />
            <div className="max-w-7xl mx-auto relative z-10">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Akari Status</h1>
                    <p className="text-muted-foreground">
                        Real-time status and analytics for Akari
                    </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <RuntimeStatsCard />
                    <div className="md:col-span-2 w-full h-full">
                        <Uptime />
                    </div>
                </div>
                <Analytics />
            </div>
        </div>
    );
}
