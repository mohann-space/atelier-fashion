
const adminOrders = document.getElementById("adminOrders");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function displayOrders() {
    adminOrders.innerHTML = "<p>Loading customer orders...</p>";

    const { data: orders, error } = await supabaseClient
        .from("atelier_orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Orders loading error:", error);
        adminOrders.innerHTML =
            "<p>Could not load orders. Check the browser console.</p>";
        return;
    }

    if (!orders || orders.length === 0) {
        adminOrders.innerHTML = "<p>No orders received yet.</p>";
        return;
    }

    adminOrders.innerHTML = `
        <button type="button" id="refreshOrders">
            REFRESH ORDERS ↻
        </button>

        <p>${orders.length} order(s) received</p>

        ${orders.map(order => `
            <div class="admin-order">
                <h3>Order #${escapeHTML(order.order_number)}</h3>

                <p><strong>Customer:</strong>
                    ${escapeHTML(order.customer_name)}</p>

                <p><strong>Phone:</strong>
                    ${escapeHTML(order.phone)}</p>

                <p><strong>Email:</strong>
                    ${escapeHTML(order.email)}</p>

                <p><strong>Address:</strong>
                    ${escapeHTML(order.address)},
                    ${escapeHTML(order.city)},
                    ${escapeHTML(order.state)} -
                    ${escapeHTML(order.pincode)}
                </p>

                <p><strong>Order date:</strong>
                    ${new Date(order.created_at).toLocaleString("en-IN")}
                </p>

                <h4>Products ordered</h4>

                ${(Array.isArray(order.items) ? order.items : []).map(item => `
                    <p>
                        ${escapeHTML(item.name)}
                        | Size: ${escapeHTML(item.size || "One Size")}
                        | Quantity: ${Number(item.quantity)}
                        | ₹${(
                            Number(item.price) * Number(item.quantity)
                        ).toLocaleString("en-IN")}
                    </p>
                `).join("")}

                <h3>Total: ₹${Number(order.total).toLocaleString("en-IN")}</h3>

                <p><strong>Order status:</strong></p>

                <select class="order-status"
                    data-order-id="${escapeHTML(order.id)}">

                    <option value="Pending"
                        ${order.status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="Shipped"
                        ${order.status === "Shipped" ? "selected" : ""}>
                        Shipped
                    </option>

                    <option value="Delivered"
                        ${order.status === "Delivered" ? "selected" : ""}>
                        Delivered
                    </option>
                </select>

                <br><br>

                <button type="button" class="delete-order"
                    data-order-id="${escapeHTML(order.id)}">
                    DELETE ORDER
                </button>
            </div>
        `).join("")}
    `;

    document.getElementById("refreshOrders")
        .addEventListener("click", displayOrders);

    document.querySelectorAll(".order-status").forEach(select => {
        select.addEventListener("change", function() {
            updateOrderStatus(this.dataset.orderId, this.value);
        });
    });

    document.querySelectorAll(".delete-order").forEach(button => {
        button.addEventListener("click", function() {
            deleteOrder(this.dataset.orderId);
        });
    });
}

async function updateOrderStatus(orderId, status) {
    const { error } = await supabaseClient
        .from("atelier_orders")
        .update({ status })
        .eq("id", orderId);

    if (error) {
        console.error("Status update error:", error);
        alert("Could not update order status.");
        return;
    }

    alert("Order status updated!");
    displayOrders();
}

async function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("atelier_orders")
        .delete()
        .eq("id", orderId);

    if (error) {
        console.error("Delete order error:", error);
        alert("Could not delete this order.");
        return;
    }

    alert("Order deleted successfully!");
    displayOrders();
}

window.addEventListener("atelier-admin-ready", displayOrders);
