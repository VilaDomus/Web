const fs = require('fs');

const urls = [
    'https://ical.booking.com/v1/export?t=cb4b4ca4-3b29-4cc8-9b9f-4a1c9efd20ac',
    'https://www.airbnb.cz/calendar/ical/1523021244980704329.ics?t=657e5cffe8aa4afc8f0c1bc6daa64e59'
];

let bookedDates = [];
let checkInDates = [];
let checkOutDates = [];

function processReservation(startStr, endStr) {
    let startDate = new Date(startStr.substring(0,4), parseInt(startStr.substring(4,6))-1, startStr.substring(6,8));
    let endDate = new Date(endStr.substring(0,4), parseInt(endStr.substring(4,6))-1, endStr.substring(6,8));
    
    const startString = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    if (!checkInDates.includes(startString)) checkInDates.push(startString);

    let curr = new Date(startDate);
    while(curr < endDate) {
        const dateString = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        if(!bookedDates.includes(dateString)) bookedDates.push(dateString);
        curr.setDate(curr.getDate() + 1);
    }

    const endString = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    if (!checkOutDates.includes(endString)) checkOutDates.push(endString);
}

function parseICal(data) {
    const lines = data.split(/\r?\n/);
    let inEvent = false;
    let start = '', end = '';

    for (let line of lines) {
        line = line.trim();
        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            start = ''; end = '';
        } else if (line === 'END:VEVENT') {
            inEvent = false;
            if (start) processReservation(start, end || start);
        } else if (inEvent) {
            if (line.startsWith('DTSTART')) {
                const match = line.match(/:(\d{8})/);
                if (match) start = match[1];
            } else if (line.startsWith('DTEND')) {
                const match = line.match(/:(\d{8})/);
                if (match) end = match[1];
            }
        }
    }
}

async function run() {
    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.text();
                parseICal(data);
            }
        } catch (err) {
            console.error("Chyba pri stahovani URL:", url, err);
        }
    }

    const result = { booked: bookedDates, checkIn: checkInDates, checkOut: checkOutDates };
    fs.writeFileSync('obsazenost.json', JSON.stringify(result));
    console.log("Kalendar byl uspesne aktualizovan!");
}

run();
