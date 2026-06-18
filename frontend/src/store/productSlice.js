import { createSlice } from '@reduxjs/toolkit';

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Royal Kundan Bridal Choker Set",
    category: "Bridal Collection",
    price: 18999,
    originalPrice: 24999,
    discount: 24,
    rating: 4.9,
    reviewsCount: 124,
    images: [
      "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-KUNDAN-09",
    description: "Make your special day unforgettable with our Royal Kundan Bridal Set. Meticulously handcrafted by master artisans, this set features detailed kundan glass work, premium freshwater pearls, and an adjustable gold-dori thread. Set includes a grand choker necklace, matching chandelier earrings, and a traditional maang tikka.",
    colors: ["Classic Gold", "Antique Rose"],
    sizes: ["Adjustable Fit"],
    isTrending: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 12
  },
  {
    id: 2,
    name: "Exquisite Temple Work Kasu Mala",
    category: "Necklaces",
    price: 8499,
    originalPrice: 11999,
    discount: 29,
    rating: 4.8,
    reviewsCount: 88,
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-TEMPLE-88",
    description: "An elegant tribute to traditional temple craftsmanship, this Kasu Mala depicts Goddess Lakshmi seated on a lotus. Plated in rich 22k antique gold, it is perfect for festivals, pujas, and weddings. The necklace exudes a timeless heritage charm.",
    colors: ["Antique Gold"],
    sizes: ["20 Inches", "24 Inches"],
    isTrending: true,
    isFeatured: false,
    isNewArrival: true,
    stock: 8
  },
  {
    id: 3,
    name: "Sparkling AD Diamond Chandelier Earrings",
    category: "Earrings",
    price: 3299,
    originalPrice: 4500,
    discount: 26,
    rating: 4.7,
    reviewsCount: 142,
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-EAR-AD33",
    description: "Sparkle like a diamond in these luxurious American Diamond chandelier earrings. Set in premium silver plating, these long, lightweight earrings capture light brilliantly, making them the ultimate statement piece for cocktail parties and gala receptions.",
    colors: ["Silver-Rhodium", "Rose Gold"],
    sizes: ["One Size"],
    isTrending: false,
    isFeatured: true,
    isNewArrival: true,
    stock: 25
  },
  {
    id: 4,
    name: "Classic 22k Gold Plated Kada Bangles (Set of 2)",
    category: "Bangles",
    price: 4599,
    originalPrice: 6599,
    discount: 30,
    rating: 4.6,
    reviewsCount: 65,
    images: [
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-KADA-102",
    description: "Upgrade your jewelry drawer with this exquisite set of two thick 22k gold plated Kada bangles. Featuring intricate floral carvings and an easy screw-lock system, these bangles pair flawlessly with heavy silk sarees and modern ethnic wear.",
    colors: ["Yellow Gold"],
    sizes: ["2.4", "2.6", "2.8"],
    isTrending: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 18
  },
  {
    id: 5,
    name: "Czarina CZ Solitaire Emerald Ring",
    category: "Rings",
    price: 2499,
    originalPrice: 3999,
    discount: 37,
    rating: 4.9,
    reviewsCount: 97,
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-RING-CZ4",
    description: "Express your royal elegance with this breath-taking emerald cocktail ring. Centered around a premium lab-created oval emerald surrounded by brilliant-cut cubic zirconia, this ring is finished in 18k yellow gold plating and is adjustable for standard sizing.",
    colors: ["Emerald Green", "Royal Ruby"],
    sizes: ["Adjustable"],
    isTrending: false,
    isFeatured: false,
    isNewArrival: true,
    stock: 30
  },
  {
    id: 6,
    name: "Sublime Pearl & Kemp Stone Haram",
    category: "Necklaces",
    price: 7999,
    originalPrice: 9999,
    discount: 20,
    rating: 4.8,
    reviewsCount: 52,
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-HARAM-45",
    description: "A gorgeous, long haram style necklace embedded with premium red and green Kemp stones, bordered by clusters of high-quality synthetic seed pearls. This stunning necklace comes with a pair of matching jhumka earrings to complete the traditional south-Indian ensemble.",
    colors: ["Ruby Red", "Heritage Multi-color"],
    sizes: ["Standard Long"],
    isTrending: true,
    isFeatured: false,
    isNewArrival: false,
    stock: 7
  },
  {
    id: 7,
    name: "Classic Jhumka Earrings with Ear Chains",
    category: "Earrings",
    price: 2999,
    originalPrice: 4200,
    discount: 28,
    rating: 4.7,
    reviewsCount: 76,
    images: [
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-JHUM-71",
    description: "Capture vintage grace with these gorgeous bell jhumkas that come complete with multi-layered pearl side-swept ear chains (matti). Plated in matte antique gold and decorated with floral patterns, they are a show-stopper for wedding parties.",
    colors: ["Matte Gold"],
    sizes: ["Standard"],
    isTrending: false,
    isFeatured: true,
    isNewArrival: false,
    stock: 14
  },
  {
    id: 8,
    name: "Delicate Gold-Plated CZ Anklets (Payal)",
    category: "Bangles",
    price: 1999,
    originalPrice: 2999,
    discount: 33,
    rating: 4.5,
    reviewsCount: 45,
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop"
    ],
    sku: "SBI-PAYAL-09",
    description: "Elegant, fluid anklets embellished with sparkling starburst cubic zirconia. Features a durable S-hook closure and customizable links. Beautifully subtle and resonant with every step you take.",
    colors: ["Yellow Gold", "Silver Plated"],
    sizes: ["10 Inches"],
    isTrending: false,
    isFeatured: false,
    isNewArrival: true,
    stock: 22
  }
];

const initialState = {
  items: MOCK_PRODUCTS,
  filteredItems: MOCK_PRODUCTS,
  categories: ["All", "Bridal Collection", "Necklaces", "Earrings", "Bangles", "Rings"],
  selectedCategory: "All",
  searchTerm: "",
  sortBy: "featured", // "featured", "price-low-high", "price-high-low", "rating"
  priceRange: { min: 0, max: 25000 },
  selectedPriceRange: { min: 0, max: 25000 },
  selectedProduct: null
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.filteredItems = applyFilters(state);
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.filteredItems = applyFilters(state);
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
      state.filteredItems = applyFilters(state);
    },
    setSelectedPriceRange: (state, action) => {
      state.selectedPriceRange = action.payload;
      state.filteredItems = applyFilters(state);
    },
    resetFilters: (state) => {
      state.selectedCategory = "All";
      state.searchTerm = "";
      state.sortBy = "featured";
      state.selectedPriceRange = { min: 0, max: 25000 };
      state.filteredItems = state.items;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = state.items.find(item => item.id === action.payload) || null;
    }
  }
});

function applyFilters(state) {
  let tempItems = [...state.items];

  // Category Filter
  if (state.selectedCategory && state.selectedCategory !== "All") {
    tempItems = tempItems.filter(item => item.category === state.selectedCategory);
  }

  // Search Filter
  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    tempItems = tempItems.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  }

  // Price Filter
  tempItems = tempItems.filter(item => 
    item.price >= state.selectedPriceRange.min && item.price <= state.selectedPriceRange.max
  );

  // Sorting
  if (state.sortBy === "price-low-high") {
    tempItems.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === "price-high-low") {
    tempItems.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === "rating") {
    tempItems.sort((a, b) => b.rating - a.rating);
  } else {
    // featured: custom sorting putting featured/trending first
    tempItems.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  return tempItems;
}

export const { 
  setSearchTerm, 
  setSelectedCategory, 
  setSortBy, 
  setSelectedPriceRange, 
  resetFilters, 
  setSelectedProduct 
} = productSlice.actions;

export default productSlice.reducer;
