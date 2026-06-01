// Loads + caches a form's sections + fields (by id or by public slug).
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export function useFormSchema({ id, slug } = {}) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id && !slug) return;
    let cancel = false;
    const url = id ? `${API}registration/forms/${id}` : `${API}registration/public/forms/${slug}`;
    setLoading(true);
    axios.get(url)
      .then((r) => { if (!cancel) setForm(r.data); })
      .catch((e) => { if (!cancel) setError(e?.response?.data?.message || e.message); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [id, slug]);

  return { form, loading, error, reload: () => setForm({ ...form }) };
}
