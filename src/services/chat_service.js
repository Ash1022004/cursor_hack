// frontend/services/chat_service.js
import api from '@/network/core/axiosInstance';

const SESSION_KEY = 'saathi_jwt_session_id';

// Student JWT chat → Convex patient pipeline (anonymousId jwt:userId)
export async function sendAIChat({ message, domain, update_profile }) {
  if (!message || typeof message !== 'string') {
    throw new Error('message is required');
  }
  const sessionId =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(SESSION_KEY)
      : null;
  const body = {
    message,
    domain,
    update_profile,
    ...(sessionId ? { sessionId } : {}),
  };
  const res = await api.post('/api/user/chat/ai', body);
  const data = res.data;
  if (data?.sessionId && typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, data.sessionId);
  }
  return data;
}

// LLM configured on Convex (Gemini / OpenAI)
export async function getChatbotHealth() {
  try {
    const res = await api.get('/api/chatbot/health');
    return Boolean(res?.data?.ok);
  } catch (e) {
    return false;
  }
}
