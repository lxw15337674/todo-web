'use client';

import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionStorageState } from 'ahooks';
import Image from 'next/image';
import {
  BotIcon,
  CheckIcon,
  CopyIcon,
  MenuIcon,
  MessageCircleIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import { polishContent } from '@/api/ai/aiActions';
import { Attachment, AttachmentMedia } from '@/components/ui/attachment';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { PolishCard } from './components/PolishCard';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'polish' | 'status' | 'error';
  content: string;
}

interface Command {
  key: string;
  description: string;
  type?: 'text' | 'image';
}

const STORAGE_KEY = 'chat_messages';

export default function Chat() {
  const [messages, setMessages] = useSessionStorageState<ChatMessage[]>(STORAGE_KEY, {
    defaultValue: [],
  });
  const [input, setInput] = useSessionStorageState<string>('chat_input', {
    defaultValue: '',
  });
  const [commands, setCommands] = useState<Command[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isProcessing = useMemo(
    () => messages?.some((message) => message.type === 'status') ?? false,
    [messages],
  );

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const response = await fetch('/bhwa233-api/command/list');

        if (!response.ok) {
          throw new Error(`Failed to fetch commands: ${response.status}`);
        }

        const data: unknown = await response.json();
        setCommands(Array.isArray(data) ? (data as Command[]) : []);
      } catch (error) {
        console.error('Failed to fetch commands:', error);
      }
    };

    fetchCommands();
  }, [setCommands]);

  const clearMessages = () => setMessages([]);

  const handleCommandClick = (command: Command) => {
    if (command.key.endsWith(' ')) {
      setInput(command.key);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    handleSubmit(undefined, command.key);
  };

  const handleSubmit = async (
    event?: React.FormEvent,
    commandOverride?: string,
  ) => {
    event?.preventDefault();
    const commandText = commandOverride || input?.trim();

    if (!commandText) return;

    const requestId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: `${requestId}-user`,
      role: 'user',
      type: 'text',
      content: commandText,
    };
    const pendingMessage: ChatMessage = {
      id: requestId,
      role: 'assistant',
      type: 'status',
      content: '处理中',
    };

    if (!commandOverride) setInput('');
    setMessages((current) => [...(current ?? []), userMessage, pendingMessage]);

    try {
      const response = await axios.get<{
        content?: string;
        type?: ChatMessage['type'];
      }>('/bhwa233-api/command', {
        params: { command: commandText },
      });
      const processedData = response.data;

      if (!processedData.content) {
        processedData.content = await polishContent(commandText);
        processedData.type = 'polish';
      }

      setMessages((current) =>
        (current ?? []).map((message) =>
          message.id === requestId
            ? {
                id: requestId,
                role: 'assistant',
                type: processedData.type || 'text',
                content: processedData.content || '未知错误',
              }
            : message,
        ),
      );
    } catch (error) {
      console.error('Failed to send command:', error);
      setMessages((current) =>
        (current ?? []).map((message) =>
          message.id === requestId
            ? {
                ...message,
                type: 'error',
                content: '发送命令时出错，请稍后重试',
              }
            : message,
        ),
      );
    }
  };

  const handleCopy = async (message: ChatMessage) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const renderMessageBody = (message: ChatMessage) => {
    if (message.type === 'image') {
      return (
        <Attachment orientation="vertical" className="w-56 sm:w-72">
          <AttachmentMedia variant="image" className="w-full">
            <PhotoProvider>
              <PhotoView src={message.content}>
                <Image
                  src={message.content}
                  alt="命令返回图片"
                  width={600}
                  height={800}
                  className="cursor-zoom-in object-cover"
                />
              </PhotoView>
            </PhotoProvider>
          </AttachmentMedia>
        </Attachment>
      );
    }

    if (message.type === 'polish') {
      return <PolishCard content={message.content} />;
    }

    return <BubbleContent className="whitespace-pre-wrap">{message.content}</BubbleContent>;
  };

  const commandList = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <MessageCircleIcon />
        <span className="text-sm font-medium">可用命令</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {commands?.map((command) => (
          <Button
            key={command.key}
            variant="ghost"
            className="h-auto w-full justify-start px-2 py-2.5 text-left"
            disabled={isProcessing}
            onClick={() => {
              handleCommandClick(command);
              setShowCommands(false);
            }}
          >
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="truncate font-medium">{command.key.trim()}</span>
              <span className="w-full whitespace-normal text-xs leading-relaxed text-muted-foreground">
                {command.description}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-49px)] min-h-0 bg-background">
      <aside className="hidden w-72 shrink-0 border-r lg:flex">{commandList}</aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="打开命令列表"
            onClick={() => setShowCommands(true)}
          >
            <MenuIcon />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-medium">命令助手</h1>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="清空消息"
                  disabled={!messages?.length}
                  onClick={clearMessages}
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent>清空消息</TooltipContent>
          </Tooltip>
        </header>

        <div className="min-h-0 flex-1">
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6">
                  {!messages?.length ? (
                    <Empty className="min-h-[50vh]">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageCircleIcon />
                        </EmptyMedia>
                        <EmptyTitle>暂无消息</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    messages.map((message) => (
                      <MessageScrollerItem
                        key={message.id}
                        scrollAnchor={message.role === 'user'}
                      >
                        {message.type === 'status' || message.type === 'error' ? (
                          <Marker className={cn(message.type === 'error' && 'text-destructive')}>
                            <MarkerIcon>
                              {message.type === 'status' ? <Spinner /> : <BotIcon />}
                            </MarkerIcon>
                            <MarkerContent>{message.content}</MarkerContent>
                          </Marker>
                        ) : (
                          <Message align={message.role === 'user' ? 'end' : 'start'}>
                            {message.role === 'assistant' && (
                              <MessageAvatar aria-hidden="true">
                                <BotIcon />
                              </MessageAvatar>
                            )}
                            <MessageContent>
                              <Bubble
                                variant={message.role === 'user' ? 'default' : 'secondary'}
                                align={message.role === 'user' ? 'end' : 'start'}
                                className={cn(
                                  (message.type === 'polish' || message.type === 'image') &&
                                    'max-w-full',
                                )}
                              >
                                {renderMessageBody(message)}
                              </Bubble>
                              {message.type !== 'image' && (
                                <MessageFooter>
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          aria-label="复制消息"
                                          onClick={() => handleCopy(message)}
                                        />
                                      }
                                    >
                                      {copiedId === message.id ? <CheckIcon /> : <CopyIcon />}
                                    </TooltipTrigger>
                                    <TooltipContent>复制</TooltipContent>
                                  </Tooltip>
                                </MessageFooter>
                              )}
                            </MessageContent>
                          </Message>
                        )}
                      </MessageScrollerItem>
                    ))
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        <div className="shrink-0 border-t bg-background px-3 py-3 sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
            <InputGroup className="min-h-12">
              <InputGroupTextarea
                ref={inputRef}
                name="command"
                value={input || ''}
                placeholder="发送命令..."
                rows={1}
                disabled={isProcessing}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  variant="default"
                  aria-label="发送命令"
                  disabled={isProcessing || !input?.trim()}
                >
                  {isProcessing ? <Spinner /> : <SendIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </section>

      <Sheet open={showCommands} onOpenChange={setShowCommands}>
        <SheetContent side="left" className="w-[min(88vw,20rem)] p-0 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>可用命令</SheetTitle>
          </SheetHeader>
          {commandList}
        </SheetContent>
      </Sheet>
    </div>
  );
}
