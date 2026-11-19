
const lastOrder = JSON.parse(
    localStorage.getItem("atelierLastOrder")
);

const orderNumber = document.getElementById("successOrderNumber");
const orderTotal = document.getElementById("successTotal");

if (
    lastOrder &&
    lastOrder.orderNumber &&
    Number.isFinite(Number(lastOrder.total))
) {
    orderNumber.textContent = lastOrder.orderNumber;

    orderTotal.textContent =
        "₹" + Number(lastOrder.total).toLocaleString("en-IN");
} else {
    orderNumber.textContent = "Order details unavailable";
    orderTotal.textContent = "Please check your order tracking";
}
