import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FurnitureItem } from '../../types/furniture';
import { categories } from '../../services/marketplace';
import { API_ENDPOINTS } from '../../lib/api/config';
import logoImage from "../../assets/logorehome.png";
import AddToCartButton from './AddToCartButton';
import LazyImage from '../ui/LazyImage';

interface FeaturedItemsProps {
  maxItems?: number;
}

// Helper function to get the first valid image URL
const getFirstImageUrl = (item: FurnitureItem): string => {
  if (item.image_url && item.image_url.length > 0) return item.image_url[0];
  if (item.image_urls && item.image_urls.length > 0) return item.image_urls[0];
  return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
};

const FeaturedItems: React.FC<FeaturedItemsProps> = ({ maxItems = 3 }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [allItems, setAllItems] = useState<FurnitureItem[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [showMoreItems, setShowMoreItems] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch furniture items from API
  useEffect(() => {
    const fetchFurnitureItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.FURNITURE.LIST}?limit=50`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        
        // Handle both old format (array) and new format (object with data and pagination)
        let data: FurnitureItem[];
        if (Array.isArray(responseData)) {
          data = responseData;
        } else {
          data = responseData.data || [];
        }
        
        // Ensure proper field mapping for isrehome
        const mappedData = data.map(item => ({
          ...item,
          isrehome: item.isrehome ?? (item as any).is_rehome ?? false
        }));
        
        setAllItems(mappedData);
      } catch (err: any) {
        console.error('Error fetching furniture items:', err);
        setError('Failed to load featured items');
        // Fallback to empty array on error
        setAllItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFurnitureItems();
  }, []);

  // Filter and select featured items when allItems or filters change
  useEffect(() => {
    if (allItems.length === 0) {
      setItems([]);
      return;
    }

    // Filter out excluded categories and sold items
    const availableItems = allItems.filter(item => 
      !excludedCategories.includes(item.category || '') && !item.sold
    );
    
    // Group items by category
    const itemsByCategory: Record<string, FurnitureItem[]> = {};
    availableItems.forEach(item => {
      if (item.category) {
        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
      }
    });
    
    // Try to get an even distribution from each category
    const result: FurnitureItem[] = [];
    const categoriesArray = Object.keys(itemsByCategory);
    const count = showMoreItems ? 10 : maxItems;
    
    // First, get at least one item from each available category
    for (const category of categoriesArray) {
      if (itemsByCategory[category].length > 0) {
        // Get a random item from this category
        const randomIndex = Math.floor(Math.random() * itemsByCategory[category].length);
        result.push(itemsByCategory[category][randomIndex]);
        
        // Remove the selected item to avoid duplicates
        itemsByCategory[category].splice(randomIndex, 1);
        
        // Stop if we've reached the desired count
        if (result.length >= count) {
          break;
        }
      }
    }
    
    // If we still need more items, continue picking randomly from remaining items
    let remainingSlots = count - result.length;
    if (remainingSlots > 0) {
      // Create a flat array of all remaining items
      const remainingItems = categoriesArray.flatMap(category => itemsByCategory[category]);
      
      // Shuffle the remaining items
      for (let i = remainingItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
      }
      
      // Add as many as needed
      result.push(...remainingItems.slice(0, remainingSlots));
    }
    
    setItems(result);
  }, [allItems, excludedCategories, maxItems, showMoreItems]);

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

  if (loading) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('homepage.featuredItems')}
            </h2>
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('homepage.featuredItems')}
            </h2>
            <div className="mt-8 text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              No featured items available at the moment.
            </div>
          ) : (
            items.map((item) => (
              <Link key={item.id} to={`/marketplace`} className="block bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full overflow-hidden">
                  {/* ReHome logo badge for ReHome items */}
                  {item.isrehome && (
                    <img 
                      src={logoImage} 
                      alt="ReHome Verified" 
                      className="absolute top-2 left-2 z-10 w-8 h-8 object-contain m-0 p-0"
                      style={{display: 'block'}}
                      loading="eager"
                    />
                  )}
                  <LazyImage
                    src={getFirstImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    priority={false}
                    quality={75}
                  />
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.category} • {item.subcategory}</p>
                    </div>
                    <p className="text-lg font-semibold text-orange-600">
                      {item.price === 0 ? 'Free' : `€${item.price}`}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{item.city_name}</span>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <div className="mt-4">
                    <AddToCartButton item={item} buttonType="secondary" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-12 text-center">
          {!showMoreItems && items.length > 0 && (
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