
'use server';
/**
 * @fileOverview Service functions for form interactions with Firestore.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  updateDoc,
  orderBy,
  getCountFromServer
} from 'firebase/firestore';
import type { Question } from '@/app/forms/create/page';

export type NotificationDestination = "none" | "email" | "discord";

// Added 'updatedAt' as optional for Firestore updates
export interface FormSchemaForFirestore {
  id?: string;
  userId: string;
  title: string;
  questions: Question[];
  createdAt: Timestamp;
  updatedAt?: Timestamp; // For tracking updates
  publishedLinkPath?: string;
  backgroundImageUrl?: string | null;
  notificationDestination?: NotificationDestination;
  receiverEmail?: string | null;
  discordWebhookUrl?: string | null;
}

export interface FormSchemaWithId extends Omit<FormSchemaForFirestore, 'createdAt' | 'questions' | 'updatedAt'> {
  id: string;
  questions: Question[];
  createdAt: string; // Converted to ISO string for client
  updatedAt?: string; // Converted to ISO string for client
  notificationDestination: NotificationDestination;
  receiverEmail?: string | null;
  discordWebhookUrl?: string | null;
}


export interface FormResponseData {
  responseData: Record<string, any>;
  submittedAt: Timestamp;
}


export async function saveForm(
  userId: string,
  formData: {
    title: string;
    questions: Question[];
    backgroundImageUrl?: string | null; 
    notificationDestination?: NotificationDestination;
    receiverEmail?: string | null; 
    discordWebhookUrl?: string | null; 
  }
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is missing, cannot save form.');
  }
  if (!formData || typeof formData.title === 'undefined' || formData.title.trim() === "") {
     throw new Error('Form data or title is missing/empty, cannot save form.');
  }
  
  try {
    const dataToSave: Omit<FormSchemaForFirestore, 'id' | 'publishedLinkPath'> = {
      userId,
      title: formData.title,
      questions: formData.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() })) || [],
      })),
      backgroundImageUrl: formData.backgroundImageUrl === undefined ? null : formData.backgroundImageUrl,
      notificationDestination: formData.notificationDestination || "none",
      receiverEmail: formData.notificationDestination === "email" ? (formData.receiverEmail || null) : null,
      discordWebhookUrl: formData.notificationDestination === "discord" ? (formData.discordWebhookUrl || null) : null,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'forms'), dataToSave);
    console.log('Form saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving form to Firestore:', error);
    let errorMessage = 'Unknown error while saving form.';
    if (error instanceof Error) {
        errorMessage = error.message;
        if ((error as any).code) {
            errorMessage += ` (Firestore code: ${(error as any).code})`;
        }
    }
    throw new Error(`Failed to save form: ${errorMessage}`);
  }
}

export async function getForm(formId: string): Promise<FormSchemaForFirestore | null> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (formDocSnap.exists()) {
      const data = formDocSnap.data();
      // Ensure questions and options have IDs if they are missing (older data migration)
      const questions = (data.questions || []).map((q: any) => ({
        id: q.id || crypto.randomUUID(),
        text: q.text || '',
        type: q.type || 'text',
        isRequired: q.isRequired || false,
        options: (q.options || []).map((opt: any) => ({
          id: opt.id || crypto.randomUUID(),
          value: opt.value || '',
        })),
      }));

      return {
        id: formDocSnap.id,
        ...data,
        questions: questions, // Use processed questions
        notificationDestination: data.notificationDestination || "none",
        receiverEmail: data.receiverEmail || null, 
        discordWebhookUrl: data.discordWebhookUrl || null, 
      } as FormSchemaForFirestore;
    } else {
      console.log('No such document for formId:', formId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching form by ID:', formId, error);
    throw new Error('Failed to fetch form.');
  }
}

export async function getFormsByUser(userId: string): Promise<FormSchemaWithId[]> {
  try {
    const formsCollectionRef = collection(db, 'forms');
    const q = query(formsCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const forms: FormSchemaWithId[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as FormSchemaForFirestore;
      forms.push({
        ...data,
        id: docSnap.id,
        questions: (data.questions || []).map((q: any) => ({
            id: q.id || crypto.randomUUID(),
            text: q.text || '',
            type: q.type || 'text',
            isRequired: q.isRequired || false,
            options: (q.options || []).map((opt: any) => ({
            id: opt.id || crypto.randomUUID(),
            value: opt.value || '',
            })),
        })),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt ? String(data.updatedAt) : undefined),
        notificationDestination: data.notificationDestination || "none",
        receiverEmail: data.receiverEmail || null,
        discordWebhookUrl: data.discordWebhookUrl || null,
      });
    });
    return forms;
  } catch (error) {
    console.error('Error fetching forms by user (UID:', userId, '):', error);
    const originalError = error instanceof Error ? error.message : String(error);
    if (originalError.includes('indexes?create_composite=') || originalError.toLowerCase().includes('index')) {
        console.error("Firestore indexing issue suspected. Please check the Firebase console for index creation prompts related to the 'forms' collection, filtering by 'userId' and ordering by 'createdAt'. The original error from Firestore is: ", (error as any)?.cause || error);
         throw new Error(`Failed to fetch forms. Original error: ${originalError} This often indicates a missing Firestore index. Please check your server console logs (where 'npm run dev' is running) for a detailed error message from Firestore, which may include a link to create the required index.`);
    }
    throw new Error(`Failed to fetch forms. Original error: ${originalError}`);
  }
}

export async function deleteForm(formId: string, userId: string): Promise<void> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (!formDocSnap.exists()) {
      throw new Error('Form not found.');
    }

    const formData = formDocSnap.data() as FormSchemaForFirestore;
    if (formData.userId !== userId) {
      throw new Error('User not authorized to delete this form.');
    }

    await deleteDoc(formDocRef);
    console.log('Form deleted successfully: ', formId);
  } catch (error) {
    console.error('Error deleting form: ', formId, error);
    if (error instanceof Error && (error.message === 'Form not found.' || error.message === 'User not authorized to delete this form.')) {
      throw error;
    }
    throw new Error('Failed to delete form.');
  }
}

export async function updateForm(
    formId: string,
    userId: string,
    formData: {
        title: string;
        questions: Question[];
        backgroundImageUrl?: string | null;
        notificationDestination?: NotificationDestination;
        receiverEmail?: string | null;
        discordWebhookUrl?: string | null;
    }
): Promise<void> {
  console.log('[updateForm] Received request to update form. FormID:', formId, 'UserID:', userId);
  console.log('[updateForm] FormData received:', JSON.stringify(formData, null, 2));
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (!formDocSnap.exists()) {
      console.error('[updateForm] Form not found with ID:', formId);
      throw new Error('Form not found.');
    }

    const existingFormData = formDocSnap.data() as FormSchemaForFirestore;
    if (existingFormData.userId !== userId) {
      console.error('[updateForm] User not authorized. Form UserID:', existingFormData.userId, 'Attempted UserID:', userId);
      throw new Error('User not authorized to update this form.');
    }

    const updateData: Partial<FormSchemaForFirestore> = {
        title: formData.title,
        questions: formData.questions.map(q => ({
            ...q,
            id: q.id || crypto.randomUUID(),
            options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() })) || []
        })),
        backgroundImageUrl: formData.backgroundImageUrl === undefined ? existingFormData.backgroundImageUrl : formData.backgroundImageUrl,
        notificationDestination: formData.notificationDestination || existingFormData.notificationDestination || "none",
        updatedAt: serverTimestamp() as Timestamp
    };

    if (formData.notificationDestination === "email") {
        updateData.receiverEmail = formData.receiverEmail || null;
        updateData.discordWebhookUrl = null;
    } else if (formData.notificationDestination === "discord") {
        updateData.discordWebhookUrl = formData.discordWebhookUrl || null;
        updateData.receiverEmail = null;
    } else if (formData.notificationDestination === "none") {
        updateData.receiverEmail = null;
        updateData.discordWebhookUrl = null;
    } else { 
        updateData.receiverEmail = existingFormData.receiverEmail !== undefined ? existingFormData.receiverEmail : null;
        updateData.discordWebhookUrl = existingFormData.discordWebhookUrl !== undefined ? existingFormData.discordWebhookUrl : null;
    }

    console.log('[updateForm] Data being written to Firestore for update:', JSON.stringify(updateData, null, 2));
    await updateDoc(formDocRef, updateData);
    console.log('[updateForm] Form updated successfully: ', formId);
  } catch (error) {
    console.error('[updateForm] Error updating form. FormID:', formId, 'Raw error object:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error while updating form.';
     if (error instanceof Error && (error.message === 'Form not found.' || error.message === 'User not authorized to update this form.')) {
      throw error;
    }
    throw new Error(`Failed to update form: ${errorMessage}`);
  }
}

export async function saveFormResponse(formId: string, responseData: Record<string, any>): Promise<string> {
  try {
    const responsesCollectionRef = collection(db, 'forms', formId, 'responses');
    const docRef = await addDoc(responsesCollectionRef, {
      responseData,
      submittedAt: serverTimestamp(),
    });
    console.log('Form response saved with ID: ', docRef.id, 'for formId:', formId);
    return docRef.id;
  } catch (error) {
    console.error('Error saving form response for formId:', formId, error);
    throw new Error('Failed to save form response.');
  }
}

export async function getTotalSubmissionsForUser(userId: string): Promise<number> {
  let totalSubmissions = 0;
  try {
    const userForms = await getFormsByUser(userId);
    if (userForms.length === 0) {
      return 0;
    }

    const submissionCountPromises = userForms.map(form => {
      const responsesCollectionRef = collection(db, 'forms', form.id, 'responses');
      return getCountFromServer(responsesCollectionRef).then(snapshot => snapshot.data().count);
    });

    const counts = await Promise.all(submissionCountPromises);
    totalSubmissions = counts.reduce((sum, count) => sum + count, 0);

    return totalSubmissions;
  } catch (error) {
    console.error('Error getting total submissions for user:', userId, error);
    return totalSubmissions > 0 ? totalSubmissions : 0;
  }
}

    
