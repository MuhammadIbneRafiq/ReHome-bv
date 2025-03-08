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
import { FaEnvelope, FaLock, FaUserAlt } from "react-icons/fa";

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(20, { message: "Password must not exceed 20 characters" }),
  role: z.enum(["buyer", "seller"], {
    errorMap: () => ({ message: "Role is required" }),
  }),
});

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
      role: "buyer", // Initialize as buyer
    },
  });

  const googleMessage: string = t('auth.createAccount');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      await axios.post(
        "https://rehome-backend.vercel.app/auth/signup",
        {
          email: values.email,
          password: values.password,
          role: values.role,
        }
      );

      toast({
        title: t('auth.signupSuccess'),
        description: t('common.success'),
        className: "bg-green-50 border-green-200",
      });
      
      // Redirect to login page after successful signup
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Extract error message from response if available
      const errorMsg = error.response?.data?.message || t('auth.signupError');
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <FaUserAlt className="mr-2 text-orange-500" /> {t('auth.role')}
                      </FormLabel>
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="buyer"
                            value="buyer"
                            checked={field.value === "buyer"}
                            onChange={() => form.setValue("role", "buyer")}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                          />
                          <label htmlFor="buyer" className="ml-2 block text-sm text-gray-700">
                            {t('auth.buyer')}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="seller"
                            value="seller"
                            checked={field.value === "seller"}
                            onChange={() => form.setValue("role", "seller")}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                          />
                          <label htmlFor="seller" className="ml-2 block text-sm text-gray-700">
                            {t('auth.seller')}
                          </label>
                        </div>
                      </div>
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
                  <ThirdPartyAuth message={googleMessage} />
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
