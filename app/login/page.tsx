'use client'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from 'next/navigation';
import { useMount } from "ahooks"
import { Lock, Loader2 } from 'lucide-react';
import useConfigStore from "../../store/config";
import { useToast } from "../../src/hooks/use-toast";
import PasswordInput from "../../src/components/PasswordInput";

export default function Login() {
    const { setEditCodePermission, checkAuth } = useConfigStore();
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast();
    const router = useRouter()

    useMount(() => {
        checkAuth().then((role) => {
            if (role !== 'none') {
                router.push('/')
            }
        });
    })

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            router.push('/');
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        
        setIsLoading(true);
        try {
            const role = await setEditCodePermission(password ?? '')
            if (role === 'none') {
                toast({
                    variant: "destructive",
                    title: "验证失败",
                    description: "访问密码错误，请重试",
                    duration: 2000
                })
                setPassword(''); // Clear password on error for UX
                return
            }
            
            toast({
                title: "验证通过",
                description: "即将进入系统...",
                duration: 1500
            })
            
            // Give a small delay for user to see success state
            setTimeout(() => {
                router.push('/')
            }, 500);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[400px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="flex flex-col items-center space-y-2 text-center sm:text-center">
                    <div className="rounded-full bg-muted p-3">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">安全访问</DialogTitle>
                    <DialogDescription>
                        请输入访问密码以继续操作
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="输入访问密码"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button type="submit" className="w-full sm:w-full" disabled={isLoading || !password}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    验证中...
                                </>
                            ) : (
                                "确认访问"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
