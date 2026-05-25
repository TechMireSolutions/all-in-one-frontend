// frontend/src/Store/contactStore.js
import { create } from "zustand";
import axios from "axios";

// Read API URL dynamically or fallback to localhost
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
const CONTACTS_URL = `${API_BASE}contacts`;

export const useContactStore = create((set, get) => ({
  contacts: [],
  mergeLogs: [],
  loading: false,
  error: null,

  // Fetch all contacts
  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(CONTACTS_URL);
      set({ contacts: res.data, loading: false });
    } catch (err) {
      console.error("Fetch contacts error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch contacts.",
        loading: false,
      });
    }
  },

  // Create a new contact
  createContact: async (formData) => {
    set({ loading: true, error: null });
    try {
      // If formData is not an instance of FormData, we can map it to FormData
      let payload = formData;
      let headers = {};
      
      if (!(formData instanceof FormData)) {
        payload = new FormData();
        Object.keys(formData).forEach((key) => {
          if (["phoneNumbers", "emails", "addresses", "socials"].includes(key)) {
            payload.append(key, JSON.stringify(formData[key]));
          } else if (formData[key] !== undefined && formData[key] !== null) {
            payload.append(key, formData[key]);
          }
        });
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        headers = { "Content-Type": "multipart/form-data" };
      }

      const res = await axios.post(CONTACTS_URL, payload, { headers });
      set((state) => ({
        contacts: [res.data.contact, ...state.contacts],
        loading: false,
      }));
      return { success: true, contact: res.data.contact, suggestions: res.data.suggestions };
    } catch (err) {
      console.error("Create contact error:", err);
      const msg = err.response?.data?.message || "Failed to create contact.";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // Update an existing contact
  updateContact: async (id, formData) => {
    set({ loading: true, error: null });
    try {
      let payload = formData;
      let headers = {};

      if (!(formData instanceof FormData)) {
        payload = new FormData();
        Object.keys(formData).forEach((key) => {
          if (["phoneNumbers", "emails", "addresses", "socials"].includes(key)) {
            payload.append(key, JSON.stringify(formData[key]));
          } else if (formData[key] !== undefined && formData[key] !== null) {
            payload.append(key, formData[key]);
          }
        });
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        headers = { "Content-Type": "multipart/form-data" };
      }

      const res = await axios.put(`${CONTACTS_URL}/${id}`, payload, { headers });
      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? res.data.contact : c)),
        loading: false,
      }));
      return { success: true, contact: res.data.contact, suggestions: res.data.suggestions };
    } catch (err) {
      console.error("Update contact error:", err);
      const msg = err.response?.data?.message || "Failed to update contact.";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // Delete contact by ID
  deleteContact: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${CONTACTS_URL}/${id}`);
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
        loading: false,
      }));
      return true;
    } catch (err) {
      console.error("Delete contact error:", err);
      set({
        error: err.response?.data?.message || "Failed to delete contact.",
        loading: false,
      });
      return false;
    }
  },

  // Fetch duplicates for a contact or full map
  checkDuplicates: async (id = null) => {
    try {
      const url = id ? `${CONTACTS_URL}/duplicates?id=${id}` : `${CONTACTS_URL}/duplicates`;
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      console.error("Check duplicates error:", err);
      return [];
    }
  },

  // Merge contact records
  mergeContacts: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${CONTACTS_URL}/merge`, payload);
      // Remove merged source and update master in list
      set((state) => ({
        contacts: state.contacts
          .filter((c) => c.id !== payload.sourceId)
          .map((c) => (c.id === payload.masterId ? res.data.master : c)),
        loading: false,
      }));
      return { success: true, mergeLog: res.data.mergeLog };
    } catch (err) {
      console.error("Merge error:", err);
      const msg = err.response?.data?.message || "Failed to merge records.";
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  // Undo/Restore a previous merge
  undoMerge: async (logId) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${CONTACTS_URL}/undo`, { logId });
      // Fetch fresh contacts to load both restored contacts
      await get().fetchContacts();
      await get().fetchMergeLogs();
      set({ loading: false });
      return true;
    } catch (err) {
      console.error("Undo merge error:", err);
      set({
        error: err.response?.data?.message || "Failed to reverse merge operation.",
        loading: false,
      });
      return false;
    }
  },

  // Fetch Merge audit logs
  fetchMergeLogs: async () => {
    try {
      const res = await axios.get(`${CONTACTS_URL}/logs`);
      set({ mergeLogs: res.data });
    } catch (err) {
      console.error("Fetch merge logs error:", err);
    }
  },
}));
