
'use server';
/**
 * @fileOverview Service functions for form interactions with Firestore.
 *
 * - saveForm(userId, formData) - Saves a new form to Firestore.
 * - getForm(formId) - Retrieves a form by its ID from Firestore.
 * - getFormsByUser(userId) - Retrieves all forms for a given user.
 * - deleteForm(formId, userId) - Deletes a form if the user is the owner.
 * - updateForm(formId, userId, formData) - Updates an existing form.
 * - saveFormResponse(formId, responseData) - Saves a public form submission.
 * - getTotalSubmissionsForUser(userId) - Gets total submissions for a user's forms.
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

// Interface for data going to/coming from Firestore
export interface FormSchemaForFirestore {
  id?: string; // Firestore document ID, added after retrieval
  userId: string;
  title: string;
  questions: Question[];
  createdAt: Timestamp; // Always Timestamp when dealing with Firestore directly
  publishedLinkPath?: string;
  backgroundImageUrl?: string | null; // Allow null
}

// Interface for form data when used in components, createdAt might be string
export interface FormSchemaWithId extends FormSchemaForFirestore {
  id: string;
  createdAt: Timestamp | string; // Allow string for display purposes after conversion
}

export interface FormResponseData {
  responseData: Record<string, any>;
  submittedAt: Timestamp;
}


export async function saveForm(userId: string, formData: { title: string; questions: Question[]; backgroundImageUrl?: string; }): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'forms'), {
      userId,
      title: formData.title,
      questions: formData.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() }))
      })),
      backgroundImageUrl: formData.backgroundImageUrl || null,
      createdAt: serverTimestamp(),
    });
    console.log('Form saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving form: ', error);
    throw new Error('Failed to save form.');
  }
}

export async function getForm(formId: string): Promise<FormSchemaForFirestore | null> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (formDocSnap.exists()) {
      return { id: formDocSnap.id, ...formDocSnap.data() } as FormSchemaForFirestore;
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
    querySnapshot.forEach((doc) => {
      forms.push({ id: doc.id, ...doc.data() } as FormSchemaWithId);
    });
    return forms;
  } catch (error) {
    console.error('Error fetching forms by user (UID:', userId, '):', error);
    if (error instanceof Error && (error.message.includes('indexes?create_composite=') || error.message.toLowerCase().includes('index'))) {
        console.error("Firestore indexing issue suspected. Please check the Firebase console for index creation prompts related to the 'forms' collection, filtering by 'userId' and ordering by 'createdAt'. The original error from Firestore is: ", (error as any)?.cause || error);
    }
    throw new Error(`Failed to fetch forms. Original error: ${(error as Error).message}`);
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

export async function updateForm(formId: string, userId: string, formData: { title: string; questions: Question[]; backgroundImageUrl?: string | null; }): Promise<void> {
  try {
    const formDocRef = doc(db, 'forms', formId);
    const formDocSnap = await getDoc(formDocRef);

    if (!formDocSnap.exists()) {
      throw new Error('Form not found.');
    }

    const existingFormData = formDocSnap.data() as FormSchemaForFirestore;
    if (existingFormData.userId !== userId) {
      throw new Error('User not authorized to update this form.');
    }

    await updateDoc(formDocRef, {
      title: formData.title,
      questions: formData.questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        options: q.options?.map(opt => ({ ...opt, id: opt.id || crypto.randomUUID() }))
      })),
      backgroundImageUrl: formData.backgroundImageUrl === undefined ? null : formData.backgroundImageUrl, 
      updatedAt: serverTimestamp() // Good practice to add an updatedAt timestamp
    });
    console.log('Form updated successfully: ', formId);
  } catch (error) {
    console.error('Error updating form: ', formId, error);
     if (error instanceof Error && (error.message === 'Form not found.' || error.message === 'User not authorized to update this form.')) {
      throw error;
    }
    throw new Error('Failed to update form.');
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
    // Don't throw an error that breaks the dashboard, just return 0 or current count
    // Or rethrow if this data is critical and should halt rendering
    // For now, return the count accumulated so far or 0 if it's early in the process
    return totalSubmissions > 0 ? totalSubmissions : 0; 
  }
}
