// Constants for the form and form controls
const newVacationForm = document.getElementById("vacation-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const pastVacationContainer = document.getElementById("past-vacations");

// Listen to form submissions
newVacationForm.addEventListener("submit", (event)=> {
    // prevent form from submitting to the server
    // since everything will be on client side
    event.preventDefault();

    // get dates from the form
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    // validate dates
    if (checkDatesInvalid(startDate, endDate)) {
        return; // don't submit the form, just exit
    }

    // store the new vacation in our client-side storage
    storeNewVacation(startDate, endDate);

    // refresh UI
    renderPastVacations();

    // reset the form
    newVacationForm.reset();
});

function checkDatesInvalid(startDate, endDate) {
    if (!startDate || !endDate || startDate > endDate) {
        // error message
        // we're just gonna clear the form if anything is invalid
        newVacationForm.reset();

        return true; // something is invalid
    } else {
        return false; // everything is good
    }
};

// add the storage key as an app-wide constant
const STORAGE_KEY = "vacation_tracker";

function storeNewVacation(startDate, endDate) {
    // get data from the storage
    const vacations = getAllStoredVacations(); // returns an array of Strings
    
    // add new vacation (JSON object) at the end of the array
    vacations.push({startDate, endDate});

    // sort the array so newest to oldest
    vacations.sort((a, b) => {
        return new Date(b.startDate) - new Date(a.startDate)
    });

    // store the new array back in storage

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vacations));
};

function getAllStoredVacations(){
    //get the string of vacation from localStorage
    const data = window.localStorage.getItem(STORAGE_KEY);

    //if no vacations are stored, default to an empty array
    //other wise, return the stored data (JSON string) as parsed JSON
    const vacations = data ? JSON.parse(data) : [];

    return vacations;
}

function renderPastVacations() {
    //get the parsed string of vacations or an empty array if there arent any 
    const vacations = getAllStoredVacations();

    //exit if there arent any vacations
    if(vacations.length === 0){
        return;
    }

    //clear the list of past vacations since we're going to re-render it
    pastVacationContainer.innerHTML = "";

    const pastVacationHeader = document.createElement("h2");
    pastVacationHeader.textContent = "Past Vacations";

    const pastVacationList = document.createElement("ul");

    //loop over all vacations and render them
    vacations.forEach((vacation) =>{
        const vacationEl = document.createElement("li");
        vacationEl.textContent = `From ${formatDate(vacation.startDate)}
        to ${formatDate(vacation.endDate)}`;
        pastVacationList.appendChild(vacationEl);
    });

    pastVacationContainer.appendChild(pastVacationHeader);
    pastVacationContainer.appendChild(pastVacationList);

};

function formatDate(dateString){
    //convert the date string to a Date object
    const date = new Date(dateString);

    //format the date into a location specific string.
    //include your locale for a better user experience.
    return date.toLocaleDateString("en-US", {timeZone: "UTC"});
};

renderPastVacations();

//register the service worker
if ("serviceWork" in navigator){
    navigator.serviceWorker.register("sw.js").then((registation)=>{
        console.log("Service worker registered with scope:",registation.scope);
    })
    .catch((error)=>{
        console.log("Service worker registration failed:", error);
    });
}

// //listen for messages from the service worker
// navigator.serviceWorker.addEventListener("message", (event)=>{
//     console.log("received a message from service worker:", event.data);

//     if(event.data.type === "update"){
//         console.log("Update received:", event.data.data);
//     }
// });

// //handle different message types


// //function to send a message to the service worker
// function sendMessageToSw(message){
//     if(navigator.serviceWorker.controller){
//         navigator.serviceWorker.controller.postMessage(message);
//     }
// }

//send a amessage when button is clicked
// document.getElementById("sendButton").addEventListener("click", ()=>{
//     sendMessageToSw({type: "action", data: "Button clicked"});
// });

//create a broadcast channe; - name here needs to match the name in sw
const channel = new BroadcastChannel("pwa_channel");

//listen for messages
channel.onmessage = (event) => {
    console.log("Received a message in PWA:", event.data);
    document.getElementById("messages")
        .insertAdjacentElement("beforeend", '<p>Received : ${event.data}</p>');
};

//send a amessage when button is clicked
document.getElementById("sendButton").addEventListener("click", ()=>{
    const message = "Hello from PWA!";
    channel.postMessage(message);
    console.log("Sent message from PWA:", message);
});

//open or create the database
let db;
const dbName = "SyncDatabase";
const request = indexedDB.open(dbName,1);

request.onerror = function (event){
    console.error("Database error: " + event.target.error);
};

request.onsuccess = function(event){
    //now we actually have our db
    db = event.target.result;
    console.log("Database opened successfully");
};

request.onupgradeneeded = function (event){
    db = event.target.result;

    //create any new object stores for our db or delete any old ones from a previous version
    const objectStore = db.createObjectStore("pendingData",
        {
            keyPath:"id",
            autoIncrement: true
        }
    );
};

//add data to out db, we need a transaction to accomplish it
function addDataToIndexedDB(data){
    return new Promise((resolve, reject) =>{

        const transaction = db.transaction(["pendingData"], "readwrite");
        const objectStore = transaction.objectStore("pendingData");
        const request = objectStore.add({data: data});

        request.onsuccess = function(event) {
            resolve();
        };
        request.onerror = function(event){
            reject("Error storing data: " + event.target.error);
        };

    });
}

//handle form submission
document.getElementById("dataForm").addEventListener("submit",function(event){
    event.preventDefault();

    //get our data
    const data = document.getElementById("dataInput").value;
    
    //we need to check to see if both the serviceWorker and the SyncManager available
    if("serviceWorker" in navigator && "SyncManager" in window){
        //we're good to add the data to the db for offline persistence
        addDataToIndexedDB(data).then(() => navigator.serviceWorker.ready)
        .then((registation) =>{
            //registers a sync event for when the device come online
            return registation.sync.register("send-data");
        })
        .then(() =>{
            //update the UI for successful registration
            document.getElementById("status").textContent = 
            "Sync registered. Data will be sent when online";
        })
        .catch((error)=>{
            console.log("Error: ", error);
        })
    } else{
        //background sync isn't supported, try to send immediatley
        sendData(data)
        .then((result)=>{
            //update UI
            document.getElementById("status").textContent = result;
        })
        .catch((error)=>{
            //update UI
            document.getElementById("status").textContent = error.message;
        })
    }

});

function sendData(data){
    console.log("Attempting to send data:", data);

    return new Promise((resolve, reject) =>{
        setTimeout(()=>{
            if(Math.random() > 0.5){
                resolve("Data sent successfully");
            } else{
                reject(new Error("Failed to send data"));
            }
        }, 1000);
    })
}