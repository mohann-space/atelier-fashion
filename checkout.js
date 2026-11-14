
let checkoutCart = JSON.parse(
    localStorage.getItem("atelierCart")
) || [];

const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");

function displayCheckout() {
    if (checkoutCart.length === 0) {
        checkoutItems.innerHTML = "<p>Your bag is empty.</p>";
        checkoutTotal.textContent = "0";
        document.querySelector(".place-order").disabled = true;
        return;
    }

    checkoutItems.innerHTML = checkoutCart.map(item => `
        <div class="checkout-item">
            <img src="${item.image}" alt="Product">

            <div>
                <p>${escapeHTML(item.name)}</p>
                <p>Size: ${escapeHTML(item.size || "One Size")}</p>
                <p>Quantity: ${Number(item.quantity)}</p>
                <strong>₹${(
                    Number(item.price) * Number(item.quantity)
                ).toLocaleString("en-IN")}</strong>
            </div>
        </div>
    `).join("");

    const total = checkoutCart.reduce(
        (sum, item) =>
            sum + Number(item.price) * Number(item.quantity),
        0
    );

    checkoutTotal.textContent = total.toLocaleString("en-IN");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

document.getElementById("checkoutForm").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        if (checkoutCart.length === 0) {
            alert("Your shopping bag is empty!");
            return;
        }

        const orderButton = document.querySelector(".place-order");
        orderButton.disabled = true;
        orderButton.textContent = "PLACING ORDER...";

        const total = checkoutCart.reduce(
            (sum, item) =>
                sum + Number(item.price) * Number(item.quantity),
            0
        );

        const orderNumber = "AT" + Date.now();

        const order = {
            order_number: orderNumber,
            customer_name: document.getElementById("customerName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            pincode: document.getElementById("pincode").value.trim(),
            items: checkoutCart,
            total: total,
            status: "Pending"
        };

        try {
            const { data, error } = await supabaseClient
                .rpc("place_atelier_order", {
                p_order: order
              });

            if (error) {
                throw error;
            }

            console.log("Order confirmed:", data);
            console.log("ATELIER EMAIL TEST STARTED");
            // Send order confirmation email
            const { data: emailData, error: emailError } =
            await supabaseClient.functions.invoke(
                "send-order-confirmation",
                {
                    body: {
                        order_number: data.order_number,
                        phone: order.phone
                    }
                }
            );

            if (emailError) {
            console.error("Confirmation email error:", emailError);
            } else {
            console.log("Confirmation email result:", emailData);
            }

            localStorage.removeItem("atelierCart");

            localStorage.setItem("atelierLastOrder", JSON.stringify({
                orderNumber: data.order_number,
                total: data.total
            }));
            
            window.location.href = "order-success.html";

        } catch (error) {
            console.error("Order error:", error);

            alert(
                "Sorry! We couldn't place your order. " +
                "Your bag is still saved. Please try again."
            );

            orderButton.disabled = false;
            orderButton.textContent = "PLACE ORDER";
        }
    }
);

displayCheckout();
