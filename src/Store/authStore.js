import { create } from 'zustand';
import axios from 'axios';

// Load initial state from sessionStorage to persist across page reloads (clears when tab/browser is closed)
const savedUser = JSON.parse(sessionStorage.getItem('tms_user') || 'null');
const savedRole = sessionStorage.getItem('tms_role') || null;

export const useAuthStore = create((set) => ({
  user: savedUser,
  role: savedRole,
  loading: false,
  error: null,

  login: async (emailOrStakeholder, passwordOrCredentials) => {
    set({ loading: true, error: null });
    try {
      let payload = {};
      const isOldFormat = typeof emailOrStakeholder === 'string' && ['employee', 'ojt', 'student', 'hr', 'superadmin'].includes(emailOrStakeholder.toLowerCase());

      if (isOldFormat) {
        payload = {
          stakeholder: emailOrStakeholder,
          ...passwordOrCredentials
        };
      } else {
        payload = {
          email: emailOrStakeholder,
          password: passwordOrCredentials
        };
      }

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}auth/login`, payload);

      const resolvedRole = response.data.user?.role;
      const emailCnicRoles = ['employee', 'ojt', 'student'];
      const userData = emailCnicRoles.includes(resolvedRole)
          ? {
              ...response.data.user,
              id: response.data.user.id,
              employee_id: response.data.user.employee_id,
              registration_date: response.data.user.registration_date,
              joining_date: response.data.user.joining_date,
              post_applied_for: response.data.user.post_applied_for,
              full_name: response.data.user.full_name,
              gender: response.data.user.gender,
              cnic: response.data.user.cnic,
              dob: response.data.user.dob,
              permanent_address: response.data.user.permanent_address,
              contact_number: response.data.user.contact_number,
              email: response.data.user.email,
              degree: response.data.user.degree,
              institute: response.data.user.institute,
              grade: response.data.user.grade,
              year: response.data.user.year,
              current_study: response.data.user.current_study,
              teaching_subjects: response.data.user.teaching_subjects,
              teaching_institute: response.data.user.teaching_institute,
              teaching_contact: response.data.user.teaching_contact,
              position: response.data.user.position,
              organization: response.data.user.organization,
              skills: response.data.user.skills,
              description: response.data.user.description,
              in_time: response.data.user.in_time,
              out_time: response.data.user.out_time,
              Salary_Cap: response.data.user.Salary_Cap,
              role: response.data.user.role,
              image: response.data.user.image,
              guardian_phone: response.data.user.guardian_phone,
              reference_name: response.data.user.reference_name,
              reference_contact: response.data.user.reference_contact,
              has_disease: response.data.user.has_disease,
              disease_description: response.data.user.disease_description,
            }
          : resolvedRole === 'hr' || resolvedRole === 'role'
          ? {
              role: resolvedRole,
              email: response.data.user.email,
              allowedPages: response.data.user.allowedPages ?? null,
              customRole: response.data.user.customRole || null,
            }
          : { role: 'superadmin' }; // Super Admin

      // Ensure allowedPages flows through for non-hr/non-superadmin users too
      if (resolvedRole && resolvedRole !== 'superadmin' && userData && userData.allowedPages === undefined) {
        userData.allowedPages = response.data.user.allowedPages ?? null;
      }

      set({
        user: userData,
        role: resolvedRole,
        loading: false,
      });
      // Save session in sessionStorage
      sessionStorage.setItem('tms_user', JSON.stringify(userData));
      sessionStorage.setItem('tms_role', resolvedRole);
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      set({ error: error.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  logout: () => {
    sessionStorage.removeItem('tms_user');
    sessionStorage.removeItem('tms_role');
    set({ user: null, role: null, error: null });
  },
}));