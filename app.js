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




