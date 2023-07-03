import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function logConversation(sessionId: string, role: string, message: string, systemPrompt: string, model: string) {
    await supabase
        .from('user_sessions')
        .insert([
            { 
                session_id: sessionId, 
                role: role, 
                message: message, 
                system_prompt: systemPrompt,
                model: model
            },
        ])
}

export default logConversation;