import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.company')}</h3>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="hover:text-orange-400">{t('footer.about')}</Link></li>
                            <li><Link to="/careers" className="hover:text-orange-400">{t('footer.careers')}</Link></li>
                            <li><Link to="/contact" className="hover:text-orange-400">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.services')}</h3>
                        <ul className="space-y-2">
                            <li><Link to="/marketplace" className="hover:text-orange-400">{t('footer.marketplace')}</Link></li>
                            <li><Link to="/item-moving" className="hover:text-orange-400">{t('footer.itemMoving')}</Link></li>
                            <li><Link to="/house-moving" className="hover:text-orange-400">{t('footer.houseMoving')}</Link></li>
                            <li><Link to="/special-request" className="hover:text-orange-400">{t('footer.specialRequest')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">{t('footer.legal')}</h3>
                        <ul className="space-y-2">
                            <li><Link to="/terms" className="hover:text-orange-400">{t('footer.terms')}</Link></li>
                            <li><Link to="/privacy" className="hover:text-orange-400">{t('footer.privacy')}</Link></li>
                            <li><Link to="/cookies" className="hover:text-orange-400">{t('footer.cookies')}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                        <p>Email: info@rehome.nl</p>
                        <p>Phone: +31 6 1234 5678</p>
                        <p>Address: Amsterdam, Netherlands</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                    <p className="text-sm text-gray-400">{t('footer.copyright')}</p>
                </div>
            </div>
        </footer>
    );
} 