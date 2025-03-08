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
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ThirdPartyAuth from "../../hooks/ThirdPartyAuth";

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password cannot be longer than 20 characters"),
  role: z.enum(["buyer", "seller"], {
    errorMap: () => ({ message: "Role is required" }),
  }),
});

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "buyer", // Initialize as buyer
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // setCurrentUser(values);
      // console.log(values);
      await axios.post(
        "https://rehome-backend.vercel.app/auth/signup",
        // "http://localhost:3000/auth/signup",
        {
          email: values.email,
          password: values.password,
          role: values.role,
        }
      );
      // localStorage.setItem('userRole', response.data.role);

      navigate("/chatHome");
      toast({
        title: "Thank you for signing up!",
        description:
          "You've successfully created an account. Now start a chat with our agent and describe your project.",
        variant: "success",
      });
    } catch (error: any) {
      form.setError("root", {
        type: "manual",
        message: error.message,
      });
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-screen flex justify-center items-center space-x-24 dark:bg-black bg-white pt-24 p-4">
      <Card className="max-h-[450px] h-full max-w-[600px] w-full">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl text-center">
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="abc@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.formState.errors.root && (
                  <FormMessage>
                    {form.formState.errors.root.message}
                  </FormMessage>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader className="animate-spin" />
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>
            </form>
            <ThirdPartyAuth googleMessage={"Sign up"}/>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
