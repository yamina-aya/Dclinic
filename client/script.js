document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = checkUserLoginStatus();
    
    if (!isLoggedIn) {
        window.location.href = '/login';
        return;
    }

    const stars = document.querySelectorAll('.fa-star');
    let currentRating = 0;

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            highlightStars(rating, true);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(currentRating, false);
        });

        star.addEventListener('click', function() {
            currentRating = this.dataset.rating;
            highlightStars(currentRating, false);
        });
    });

    function highlightStars(rating, isHover) {
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            star.classList.remove('fas', 'far', 'active', 'hover');
            
            if (starRating <= rating) {
                star.classList.add('fas');
                star.classList.add(isHover ? 'hover' : 'active');
            } else {
                star.classList.add('far');
            }
        });
    }

    // Form submission
    document.getElementById('feedbackForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (currentRating === 0) {
            alert('Please provide a rating before submitting.');
            return;
        }
        
        const category = document.querySelector('input[name="category"]:checked').value;
        const message = document.getElementById('message').value;
        
        console.log('Feedback submitted:', { 
            rating: currentRating,
            category,
            message 
        });
        
        // Clear form
        this.reset();
        currentRating = 0;
        highlightStars(0, false);
        alert('Thank you for your feedback!');
    });
});

function checkUserLoginStatus() {
    // Implement your login check logic here
    return true; // Placeholder return
}
