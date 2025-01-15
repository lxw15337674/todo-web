'use client';

import axios from 'axios';
import { useState } from 'react';
import Image from 'next/image';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    type: 'text' | 'image';
    content: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            type: 'text',
            content: input.trim()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            // Call command API
            const response = await axios.post('/api/command', {
                command: input.trim(),
            });
            
            // Add AI response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: response.data.type === 'image' ? 'image' : 'text',
                content: response.data.success ? response.data.message : response.data.error || '处理命令时出错'
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.log(error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'text',
                content: '发送命令时出错，请稍后重试'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const renderMessageContent = (message: Message) => {
        if (message.type === 'image') {
            return (
                <Image
                    src={message.content}
                    alt="Command response image"
                    width={300}
                    height={200}
                    className="rounded-lg"
                />
            );
        }
        return <div className="whitespace-pre-wrap">{message.content}</div>;
    };

    return (
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
            <div className="flex-1 space-y-6">
                {messages.map((m: Message) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            m.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                            {renderMessageContent(m)}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md p-2 mb-8">
                <input
                    className="w-full p-2 border border-gray-300 rounded shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    value={input}
                    placeholder="发送消息..."
                    onChange={(e) => setInput(e.target.value)}
                />
            </form>
        </div>
    );
}