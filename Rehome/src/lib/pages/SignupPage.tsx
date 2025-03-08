import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
// import { Icons } from "../components/ui/icons";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader } from "lucide-react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ThirdPartyAuth from "../../hooks/ThirdPartyAuth";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { AxiosResponse } from "axios";

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(20, { message: "Password must not exceed 20 characters" }),
});

// Add this function before onSubmit
const axiosWithRetry = async (url: string, data: any, retries = 3, timeout = 10000): Promise<AxiosResponse> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, data, { timeout });
    } catch (error: any) {
      if (i === retries - 1) throw error;
      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('All retries failed');
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const googleMessage: string = t('auth.createAccount');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await axiosWithRetry(
        "http://localhost:3000/auth/signup",
        {
          email: values.email,
          password: values.password,
        }
      );

      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        
        toast({
          title: "Welcome to ReHome!",
          description: "Account created successfully. You are now logged in.",
          className: "bg-green-50 border-green-200",
          duration: 3000,
        });
        
        navigate("/sell-dash");
      } else {
        toast({
          title: "Account Created",
          description: "Please log in with your credentials.",
          className: "bg-green-50 border-green-200",
          duration: 3000,
        });
        
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMsg = t('auth.signupError');
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        errorMsg = "Server is taking too long to respond. Please try again.";
      } else if (error.response?.status === 400) {
        errorMsg = error.response.data?.error || "Invalid signup data";
      } else if (error.response?.status === 409) {
        errorMsg = "Email already exists. Please use a different email.";
      } else if (error.response?.status === 500) {
        errorMsg = error.response.data?.error || "Server error. Please try again later.";
      } else if (!error.response && error.message === 'Network Error') {
        errorMsg = "Unable to connect to the server. Please check your internet connection.";
      }
      
      setErrorMessage(errorMsg);
      
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {t('auth.createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link
              to="/login"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              {t('auth.login')}
            </Link>
          </p>
        </div>
        
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{errorMessage}</span>
          </motion.div>
        )}
        
        <Card className="shadow-lg border-orange-100">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
            <CardTitle className="text-center text-gray-800">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.enterEmailBelow')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <FaEnvelope className="mr-2 text-orange-500" /> {t('auth.email')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="example@example.com" 
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <FaLock className="mr-2 text-orange-500" /> {t('auth.password')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.createAccount')
                  )}
                </Button>
              </form>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">
                      {t('auth.or')}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <ThirdPartyAuth text={googleMessage} />
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

