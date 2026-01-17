// HestiaViz Redux - Main Application
// Geographic visualization for Herodotus' Histories

// Sample geographic data from Herodotus
const locations = [
    {
        name: "Athens",
        lat: 37.9838,
        lng: 23.7275,
        description: "The great city-state of Athens, central to Greek democracy and culture.",
        references: "Mentioned throughout the Histories as a major Greek power."
    },
    {
        name: "Sparta",
        lat: 37.0733,
        lng: 22.4309,
        description: "The military state of Sparta, rival to Athens.",
        references: "Known for its military prowess and role in the Persian Wars."
    },
    {
        name: "Thermopylae",
        lat: 38.7999,
        lng: 22.5365,
        description: "The narrow pass where 300 Spartans made their famous stand.",
        references: "Site of the legendary battle against Persian forces in 480 BCE."
    },
    {
        name: "Delphi",
        lat: 38.4824,
        lng: 22.5010,
        description: "Home of the famous Oracle of Apollo.",
        references: "A sacred site where Greeks sought prophecies and divine guidance."
    },
    {
        name: "Babylon",
        lat: 32.5355,
        lng: 44.4275,
        description: "The magnificent capital of the Persian Empire.",
        references: "Described in detail by Herodotus in Book I."
    },
    {
        name: "Egypt",
        lat: 26.8206,
        lng: 30.8025,
        description: "The ancient land of the Nile, explored by Herodotus.",
        references: "Subject of Book II of the Histories."
    },
    {
        name: "Marathon",
        lat: 38.1167,
        lng: 23.9667,
        description: "Site of the famous battle where Athens defeated Persia.",
        references: "The Battle of Marathon in 490 BCE was a turning point in Greek history."
    },
    {
        name: "Salamis",
        lat: 37.9644,
        lng: 23.5553,
        description: "Island where the Greek fleet defeated the Persians.",
        references: "The naval battle of 480 BCE was crucial to Greek victory."
    }
];

// Sample text excerpts from Herodotus
const textExcerpts = [
    {
        text: "These are the researches of Herodotus of Halicarnassus, which he publishes, in the hope of thereby preserving from decay the remembrance of what men have done, and of preventing the great and wonderful actions of the Greeks and the Barbarians from losing their due meed of glory; and withal to put on record what were their grounds of feuds.",
        places: []
    },
    {
        text: "Now the Persians say that the Phoenicians were the cause of the dispute. These people came from the shores of the Erythraean sea, and settled in the country where they now dwell. They at once began to adventure on long voyages, freighting their vessels with the wares of <span class='place-name' data-location='Egypt'>Egypt</span> and Assyria.",
        places: ["Egypt"]
    },
    {
        text: "The Lacedaemonians, or Spartans, had sent their king Leonidas with his famous three hundred to hold the pass of <span class='place-name' data-location='Thermopylae'>Thermopylae</span> against the vast army of Xerxes. This was ground they had chosen with great care, as it was so narrow that the Persian numbers would count for nothing.",
        places: ["Thermopylae"]
    },
    {
        text: "After this, the Persians held a council, whereat it was resolved that they should make an attempt upon <span class='place-name' data-location='Athens'>Athens</span> by sea. The Greeks, meanwhile, prepared their defense, and the Athenians sent to <span class='place-name' data-location='Delphi'>Delphi</span> to consult the oracle.",
        places: ["Athens", "Delphi"]
    },
    {
        text: "The battle of <span class='place-name' data-location='Marathon'>Marathon</span> was fought in the archonship of Phaenippus. The Persians landed on the plain, but the Athenians, though greatly outnumbered, charged down from the hills and won a glorious victory.",
        places: ["Marathon"]
    },
    {
        text: "Concerning <span class='place-name' data-location='Babylon'>Babylon</span>, the city stands in a vast plain, and is in form a square. The walls are of enormous height and thickness, and the city is divided into two portions by the river Euphrates which flows through the middle of it.",
        places: ["Babylon"]
    }
];

// Initialize map
let map;
let markers = {};

function initMap() {
    // Create map centered on ancient Greece/Mediterranean
    map = L.map('map').setView([38.0, 24.0], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Add markers for each location
    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
            .addTo(map)
            .bindPopup(`<b>${location.name}</b><br>${location.description}`);

        marker.on('click', () => {
            showLocationInfo(location);
        });

        markers[location.name] = marker;
    });
}

function showLocationInfo(location) {
    const infoDiv = document.getElementById('location-details');
    infoDiv.innerHTML = `
        <h4>${location.name}</h4>
        <p><strong>Description:</strong> ${location.description}</p>
        <p><strong>Historical Context:</strong> ${location.references}</p>
        <p><em>Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</em></p>
    `;
}

function loadText() {
    const textContent = document.getElementById('text-content');
    textContent.innerHTML = textExcerpts.map((excerpt, index) =>
        `<p class="text-excerpt">${excerpt.text}</p>`
    ).join('');

    // Add click handlers to place names
    document.querySelectorAll('.place-name').forEach(element => {
        element.addEventListener('click', () => {
            const locationName = element.getAttribute('data-location');
            const location = locations.find(loc => loc.name === locationName);
            if (location) {
                // Show location info
                showLocationInfo(location);

                // Pan to location on map
                map.setView([location.lat, location.lng], 8);

                // Open popup
                if (markers[locationName]) {
                    markers[locationName].openPopup();
                }
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadText();
});
