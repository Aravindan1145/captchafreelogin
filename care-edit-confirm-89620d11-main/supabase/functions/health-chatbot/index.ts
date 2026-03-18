import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  patientName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, patientName }: ChatRequest = await req.json();

    console.log('Health chatbot request received:', { messageCount: messages.length, patientName });

    const systemPrompt = `You are a helpful and compassionate healthcare assistant chatbot for the Health Record Management System. Your name is HealthBot.

Your role is to:
- Help patients understand their health conditions and medical terminology
- Provide general health information and wellness tips
- Explain common symptoms and when to seek medical attention
- Guide patients on how to use the health management system
- Offer emotional support and reassurance
- Remind patients about the importance of following their doctor's advice

Important guidelines:
- Never provide specific medical diagnoses or prescriptions
- Always recommend consulting with a healthcare professional for serious concerns
- Be empathetic, patient, and use simple language
- If asked about emergencies, advise calling emergency services immediately
- Respect patient privacy and don't ask for sensitive personal information

${patientName ? `You are currently assisting patient: ${patientName}. Address them by name occasionally to make the conversation more personal.` : ''}

Keep responses concise but helpful. Use bullet points when listing information.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    console.log('Health chatbot response generated');

    return new Response(JSON.stringify({ 
      success: true,
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in health-chatbot function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
