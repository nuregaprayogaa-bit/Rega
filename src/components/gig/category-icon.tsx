import {
  Palette,
  PenLine,
  Clapperboard,
  Megaphone,
  Code,
  Briefcase,
  Music,
  Camera,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Palette,
  PenLine,
  Clapperboard,
  Megaphone,
  Code,
  Briefcase,
  Music,
  Camera,
};

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || LayoutGrid;
  return <Icon className={className} />;
}
