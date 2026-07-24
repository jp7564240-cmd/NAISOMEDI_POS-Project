export interface Product {
  id: number;
  name: string;
  cat: string;
  price: number;
  currency: string;
  stock: number;
  expiry: string;
  supplier: string;
  image: string;
}

export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface SaleRecord {
  id: number;
  items: CartItem[];
  total: number;
  timestamp: number;
  paymentMethod: string;
}

const KEYS = {
  products: 'naisomedi_products_v3',
  categories: 'naisomedi_categories_v3',
  cart: 'naisomedi_cart_v3',
  sales: 'naisomedi_sales_v3',
  currency: 'naisomedi_currency_v3',
};

const defaultImages = {
  paracetamol: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzI1NWQiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiM2YjIxYTgiIG9wYWNpdHk9IjAuMyIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TWVkaWNpbmU8L3RleHQ+PC9zdmc+',
  vitamin: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyZDRhMjIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiM2OGIzNWEiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Vml0YW1pbjwvdGV4dD48L3N2Zz4=',
  antibiotic: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM3YzJkMTIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiNkNDU3M2EiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QUJYPC90ZXh0Pjwvc3ZnPg==',
  syrup: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM2YjQyMjYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiNkNDc3M2EiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3lydXA8L3RleHQ+PC9zdmc+',
  inhaler: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxZTNhNWEiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiM2YjQ1YjIiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW5oYWxlcjwvdGV4dD48L3N2Zz4=',
  skincare: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM1YjIxNGEiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiNlYzQ4OTkiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2tpbiA8L3RleHQ+PC9zdmc+',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProducts(): Product[] {
  const existing = load<Product[]>(KEYS.products, []);
  if (existing.length > 0) return existing;
  const defaults: Product[] = [];
  save(KEYS.products, defaults);
  return defaults;
}

export function saveProducts(products: Product[]) {
  save(KEYS.products, products);
}

export function addProduct(product: Omit<Product, 'id'>): Product {
  const products = getProducts();
  const newProduct: Product = { ...product, id: Date.now() };
  products.unshift(newProduct);
  saveProducts(products);
  return newProduct;
}

export function deleteProduct(id: number) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

export function updateProduct(id: number, updates: Partial<Product>) {
  const products = getProducts().map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveProducts(products);
}

export function getCategories(): Category[] {
  const existing = load<Category[]>(KEYS.categories, []);
  if (existing.length > 0) return existing;
  const defaults: Category[] = [
    { id: 1, name: 'Prescription Medicines', image: defaultImages.paracetamol },
    { id: 2, name: 'OTC Drugs', image: defaultImages.antibiotic },
    { id: 3, name: 'Vitamins & Supplements', image: defaultImages.vitamin },
    { id: 4, name: 'Baby Care', image: defaultImages.skincare },
    { id: 5, name: 'Skincare & Beauty', image: defaultImages.skincare },
    { id: 6, name: 'Medical Devices', image: defaultImages.inhaler },
    { id: 7, name: 'Cough & Cold', image: defaultImages.syrup },
    { id: 8, name: 'First Aid', image: defaultImages.paracetamol },
  ];
  save(KEYS.categories, defaults);
  return defaults;
}

export function saveCategories(categories: Category[]) {
  save(KEYS.categories, categories);
}

export function addCategory(name: string, image: string): Category {
  const categories = getCategories();
  const newCategory: Category = { id: Date.now(), name, image };
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

export function deleteCategory(id: number) {
  const categories = getCategories().filter((c) => c.id !== id);
  saveCategories(categories);
}

export function getCart(): CartItem[] {
  return load<CartItem[]>(KEYS.cart, []);
}

export function saveCart(cart: CartItem[]) {
  save(KEYS.cart, cart);
}

export function addToCart(product: Product, quantity: number = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 10);
  } else {
    cart.push({ productId: product.id, name: product.name, price: product.price, quantity: Math.min(quantity, 10), image: product.image });
  }
  saveCart(cart);
}

export function updateCartQuantity(productId: number, quantity: number) {
  const cart = getCart().map((item) => (item.productId === productId ? { ...item, quantity: Math.min(Math.max(0, quantity), 10) } : item)).filter((item) => item.quantity > 0);
  saveCart(cart);
}

export function clearCart() {
  save(KEYS.cart, []);
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
}

export function getSales(): SaleRecord[] {
  return load<SaleRecord[]>(KEYS.sales, []);
}

export function saveSales(sales: SaleRecord[]) {
  save(KEYS.sales, sales);
}

export function addSale(items: CartItem[], total: number, paymentMethod: string = 'Cash'): SaleRecord {
  const sales = getSales();
  const sale: SaleRecord = { id: Date.now(), items, total, timestamp: Date.now(), paymentMethod };
  sales.unshift(sale);
  saveSales(sales);
  return sale;
}

export function deleteSale(id: number) {
  const sales = getSales().filter((s) => s.id !== id);
  saveSales(sales);
}

export function getDefaultCurrency(): string {
  return load<string>(KEYS.currency, 'KSH');
}

export function setDefaultCurrency(currency: string) {
  save(KEYS.currency, currency);
}

export function formatPrice(price: number, _currency?: string): string {
  return `KSH ${price.toFixed(2)}`;
}

export function getProductCountInCategory(categoryName: string): number {
  return getProducts().filter((p) => p.cat === categoryName).length;
}

export function syncCategoriesFromProducts() {
  const products = getProducts();
  const existingCats = getCategories();
  const productCats = [...new Set(products.map((p) => p.cat))];
  const newCats = productCats
    .filter((catName) => !existingCats.some((c) => c.name === catName))
    .map((name) => ({ id: Date.now() + Math.random(), name, image: defaultImages.paracetamol }));
  if (newCats.length > 0) {
    saveCategories([...existingCats, ...newCats]);
  }
}

export function dedupeCategoriesFromProducts() {
  const products = getProducts();
  const cats = getCategories();
  const usedNames = new Set(products.map((p) => p.cat));
  const cleaned = cats.filter((c) => usedNames.has(c.name));
  if (cleaned.length !== cats.length) {
    saveCategories(cleaned);
  }
}
