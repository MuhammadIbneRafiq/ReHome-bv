import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import ThirdPartyAuth from "../../hooks/ThirdPartyAuth";
// import TestAuth from "../../components/TestAuth";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { apiService } from "../api/apiService";
// import useUserSessionStore from "../../services/state/useUserSessionStore";

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(20, { message: "Password must not exceed 20 characters" }),
});

export default function LoginPage() {
  // const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  // const setUser = useUserSessionStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const googleMessage: string = t('auth.signInWith');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await apiService.login(values.email, values.password);
      
      const { accessToken } = response;
      console.log('Normal login successful, storing access token');
      localStorage.setItem("accessToken", accessToken);
      
      // SIMPLIFIED: Just store the access token - useAuth will handle the rest
      console.log('Access token stored, navigating to dashboard');
      
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.loginSuccess'),
        className: "bg-green-50 border-green-200",
      });
      
      // Force a page reload to trigger authentication check
      window.location.href = "/sell-dash";
    } catch (error: any) {
      console.error("Login error details:", error);
      
      // Extract error message from the API service error
      const errorMsg = error.message || t('auth.loginError');
      setErrorMessage(errorMsg);
      
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: errorMsg,
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
            {t('auth.loginSuccess')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.dontHaveAccount')}{" "}
            <Link
              to="/register"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              {t('auth.createAccount')}
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
            <CardTitle className="text-center text-gray-800">{t('navbar.login')}</CardTitle>
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
                    t('navbar.login')
                  )}
                </Button>
              </form>
            </Form>
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
              <div className="mt-6 space-y-4">
                <ThirdPartyAuth text={googleMessage} />
                {/* <TestAuth /> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
