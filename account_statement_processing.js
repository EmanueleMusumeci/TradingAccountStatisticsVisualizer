//-------------------
//| Data extraction |
//-------------------

async function processAccountStatementFile(file, accountType, updateCallback)
{

    if (accountType === "Binance") {
        if (!file || !file.name.endsWith(".txt")) {
            alert("Please select a .txt file for Binance account statements.");
            return;
        }
    } else {
        if (!file || !file.name.endsWith(".pdf")) {
            alert("Please select a PDF file for eToro or Interactive Brokers account statements.");
            return;
        }
    }        

    switch(accountType)
    {
        case "eToro": case "Interactive Brokers":
        {
            processAccountPDFStatementFile(file, accountType, updateCallback);
            break;                            
        }
        case "Binance":
        {
            processTxtAccountStatementFile(file, accountType, updateCallback);
            break;
        }
        default:
        {
            alert("Unknown account platform: "+accountType);
            return
        }
    }
}

async function processAccountPDFStatementFile(accountStatementFile, accountType, updateCallback) {
    
    console.log(accountStatementFile)

    //Step 2: Read the file using file reader
    var fileReader = new FileReader();  

    fileReader.onload = function() {

        //Step 4:turn array buffer into typed array
        var typedarray = new Uint8Array(this.result);

        //Step 5:pdfjs should be able to read this
        const loadingTask = pdfjsLib.getDocument(typedarray);
        loadingTask.promise.then(async function(pdf) {

            if (!pdf) {
                alert("Please select a PDF file.");
                return;
            }

            var dateToOperation = null;
            switch(accountType)
            {
                case "eToro":
                {
                    // Call a function to extract a date -> operation map from the PDF file
                    dateToOperation = await extractDateToOperationFromeToroAccountStatement(pdf);
                    //console.log(dateToOperation)
                    //We will have a balance for each operation so not a balance for all days
                    // but only for days where an operation has occurred
                    dateToBalance = extractDailyEquitiesFromeToroOperations(dateToOperation);
                    //console.log(dateToBalance)

                    break;                            
                }
                case "Interactive Brokers":
                {
                    break;
                }
                default:
                {
                    alert("Unknown account platform: "+accountType);
                    return
                }
            }
        }).then(() => {

            //A balance for each day (map day (1-365) -> account balance)
            dailyBalances = computeDailyBalancesFromSparseBalances(dateToBalance);
            updateCallback();
        });                           

    };
    
    //Step 3:Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(accountStatementFile);
}

async function processTxtAccountStatementFile(accountStatementFile, accountType, updateCallback)
{
    var fileReader = new FileReader();  

    fileReader.onload = function(event) {
        console.log("fileReader.onload")

        const fileContent = event.target.result;

        if (!fileContent) {
            alert("Please select a file.");
            return;
        }

        var dateToOperation = null;
        //console.log(fileContent)
        switch(accountType)
        {
            case "Binance":
            {
                // Call a function to extract a date -> operation map from the PDF file
                dateToOperation = extractDateToOperationFromBinanceAccountStatement(fileContent);
                //We will have a balance for each operation so not a balance for all days
                // but only for days where an operation has occurred
                dateToBalance = extractDailyEquitiesFromBinanceOperations(dateToOperation);
                console.log(dateToBalance)

                break;                            
            }
            default:
            {
                alert("Unknown account platform: "+accountType);
                return
            }
        }

        
        //A balance for each day (map day (1-365) -> account balance)
        dailyBalances = computeDailyBalancesFromSparseBalances(dateToBalance);
        updateCallback();
    };

    fileReader.onerror = function (event) {
        reject(new Error("Error while reading the file."));
    };
    
    //Step 3:Read the file as text
    fileReader.readAsText(accountStatementFile);
}

//---------
//| eToro |
//---------

function extractDailyEquitiesFromeToroOperations(dateToOperation)
{
    //console.log(dateToOperation)
    var dateToDailyBalance = new Map();
    //var previousDateInMilliseconds = null;
    var previousDate = null;
    var previousEquity = null;
    for(let operation of dateToOperation)
    {
        //console.log(operation.date)
        var parsedDate = extractDayFromDate(operation.date, "dmy");
        //console.log(parsedDate)
        var parsedDateInMilliseconds = parsedDate.getTime();
        //console.log(new Date(parsedDateInMilliseconds))
        var parsedEquity = parseFloat(operation.realizedEquity);
        if(previousDate == null)
        {
            previousDate = parsedDateInMilliseconds;
            previousEquity = parsedEquity
        }
        else if(previousDate != parsedDateInMilliseconds)
        {
            dateToDailyBalance.set(previousDate, {amount: previousEquity});
            previousDate = parsedDateInMilliseconds;
            previousEquity = parsedEquity
        }
        else continue;
    }

    return dateToDailyBalance;
}

async function extractDateToOperationFromeToroAccountStatement(pdfDocument) {
    const totalPages = pdfDocument.numPages;

    var firstAccountActivityPage = -1;
    var lastAccountActivityPage = -1;
    for (let pageNum = 1; pageNum <= totalPages && lastAccountActivityPage == -1; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        //console.log("Scanning page: "+pageNum)

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const text = item.str.trim();

            //console.log("Text: "+text)
            if (text.toLowerCase().includes("account activity")) {
                firstAccountActivityPage = pageNum
                console.log("Found beginning of account activity at page: "+pageNum)
            } else if (text.toLowerCase().includes("net dividend received")) {
                lastAccountActivityPage = pageNum-1;
                console.log("Found end of account activity at page: "+pageNum)
                break;
            }
        }
    }

    if(firstAccountActivityPage == -1 || lastAccountActivityPage == -1)
    {
        alert("No Account Activity found. Are you sure this is an eToro account statement? For bug reports contact ing.emanuele.musumeci@gmail.com.")
        return
    }

    allOperations = [];
    for(let pageNum = firstAccountActivityPage; pageNum <= lastAccountActivityPage; pageNum+=1)
    {
        const page = await pdfDocument.getPage(pageNum)
        var pageOperations = await extractOperationsFromEToroAccountStatement(page)
        allOperations.push(...pageOperations)
    }

    return allOperations;
}

async function extractOperationsFromEToroAccountStatement(page)
{
    const textContent = await page.getTextContent();
    const items = textContent.items;
    var currentRow = []
    var operations = []
    var pageHeader = true;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.str.trim();

        if(text.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/) || i === items.length - 1)
        {
            pageHeader = false;
            if(currentRow.length > 0)
            {
                operations.push(await processEToroOperation(currentRow))
                currentRow = []
            }                    
        }
        if(pageHeader) continue;
        currentRow.push(text)
    }
    return operations;
}

async function processEToroOperation(fields)
{
    currentOperation = {
        date: fields[0],
        accountType: null,
        type: fields[1],
        currency: null,
        details: fields[2],
        amount: fields[3],
        realizedEquityChange: fields[4],
        realizedEquity: fields[5],
        balance: fields[6],
        positionID: null   
    };

    if(fields.length === 8) 
        currentOperation.positionID = fields[7];

    return currentOperation;
}

//-----------
//| Binance |
//-----------

function extractDateToOperationFromBinanceAccountStatement(txtFile) 
{
    // Split the file content into rows and ignore first and last rows
    var fileRows = txtFile.split("\n").slice(1);
    fileRows = fileRows.slice(0,fileRows.length-1);

    var allOperations = extractOperationsFromBinanceAccountStatement(fileRows)
    return allOperations;
}

function extractOperationsFromBinanceAccountStatement(fileRows)
{
    var operations = [];
    for(var row of fileRows)
    {
        var fields = row.split(",");
        operations.push(processBinanceOperation(fields))
    }
    return operations;
}

//Binance provides an equity changes on an operation-by-operation basis, therefore, to know
//the current balances, we need to accumulate the current equities
function extractDailyEquitiesFromBinanceOperations(dateToOperation)
{
    var dateToDailyBalance = new Map();
    var previousDate = null;
    var currentEquity = 0;
    for(let operation of dateToOperation)
    {
        console.log(operation.date)
        var parsedDate = extractDayFromDate(operation.date, "ymd");
        console.log(parsedDate)
        var parsedDateInMilliseconds = parsedDate.getTime();
        console.log(new Date(parsedDateInMilliseconds))
        var parsedEquityChange = parseFloat(operation.realizedEquityChange);
        if(previousDate == null)
        {
            previousDate = parsedDateInMilliseconds;
            currentEquity = currentEquity + parsedEquityChange
        }
        else if(previousDate != parsedDateInMilliseconds)
        {
            dateToDailyBalance.set(previousDate, {amount: currentEquity});
            previousDate = parsedDateInMilliseconds;
            currentEquity = currentEquity + parsedEquityChange
        }
        else continue;
    }

    return dateToDailyBalance;
}

function processBinanceOperation(fields)
{
    var currentOperation = {
        date: fields[1],
        accountType: fields[2],
        type: fields[3],
        currency: fields[4],
        details: null,
        amount: null,
        realizedEquityChange: fields[5],
        realizedEquity: null,
        balance: null,
        positionID: null   
    };

    return currentOperation;
}