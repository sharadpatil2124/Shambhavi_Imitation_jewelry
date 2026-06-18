/**
 * SHAMBHAVI IMITATION JEWELRY API REFERENCE & TEST GUIDE
 * 
 * This file lists all the backend REST API endpoints available for the platform.
 * Use these endpoint configurations, request body schemas, and parameters to test in Postman or program clients.
 * 
 * Server Base URL: http://localhost:5000
 */

// =========================================================================
// 1. AUTHENTICATION MODULE (/api/auth)
// =========================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account
 * @access  Public
 * @body    {
 *            "name": "John Doe",
 *            "email": "john@example.com",
 *            "password": "password123",
 *            "phone": "9876543210"
 *          }
 */

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate credentials and obtain JWT Bearer Token
 * @access  Public
 * @body    {
 *            "email": "john@example.com",
 *            "password": "password123"
 *          }
 * @returns Saves JWT token to client (e.g. LocalStorage or Collection variable)
 */

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token
 * @access  Public
 * @body    {
 *            "email": "john@example.com"
 *          }
 */

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using valid cryptographically secure token
 * @access  Public
 * @params  token (Reset token generated via forgot-password route)
 * @body    {
 *            "password": "newSecurePassword123"
 *          }
 */

/**
 * @route   POST /api/auth/logout
 * @desc    Logout customer and clear session token
 * @access  Protected (Requires Bearer token)
 */


// =========================================================================
// 2. PRODUCT MANAGEMENT MODULE (/api/products)
// =========================================================================

/**
 * @route   GET /api/products
 * @desc    Get paginated, searchable, sorted, and filtered catalog products
 * @access  Public
 * @query   page (Number, default: 1)
 *          limit (Number, default: 12)
 *          search (String, matches name/description/SKU)
 *          category (Slug or MongoDB ObjectId)
 *          minPrice (Number)
 *          maxPrice (Number)
 *          rating (Number, min average rating)
 *          sort (String: 'price-asc' | 'price-desc' | 'rating' | 'oldest' | 'createdAt')
 *          isTrending (Boolean: 'true' | 'false')
 *          isNewArrival (Boolean: 'true' | 'false')
 */

/**
 * @route   GET /api/products/:id
 * @desc    Get detailed specifications of a single product
 * @access  Public
 * @params  id (Product MongoDB ObjectId)
 */

/**
 * @route   POST /api/products
 * @desc    Add new product to system (supports multipart image uploads)
 * @access  Protected (Admin Only)
 * @headers Content-Type: multipart/form-data
 * @body    form-data:
 *            name: "Ruby Royal Necklace"
 *            sku: "SKU-RUBY-NECK-001"
 *            category: "category_id_here"
 *            price: 1999
 *            originalPrice: 2999
 *            description: "Exquisite gold-plated traditional necklace set."
 *            details: "Gold Plated,Semi-Precious Rubies,Adjustable Thread" (Comma-separated list or array)
 *            colors: "Ruby Red,Golden" (Comma-separated list or array)
 *            sizes: "Standard" (Comma-separated list or array)
 *            stock: 50
 *            isTrending: "true"
 *            isNewArrival: "true"
 *            images: [Binary files with key name 'images', limit 5]
 */

/**
 * @route   PUT /api/products/:id
 * @desc    Modify details or inventory levels of an existing product
 * @access  Protected (Admin Only)
 * @params  id (Product MongoDB ObjectId)
 * @headers Content-Type: multipart/form-data or application/json
 * @body    Supports partial updates on fields (name, price, stock, images etc.)
 */

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product from collection and restore stock
 * @access  Protected (Admin Only)
 * @params  id (Product MongoDB ObjectId)
 */


// =========================================================================
// 3. CATEGORY MODULE (/api/categories)
// =========================================================================

/**
 * @route   GET /api/categories
 * @desc    Fetch list of all catalog categories
 * @access  Public
 */

/**
 * @route   POST /api/categories
 * @desc    Create new category item with cover graphic
 * @access  Protected (Admin Only)
 * @headers Content-Type: multipart/form-data
 * @body    form-data:
 *            name: "Necklace Sets"
 *            slug: "necklace-sets"
 *            description: "Luxury traditional necklace collection"
 *            image: [Binary file for cover photo]
 */

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category metadata/cover photo
 * @access  Protected (Admin Only)
 * @params  id (Category MongoDB ObjectId)
 */

/**
 * @route   DELETE /api/categories/:id
 * @desc    Remove category
 * @access  Protected (Admin Only)
 * @params  id (Category MongoDB ObjectId)
 */


// =========================================================================
// 4. CART MANAGEMENT MODULE (/api/cart)
// =========================================================================

/**
 * @route   GET /api/cart
 * @desc    Get items inside user's active shopping cart
 * @access  Protected (User)
 */

/**
 * @route   POST /api/cart
 * @desc    Add product item to cart
 * @access  Protected (User)
 * @body    {
 *            "productId": "product_id_here",
 *            "quantity": 1,
 *            "color": "Golden",
 *            "size": "Standard"
 *          }
 */

/**
 * @route   PUT /api/cart
 * @desc    Update quantity of item in cart
 * @access  Protected (User)
 * @body    {
 *            "productId": "product_id_here",
 *            "quantity": 3,
 *            "color": "Golden",
 *            "size": "Standard"
 *          }
 */

/**
 * @route   DELETE /api/cart
 * @desc    Remove item from shopping cart
 * @access  Protected (User)
 * @body    {
 *            "productId": "product_id_here",
 *            "color": "Golden",
 *            "size": "Standard"
 *          }
 */


// =========================================================================
// 5. WISHLIST MODULE (/api/wishlist)
// =========================================================================

/**
 * @route   GET /api/wishlist
 * @desc    Retrieve user's favorite products
 * @access  Protected (User)
 */

/**
 * @route   POST /api/wishlist
 * @desc    Save a product to wishlist
 * @access  Protected (User)
 * @body    {
 *            "productId": "product_id_here"
 *          }
 */

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Protected (User)
 * @params  productId (Product MongoDB ObjectId)
 */


// =========================================================================
// 6. ORDER MODULE (/api/orders)
// =========================================================================

/**
 * @route   POST /api/orders
 * @desc    Place a new checkout order
 * @access  Protected (User)
 * @body    {
 *            "orderItems": [
 *              {
 *                "product": "product_id_here",
 *                "name": "Ruby Royal Necklace",
 *                "quantity": 1,
 *                "price": 1999,
 *                "color": "Golden",
 *                "size": "Standard"
 *              }
 *            ],
 *            "shippingAddress": {
 *              "address": "123 Luxury Street",
 *              "city": "Mumbai",
 *              "postalCode": "400001",
 *              "state": "Maharashtra",
 *              "country": "India"
 *            },
 *            "paymentMethod": "COD", // "COD" or "Razorpay"
 *            "itemsPrice": 1999,
 *            "taxPrice": 180,
 *            "shippingPrice": 100,
 *            "discountPrice": 0,
 *            "totalPrice": 2279,
 *            "razorpayOrderId": "order_xyz", // Optional, required only for online payments
 *            "razorpayPaymentId": "pay_xyz", // Optional, required only for online payments
 *            "razorpaySignature": "sig_xyz"  // Optional, required only for online payments
 *          }
 */

/**
 * @route   GET /api/orders/my-orders
 * @desc    List all orders placed by current logged-in user
 * @access  Protected (User)
 */

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details
 * @access  Protected (User/Admin)
 * @params  id (Order MongoDB ObjectId)
 */

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order and return items to inventory stock levels
 * @access  Protected (User/Admin)
 * @params  id (Order MongoDB ObjectId)
 */

/**
 * @route   GET /api/orders
 * @desc    Retrieve all orders placed across platform
 * @access  Protected (Admin Only)
 */

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order workflow status (e.g. Processing, Dispatched, Delivered)
 * @access  Protected (Admin Only)
 * @params  id (Order MongoDB ObjectId)
 * @body    {
 *            "status": "Dispatched",
 *            "courierName": "BlueDart Express",
 *            "trackingNumber": "BD-987654321"
 *          }
 */

/**
 * @route   PUT /api/orders/:id/refund
 * @desc    Mark a cancelled transaction refund as successful
 * @access  Protected (Admin Only)
 * @params  id (Order MongoDB ObjectId)
 */


// =========================================================================
// 7. PAYMENTS MODULE (/api/payments)
// =========================================================================

/**
 * @route   POST /api/payments/order
 * @desc    Create Razorpay Order ID for client integration
 * @access  Protected (User)
 * @body    {
 *            "amount": 2279
 *          }
 */

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay secure SHA256 payment signature and save details
 * @access  Protected (User)
 * @body    {
 *            "razorpayOrderId": "order_xyz",
 *            "razorpayPaymentId": "pay_xyz",
 *            "razorpaySignature": "generated_signature_here",
 *            "orderId": "local_order_id_here" // Optional, updates database payment status
 *          }
 */


// =========================================================================
// 8. PRODUCT REVIEWS MODULE (/api/reviews)
// =========================================================================

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all reviews and ratings submitted for a specific product
 * @access  Public
 * @params  productId (Product MongoDB ObjectId)
 */

/**
 * @route   POST /api/reviews
 * @desc    Submit a review and rating for a product
 * @access  Protected (User)
 * @body    {
 *            "productId": "product_id_here",
 *            "rating": 5,
 *            "title": "Beautiful piece!",
 *            "comment": "Outstanding design and finish."
 *          }
 */

/**
 * @route   PUT /api/reviews/:id
 * @desc    Edit a previously submitted review
 * @access  Protected (User)
 * @params  id (Review MongoDB ObjectId)
 * @body    {
 *            "rating": 4,
 *            "title": "Beautiful but slightly heavy",
 *            "comment": "Good craftsmanship, but a bit heavy."
 *          }
 */

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Protected (User/Admin)
 * @params  id (Review MongoDB ObjectId)
 */


// =========================================================================
// 9. ADMIN ANALYTICS MODULE (/api/admin)
// =========================================================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard metrics summary
 * @access  Protected (Admin Only)
 */

/**
 * @route   GET /api/admin/sales-report
 * @desc    Generate report parameters for all order sales
 * @access  Protected (Admin Only)
 */

/**
 * @route   GET /api/admin/customers
 * @desc    Get registered customers data metrics
 * @access  Protected (Admin Only)
 */

/**
 * @route   GET /api/admin/revenue-stats
 * @desc    Get sales revenue analytics over time
 * @access  Protected (Admin Only)
 */
