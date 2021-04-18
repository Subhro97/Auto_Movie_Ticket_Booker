let puppeteer = require("puppeteer");
let input = require("./input.json");

(async function fn(input) {
    try {
        let browserInstance = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        });
        await movieTicketBooker(browserInstance, input);

    } catch (err) {
        console.log(err);
    }

})(input);

async function movieTicketBooker(browserInstance, input) {

    let context = await browserInstance.createIncognitoBrowserContext();
    let newPage = await context.newPage();
    await newPage.goto("https://in.bookmyshow.com/buytickets/godzilla-vs-kong-national-capital-region-ncr/movie-ncr-ET00308781-MT/20210420");
    await waitNClick("button#wzrk-cancel", newPage);

    await newPage.evaluate(movieDateFn, input[0].Date);
    await newPage.waitForTimeout(2000);

    await newPage.evaluate(movietheaterFn, input[0].Time);
    await newPage.waitForTimeout(2000);

    await waitNClick("#btnPopupAccept", newPage);

    await newPage.waitForTimeout(2000);
    await newPage.evaluate(movieSeatsFn, input[0].Seats);
    await newPage.click("#proceed-Qty");

    await newPage.waitForTimeout(2000);
    await newPage.evaluate(seatSelectorFn, input[0].Seat_Row, input[0].Seat_No);
    await newPage.waitForTimeout(2000);

/*    await newPage.click("#btmcntbook");
    await newPage.waitForTimeout(3000);
    await newPage.evaluate(lastClickFn);
    //await newPage.waitForTimeout(2000);*/


    //await screenshotDOMElement(newPage, ".order-summarywrap", 16);
    //let ndetails = await newPage.evaluate(lastFn, details);

    //await newPage.waitForTimeout(4000);
    /*await newPage.close();
    await newPage.waitForTimeout(2000);
    return browserInstance.close();*/

    // return ndetails;
}

function lastClickFn() {
    return new Promise(function (resolve, reject) {
        let clickArr = document.querySelectorAll(".__up-icon.up-icon-tax");
        resolve(clickArr[1].click());
    })
}

function seatSelectorFn(seatrow, seatno) {
    return new Promise(function (resolve, reject) {
        let seatrowArr = document.querySelectorAll("tbody tr td.SRow1 ._available");
        for (let i = 0; i < seatrowArr.length; i++) {
            if (seatno - 1 == i) {
                resolve(seatrowArr[i].click());
            }

        }
    })
}

function movieSeatsFn(seats) {
    return new Promise(function (resolve, reject) {
        let seatsArr = document.querySelectorAll("#popQty li");
        for (let i = 0; i < seatsArr.length; i++) {
            if (seats == seatsArr[i].innerText) {
                resolve(seatsArr[i].click());
            }
        }
    })

}


function movietheaterFn(showTime) {
    return new Promise(function (resolve, reject) {
        let showtimeArr = document.querySelectorAll(".__details .__text");
        for (let i = 0; i < showtimeArr.length; i++) {
            if (showTime == showtimeArr[i].innerText) {
                resolve(showtimeArr[i].click());
            }
        }


    })

}

function movieDateFn(movieDate) {
    return new Promise(function (resolve, reject) {
        let movieDateArr = document.querySelectorAll(".date-numeric");
        for (let i = 0; i < movieDateArr.length; i++) {
            if (movieDate == movieDateArr[i].innerText) {
                resolve(movieDateArr[i].click());
            }
        }
        reject("Not Valid Date");
    })
}
async function waitNClick(selector, newPage) {
    await newPage.waitForSelector(selector, { visible: true });
    return newPage.click(selector);
}