import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

import { chatState } from "../../Context/ChatProvider";
import api from "../../config/api";
import Loader from "../Loader";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser } = chatState();
  const toast = useToast();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: yup.object({
      email: yup
        .string()
        .email("Must be a valid email address")
        .required("Email is required"),
      password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);

      try {
        const { data } = await api.post("/users/login", {
          email: values.email,
          password: values.password,
        });

        toast({
          title: "Login Successful",
          description: data.message || "Welcome back!",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });

        // 1. Save to localStorage
        localStorage.setItem("userInfo", JSON.stringify(data));

        // 2. Sync to Context State
        if (setUser) setUser(data);

        // 3. Navigate to chat dashboard
        navigate("/dashboard", { replace: true });
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred. Please try again.";

        toast({
          title: "Login Failed",
          description: errorMessage,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "bottom",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <>
      {isLoading && <Loader />}

      <form onSubmit={formik.handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* Email Field */}
          <FormControl
            id="login-email"
            isRequired
            isInvalid={formik.touched.email && Boolean(formik.errors.email)}
          >
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
          </FormControl>

          {/* Password Field */}
          <FormControl
            id="login-password"
            isRequired
            isInvalid={
              formik.touched.password && Boolean(formik.errors.password)
            }
          >
            <FormLabel>Password</FormLabel>
            <InputGroup size="md">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <InputRightElement width="4.5rem">
                <Button
                  h="1.75rem"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
          </FormControl>

          {/* Submit Button */}
          <Button
            type="submit"
            colorScheme="teal"
            width="100%"
            mt={2}
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Login
          </Button>
        </VStack>
      </form>
    </>
  );
};

export default Login;
