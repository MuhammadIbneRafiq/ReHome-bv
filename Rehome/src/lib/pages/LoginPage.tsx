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
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import ThirdPartyAuth from "../../hooks/ThirdPartyAuth";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(8, "Password are at least 8 characters")
    .max(20, "Password are not longer than 20 characters"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const googleMessage: string = t('auth.login');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://rehome-backend.vercel.app/auth/login",
        values
      );
      const { token } = response.data;
      localStorage.setItem("token", token);
      toast({
        title: t('common.success'),
        description: t('auth.login') + " " + t('common.success'),
      });
      navigate("/");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.dontHaveAccount')}{" "}
            <a
              href="/register"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              {t('auth.createAccount')}
            </a>
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('auth.login')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.email')}</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" {...field} />
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
                      <FormLabel>{t('auth.password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.login')
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
              <div className="mt-6">
                <ThirdPartyAuth message={googleMessage} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
