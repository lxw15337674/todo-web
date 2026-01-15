import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ProducerAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

// 简单的硬编码密码（实际项目中应该从环境变量或配置中获取）
const ACCESS_PASSWORD = 'producer123';

export function ProducerAuthDialog({
  open,
  onOpenChange,
  onAuthSuccess,
}: ProducerAuthDialogProps) {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('请输入访问密码');
      return;
    }

    setIsVerifying(true);
    setError('');

    // 模拟验证延迟
    setTimeout(() => {
      if (password === ACCESS_PASSWORD) {
        // 验证成功，保存会话状态
        localStorage.setItem('producer_auth_token', Date.now().toString());
        localStorage.setItem('producer_auth_time', new Date().toISOString());

        toast({
          title: '验证成功',
          description: '您现在可以管理制作者了',
        });

        onAuthSuccess();
        setPassword('');
        onOpenChange(false);
      } else {
        setError('密码错误，请重试');
        setPassword('');
      }
      setIsVerifying(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            访问验证
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            制作者管理需要验证访问权限，请输入密码继续。
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">访问密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="请输入访问密码"
              onKeyDown={handleKeyPress}
              disabled={isVerifying}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>💡 提示：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>密码区分大小写</li>
              <li>验证成功后会在当前会话中保持权限</li>
              <li>忘记密码请联系管理员</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPassword('');
              setError('');
            }}
            disabled={isVerifying}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isVerifying || !password.trim()}
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            验证
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 检查权限的辅助函数
export function checkProducerAuth(): boolean {
  const token = localStorage.getItem('producer_auth_token');
  const time = localStorage.getItem('producer_auth_time');

  if (!token || !time) {
    return false;
  }

  // 检查会话是否过期（24小时）
  const authTime = new Date(time).getTime();
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;

  if (now - authTime > hours24) {
    clearProducerAuth();
    return false;
  }

  return true;
}

// 清除权限
export function clearProducerAuth() {
  localStorage.removeItem('producer_auth_token');
  localStorage.removeItem('producer_auth_time');
}
