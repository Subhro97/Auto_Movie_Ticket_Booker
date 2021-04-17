let details = [{ "movieName": "Godzilla vs. Kong", "movieDuration": "1h 54m" }, { "tickets": " ( 2 Tickets )", "totalamt": "Rs. 694.04" }]
let newObj = {};
for (let i = 0; i < details.length; i++) {
    for (let keys in details[i]) {
        newObj[keys] = details[i][keys];

    }
}
console.log(newObj);