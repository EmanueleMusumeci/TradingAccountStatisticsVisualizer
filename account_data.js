//TODO use sparse arrays for balances: avoid the need to specify one balance for each day
// but instead use the "sparse" ones


let dateToCashFlow = new Map();
let dateToBalance = new Map();
let dailyBalances = [];
let yearlyAverage = null;
let finalBalance = null;

// Draw a simple cash flow graph
const balancesGraphCanvas = document.getElementById("balancesGraph");
const balancesGraphContext = balancesGraphCanvas.getContext("2d");


//---------------
//| Update data |
//---------------

updateDataCallback = function() {
    saveDataToLocalStorage();
    updateVisualizedData();
    drawBalancesGraph(dailyBalances)
}

function updateTables() {
    updateCashFlowTable();
    updateBalancesTable();
}

function updateAccountStatistics() {
    var yearlyAverageStr = "N\\A";
    var finalBalanceStr = "N\\A";
    
    if(dailyBalances.length > 0)
    {
        computeFinalBalance();
        computeYearlyAverage();
        finalBalanceStr = `${finalBalance.toFixed(2)}`
        yearlyAverageStr = `${yearlyAverage.toFixed(2)}`
    }

    document.getElementById("final-balance").innerHTML = finalBalanceStr;
    document.getElementById("yearly-average").innerHTML = yearlyAverageStr;
}

function updateVisualizedData() {
    updateTables();
    updateAccountStatistics();
    resetCashFlowInputFields();
    drawBalancesGraph();
}

// Cash flows

function addCashFlow(dateInMilliseconds, amount, isDeposit) {

    if (!dateInMilliseconds || isNaN(amount)) {
        alert("Please enter a valid date and amount.");
        return;
    }

    dateToCashFlow.set(dateInMilliseconds, {
        dateInMilliseconds: dateInMilliseconds,
        amount: isDeposit ? amount : -amount
    });

    dateToCashFlow = new Map([...dateToCashFlow.entries()].sort());

    dailyBalances = computeDailyBalancesFromCashFlows()
    dateToBalance = computeSparseBalancesFromCashFlows()
    saveDataToLocalStorage();
    updateVisualizedData();
}

function deleteCashFlow(eventTarget) {
    //console.log(eventTarget.index)
    dateToCashFlow.delete(eventTarget.date);
    dailyBalances = computeDailyBalancesFromCashFlows()
    saveDataToLocalStorage();
    updateVisualizedData();

}

function updateCashFlowTable() {
    resetCashFlowsTable(dateToCashFlow.size > 0);
    const table = document.getElementById("cashFlowsTable");
    index = 0;
    for(let [date, cashFlowEntry] of dateToCashFlow.entries())
    {
        const transactionType = cashFlowEntry.amount>=0 ? "Deposit" : "Withdrawal";
        const newRow = table.insertRow(table.rows.length);
        newRow.insertCell(0).textContent = new Date(cashFlowEntry.dateInMilliseconds).toLocaleDateString();
        newRow.insertCell(1).textContent = cashFlowEntry.amount;
        const transactionTypeCell = newRow.insertCell(2);
        transactionTypeCell.textContent = transactionType 
        transactionTypeCell.className = transactionType.toLowerCase();
        var deleteBtn = document.createElement('input');
        deleteBtn.type = "button";
        deleteBtn.className = "delete";
        deleteBtn.value = "🗑";
        deleteBtn.date = date;
        newRow.appendChild(deleteBtn);
        deleteBtn.addEventListener("click", (evt) => {deleteCashFlow(evt.target)});
        index+=1;
    }
    resetInputFields();
}

// Balances


function addBalance(dateInMilliseconds, amount) {

    if (!dateInMilliseconds || isNaN(amount)) {
        alert("Please enter a valid date and amount.");
        return;
    }

    dateToBalance.set(dateInMilliseconds, {
        dateInMilliseconds: dateInMilliseconds,
        amount: amount
    });

    dateToBalance = new Map([...dateToBalance.entries()].sort());

    dailyBalances = computeDailyBalancesFromSparseBalances()
    saveDataToLocalStorage();
    updateVisualizedData();
}

function deleteBalance(eventTarget) {
    //console.log(eventTarget.index)
    dateToBalance.delete(eventTarget.date);
    dailyBalances = computeDailyBalancesFromSparseBalances()
    saveDataToLocalStorage();
    updateVisualizedData();

}

function updateBalancesTable() {
    const table = document.getElementById("balancesTable");
    resetBalancesTable(dateToBalance.size > 0);
    index = 0;
    console.log(dateToBalance)
    for(let [date, balanceEntry] of dateToBalance.entries())
    {
        const newRow = table.insertRow(table.rows.length);
        newRow.insertCell(0).textContent = new Date(date).toLocaleDateString();
        newRow.insertCell(1).textContent = balanceEntry.amount;
        var deleteBtn = document.createElement('input');
        deleteBtn.type = "button";
        deleteBtn.className = "delete";
        deleteBtn.value = "🗑";
        deleteBtn.date = date;
        newRow.appendChild(deleteBtn);
        deleteBtn.addEventListener("click", (evt) => {deleteBalance(evt.target)});
        index+=1;
    }
    resetInputFields();
}

function drawBalancesGraph() {
    balancesGraphContext.clearRect(0, 0, balancesGraphCanvas.width, balancesGraphCanvas.height);
    balancesGraphCanvas.width = document.body.clientWidth;

    balancesGraphContext.lineWidth = 2;
    balancesGraphContext.strokeStyle="#000000";
    balancesGraphContext.strokeRect(0, 0, balancesGraphCanvas.width, balancesGraphCanvas.height);
    balancesGraphContext.stroke();

    if(dailyBalances.length == 0)
    {
        resetBalancesGraph();
        return;
    }

    // Find the first and last transaction dates
    //console.log(dailyBalances)
    console.log("Updating balances graph")
    const totalDays = dailyBalances.length;
    
    const maxBalance = Math.max(...dailyBalances)*1.5;
    //console.log(maxBalance)

    const firstBalance = dailyBalances[0];
    const horizontalOffset = 0;
    const verticalOffset = balancesGraphCanvas.height/4;

    const x = horizontalOffset;                    
    const dataPointY = (balancesGraphCanvas.height - verticalOffset/2) - ((firstBalance / maxBalance) * (balancesGraphCanvas.height - verticalOffset/2));
    balancesGraphContext.fillStyle = "red";
    balancesGraphContext.strokeStyle = "red";
    balancesGraphContext.beginPath();
    balancesGraphContext.moveTo(x, dataPointY);

    dailyBalances.forEach((balance, index) => {
        const x = horizontalOffset + Math.floor((index/totalDays)*balancesGraphCanvas.width);     
        const dataPointY = balancesGraphCanvas.height - verticalOffset/2 - (Math.floor((balance / maxBalance) * (balancesGraphCanvas.height - verticalOffset/2)));
        //console.log(x)
        //console.log(dataPointY)
        balancesGraphContext.lineTo(x, dataPointY);
        balancesGraphContext.stroke();
    });

    const arrowWidth = 10;
    const arrowHeadHeight = 10;
    const arrowHeight = 30;
    dateToCashFlow.forEach((entry, index) => {
        // Draw arrows for deposits (green upwards arrows)
        if (entry.amount > 0) {
            balancesGraphContext.fillStyle = "green";
            balancesGraphContext.beginPath();
            balancesGraphContext.moveTo(x, balancesGraphCanvas.height - arrowHeight);
            balancesGraphContext.lineTo(x - arrowWidth/2, balancesGraphCanvas.height - arrowHeadHeight);
            balancesGraphContext.lineTo(x + arrowWidth/2, balancesGraphCanvas.height - arrowHeadHeight);
            balancesGraphContext.fill();
        }
        // Draw arrows for withdrawals (red downwards arrows)
        else if (entry.amount < 0) {
            balancesGraphContext.fillStyle = "red";
            balancesGraphContext.beginPath();
            balancesGraphContext.moveTo(x, balancesGraphCanvas.height - 10);
            balancesGraphContext.lineTo(x - 5, balancesGraphCanvas.height - 20);
            balancesGraphContext.lineTo(x + 5, balancesGraphCanvas.height - 20);
            balancesGraphContext.fill();
        }
    });
}


//--------------
//| Reset data |
//--------------

function resetData() {
    dateToCashFlow = new Map();
    dateToBalance = new Map();
    dailyBalances = [];
    yearlyAverage = null;
    finalBalance = null;
    clearLocalStorage();
    resetVisualizedData();
    console.log("Data reset")
}

function resetVisualizedData() {
    resetInputFields();
    resetTables();
    resetAccountStatistics();
}



function resetCashFlowInputFields() {
    document.getElementById("cashFlowDate").value = "";
    document.getElementById("cashFlowAmount").value = "";
}

function resetBalanceInputFields() {
    document.getElementById("balanceDate").value = "";
    document.getElementById("balanceAmount").value = "";
}

function resetInputFields() {
    resetAccountStatementInputFields();
    resetCashFlowInputFields();
    resetBalanceInputFields();
}

function resetAccountStatementInputFields() {
    document.getElementById("accountStatementFileInput").value = null;
}

function resetAccountStatistics() {
    var yearlyAverageStr = "N\\A";
    var finalBalanceStr = "N\\A";
    document.getElementById("final-balance").innerHTML = finalBalanceStr;
    document.getElementById("yearly-average").innerHTML = yearlyAverageStr;
}



function resetCashFlowsTable(empty = false) {
    const table = document.getElementById("cashFlowsTable");
    table.innerHTML = ""
    if(!empty)
    {
        table.innerHTML = "\
        <thead>\
            <tr>\
                <th>Date</th>\
                <th>Amount</th>\
                <th>Type</th>\
            </tr>\
        </thead>\
        <tbody>\
            <tr>\
                <td colspan=\"3\" style=\"text-align: center;\">No cash flow data</td>\
            </tr>\
        </tbody>\
        "
    }
}

function resetBalancesTable(empty = false) {
    const table = document.getElementById("balancesTable");
    table.innerHTML = ""
    if(!empty)
    {
        table.innerHTML = "\
        <thead>\
            <tr>\
                <th>Date</th>\
                <th>Balance</th>\
            </tr>\
        </thead>\
        <tbody>\
            <tr>\
                <td colspan=\"\" style=\"text-align: center;\">No balance data</td>\
            </tr>\
        </tbody>\
        "
    }
}

function resetTables() {
    resetCashFlowsTable();
    resetBalancesTable();
}



function resetBalancesGraph() {
    balancesGraphContext.clearRect(0, 0, balancesGraphCanvas.width, balancesGraphCanvas.height);
    balancesGraphContext.lineWidth = 2;
    balancesGraphContext.fillStyle="#f5f5f5";
    balancesGraphContext.fillRect(0, 0, balancesGraphCanvas.width, balancesGraphCanvas.height);

    // Set font properties
    balancesGraphContext.font = 'bold 20px Arial'; // Font size and style
    balancesGraphContext.fillStyle = 'black'; // Font color
    balancesGraphContext.textAlign = 'center'; // Text alignment

    // Calculate the center coordinates
    const centerX = balancesGraphCanvas.width / 2;
    const centerY = balancesGraphCanvas.height / 2;

    // Write "No balance data" in the center
    balancesGraphContext.fillText('No balance data', centerX, centerY);
    return;
}



function deleteAllCashFlows() {
    dateToCashFlow = new Map();
    dateToBalance = new Map();
    dailyBalances = new Map();
    resetInputFields();
    resetVisualizedData();
}


//---------------
//| Computation |
//---------------
function computeDailyBalancesFromSparseBalances() {
    if (dateToBalance.size == 0) {
        return;
    }

    dateToBalance = new Map([...dateToBalance.entries()].sort());

    // Find the first and last transaction dates
    const firstDate = new Date(getFirstKeyInMap(dateToBalance));
    const lastDate = new Date(getLastKeyInMap(dateToBalance));
    
    //Get the current year
    const currentYear = firstDate.getFullYear();

    //Make sure that all balances refer to the same year
    if (currentYear !== lastDate.getFullYear()) {
        alert("Transactions span multiple years. Yearly average cannot be calculated.");
        return;
    }
    
    // Calculate the number of days between the first and last transaction

    const totalDays = daysInYear(currentYear);
    var balanceDays = createArray(1,totalDays);
    
    const dateToBalanceArr = [...dateToBalance]
    const dayToBalance = new Map(dateToBalanceArr.map(
        ([date, balanceEntry]) => 
        [
            dayOfYear(new Date(date)), {amount: balanceEntry.amount}
        ]
    ))
            
    const balances = [];
    var currentBalance = 0;
    for(let day of balanceDays)
    {
        if(dayToBalance.has(day))
        {
            currentBalance = dayToBalance.get(day).amount;
        }
        balances.push(currentBalance);
    }

    document.getElementById("final-balance").innerHTML = `${balances[balances.length-1].toFixed(2)}`;

    return balances;
}

function computeSparseBalancesFromCashFlows() {
    if (dateToCashFlow.length === 0) {
        alert("No cash flow data available.");
        return;
    }

    dateToCashFlow = new Map([...dateToCashFlow.entries()].sort());

    // Find the first and last transaction dates
    const firstDate = new Date(getFirstKeyInMap(dateToCashFlow));
    const lastDate = new Date(getLastKeyInMap(dateToCashFlow));

    const currentYear = firstDate.getFullYear();
    
    if (currentYear !== lastDate.getFullYear()) {
        alert("Transactions span multiple years. Yearly average cannot be calculated.");
        return;
    }
    

    var dateToBalance = new Map();
    var currentBalance = 0;
    for(let [date, cashFlowEntry] of dateToCashFlow.entries())
    {
        currentBalance += cashFlowEntry.amount;
        dateToBalance.set(date, {amount: currentBalance});
    }

    return dateToBalance;
}

function computeDailyBalancesFromCashFlows() {
    if (dateToCashFlow.length === 0) {
        alert("No cash flow data available.");
        return;
    }

    dateToCashFlow = new Map([...dateToCashFlow.entries()].sort());

    // Find the first and last transaction dates
    const firstDate = new Date(getFirstKeyInMap(dateToCashFlow));
    const lastDate = new Date(getLastKeyInMap(dateToCashFlow));

    const currentYear = firstDate.getFullYear();
    
    if (currentYear !== lastDate.getFullYear()) {
        alert("Transactions span multiple years. Yearly average cannot be calculated.");
        return;
    }
    

    const totalDays = daysInYear(currentYear);
    var cashFlowDays = createArray(1,totalDays);
    
    const dateToCashFlowArr = [...dateToCashFlow]
    const dayToCashFlow = new Map(dateToCashFlowArr.map(
        ([date, cashFlowEntry]) => 
        [
            dayOfYear(new Date(date)), {amount: cashFlowEntry.amount}
        ]
    ))
                
    const balances = [];
    var currentBalance = 0;
    for(let day of cashFlowDays)
    {
        if(dayToCashFlow.has(day))
        {
            currentBalance += dayToCashFlow.get(day).amount;
        }
        balances.push(currentBalance);
    }

    return balances;
}

function computeFinalBalance() {
    finalBalance = dailyBalances[dailyBalances.length-1]
}

function computeYearlyAverage() {
    var yearlyBalance = 0;
    for(var balance of dailyBalances)
    {
        yearlyBalance += balance
    }

    yearlyAverage = yearlyBalance / dailyBalances.length;
}