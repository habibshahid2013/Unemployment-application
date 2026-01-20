import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Job } from './linkedin';

export async function saveApplication(userId: string, formData: Record<string, unknown>) {
  try {
    const response = await fetch('/api/v1/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers: formData })
    });
    
    if (!response.ok) throw new Error('Failed to submit application via API');
    
    const result = await response.json();
    return result; // contains { success: true, id: ... }
  } catch (e) {
    console.error("Error submitting application: ", e);
    return { success: false, error: e };
  }
}

// Chat Functions
interface Message {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: unknown;
    type?: 'text' | 'job-share';
    jobDetails?: Job | null;
}

export function subscribeToMessages(callback: (messages: Message[]) => void) {
  if (!db) return () => {};

  const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[]; 
    
    // Reverse to show chronological (oldest at top of list if UI expects that)
    callback(messages.reverse());
  });
}

export async function sendMessage(userId: string, userName: string, text: string, type: 'text' | 'job-share' = 'text', jobDetails?: Job) {
  if (!db) return;

  try {
    await addDoc(collection(db, 'messages'), {
      userId,
      userName,
      text,
      type,
      jobDetails: jobDetails || null,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Error sending message:", e);
    return false;
  }
}
