
const trackingForm = document.getElementById("trackingForm");
const trackingResult = document.getElementById("trackingResult");
const trackingButton = document.getElementById("trackingButton");

trackingForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const orderNumber = document
        .getElementById("trackingOrderNumber")
        .value.trim();

    const phone = document
        .getElementById("trackingPhone")
        .value.trim();

    trackingButton.disabled = true;
    trackingButton.textContent = "CHECKING...";

    trackingResult.textContent = "Searching for your order...";

    try {
        const { data, error } = await supabaseClient.rpc(
            "track_atelier_order",
            {
                p_order_number: orderNumber,
                p_phone: phone
            }
        );

        if (error) {
            throw error;
        }

        if (!data.success) {
            trackingResult.textContent =
                "Order not found. Please check your order number and phone number.";
            return;
        }

        const resultBox = document.createElement("div");
         
        resultBox.className = "tracking-success";

        const heading = document.createElement("h2");
        heading.textContent = "YOUR ORDER";

        const number = document.createElement("p");
        number.textContent = "Order ID: " + data.order_number;

        const status = document.createElement("h3");
        status.textContent = "Status: " + data.status;

        const date = document.createElement("p");
        date.textContent = "Order Date: " +
            new Date(data.created_at).toLocaleDateString("en-IN");

        resultBox.append(heading, number, status, date);

        const stages = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered"
        ];

        const currentStatus = String(data.status).toLowerCase();
        const currentStage = stages.findIndex(
            stage => stage.toLowerCase() === currentStatus
        );

        const timeline = document.createElement("div");
        timeline.className = "order-timeline";

        stages.forEach((stage, index) => {
            const item = document.createElement("div");
            item.className = "timeline-stage";

            if (currentStage >= index && currentStage !== -1) {
                item.classList.add("completed");
            }

            const circle = document.createElement("span");
            circle.className = "timeline-circle";
            circle.textContent =
                currentStage >= index && currentStage !== -1 ? "✓" : (index + 1);

            const label = document.createElement("p");
            label.textContent = stage === "Pending"
                ? "Order Placed"
                : stage;

            item.append(circle, label);
            timeline.appendChild(item);
        });

        if (currentStage === -1) {
            const message = document.createElement("p");
            message.textContent = "Your order status: " + data.status;
            timeline.appendChild(message);
        }

        resultBox.appendChild(timeline);


        trackingResult.replaceChildren(resultBox);

    } catch (error) {
        console.error("Tracking error:", error);
        trackingResult.textContent =
            "Something went wrong. Please try again.";
    } finally {
        trackingButton.disabled = false;
        trackingButton.textContent = "TRACK ORDER";
    }
});
