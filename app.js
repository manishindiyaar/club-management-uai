// app.js

// Initialize events data if not already present
const initializeData = () => {
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
};

// Existing loadContent function updated to include the student events view
const loadContent = (section) => {
    const contentArea = document.getElementById('content-area');
    switch(section) {
        // Admin pages
        case 'create-event':
            contentArea.innerHTML = createEventForm();
            break;
        case 'manage-events':
            contentArea.innerHTML = manageEvents();
            break;
        // Student pages
        case 'events':
            contentArea.innerHTML = displayOngoingEvents();
            break;
        case 'my-club':
            contentArea.innerHTML = `<div class="content-card"><h2>My Club</h2><p>Your club information will be displayed here.</p></div>`;
            break;
        case 'clubs':
            displayClubs();
            break;
        default:
            contentArea.innerHTML = '';
    }
};

// Function to create a new event form (used in admin)
const createEventForm = () => {
    return `
        <div class="content-card">
            <h2>Create New Event</h2>
            <form onsubmit="event.preventDefault(); handleCreateEvent(this)">
                <input type="text" name="title" placeholder="Event Title" required>
                <input type="date" name="date" required>
                <textarea name="description" placeholder="Event Description" required></textarea>
                <button type="submit">Create Event</button>
            </form>
        </div>
    `;
};

const handleCreateEvent = (form) => {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const formData = new FormData(form);

    const newEvent = {
        id: 'event-' + Date.now(),
        title: formData.get('title'),
        date: formData.get('date'),
        description: formData.get('description'),
        clubId: 'club-1'
    };

    localStorage.setItem('events', JSON.stringify([...events, newEvent]));
    loadContent('manage-events');
};

const manageEvents = () => {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    return `
        <div class="content-card">
            <h2>Manage Events</h2>
            <div class="event-list">
                ${events.map(event => `
                    <div class="event-card">
                        <div>
                            <h3>${event.title}</h3>
                            <p>${event.date}</p>
                            <p>${event.description}</p>
                        </div>
                        <div class="event-actions">
                            <button onclick="handleEditEvent('${event.id}')">Edit</button>
                            <button onclick="deleteEvent('${event.id}')">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

const handleEditEvent = (eventId) => {
    const events = JSON.parse(localStorage.getItem('events'));
    const event = events.find(e => e.id === eventId);
    if (!event) return alert('Event not found');
    
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="content-card">
            <h2>Edit Event</h2>
            <form onsubmit="event.preventDefault(); handleUpdateEvent('${event.id}', this)">
                <input type="text" name="title" value="${event.title}" required>
                <input type="date" name="date" value="${event.date}" required>
                <textarea name="description" required>${event.description}</textarea>
                <button type="submit">Update Event</button>
            </form>
        </div>
    `;
};

const handleUpdateEvent = (eventId, form) => {
    const events = JSON.parse(localStorage.getItem('events'));
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) return alert('Event not found');
    
    const formData = new FormData(form);
    events[eventIndex] = {
        ...events[eventIndex],
        title: formData.get('title'),
        date: formData.get('date'),
        description: formData.get('description')
    };

    localStorage.setItem('events', JSON.stringify(events));
    loadContent('manage-events');
};

const deleteEvent = (eventId) => {
    const events = JSON.parse(localStorage.getItem('events'));
    const updatedEvents = events.filter(e => e.id !== eventId);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    loadContent('manage-events');
};

// --- New Function for Student Page --- //

const displayOngoingEvents = () => {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    
    // Sort events so that the newest events (by date) appear first.
    const sortedEvents = events.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return `
        <div class="content-card">
            <h2>Ongoing Events</h2>
            <div class="event-list">
                ${sortedEvents.length ? sortedEvents.map(event => `
                    <div class="event-card">
                        <div>
                            <h3>${event.title}</h3>
                            <p>${event.date}</p>
                            <p>${event.description}</p>
                        </div>
                    </div>
                `).join('') : '<p>No events available.</p>'}
            </div>
        </div>
    `;
};


// --- New Function for Displaying Clubs --- //
const displayClubs = async () => {
    try {
        const response = await fetch('clubs.json');
        const clubs = await response.json();

        let clubsHTML = clubs.map(club => {
            return `
                <div class="club-card">
                    <img src="${club.logo}" alt="${club.club_name} logo" class="club-logo">
                    <div class="club-details">
                        <h3>${club.club_name}</h3>
                        <p><strong>President:</strong> ${club.president}</p>
                        <p><strong>Vice President:</strong> ${club.vice_president}</p>
                        <p><strong>Total Members:</strong> ${club.total_member}</p>
                    </div>
                </div>
            `;
        }).join('');

        const contentHTML = `
            <div class="content-card">
                <h2>All Clubs</h2>
                <div class="club-list">${clubsHTML}</div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = contentHTML;
    } catch (error) {
        console.error("Error fetching clubs data:", error);
        document.getElementById('content-area').innerHTML = `<div class="content-card"><h2>All Clubs</h2><p>Error loading clubs data.</p></div>`;
    }
};


// Initialize the application
initializeData();

// For Admin Dashboard (if using admin.html)
// loadContent('manage-events');

// For Student Dashboard (if using student.html)
if(document.title.includes("Student")) {
    loadContent('events'); // Load the ongoing events view by default
}
