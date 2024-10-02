// Constants for the form and form controls
const newVacationForm = document.getElementById("vacation-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

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

function renderPastVacations() {

};

