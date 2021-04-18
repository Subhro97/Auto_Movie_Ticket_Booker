let puppeteer = require("puppeteer");
let fs = require("fs");
let path = require("path");
let PDFDocument = require('pdfkit');

let input=require("./input.json");

(async function fn(input) {
    try {
        let browserInstance = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        });
        let details = await movieTicketBooker(browserInstance,input);

        dirCreater("Movie_Details");
        let newDetails = createFile("Movie", "Movie_Details", details);


        console.table(newDetails);

    } catch (err) {
        console.log(err);
    }

})(input);

async function movieTicketBooker(browserInstance,input) {

    let context = await browserInstance.createIncognitoBrowserContext();
    let newPage = await context.newPage();
    await newPage.goto("https://in.bookmyshow.com/explore/home");

    await waitNClick("button#wzrk-cancel", newPage);
    await waitNClick('.sc-RbTVP.fjyOHW [alt="NCR"]', newPage);

    let url = newPage.url();
    await newPage.goto(url);
    await newPage.click(".sc-gmeYpB.MZHt");
    await newPage.type(".sc-gmeYpB.MZHt", input[0].Movie, { Delay: 200 });
    await waitNClick(".sc-ekulBa.ffzpQn", newPage);

    let url2 = newPage.url();
    await newPage.goto(url2);

    let details = await newPage.evaluate(movieDoc);

    await waitNClick("#page-cta-container", newPage);

    await newPage.waitForTimeout(2000);

    await newPage.evaluate(formatSelectorFn, input[0].Format);
    await newPage.waitForTimeout(2000);

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

    await newPage.click("#btmcntbook");
    await newPage.waitForTimeout(3000);
    await newPage.evaluate(lastClickFn);
    await newPage.waitForTimeout(4000);

    await screenshotDOMElement(newPage, ".order-summarywrap", 16);
    let ndetails = await newPage.evaluate(lastFn, details);

    await newPage.waitForTimeout(4000);
    await newPage.close();
    await newPage.waitForTimeout(2000);
    await browserInstance.close();

    return ndetails;
}

function lastFn(details) {
    return new Promise(function (resolve, reject) {
        let ticketsArr = document.querySelectorAll("#TickQuantity");
        let totalamtArr = document.querySelectorAll("#ttPrice");

        let Tickets = ticketsArr[0].innerText.split("(")[1].split(")")[0];
        let Total_Amount = totalamtArr[0].innerText;
        details.push({ Tickets, Total_Amount });
        resolve(details);
    })

}

function movieDoc() {
    return new Promise(function (resolve, reject) {
        let movieNameArr = document.querySelectorAll(".styles__EventHeading-qswwm9-6.mptsd");
        let movieDurationArr = document.querySelectorAll(".styles__EventAttributesContainer-sc-2k6tnd-1.hSMSQi");

        let Movie_Name = movieNameArr[0].innerText;
        let Movie_Duration = movieDurationArr[1].innerText.split("•")[0].split("\n")[0];
        let arr = [];
        arr.push({ Movie_Name, Movie_Duration });
        resolve(arr);
    })
}

async function screenshotDOMElement(page, selector, padding = 0) {
    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);
        const { x, y, width, height } = element.getBoundingClientRect();
        return { left: x, top: y, width, height, id: element.id };
    }, selector);

    return await page.screenshot({
        path: 'screenshot.png',
        clip: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        }
    });
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

function formatSelectorFn(formatName) {
    return new Promise(function (resolve, reject) {
        let movieFormatArr = document.querySelectorAll(".styles__DimensionComponent-vhz3gb-3.ejeujv span");
        for (let i = 0; i < movieFormatArr.length; i++) {
            if (formatName == movieFormatArr[i].innerText) {
                resolve(movieFormatArr[i].click());
            }
        }
        reject("Format Not Fount");
    })
}

function dirCreater(topicName) {
    let pathOfFolder = path.join(__dirname, topicName);
    if (fs.existsSync(pathOfFolder) == false) {
        fs.mkdirSync(pathOfFolder);
    }
}
function createFile(repoName, topicName, details) {
    let newObj = {};
    for (let i = 0; i < details.length; i++) {
        for (let keys in details[i]) {
            newObj[keys] = details[i][keys];

        }
    }
    let pathofFile = path.join(__dirname, topicName, repoName + ".json");
    if (fs.existsSync(pathofFile) == false) {
        let createStream = fs.createWriteStream(pathofFile);
        createStream.end();
    }
    fs.writeFileSync(pathofFile, JSON.stringify(newObj));

    let filePath = path.join(__dirname, topicName, repoName + ".pdf");
    let pdfDoc = new PDFDocument;
    pdfDoc.pipe(fs.createWriteStream(filePath));
    for (let keys in newObj) {
        pdfDoc.text(keys + ":" + newObj[keys]);
        pdfDoc.moveDown();
    }
    pdfDoc.end();

    return newObj;
}

async function waitNClick(selector, newPage) {
    await newPage.waitForSelector(selector, { visible: true });
    return newPage.click(selector);
}



