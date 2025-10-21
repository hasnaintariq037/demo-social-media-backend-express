import * as yup from "yup";

export const signupSchema = yup.object().shape({
  name: yup.string().min(6, "Name shoudl be atleast 6 characters long"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is Required"),
  password: yup.string().min(6, "Password must be at least 6 characters"),
});
