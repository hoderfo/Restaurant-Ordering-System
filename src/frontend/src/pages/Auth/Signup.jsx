import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    Fingerprint,
    Shield,
    Sparkles,
    User,
    KeyRound,
    Smartphone,
    Globe,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { useAuthStore } from '../../store/useAuthStore';

const Signup = () => {
    const { signup, isLoading } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        signup(formData);
    };

    const handleSocialLogin = (provider) => {
        console.log(`Social login with ${provider}`);
        // Add social login logic here
    };

    const handleForgotPassword = () => {
        console.log('Forgot password clicked');
        // Add forgot password logic here
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-100 dark:from-gray-950 dark:via-gray-900 dark:to-cyan-950/30 transition-colors duration-300">
            {/* Background Patterns */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl dark:bg-cyan-500/10" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl dark:bg-cyan-600/10" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl dark:from-cyan-700/20 dark:to-blue-900/20" />
            </div>

            <div className="relative flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}


                    {/* Main Card */}
                    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-cyan-200/50 dark:border-cyan-800/50 shadow-xl shadow-cyan-500/5">
                        <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">
                                Account Sign Up
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                Enter your credentials to access your dashboard
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-5">
                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                        Full Name
                                    </Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 size-4 transition-colors" />
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Jhon Deo"
                                            className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                        Email Address
                                    </Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 size-4 transition-colors" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                            Password
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                                            onClick={handleForgotPassword}
                                        >
                                            Forgot password?
                                        </Button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 size-4 transition-colors" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Terms */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="rememberMe"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({ ...prev, rememberMe: checked }))
                                            }
                                            className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                        />
                                        <Label
                                            htmlFor="rememberMe"
                                            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            Remember me
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Shield className="size-3" />
                                        <span>Secure login</span>
                                    </div>
                                </div>

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-600/25 hover:shadow-cyan-600/40 transition-all duration-300 group"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            Signing up...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="size-4 mr-2 group-hover:translate-x-1 transition-transform" />
                                            Sign Up to Dashboard
                                        </>
                                    )}
                                </Button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                {/* Social Login */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 border-gray-300 dark:border-gray-700 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30"
                                        onClick={() => handleSocialLogin('google')}
                                    >
                                        <Globe className="size-4 mr-2" />
                                        Google
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 border-gray-300 dark:border-gray-700 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30"
                                        onClick={() => handleSocialLogin('github')}
                                    >
                                        <Smartphone className="size-4 mr-2" />
                                        GitHub
                                    </Button>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col space-y-4 pt-2">
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline-offset-4 hover:underline transition-colors"
                                    >
                                        Login
                                    </Link>
                                </div>

                                {/* Security Note */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/30 rounded-full text-xs text-cyan-700 dark:text-cyan-300">
                                        <Fingerprint className="size-3" />
                                        <span>Your data is encrypted and secure</span>
                                    </div>
                                </div>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Footer Links */}
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <button className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                Privacy Policy
                            </button>
                            <span>•</span>
                            <button className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                Terms of Service
                            </button>
                            <span>•</span>
                            <button className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                Help Center
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            © 2024 Education Platform. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="fixed top-10 left-10 hidden lg:block">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <Sparkles className="size-5 animate-pulse" />
                    <span className="text-sm font-medium">Secure Login</span>
                </div>
            </div>
            <div className="fixed bottom-10 right-10 hidden lg:block">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <KeyRound className="size-5 animate-pulse" />
                    <span className="text-sm font-medium">Encrypted Connection</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;