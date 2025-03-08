import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FaUsers, FaLeaf, FaHandshake, FaGlobe } from 'react-icons/fa';

export default function AboutUsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const values = [
    {
      icon: <FaUsers className="h-8 w-8 text-orange-600" />,
      title: t('aboutUs.values.community.title'),
      description: t('aboutUs.values.community.description'),
    },
    {
      icon: <FaLeaf className="h-8 w-8 text-orange-600" />,
      title: t('aboutUs.values.sustainability.title'),
      description: t('aboutUs.values.sustainability.description'),
    },
    {
      icon: <FaHandshake className="h-8 w-8 text-orange-600" />,
      title: t('aboutUs.values.trust.title'),
      description: t('aboutUs.values.trust.description'),
    },
    {
      icon: <FaGlobe className="h-8 w-8 text-orange-600" />,
      title: t('aboutUs.values.impact.title'),
      description: t('aboutUs.values.impact.description'),
    },
  ];

  const stats = [
    {
      value: '10,000+',
      label: t('aboutUs.stats.users'),
    },
    {
      value: '5,000+',
      label: t('aboutUs.stats.items'),
    },
    {
      value: '1,000+',
      label: t('aboutUs.stats.moves'),
    },
    {
      value: '95%',
      label: t('aboutUs.stats.satisfaction'),
    },
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-24">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('aboutUs.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            {t('aboutUs.hero.subtitle')}
          </p>
          <Button
            onClick={() => navigate('/contact')}
            className="bg-white text-orange-600 hover:bg-orange-100"
            size="lg"
          >
            {t('aboutUs.hero.button')}
          </Button>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              {t('aboutUs.mission.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('aboutUs.mission.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('aboutUs.values.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <Card key={value.title} className="bg-orange-50 shadow-lg">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-center">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            {t('aboutUs.cta.title')}
          </h2>
          <p className="text-xl mb-8">
            {t('aboutUs.cta.description')}
          </p>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-white text-orange-600 hover:bg-orange-100"
            size="lg"
          >
            {t('aboutUs.cta.button')}
          </Button>
        </div>
      </div>
    </div>
  );
}