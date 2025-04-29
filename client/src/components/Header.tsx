import { Newspaper } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full sticky top-0 z-50 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] shadow flex items-center px-6 h-14">
      <div className="flex items-center">
        <Newspaper className="h-6 w-6 mr-2" />
        <h1 className="text-xl font-bold">Inkless News</h1>
      </div>
    </header>
  );
} 