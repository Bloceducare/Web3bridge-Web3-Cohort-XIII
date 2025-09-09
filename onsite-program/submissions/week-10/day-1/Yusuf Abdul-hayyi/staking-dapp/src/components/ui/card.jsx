import { cn } from "../../lib/utils";

function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg transition-shadow overflow-hidden",
                "dark:bg-zinc-900 dark:border-zinc-800",
                className
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }) {
    return (
        <div
            className={cn(
                "p-4 border-b bg-gradient-to-r from-indigo-50 via-fuchsia-50 to-violet-50",
                "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 dark:border-zinc-800",
                className
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }) {
    return (
        <h3
            className={cn("text-base font-semibold text-zinc-900 dark:text-zinc-100", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }) {
    return (
        <p className={cn("text-sm text-zinc-600 dark:text-zinc-400", className)} {...props} />
    );
}

function CardContent({ className, ...props }) {
    return <div className={cn("p-4", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
    return <div className={cn("p-4 border-t dark:border-zinc-800", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };


