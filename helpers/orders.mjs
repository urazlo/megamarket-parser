export const getOrders = async () => {
    const response = await fetch("https://clore.ai/webapi/marketplace/orders", {
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        },
        method: "POST",
        body: JSON.stringify({
            token: "MTcwOTYyNTkzNl9pbjlxdlozMngxcGNsaXBCTHdMRXJkRXNrN0hrSks=",
            rc: false
        }),
    });

    return response.json();
}
