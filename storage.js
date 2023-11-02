// Function to save cash flow data to localStorage
function saveDataToLocalStorage() {
    console.log("Saving data to local storage...")
    localStorage.setItem('dateToCashFlowData', JSON.stringify(dateToCashFlow, replacer));
    localStorage.setItem('dateToBalanceData', JSON.stringify(dateToBalance, replacer));
    localStorage.setItem('dailyBalancesData', JSON.stringify(dailyBalances, replacer));
}

// Function to retrieve cash flow data from localStorage
function loadDataFromLocalStorage(updateCallback) {
    console.log("Loading data from local storage...")
    const dateToCashFlowData = localStorage.getItem('dateToCashFlowData');
    if (dateToCashFlowData) {
        dateToCashFlow = JSON.parse(dateToCashFlowData, reviver);
        console.log("dateToCashFlow loaded from localStorage")
    }

    const dateToBalanceData = localStorage.getItem('dateToBalanceData');
    if (dateToBalanceData) {
        dateToBalance = JSON.parse(dateToBalanceData, reviver);
        console.log("dateToBalance loaded from localStorage")
    }

    const dailyBalances = localStorage.getItem('dailyBalances');
    if (dailyBalances) {
        dailyBalances = JSON.parse(dailyBalances, reviver);
        console.log("dailyBalances loaded from localStorage")
    }
    
    if(dateToCashFlowData || dateToBalanceData || dailyBalances)
    {
        updateCallback();
    }
}

function clearLocalStorage() {
    localStorage.clear();
}

//Needed to JSON.parse an ES6 Map
function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
        return new Map(value.value);
        }
    }
    return value;
}
         
//Needed to JSON.stringify an ES6 Map
function replacer(key, value) {
    if(value instanceof Map) {
        return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}