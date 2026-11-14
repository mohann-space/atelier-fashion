
let products = [];
let cart = JSON.parse(localStorage.getItem("atelierCart")) || [];
let wishlist = JSON.parse(localStorage.getItem("atelierWishlist")) || [];

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
        cart.map(item => `
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
document.getElementById("cartBtn").onclick = () => {
    document.getElementById("cartPanel").classList.add("open");
};

document.getElementById("closeCart").onclick = () => {
    document.getElementById("cartPanel").classList.remove("open");
};

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
document.getElementById("searchBtn").onclick = () => {
    const term = prompt("What are you looking for?");

    if (!term) return;

    const matching = products.filter(product =>
        product.name.toLowerCase().includes(term.toLowerCase())
    );

    if (matching.length === 0) {
        productContainer.innerHTML = "<p>No products found.</p>";
        return;
    }

    productContainer.innerHTML = matching.map(product => `
        <div class="product">
            <img
                src="${escapeHTML(product.image)}"
                alt="${escapeHTML(product.name)}"
                onclick="openProduct(${product.id})"
            >

            <h3>${escapeHTML(product.name)}</h3>

            <p>₹${Number(product.price).toLocaleString("en-IN")}</p>

            <button onclick="openProduct(${product.id})">
                VIEW PRODUCT
            </button>
        </div>
    `).join("");
};

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

    selectedSize = "";

    const mainImage = document.getElementById("detailImage");

    const additionalImages = Array.isArray(selectedProduct.additional_images)
        ? selectedProduct.additional_images
        : [];

    const allImages = [
        selectedProduct.image,
        ...additionalImages
    ].filter(Boolean);

    mainImage.src = selectedProduct.image;
    mainImage.alt = selectedProduct.name;

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
        const size = button.textContent.trim().split(" ")[0];
        const stock = Number(selectedProduct.stock?.[size] ?? 0);
    
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

    window.scrollTo(0, 0);
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

    window.scrollTo(0, 0);
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

    alert("Added to bag! Size: " + selectedSize);
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

