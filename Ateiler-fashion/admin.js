
const productForm = document.getElementById("productForm");
const adminProducts = document.getElementById("adminProducts");

let products = [];
let editingProductId = null;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Load products from Supabase
async function loadProducts() {
    adminProducts.innerHTML = "<p>Loading products...</p>";

    const { data, error } = await supabaseClient
        .from("atelier_products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Product loading error:", error);
        adminProducts.innerHTML = "<p>Could not load products.</p>";
        return;
    }

    products = data || [];
    displayAdminProducts();
}

// Display products
function displayAdminProducts() {
    if (products.length === 0) {
        adminProducts.innerHTML = "<p>No products added yet.</p>";
        return;
    }

    adminProducts.innerHTML = products.map(product => `
        <div class="admin-product">
            <h3>${escapeHTML(product.name)}</h3>

            <p>Price: ₹${Number(product.price).toLocaleString("en-IN")}</p>

            <p>
               ** INVENTORY **
            </p>

            <p><strong>INVENTORY</strong></p>

            <p>
                S: ${product.stock?.S ?? 0}
                ${Number(product.stock?.S ?? 0) === 0
                    ? "— SOLD OUT"
                    : Number(product.stock?.S ?? 0) <= 2
                    ? "— LOW STOCK"
                    : ""}
            </p>

            <p>
                M: ${product.stock?.M ?? 0}
                ${Number(product.stock?.M ?? 0) === 0
                    ? "— SOLD OUT"
                    : Number(product.stock?.M ?? 0) <= 2
                    ? "— LOW STOCK"
                    : ""}
            </p>

            <p>
                L: ${product.stock?.L ?? 0}
                ${Number(product.stock?.L ?? 0) === 0
                    ? "— SOLD OUT"
                    : Number(product.stock?.L ?? 0) <= 2
                    ? "— LOW STOCK"
                    : ""}
            </p>

            <p>
                XL: ${product.stock?.XL ?? 0}
                ${Number(product.stock?.XL ?? 0) === 0
                    ? "— SOLD OUT"
                    : Number(product.stock?.XL ?? 0) <= 2
                    ? "— LOW STOCK"
                    : ""}
            </p>

            <p>Category: ${escapeHTML(product.category)}</p>

            <button onclick="editProduct(${product.id})">
                EDIT PRODUCT
            </button>

            <button onclick="deleteProduct(${product.id})">
                DELETE
            </button>
        </div>
    `).join("");
}

// Cancel editing button
let cancelButton = document.getElementById("cancelEdit");

if (!cancelButton) {
    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.id = "cancelEdit";
    cancelButton.textContent = "CANCEL EDIT";
    cancelButton.style.display = "none";

    productForm.appendChild(cancelButton);
}

cancelButton.addEventListener("click", cancelEdit);

// Edit an existing product
function editProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    editingProductId = id;

    document.getElementById("name").value = product.name;
    document.getElementById("price").value = product.price;
    document.getElementById("image").value = product.image;
    document.getElementById("category").value = product.category || "Woman";

    document.getElementById("description").value =
        product.description || "";

    document.getElementById("additionalImages").value =
        (product.additional_images || []).join("\n");

    document.getElementById("stockS").value = product.stock?.S ?? 0;
    document.getElementById("stockM").value = product.stock?.M ?? 0;
    document.getElementById("stockL").value = product.stock?.L ?? 0;
    document.getElementById("stockXL").value = product.stock?.XL ?? 0;

    productForm.querySelector('button[type="submit"]').textContent =
        "UPDATE PRODUCT";

    cancelButton.style.display = "inline-block";

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancel editing
function cancelEdit() {
    editingProductId = null;

    productForm.reset();

    document.getElementById("stockS").value = 0;
    document.getElementById("stockM").value = 0;
    document.getElementById("stockL").value = 0;
    document.getElementById("stockXL").value = 0;

    productForm.querySelector('button[type="submit"]').textContent =
        "ADD PRODUCT";

    cancelButton.style.display = "none";
}

// Add or update product
productForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const price = Number(document.getElementById("price").value);
    const image = document.getElementById("image").value.trim();
    const category = document.getElementById("category").value;

    const description =
        document.getElementById("description").value.trim();

    const additionalImages = document
        .getElementById("additionalImages")
        .value
        .split("\n")
        .map(url => url.trim())
        .filter(url => url !== "");

    if (!name || !price || price <= 0 || !image) {
        alert("Please enter valid product details.");
        return;
    }

    const stock = {
        S: Number(document.getElementById("stockS").value),
        M: Number(document.getElementById("stockM").value),
        L: Number(document.getElementById("stockL").value),
        XL: Number(document.getElementById("stockXL").value)
    };
    
    const productData = {
        name,
        price,
        image,
        category,
        description,
        additional_images: additionalImages,
        stock
    };

    let error;

    if (editingProductId !== null) {
        const result = await supabaseClient
            .from("atelier_products")
            .update(productData)
            .eq("id", editingProductId);

        error = result.error;

    } else {
        const result = await supabaseClient
            .from("atelier_products")
            .insert([productData]);

        error = result.error;
    }

    if (error) {
        console.error("Product saving error:", error);
        alert("Could not save product. Please try again.");
        return;
    }

    const wasEditing = editingProductId !== null;

    cancelEdit();
    await loadProducts();

    alert(wasEditing
        ? "Product updated successfully!"
        : "Product added successfully!"
    );
});

// Delete product
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("atelier_products")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Product deletion error:", error);
        alert("Could not delete product.");
        return;
    }

    await loadProducts();
    alert("Product deleted successfully!");
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

// Load products when admin dashboard opens
window.addEventListener("atelier-admin-ready", loadProducts);
