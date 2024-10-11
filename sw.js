const VERSION = "v3";

// offline resource list
const APP_STATIC_RESOURCES = [
    "index.html",
    "style.css",
    "app.js",
    "manifest.json",
    "assets/icons/icon-512x512.png"
];

const CACHE_NAME = `vacation-tracker-${VERSION}`;

// handle the install event and retrieve and store the file listed for the cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async() => {
            const cache = await caches.open(CACHE_NAME);
            cache.addAll(APP_STATIC_RESOURCES);
        })()
    );
});
  
/* use the activate even to delete any old caches so we dont't run out of space.
    We're going to delete all but the current one. Then set the service worker
    as the controller for our app (PWA). */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async() => {
            // get the names of the existing caches
            const names = await caches.keys();

            /* iterate through the list and check each one to see if it's the current
                cache and delete it if not */
            await Promise.all(
                names.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            ); 

            /* user the claim() method of the client's interface to enable our service worker
                as the controller */
            await clients.claim();
        })()
    );
});

/* use the fetch event to intercept request to the server so we can serve up our 
    cached pagesor respond with an error or 404 */
self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async() => {
            // try to get the resource from the cache
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // if not cached, try to fetch from the network
            try {
                const networkResponse = await fetch(event.request);

                // cache new response for future use
                cache.put(event.request, networkResponse.clone());

                return networkResponse;

            } catch(error) {
                console.error("fetch failed; returning offline page instead.", error);

                // if the request is for a page, return index.html as a fallback
                if (event.request.mode === "navigate") {
                    return cache.match("/index.html");
                }

                // for everything else, we're just going to throw an error
                // you might want to return a default offline asset instead
                throw error;
            };
        })()
    );
    
});

// //send a message to the client - we will use to update data later
// function sendMessageToPwa(message){
//     self.clients.matchAll().then((clients) => {
//         clients.forEach((client) => {
//             client.postMessage(message);
//         });
//     });

// }

// setInterval(()=>{
//     sendMessageToPwa({type: "update", data: "New data available"})
// },10000);

// //listen for messages from the app
// self.addEventListener("message", (event)=>{
//     console.log("service worker received a message", event.data);

//     //you can respond back if needed
//     event.source.postMessage({
//         type: "response",
//         data: "Message received by sw",
//     });
// });

//create a broadcast channe; - name here needs to match the name in sw
const channel = new BroadcastChannel("pwa_channel");

//listen for messages
channel.onmessage = (event) => {
    console.log("Received message in Service Worker:", event.data);
    
    //echo the message back to the PWA
    channel.postMessage("Service Worker received:" + event.data);
};

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
    console.log("Database opened successfully in serviceWorker");
};

self.addEventListener("sync", function(event){
    if(event.tag === "send-data"){
        event.waitUntil(sendDataToSever());
    }
});

function sendDataToSever(){

}