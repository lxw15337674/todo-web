'use client';

import axios from 'axios';
import { useRef, useEffect } from 'react';
import { useSessionStorageState } from 'ahooks';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    type: 'text' | 'image';
    content: string;
}

interface Command {
    key: string;
    description: string;
    type?: 'text' | 'image';
}

const STORAGE_KEY = 'chat_messages';

export default function Chat() {
    const [messages, setMessages] = useSessionStorageState<Message[]>(STORAGE_KEY, {
        defaultValue: []
    });
    const [input, setInput] = useSessionStorageState<string>('chat_input', {
        defaultValue: ''
    });
    const [commands, setCommands] = useSessionStorageState<Command[]>('commands', {
        defaultValue: []
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showCommands, setShowCommands] = useSessionStorageState<boolean>('show_commands', {
        defaultValue: false
    });

    // 获取命令列表
    useEffect(() => {
        const fetchCommands = async () => {
            try {
                const response = await axios.get('/api/command');
                if (response.data.success) {
                    setCommands(response.data.commands);
                }
            } catch (error) {
                console.error('Failed to fetch commands:', error);
            }
        };
        fetchCommands();
    }, [setCommands]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const clearMessages = () => {
        setMessages([]);
    };

    const handleCommandClick = (command: Command) => {
        // 如果命令需要参数，就把命令填入输入框
        if (command.key.endsWith(' ')) {
            setInput(command.key);
        } else {
            // 否则直接执行命令
            handleSubmit(undefined, command.key);
        }
    };

    const handleSubmit = async (e?: React.FormEvent, commandOverride?: string) => {
        if (e) e.preventDefault();
        const commandText = commandOverride || input?.trim();
        if (!commandText) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            type: 'text',
            content: commandText
        };
        
        setMessages((prev: Message[] = []) => [...prev, userMessage]);
        if (!commandOverride) setInput('');

        try {
            // Call command API
            const messageId = Date.now() + 1;
            setMessages((prev: Message[] = []) => [...prev, {
                id: messageId.toString(),
                role: 'assistant',
                type: 'text',
                content: '处理中...'
            }]);

            const response = await axios.post('/api/command', {
                command: commandText,
            });
            
            // Update AI response
            setMessages((prev: Message[] = []) => prev.map(msg => 
                msg.id === messageId.toString() ? {
                    id: messageId.toString(),
                    role: 'assistant',
                    type: response.data.type === 'image' ? 'image' : 'text',
                    content: response.data.success ? response.data.message : response.data.error || '处理命令时出错'
                } : msg
            ));
        } catch (error) {
            console.log(error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'text',
                content: '发送命令时出错，请稍后重试'
            };
            setMessages((prev: Message[] = []) => [...prev, errorMessage]);
        }
    };

    const renderMessageContent = (message: Message) => {
        if (message.type === 'image') {
            return (
                <PhotoProvider>
                    <PhotoView src={message.content}>
                        <Image
                            src={message.content}
                            alt="Command response image"
                            width={600}
                            height={800}
                            className="rounded-lg cursor-zoom-in"
                        />
                    </PhotoView>
                </PhotoProvider>
            );
        }
        return <div className="whitespace-pre-wrap">{message.content}</div>;
    };

    return (
        <div className="h-[calc(100vh-56px)] flex bg-background">
            {/* 左侧命令列表 - 在小屏幕上隐藏 */}
            <Card className="hidden md:block w-64 lg:w-80 border-r rounded-none shrink-0">
                <div className="p-4 font-semibold flex items-center gap-2 h-14 border-b">
                    <MessageCircle className="w-4 h-4" />
                    可用命令
                </div>
                <ScrollArea className="h-[calc(100%-56px)]">
                    <div className="space-y-1 p-2">
                        {commands?.map((command) => (
                            <Button
                                key={command.key}
                                variant="ghost"
                                className="w-full justify-start h-auto flex-col items-start gap-1 py-3"
                                onClick={() => handleCommandClick(command)}
                            >
                                <div className="font-medium">{command.key.trim()}</div>
                                <div className="text-xs text-muted-foreground">{command.description}</div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* 右侧聊天区域 */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 border-b flex items-center justify-between px-4">
                    {/* 小屏幕下的命令按钮 */}
                    <div className="md:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCommands(prev => !prev)}
                        >
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearMessages}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        清空消息
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="space-y-4 p-4 max-w-3xl mx-auto">
                        {messages?.map((m: Message) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <Card className={`px-4 py-2 max-w-[80%] sm:max-w-[70%] ${
                                    m.role === 'user' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted'
                                }`}>
                                    {renderMessageContent(m)}
                                </Card>
                            </div>
                        ))}
                    </div>
                    <div ref={messagesEndRef} className="h-4" />
                </ScrollArea>

                <div className="border-t bg-background">
                    <div className="max-w-3xl mx-auto p-4">
                        <form onSubmit={handleSubmit} className="relative">
                            <Input
                                value={input || ''}
                                placeholder="发送消息..."
                                onChange={(e) => setInput(e.target.value)}
                                className="pr-20"
                            />
                        </form>
                    </div>
                </div>
            </div>

            {/* 小屏幕下的命令抽屉 */}
            {showCommands && (
                <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
                    <div className="fixed inset-y-0 left-0 w-80 bg-background border-r">
                        <div className="p-4 font-semibold flex items-center justify-between h-14 border-b">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                可用命令
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCommands(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <ScrollArea className="h-[calc(100%-56px)]">
                            <div className="p-2 space-y-1">
                                {commands?.map((command) => (
                                    <Button
                                        key={command.key}
                                        variant="ghost"
                                        className="w-full justify-start h-auto flex-col items-start gap-1 py-3"
                                        onClick={() => {
                                            handleCommandClick(command);
                                            setShowCommands(false);
                                        }}
                                    >
                                        <div className="font-medium">{command.key.trim()}</div>
                                        <div className="text-xs text-muted-foreground">{command.description}</div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </div>
    );
}