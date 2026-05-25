import z from "zod";

export const registerUserSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  registration_date: z.coerce.date().refine((date) => !isNaN(date.getTime()), { message: "Invalid Registration Date" }),
  joining_date: z.coerce.date().refine((date) => !isNaN(date.getTime()), { message: "Invalid Joining Date" }),
  post_applied_for: z.string().min(1, "Post applied for is required"),
  full_name: z.string().min(5, "Full Name must be at least 5 characters"),
  gender: z.string().min(1, "Gender is required"),
  // Accept both formats: "4210112345671" (13 digits) and "42101-1234567-1" (with dashes).
  cnic: z.string().refine((v) => /^\d{13}$/.test(v) || /^\d{5}-\d{7}-\d{1}$/.test(v), {
    message: "CNIC must be 13 digits (with or without dashes)",
  }),
  dob: z.coerce.date().refine((date) => !isNaN(date.getTime()), { message: "Invalid Date of Birth" }),
  permanent_address: z.string().min(12, "Permanent Address must be at least 12 characters"),
  // Accept "03001234567" (11 digits) or "+923001234567" (E.164) or anything with 10-13 digits in it.
  contact_number: z.string().refine((v) => (v || "").replace(/\D/g, "").length >= 10, {
    message: "Contact Number must contain at least 10 digits",
  }),
  email: z.string().email("Invalid email format"),
  image: z.instanceof(File, { message: "Image must be a file" }).optional(),
  // Education fields moved to Contacts page → made optional here.
  degree:    z.string().optional(),
  institute: z.string().optional(),
  grade:     z.string().optional(),
  year:      z.union([z.string(), z.coerce.number()]).optional(),
  current_study: z.string().optional(),
  teaching_subjects: z.string().optional(),
  teaching_institute: z.string().optional(),
  teaching_contact: z.string()
    .optional()
    .refine((val) => !val || (val || "").replace(/\D/g, "").length >= 10, {
      message: "Teaching contact must contain at least 10 digits if provided",
    }),
  position: z.string().optional(),
  organization: z.string().optional(),
  skills: z.string().optional(),
  description: z.string().optional(),
  in_time:  z.string().min(1, "Check-in time is required"),
  out_time: z.string().min(1, "Check-out time is required"),
  Salary_Cap: z.coerce.number()
    .int("Salary Cap must be a whole number (e.g., 50000)")
    .min(0, "Salary Cap must be a positive number")
    .max(2147483647, "Salary Cap must not exceed 2,147,483,647"),
  // New Fields
  guardian_phone: z.string().refine((v) => (v || "").replace(/\D/g, "").length >= 10, {
    message: "Guardian/Alternate Phone must contain at least 10 digits",
  }),
  reference_name: z.string().optional(),
  reference_contact: z.string()
    .optional()
    .refine((val) => !val || (val || "").replace(/\D/g, "").length >= 10, {
      message: "Reference contact must contain at least 10 digits if provided",
    }),
  // Health fields moved to Contacts page → made optional here.
  has_disease:         z.string().optional(),
  disease_description: z.string().optional(),
  record_type:         z.enum(["contact", "employee"]).optional(),
  login_access:        z.boolean().optional(),
});