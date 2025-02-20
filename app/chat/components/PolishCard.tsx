import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PolishCardProps {
    content: string;
}

export function PolishCard({ content }: PolishCardProps) {
    const { toast } = useToast();
    const styles = content.split(/\[.*?\]\n/).filter(Boolean);
    const styleNames = content.match(/\[(.*?)\]/g)?.map(s => s.slice(1, -1)) || [];

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text.trim());
        toast({
            description: "已复制到剪贴板"
        });
    };

    return (
        <div className="space-y-1">
            {styles.map((style, index) => (
                <Card key={index} className="p-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            {styleNames[index] && (
                                <div className="inline-block px-2 py-0.5 mb-2 text-xs rounded-md bg-muted text-muted-foreground">
                                    {styleNames[index]}
                                </div>
                            )}
                            <p className="text-sm">{style.trim()}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(style)}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}