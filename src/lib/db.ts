import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export async function saveApplication(userId: string, formData: any) {
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
export function subscribeToMessages(callback: (messages: any[]) => void) {
  if (!db) return () => {};

  const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Show oldest first in chat UI usually, or usually newest at bottom. 
                   // If we fetch desc (newest first), reversing makes them chronological (oldest top).
    callback(messages);
  });
}

export async function sendMessage(userId: string, userName: string, text: string, type: 'text' | 'job-share' = 'text', jobDetails?: any) {
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
