import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FurnitureItem } from '../../types/furniture';
import { getFeaturedItems, categories } from '../../services/marketplace';
import logoImage from "../../assets/logorehome.jpg";
import AddToCartButton from './AddToCartButton';

interface FeaturedItemsProps {
  maxItems?: number;
}

const FeaturedItems: React.FC<FeaturedItemsProps> = ({ maxItems = 3 }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [showMoreItems, setShowMoreItems] = useState(false);

  // Load items on component mount or when excluded categories change
  useEffect(() => {
    // Get items considering the max count and excluded categories
    const count = showMoreItems ? 10 : maxItems;
    setItems(getFeaturedItems(count, excludedCategories));
  }, [excludedCategories, maxItems, showMoreItems]);

  // Toggle category exclusion
  const toggleCategoryExclusion = (category: string) => {
    setExcludedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Generate a className for category filter buttons
  const getCategoryButtonClass = (category: string) => {
    return `px-3 py-1 rounded-full text-sm font-medium ${
      excludedCategories.includes(category)
        ? 'bg-gray-200 text-gray-500'
        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    }`;
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('homepage.featuredItems')}
          </h2>
          
          {/* Category filters */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">
              Filter:
            </span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategoryExclusion(category)}
                className={getCategoryButtonClass(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full overflow-hidden">
                {/* ReHome logo badge for ReHome items */}
                {item.isrehome && (
                  <div className="absolute top-2 left-2 z-10 bg-white p-1 rounded-md shadow-md">
                    <img 
                      src={logoImage} 
                      alt="ReHome Verified" 
                      className="w-8 h-8 object-contain" 
                    />
                  </div>
                )}
                <img
                  src={item.image_url[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.category} • {item.subcategory}</p>
                  </div>
                  <p className="text-lg font-semibold text-orange-600">€{item.price}</p>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/marketplace`}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    {t('marketplace.viewDetails')} &rarr;
                  </Link>
                  <span className="text-xs text-gray-500">{item.city_name}</span>
                </div>
                
                {/* Add to Cart Button */}
                <div className="mt-4">
                  <AddToCartButton item={item} buttonType="secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          {!showMoreItems && (
            <button
              onClick={() => setShowMoreItems(true)}
              className="mr-4 inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50"
            >
              See More Items
            </button>
          )}
          <Link
            to="/marketplace"
            className="inline-block rehome-button"
          >
            {t('homepage.viewAll')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedItems; 