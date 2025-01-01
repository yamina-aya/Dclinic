document.addEventListener('DOMContentLoaded', function() {
    const productsTableBody = document.getElementById('productsTableBody');
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productForm');
    const backToTableBtn = document.querySelector('.back-to-table');
    const cancelBtn = document.querySelector('.cancel-btn');
    const searchInput = document.getElementById('searchInput');
    const searchCategory = document.getElementById('searchCategory');
    const sortButton = document.getElementById('sortButton');
    const orderButton = document.getElementById('orderButton');
    
    let currentSort = 'name';
    let isAscending = true;

    // Load products when page loads
    loadFilteredProducts();

    // Add Product Button Click Handler
    addProductBtn.addEventListener('click', function() {
        document.querySelector('.product-content').classList.add('show-form');
    });

    // Back and Cancel buttons
    backToTableBtn.addEventListener('click', resetForm);
    cancelBtn.addEventListener('click', resetForm);

    // Form submission
    productForm.addEventListener('submit', handleFormSubmit);

    // Edit Product Function
    window.editProduct = function(id) {
        fetch(`http://localhost:3000/products/${id}`)
            .then(response => response.json())
            .then(product => {
                document.querySelector('.product-content').classList.add('show-form');
                document.querySelector('.form-container h2').textContent = 'Edit Product';
                
                // Fill form with product data
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productQuantity').value = product.quantity;
                
                productForm.setAttribute('data-edit-id', id);
            })
            .catch(error => console.error('Error:', error));
    };

    // Delete Product Function
    window.deleteProduct = function(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            fetch(`http://localhost:3000/products/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                    return;
                }
                showNotification('Product deleted successfully', 'success');
                loadFilteredProducts();
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error deleting product', 'error');
            });

        }
    };

    // Add this function at the top of your file
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <span class="material-icons-sharp">${type === 'success' ? 'check_circle' : 'error'}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                container.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Form Submit Handler
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            quantity: parseInt(document.getElementById('productQuantity').value)
        };

        const editId = this.getAttribute('data-edit-id');
        const url = editId 
            ? `http://localhost:3000/products/${editId}`
            : 'http://localhost:3000/add-product';

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
            showNotification(editId ? 'Product updated successfully' : 'Product added successfully', 'success');
            resetForm();
            loadFilteredProducts();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error saving product', 'error');
        });
    }

    // Reset Form Function
    function resetForm() {
        productForm.reset();
        productForm.removeAttribute('data-edit-id');
        document.querySelector('.product-content').classList.remove('show-form');
        document.querySelector('.form-container h2').textContent = 'Add New Product';
    }

    // Load Products Function
    function loadFilteredProducts() {
        fetch('http://localhost:3000/products')
            .then(response => response.json())
            .then(products => {
                productsTableBody.innerHTML = '';
                
                products.forEach(product => {
                    const row = createTableRow(product);
                    productsTableBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Toggle sort menu
    sortButton.addEventListener('click', (e) => {
        sortButton.classList.toggle('active');
        e.stopPropagation();
    });

    // Close sort menu when clicking outside
    document.addEventListener('click', () => {
        sortButton.classList.remove('active');
    });

    // Handle sort option selection
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            document.querySelectorAll('.sort-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            currentSort = option.dataset.sort;
            sortTable();
            sortButton.classList.remove('active');
        });
    });

    // Set initial selected option
    document.querySelector(`.sort-option[data-sort="name"]`).classList.add('selected');

    // Toggle sort order
    orderButton.addEventListener('click', () => {
        isAscending = !isAscending;
        orderButton.classList.toggle('desc');
        sortTable();
    });

    function sortTable() {
        const rows = Array.from(document.querySelectorAll('#productsTableBody tr'));
        const column = {
            'name': 0,
            'category': 4,
            'price': 2,
            'stock': 3
        }[currentSort];

        const multiplier = isAscending ? 1 : -1;

        rows.sort((a, b) => {
            let aValue = a.children[column].textContent;
            let bValue = b.children[column].textContent;

            // Convert to numbers for price and stock columns
            if (column === 2 || column === 3) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (typeof aValue === 'number') {
                return (aValue - bValue) * multiplier;
            } else {
                return aValue.localeCompare(bValue) * multiplier;
            }
        });

        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = searchCategory.value;
        const tableRows = document.querySelectorAll('#productsTableBody tr');

        tableRows.forEach(row => {
            let matches = false;
            
            if (category === 'all') {
                const name = row.children[0].textContent.toLowerCase();
                const productCategory = row.children[4].textContent.toLowerCase();
                
                matches = name.includes(searchTerm) || productCategory.includes(searchTerm);
            } else {
                const columnIndex = {
                    'name': 0,
                    'category': 4
                }[category];
                
                const cellContent = row.children[columnIndex].textContent.toLowerCase();
                matches = cellContent.includes(searchTerm);
            }

            row.style.display = matches ? '' : 'none';
        });
    }

    // Event listeners for search
    searchInput.addEventListener('input', performSearch);
    searchCategory.addEventListener('change', performSearch);

    // When creating table rows in your JavaScript
    function createTableRow(product) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.id}</td>
            <td>${product.price}</td>
            <td>${product.quantity}</td>
            <td>${product.category}</td>
            <td>
                <span class="status ${product.quantity <= 0 ? 'out-of-stock' : product.quantity <= 10 ? 'low-stock' : 'in-stock'}">
                    ${product.quantity <= 0 ? 'Out of Stock' : product.quantity <= 10 ? 'Low Stock' : 'In Stock'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editProduct(${product.id})">
                        <span class="material-icons-sharp">edit</span>
                        <span class="text">Edit</span>
                    </button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">
                        <span class="material-icons-sharp">delete</span>
                        <span class="text">Delete</span>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    // Add theme toggler functionality
    const themeToggler = document.querySelector(".theme-toggler");
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
        themeToggler.querySelector('span:nth-child(2)').classList.add('active');
    }
    // Theme toggle event listener
    themeToggler.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode-variables');
        themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
        themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');

        // Save theme preference
        localStorage.setItem('theme', document.body.classList.contains('dark-mode-variables') ? 'dark' : 'light');
    });
});

