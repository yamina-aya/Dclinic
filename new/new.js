document.addEventListener('DOMContentLoaded', function() {
    const prosthesesTableBody = document.getElementById('prosthesesTableBody');
    const addProsthesisBtn = document.getElementById('addProductBtn');
    const prosthesisForm = document.getElementById('prosthesisForm');
    const backToTableBtn = document.querySelector('.back-to-table');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    // Load prostheses when page loads
    loadProstheses();

    // Add Prosthesis Button Click Handler
    addProsthesisBtn.addEventListener('click', function() {
        document.querySelector('.product-content').classList.add('show-form');
    });

    // Back and Cancel buttons
    backToTableBtn.addEventListener('click', resetForm);
    cancelBtn.addEventListener('click', resetForm);

    // Form submission
    prosthesisForm.addEventListener('submit', handleFormSubmit);

    // Theme toggler
    const themeToggler = document.querySelector(".theme-toggler");
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
        themeToggler.querySelector('span:nth-child(2)').classList.add('active');
    }

    themeToggler.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
        themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');
        
        localStorage.setItem('theme', 
            document.body.classList.contains('dark-mode-variables') ? 'dark' : 'light'
        );
    });
});

// Load Prostheses Function
function loadProstheses() {
    fetch('http://localhost:3000/prostheses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(prostheses => {
            prosthesesTableBody.innerHTML = '';
            prostheses.forEach(prosthesis => {
                const row = createTableRow(prosthesis);
                prosthesesTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading prostheses', 'error');
        });
}

// Create table row function
function createTableRow(prosthesis) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${prosthesis.first_name}</td>
        <td>${prosthesis.last_name}</td>
        <td>${prosthesis.type}</td>
        <td>${prosthesis.total_amount}</td>
        <td>${prosthesis.paid_amount}</td>
        <td>
            <span class="status ${getPaymentStatusClass(prosthesis.payment_status)}">
                ${prosthesis.payment_status}
            </span>
        </td>
        <td>
            <span class="status ${getTreatmentStatusClass(prosthesis.status)}">
                ${prosthesis.status}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                <button onclick="editProsthesis(${prosthesis.id})">
                    <span class="material-icons-sharp">edit</span>
                </button>
                <button onclick="deleteProsthesis(${prosthesis.id})">
                    <span class="material-icons-sharp">delete</span>
                </button>
            </div>
        </td>
    `;
    return row;
}

// Form Submit Handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        type: document.getElementById('prosthesisType').value,
        total_amount: parseFloat(document.getElementById('totalAmount').value),
        paid_amount: parseFloat(document.getElementById('paidAmount').value),
        payment_status: document.getElementById('paymentStatus').value,
        status: document.getElementById('treatmentStatus').value
    };

    const editId = prosthesisForm.getAttribute('data-edit-id');
    const url = editId 
        ? `http://localhost:3000/prostheses/${editId}`
        : 'http://localhost:3000/add-prosthesis';

    fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }
        showNotification(
            editId ? 'Prosthesis updated successfully' : 'Prosthesis added successfully',
            'success'
        );
        resetForm();
        loadProstheses();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving prosthesis', 'error');
    });
}

// Reset Form
function resetForm() {
    prosthesisForm.reset();
    prosthesisForm.removeAttribute('data-edit-id');
    document.querySelector('.product-content').classList.remove('show-form');
}

// Status Classes
function getPaymentStatusClass(status) {
    const classes = {
        'Paid': 'in-stock',
        'Partial': 'low-stock',
        'Pending': 'out-of-stock'
    };
    return classes[status] || '';
}

function getTreatmentStatusClass(status) {
    const classes = {
        'Completed': 'in-stock',
        'In Progress': 'low-stock',
        'Cancelled': 'out-of-stock'
    };
    return classes[status] || '';
}

// Show Notification
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}
