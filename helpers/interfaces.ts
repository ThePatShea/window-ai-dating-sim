interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export type { Message };