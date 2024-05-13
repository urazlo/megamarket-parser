export const getFiltersString = (category) => {
    const filtersObject = {
        // "90E25EADE2C71A465CAB6579E5CEFE3A": [ "1" ],
        "4CB2C27EAAFC4EB39378C4B7487E6C9E": [ "1" ],
    };

    if (category === "otparivateli") {
        filtersObject["66E5DDA2F8E93E372F85C60E17672422"] = [ "напольный" ];
    }

    const jsonString = JSON.stringify(filtersObject);

    return `#?filters=${encodeURIComponent(jsonString)}`;
};
