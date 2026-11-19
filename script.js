
let products = [];
let cart = JSON.parse(localStorage.getItem("atelierCart")) || [];
let wishlist = JSON.parse(localStorage.getItem("atelierWishlist")) || [];
let productSectionPosition = 0;

const productContainer = document.getElementById("products");

// Escape text before displaying it in HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Fetch products from Supabase
async function loadProducts() {
    productContainer.innerHTML = "<p>Loading ATELIER products...</p>";

    const { data, error } = await supabaseClient
        .from("atelier_products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Products loading error:", error);
        productContainer.innerHTML =
            "<p>Could not load products. Please try again later.</p>";
        return;
    }

    products = data || [];
    displayProducts();
}

// Display products
function displayProducts(category = "all") {
    let filteredProducts = products;

    if (category !== "all") {
        filteredProducts = products.filter(product =>
            product.category?.toLowerCase() === category.toLowerCase()
        );
    }

    if (filteredProducts.length === 0) {
        productContainer.innerHTML = "<p>No products found.</p>";
        return;
    }

    productContainer.innerHTML = filteredProducts.map(product => `
        <div class="product">

            <button class="wishlist-heart"
                onclick="toggleWishlist(${product.id})">
                ${wishlist.some(item => item.id === product.id) ? "♥" : "♡"}
            </button>

            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                onclick="openProduct(${product.id})"
            >

            <h3 onclick="openProduct(${product.id})">
                ${escapeHTML(product.name)}
            </h3>

            <p>₹${Number(product.price).toLocaleString("en-IN")}</p>

            <button onclick="openProduct(${product.id})">
                VIEW PRODUCT
            </button>

        </div>
    `).join("");
}

// Add product to cart
function addToCart(id, size = "One Size") {
    const product = products.find(item => item.id === id);

    if (!product) return;

    const existing = cart.find(
        item => item.id === id && item.size === size
    );

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            ...product,
            size: size,
            quantity: 1
        });
    }

    updateCart();
}

// Change cart quantity
function changeQuantity(id, size, amount) {
    const item = cart.find(
        item => item.id === id && item.size === size
    );

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        cart = cart.filter(
            product => !(product.id === id && product.size === size)
        );
    }

    updateCart();
}

// Remove cart item
function removeItem(id, size) {
    cart = cart.filter(
        item => !(item.id === id && item.size === size)
    );

    updateCart();
}

// Update shopping bag
function updateCart() {
    localStorage.setItem("atelierCart", JSON.stringify(cart));

    const count = cart.reduce(
        (total, item) => total + item.quantity, 0
    );

    document.getElementById("cartCount").textContent = count;

    document.getElementById("cartItems").innerHTML =
    document.getElementById("cartItems").innerHTML = cart.length === 0
    ? `
        <div class="empty-cart">
            <p class="empty-cart-brand">ATELIER</p>
            <h3>Your bag is waiting.</h3>
            <p>Discover pieces that define your style.</p>
            <button onclick="closeCartPanel(); document.getElementById('products').scrollIntoView({ behavior: 'smooth' });">
                CONTINUE SHOPPING ↗
            </button>
        </div>
    `
    : cart.map(item => `
        <div class="cart-item">
            <img
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.name)}"
                style="width:80px;height:100px;object-fit:cover;"
            >

            <p>${escapeHTML(item.name)}</p>
            <p>Size: ${escapeHTML(item.size || "One Size")}</p>
            <p>₹${Number(item.price).toLocaleString("en-IN")}</p>

            <div class="quantity-controls">
                <button onclick="changeQuantity(${item.id}, '${escapeHTML(item.size || "One Size")}', -1)">−</button>

                <span>${item.quantity}</span>

                <button onclick="changeQuantity(${item.id}, '${escapeHTML(item.size || "One Size")}', 1)">+</button>
            </div>

            <button onclick="removeItem(${item.id}, '${escapeHTML(item.size || "One Size")}')">
                REMOVE
            </button>
        </div>
    `).join("");

    const total = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity, 0
    );

    document.getElementById("total").textContent =
        total.toLocaleString("en-IN");
}

// Shopping bag open and close
// CREATE CART BACKDROP
let cartBackdrop = document.querySelector(".cart-backdrop");

if (!cartBackdrop) {
    cartBackdrop = document.createElement("div");
    cartBackdrop.className = "cart-backdrop";
    document.body.appendChild(cartBackdrop);
}

// OPEN CART
document.getElementById("cartBtn").onclick = () => {
    document.getElementById("cartPanel").classList.add("open");
    cartBackdrop.classList.add("show");
    document.body.style.overflow = "hidden";
};

// CLOSE CART
function closeCartPanel() {
    document.getElementById("cartPanel").classList.remove("open");
    cartBackdrop.classList.remove("show");
    document.body.style.overflow = "";
}

document.getElementById("closeCart").onclick = closeCartPanel;

// CLOSE WHEN BACKDROP IS CLICKED
cartBackdrop.onclick = closeCartPanel;

// CLOSE WHEN ESCAPE IS PRESSED
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCartPanel();
    }
});

// Mobile navigation
document.getElementById("menuBtn").onclick = () => {
    document.getElementById("navigation").classList.toggle("show");
};

// Category filtering
document.querySelectorAll("#navigation a[data-category]").forEach(link => {
    link.addEventListener("click", function() {
        const category = this.dataset.category;

        displayProducts(category);

        document.getElementById("products").scrollIntoView({
            behavior: "smooth"
        });

        document.getElementById("navigation").classList.remove("show");
    });
});

// Search products
// ATELIER SEARCH

const searchBtn = document.getElementById("searchBtn");
const searchOverlay = document.getElementById("searchOverlay");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchHint = document.getElementById("searchHint");

// Open search
searchBtn.addEventListener("click", () => {
    searchOverlay.style.display = "block";

    requestAnimationFrame(() => {
        searchOverlay.classList.add("search-visible");
    });

    document.body.style.overflow = "hidden";
    searchInput.focus();
});

// Close search
function closeSearchOverlay() {
    searchOverlay.classList.remove("search-visible");

    setTimeout(() => {
        searchOverlay.style.display = "none";
    }, 300);

    document.body.style.overflow = "";
}

closeSearch.addEventListener("click", closeSearchOverlay);

// Search products as customer types
searchInput.addEventListener("input", () => {

    const term = searchInput.value.trim().toLowerCase();

    if (!term) {
        searchResults.innerHTML = "";
        searchHint.textContent = "DISCOVER THE ATELIER COLLECTION";
        return;
    }

    const matching = products.filter(product =>
        String(product.name || "").toLowerCase().includes(term) ||
        String(product.category || "").toLowerCase().includes(term)
    );

    if (matching.length === 0) {
        searchHint.textContent = "NO RESULTS FOUND";
        searchResults.innerHTML = "<p>No products found.</p>";
        return;
    }
    
    searchHint.textContent =
        matching.length + (matching.length === 1
            ? " PRODUCT FOUND"
            : " PRODUCTS FOUND");

    searchResults.innerHTML = matching.map(product => `
        <div class="product">

            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                data-product-id="${escapeHTML(product.id)}"
            >

            <h3>${escapeHTML(product.name)}</h3>

            <p>₹${Number(product.price).toLocaleString("en-IN")}</p>

            <button data-product-id="${escapeHTML(product.id)}">
                VIEW PRODUCT
            </button>

        </div>
    `).join("");
});

// Open selected product
searchResults.addEventListener("click", event => {

    const target = event.target.closest("[data-product-id]");

    if (!target) return;

    const productId = target.dataset.productId;

    const product = products.find(item =>
        String(item.id) === productId
    );

    if (!product) return;

    closeSearchOverlay();
    openProduct(product.id);
});

// Close search with Escape key
document.addEventListener("keydown", event => {

    if (
        event.key === "/" &&
        searchOverlay.style.display !== "block" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
    ) {
        event.preventDefault();
        searchBtn.click();
    }

    if (
        event.key === "Escape" &&
        searchOverlay.style.display === "block"
    ) {
        closeSearchOverlay();
    }
});

// Newsletter
document.getElementById("newsletterForm").onsubmit = (event) => {
    event.preventDefault();
    alert("Thank you for subscribing to ATELIER!");
    event.target.reset();
};

// Product details
let selectedProduct = null;
let selectedSize = "";


function openProduct(id) {
    selectedProduct = products.find(product => product.id === id);

    if (!selectedProduct) return;
    productSectionPosition = document.getElementById("products").getBoundingClientRect().top + window.scrollY;

    selectedSize = "";

    const mainImage = document.getElementById("detailImage");
    mainImage.classList.remove("image-loaded");

    const additionalImages = Array.isArray(selectedProduct.additional_images)
        ? selectedProduct.additional_images
        : [];

    const allImages = [
        selectedProduct.image,
        ...additionalImages
    ].filter(Boolean);

    mainImage.alt = selectedProduct.name;

    mainImage.onload = function() {
        mainImage.classList.add("image-loaded");
    };

    mainImage.src = selectedProduct.image;

    document.getElementById("detailName").textContent =
        selectedProduct.name;

    document.getElementById("detailPrice").textContent =
        "₹" + Number(selectedProduct.price).toLocaleString("en-IN");

    document.getElementById("detailCategory").textContent =
        selectedProduct.category || "";

    document.getElementById("detailDescription").textContent =
        selectedProduct.description || "A timeless addition to your wardrobe.";

    
    selectedSize = "";

    document.querySelectorAll(".sizes button").forEach(button => {
        const size = button.dataset.size || button.textContent.trim().split(" ")[0];
        const stock = Number(selectedProduct.stock?.[size] ?? 0);
        
        button.dataset.size = size;
        button.classList.remove("active");
        button.disabled = stock <= 0;
        
        button.textContent = stock <= 0
            ? size + " - SOLD OUT"
            : size;
    });    

    // Create clickable image thumbnails
    document.getElementById("detailThumbnails").innerHTML =
        allImages.map((image, index) => `
            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(selectedProduct.name)} view ${index + 1}"
                class="${index === 0 ? "active-thumbnail" : ""}"
                onclick="changeDetailImage('${escapeHTML(image)}', this)"
            >
        `).join("");

    document.querySelectorAll(".sizes button").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById("products").style.display = "none";
    document.getElementById("productDetails").style.display = "block";

    window.scrollTo({
        top: document.getElementById("products").getBoundingClientRect().top + window.scrollY,
        behavior: "smooth"
    });
}

// Switch the main product image
function changeDetailImage(image, thumbnail) {
    document.getElementById("detailImage").src = image;

    document.querySelectorAll(".detail-thumbnails img").forEach(img => {
        img.classList.remove("active-thumbnail");
    });

    thumbnail.classList.add("active-thumbnail");
}


function closeProduct() {
    document.getElementById("productDetails").style.display = "none";
    document.getElementById("products").style.display = "grid";

    window.scrollTo({
        top: productSectionPosition,
        behavior: "smooth"
    });
}

// Select size
function selectSize(size, button) {
    if (!selectedProduct) return;

    const availableStock = Number(selectedProduct.stock?.[size] ?? 0);

    if (availableStock <= 0) {
        alert("Sorry, this size is sold out!");
        return;
    }

    selectedSize = size;

    document.querySelectorAll(".sizes button").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");
}

// Add selected product to bag
function addSelectedProductToCart() {
    if (!selectedProduct) return;

    if (!selectedSize) {
        alert("Please select a size first!");
        return;
    }

    const availableStock = Number(selectedProduct.stock?.[selectedSize] ?? 0);

    if (availableStock <= 0) {
        alert("Sorry, this size is sold out!");
        return;
    }

    const existingItem = cart.find(item =>
        item.id === selectedProduct.id && item.size === selectedSize
    );

    const quantityInCart = existingItem ? existingItem.quantity : 0;

    if (quantityInCart >= availableStock) {
        alert("Sorry, you cannot add more than the available stock.");
        return;
    }

    addToCart(selectedProduct.id, selectedSize);

    showBagNotification("Added to bag · Size " + selectedSize);
}

// Checkout
document.getElementById("checkout").onclick = () => {
    if (cart.length === 0) {
        alert("Your shopping bag is empty!");
        return;
    }

    window.location.href = "checkout.html";
};

// Initial setup
updateCart();
loadProducts();


// Update wishlist count
function updateWishlistCount() {
    document.getElementById("wishlistCount").textContent =
        wishlist.length;
}

// Add or remove product from wishlist
function toggleWishlist(id) {
    const existing = wishlist.find(item => item.id === id);

    if (existing) {
        wishlist = wishlist.filter(item => item.id !== id);
    } else {
        const product = products.find(item => item.id === id);

        if (!product) return;

        wishlist.push(product);
    }

    localStorage.setItem(
        "atelierWishlist",
        JSON.stringify(wishlist)
    );

    updateWishlistCount();
    displayProducts();
}

// Display saved products
function displayWishlist() {
    const wishlistContainer =
        document.getElementById("wishlistProducts");

    if (wishlist.length === 0) {
        wishlistContainer.innerHTML =
            "<p>Your wishlist is empty.</p>";
        return;
    }

    wishlistContainer.innerHTML = wishlist.map(product => `
        <div class="product">

            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
            >

            <h3>${escapeHTML(product.name)}</h3>

            <p>₹${Number(product.price).toLocaleString("en-IN")}</p>

            <button onclick="openProduct(${product.id})">
                VIEW PRODUCT
            </button>

            <button onclick="toggleWishlist(${product.id})">
                REMOVE ♥
            </button>

        </div>
    `).join("");
}

// Open wishlist
document.getElementById("wishlistBtn").onclick = () => {
    document.getElementById("products").style.display = "none";
    document.getElementById("productDetails").style.display = "none";
    document.getElementById("wishlistSection").style.display = "block";

    displayWishlist();

    // Automatically scroll to wishlist
    document.getElementById("wishlistSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
};

// Return to shop
function closeWishlist() {
    document.getElementById("wishlistSection").style.display = "none";
    document.getElementById("products").style.display = "grid";

    displayProducts();
    window.scrollTo(0, 0);
}

// Initialize wishlist count
updateWishlistCount();


function openSizeGuide() {
    document.getElementById("sizeGuideModal").style.display = "flex";
}

function closeSizeGuide() {
    document.getElementById("sizeGuideModal").style.display = "none";
}

function showBagNotification(message) {
    let notification = document.getElementById("bagNotification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "bagNotification";
        notification.className = "bag-notification";
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.classList.add("show");

    clearTimeout(window.bagNotificationTimer);

    window.bagNotificationTimer = setTimeout(() => {
        notification.classList.remove("show");
    }, 2500);
}
