import * as yup from "yup";

export const signupSchema = yup.object().shape({
  name: yup.string().min(6, "Name shoudl be atleast 6 characters long"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is Required"),
  password: yup.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("password is required"),
});

export const createPostSchema = yup.object().shape({
  content: yup
    .string()
    .min(5, "content should be at least 5 characters long")
    .required("content is required"),
});
