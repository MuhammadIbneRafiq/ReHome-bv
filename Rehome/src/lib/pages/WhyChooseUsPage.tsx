import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FaShieldAlt, FaHandshake, FaTruck, FaUserFriends } from 'react-icons/fa';
import logo from "../../assets/logorehome.jpg"

export default function WhyChooseUsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const reasons = [
        {
            icon: <FaShieldAlt className="h-8 w-8 text-orange-600" />,
            title: t('whyChooseUs.reasons.trust.title'),
            description: t('whyChooseUs.reasons.trust.description'),
        },
        {
            icon: <FaHandshake className="h-8 w-8 text-orange-600" />,
            title: t('whyChooseUs.reasons.service.title'),
            description: t('whyChooseUs.reasons.service.description'),
        },
        {
            icon: <FaTruck className="h-8 w-8 text-orange-600" />,
            title: t('whyChooseUs.reasons.delivery.title'),
            description: t('whyChooseUs.reasons.delivery.description'),
        },
        {
            icon: <FaUserFriends className="h-8 w-8 text-orange-600" />,
            title: t('whyChooseUs.reasons.community.title'),
            description: t('whyChooseUs.reasons.community.description'),
        },
    ];

    const testimonials = [
        {
            name: t('whyChooseUs.testimonials.1.name'),
            role: t('whyChooseUs.testimonials.1.role'),
            content: t('whyChooseUs.testimonials.1.content'),
            rating: 5,
        },
        {
            name: t('whyChooseUs.testimonials.2.name'),
            role: t('whyChooseUs.testimonials.2.role'),
            content: t('whyChooseUs.testimonials.2.content'),
            rating: 5,
        },
        {
            name: t('whyChooseUs.testimonials.3.name'),
            role: t('whyChooseUs.testimonials.3.role'),
            content: t('whyChooseUs.testimonials.3.content'),
            rating: 5,
        },
    ];

    return (
        <div className="min-h-screen bg-orange-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 py-24">
                <div className="container mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        {t('whyChooseUs.hero.title')}
                    </h1>
                    <p className="text-xl md:text-2xl mb-8">
                        {t('whyChooseUs.hero.subtitle')}
                    </p>
                    <Button
                        onClick={() => navigate('/signup')}
                        className="bg-white text-orange-600 hover:bg-orange-100"
                        size="lg"
                    >
                        {t('whyChooseUs.hero.button')}
                    </Button>
                </div>
            </div>

            {/* Reasons Section */}
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        {t('whyChooseUs.reasons.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {reasons.map((reason) => (
                            <Card key={reason.title} className="bg-white shadow-lg">
                                <CardHeader>
                                    <div className="flex justify-center mb-4">
                                        {reason.icon}
                                    </div>
                                    <CardTitle className="text-center">{reason.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 text-center">{reason.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        {t('whyChooseUs.testimonials.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.name} className="bg-orange-50 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className="h-5 w-5 text-yellow-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 15.585l-6.327 3.323 1.209-7.04L.172 7.374l7.046-1.024L10 0l2.782 6.35 7.046 1.024-4.71 4.494 1.209 7.04L10 15.585z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 mb-4">{testimonial.content}</p>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 py-16">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl font-bold mb-6">
                        {t('whyChooseUs.cta.title')}
                    </h2>
                    <p className="text-xl mb-8">
                        {t('whyChooseUs.cta.description')}
                    </p>
                    <Button
                        onClick={() => navigate('/marketplace')}
                        className="bg-white text-orange-600 hover:bg-orange-100"
                        size="lg"
                    >
                        {t('whyChooseUs.cta.button')}
                    </Button>
                </div>
            </div>
        </div>
    );
}