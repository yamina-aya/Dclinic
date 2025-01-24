// Get theme toggler elements
const themeToggler = document.querySelector('.theme-toggler');
const lightModeIcon = document.querySelector('.theme-toggler .material-icons-sharp:nth-child(1)');
const darkModeIcon = document.querySelector('.theme-toggler .material-icons-sharp:nth-child(2)');
const body = document.body;

// Check for saved theme preference
const darkMode = localStorage.getItem('darkMode');

// Apply dark mode if previously saved
if (darkMode === 'enabled') {
    body.classList.add('dark-theme');
    lightModeIcon.classList.remove('active');
    darkModeIcon.classList.add('active');
}

// Add click event listener to toggle theme
themeToggler.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    lightModeIcon.classList.toggle('active');
    darkModeIcon.classList.toggle('active');
    
    // Save preference to localStorage
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', null);
    }
});

// View Toggle Functionality
const viewToggles = document.querySelectorAll('.view-toggle');
const feedbackContainer = document.querySelector('.feedback-container');
const feedbackGrid = document.querySelector('.feedback-grid');
const feedbackTable = document.querySelector('.feedback-table');

viewToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        viewToggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');
        
        const view = toggle.dataset.view;
        if (view === 'grid') {
            feedbackContainer.classList.remove('table-view');
            feedbackContainer.classList.add('grid-view');
            feedbackGrid.style.display = 'grid';
            feedbackTable.style.display = 'none';
        } else {
            feedbackContainer.classList.remove('grid-view');
            feedbackContainer.classList.add('table-view');
            feedbackGrid.style.display = 'none';
            feedbackTable.style.display = 'block';
        }
    });
});

// Fetch and Display Feedback with debugging
async function fetchFeedback() {
    try {
        console.log('Fetching feedback...');
        const response = await fetch('http://localhost:3000/api/feedback');
        console.log('Response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const feedback = await response.json();
        console.log('Feedback data:', feedback);
        
        if (feedback.length === 0) {
            console.log('No feedback found');
            feedbackGrid.innerHTML = '<p>No feedback available.</p>';
            return;
        }
        
        displayFeedback(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        feedbackGrid.innerHTML = '<p>Error loading feedback. Please try again later.</p>';
    }
}

function displayFeedback(feedback) {
    console.log('Displaying feedback:', feedback);
    
    // Display in Grid View
    feedbackGrid.innerHTML = feedback.map(item => `
        <div class="feedback-card" data-id="${item.id}">
            <div class="header">
                <div class="client-info">
                    <h3>${item.client_name}</h3>
                    <small>${new Date(item.date).toLocaleDateString()}</small>
                </div>
                <span class="status ${item.status.toLowerCase()}">${item.status}</span>
            </div>
            <p class="feedback-message">${item.message}</p>
            ${item.reply ? `
                <div class="reply-section">
                    <h4>Admin Reply:</h4>
                    <p class="reply-message">${item.reply}</p>
                    <small class="reply-date">Replied on: ${new Date(item.reply_date).toLocaleDateString()}</small>
                </div>
            ` : ''}
            ${item.status === 'Pending' ? `
                <button class="reply-btn" onclick="openReplyModal(${item.id}, '${item.message.replace(/'/g, "\\'")}')">
                    <span class="material-icons-sharp">reply</span> Reply
                </button>
            ` : ''}
        </div>
    `).join('');

    // Display in Table View
    const tbody = feedbackTable.querySelector('tbody');
    tbody.innerHTML = feedback.map(item => `
        <tr data-id="${item.id}">
            <td>${item.client_name}</td>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td class="subject-cell">
                <div class="message-content">
                    <p>${item.message}</p>
                    ${item.reply ? `
                        <div class="reply-content">
                            <small>Reply: ${item.reply}</small>
                        </div>
                    ` : ''}
                </div>
            </td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
            <td>
                ${item.status === 'Pending' ? `
                    <button class="reply-btn" onclick="openReplyModal(${item.id}, '${item.message.replace(/'/g, "\\'")}')">
                        <span class="material-icons-sharp">reply</span>
                    </button>
                ` : `
                    <span class="material-icons-sharp replied-icon">done_all</span>
                `}
            </td>
        </tr>
    `).join('');
}

// Reply Modal Functionality
const modal = document.getElementById('replyModal');
const closeModal = document.querySelector('.close-modal');
const sendReplyBtn = document.querySelector('.send-reply');
let currentFeedbackId = null;

function openReplyModal(feedbackId, originalMessage) {
    currentFeedbackId = feedbackId;
    modal.style.display = 'block';
    document.querySelector('.original-feedback').innerHTML = `
        <h4>Original Feedback:</h4>
        <p>${originalMessage}</p>
    `;
    document.getElementById('replyText').value = ''; // Clear previous reply
}

closeModal.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Add notification function
function showNotification(message, type = 'success') {
    console.log('Showing notification:', message, type); // Debug log
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Update the reply function
sendReplyBtn.addEventListener('click', async () => {
    const replyText = document.getElementById('replyText').value;
    if (!replyText.trim()) {
        showNotification('Please enter a reply', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/feedback/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                feedbackId: currentFeedbackId,
                reply: replyText,
                adminId: 1 // You might want to get this from your authentication system
            })
        });

        if (response.ok) {
            modal.style.display = 'none';
            document.getElementById('replyText').value = '';
            showNotification('Reply sent successfully!', 'success');
            await fetchFeedback(); // Refresh the feedback list
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to send reply.', 'error');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        showNotification('Error sending reply.', 'error');
    }
});

// Initial load with console log
console.log('Script loaded, fetching feedback...');
fetchFeedback();

