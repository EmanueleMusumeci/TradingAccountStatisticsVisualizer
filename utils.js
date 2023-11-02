function daysInYear(year) {
    return ((year % 4 === 0 && year % 100 > 0) || year %400 == 0) ? 366 : 365;
}

//TODO allow specifying date format and parse date accordingly
function extractDayFromDate(timestamp, format)
{
    // Split the timestamp into date and time parts
    const [datePart, timePart] = timestamp.split(' ');

    // Split the date part into day, month, and year
    const splitDate = datePart.split('-').map(Number);

    format = format.toLowerCase()
    var year = null;
    var month = null;
    var day = null;
    for(var i=0; i<format.length; i+=1)
    {
        var dateComponent = format.charAt(i);
        switch(dateComponent)
        {
            case "y":
            {
                year = splitDate[i]
                break;   
            }
            case "m":
            {
                month = splitDate[i]
                break;   
            }
            case "d":
            {
                day = splitDate[i]
                break;   
            }
        }
    }

    //console.log(day)
    //console.log(month)
    //console.log(year)
    
    // Create a JavaScript Date object with the date part
    const jsDate = new Date(year, month - 1, day,0,0,0,0);

    return jsDate;
}
        
// Helper function to parse timestamps (adjust as needed)
function parseTimestamp(timestampStr) {
    // Implement your timestamp parsing logic here
    return new Date(timestampStr);
}

// Helper function to get a string representing the date (yyyy-mm-dd)
function getDateString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

var getDaysArray = function(s, e, inMilliseconds=false) {
    for(var a=[], d=new Date(s); d<=new Date(e); d.setDate(d.getDate()+1))
    { 
        var newDate = new Date(d);
        if(inMilliseconds) newDate = newDate.getTime();
        a.push(newDate);
    }
    return a;
};    
        
const getFirstItemInMap = map => Array.from(map)[0]
const getFirstKeyInMap = map => Array.from(map)[0][0]
const getFirstValueInMap = map => Array.from(map)[0][1]

const getLastItemInMap = map => Array.from(map)[map.size-1]
const getLastKeyInMap = map => Array.from(map)[map.size-1][0]
const getLastValueInMap = map => Array.from(map)[map.size-1][1]

const dayOfYear = date => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

function createArray(start, end) {
    let result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

function createDaysOfYearArray(currentYear) {
    return createArray(1,daysInYear(currentYear))
}