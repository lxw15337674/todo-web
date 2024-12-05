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
import useConfigStore from "../../store/config";
import { useToast } from "../../src/hooks/use-toast";
import PasswordInput from "../../src/components/PasswordInput";

export default function Login() {
    const { setEditCodePermission, validateEditCode } = useConfigStore();
    const [password, setPassword] = useState('')
    const { toast } = useToast();
    const router = useRouter()
    useMount(async () => {
        validateEditCode().then((hasEditCodePermission) => {
            if (hasEditCodePermission) {
                router.push('/')
                return
            }
        });
    })
    const onSubmit = async () => {
        const hasEditCodePermission = await setEditCodePermission(password ?? '')
        if (!hasEditCodePermission) {
            toast({
                variant: "destructive",
                title: "密码错误",
                description: "请检查密码是否正确",
                duration: 1000
            })
            return
        }
        router.push('/')
    }

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>访问密码</DialogTitle>
                    <DialogDescription>
                        需要输入密码才能查看
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" onClick={onSubmit}>
                        确定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
