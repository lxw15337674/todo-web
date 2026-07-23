import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X } from 'lucide-react';
import { Producer, ProducerType, ProducerTag } from '@prisma/client';
import { PRODUCER_TYPE_NAMES } from '@/api/gallery/type';
import { useRequest } from 'ahooks';
import { getProducerTags, createProducerTag } from '@/api/gallery/producer';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import useConfigStore from '../../../store/config';

const TAG_COLORS = [
  {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
];

const getTagColor = (tagId: string) => {
  const index =
    [...tagId].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    TAG_COLORS.length;
  return TAG_COLORS[index];
};

interface ProducerFormData {
  name: string;
  producerId: string;
  type: ProducerType;
  tags: ProducerTag[];
}

interface ProducerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producer?: (Producer & { tags: ProducerTag[] }) | null;
  mode: 'create' | 'edit';
  onSubmit: (data: ProducerFormData) => Promise<void>;
}

export function ProducerFormDialog({
  open,
  onOpenChange,
  producer,
  mode,
  onSubmit,
}: ProducerFormDialogProps) {
  const [formData, setFormData] = useState<ProducerFormData>({
    name: producer?.name || '',
    producerId: producer?.producerId || '',
    type: producer?.type || ProducerType.WEIBO_PERSONAL,
    tags: producer?.tags || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const { config } = useConfigStore();
  const editCode = config.codeConfig.editCode;

  const { data: tags = [], refresh: refreshTags } = useRequest(
    getProducerTags,
    {
      manual: false,
      ready: open,
    },
  );

  const validateForm = useCallback((data: ProducerFormData) => {
    const errors: Record<string, string> = {};

    if (!data.producerId.trim()) {
      errors.producerId = 'ID不能为空';
    }

    if (!data.name.trim()) {
      errors.name = '名称不能为空';
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
  }, []);

  const handleCreateNewTag = useCallback(
    async (tagName: string) => {
      if (!tagName.trim() || isCreatingTag) return;

      setIsCreatingTag(true);
      try {
        const newTag = await createProducerTag({
          name: tagName.trim(),
          remark: undefined,
          editCode,
        });

        await refreshTags();

        const updatedTags = [...formData.tags, newTag];
        setFormData((prev) => ({ ...prev, tags: updatedTags }));

        toast({
          title: '标签创建成功',
          description: `标签 "${tagName}" 已创建并添加`,
        });

        return newTag;
      } catch (error) {
        console.error('创建标签失败:', error);
        toast({
          title: '创建标签失败',
          description: error instanceof Error ? error.message : '请重试',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsCreatingTag(false);
      }
    },
    [formData.tags, refreshTags, isCreatingTag],
  );

  const handleSubmit = async () => {
    const { errors, isValid } = validateForm(formData);
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      toast({
        title: mode === 'create' ? '创建成功' : '保存成功',
        description: mode === 'create' ? '制作者已创建' : '制作者信息已更新',
      });

      if (mode === 'create') {
        setFormData({
          name: '',
          producerId: '',
          type: ProducerType.WEIBO_PERSONAL,
          tags: [],
        });
      }
    } catch (error) {
      console.error(`${mode === 'create' ? '创建' : '更新'}失败:`, error);
      toast({
        title: mode === 'create' ? '创建失败' : '保存失败',
        description: '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    if (validationErrors.name) {
      setValidationErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleProducerIdChange = (value: string) => {
    setFormData((prev) => ({ ...prev, producerId: value }));
    if (validationErrors.producerId) {
      setValidationErrors((prev) => ({ ...prev, producerId: '' }));
    }
  };

  const handleTypeChange = (value: ProducerType) => {
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handleTagsChange = (values: string[]) => {
    const selectedTags = tags.filter((t) => values.includes(t.id));
    setFormData((prev) => ({ ...prev, tags: selectedTags }));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '添加制作者' : '编辑制作者'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 名称输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              名称 <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="请输入制作者名称"
              className={cn(validationErrors.name && 'border-destructive')}
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* ID输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              ID <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.producerId}
              onChange={(e) => handleProducerIdChange(e.target.value)}
              placeholder="请输入制作者ID"
              className={cn(
                validationErrors.producerId && 'border-destructive',
              )}
            />
            {validationErrors.producerId && (
              <p className="text-xs text-destructive">
                {validationErrors.producerId}
              </p>
            )}
          </div>

          {/* 类型选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              类型 <span className="text-destructive">*</span>
            </label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProducerType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {PRODUCER_TYPE_NAMES[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 标签选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <div className="space-y-2">
              <MultiSelect
                key={`multi-select-${formData.tags.length}`}
                animation={0}
                options={tags.map((tag) => {
                  const color = getTagColor(tag.id);
                  return {
                    label: tag.name,
                    value: tag.id,
                    className: cn(
                      'rounded border px-1.5 py-0.5 text-xs font-medium',
                      color.bg,
                      color.text,
                      color.border,
                    ),
                  };
                })}
                defaultValue={formData.tags.map((t) => t.id)}
                onValueChange={handleTagsChange}
                placeholder="选择标签..."
                maxCount={2}
              />

              {/* 创建新标签 */}
              <div className="flex gap-2">
                <Input
                  placeholder="输入新标签名称..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleCreateNewTag(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                  disabled={isCreatingTag}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder="输入新标签名称..."]',
                    ) as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleCreateNewTag(input.value.trim());
                      input.value = '';
                    }
                  }}
                  disabled={isCreatingTag}
                >
                  {isCreatingTag ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    '创建'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
