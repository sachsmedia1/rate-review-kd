import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, isLoading }: StatCardProps) => {
  return (
    <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
          </div>
          <div className="text-4xl opacity-80">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
