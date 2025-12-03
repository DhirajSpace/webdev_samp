document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Wait for Firebase to be available
    const waitForFirebase = () => {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebase) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    };
    
    // Login form handling with Firebase
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            try {
                await waitForFirebase();
                const { signInWithEmailAndPassword, auth } = window.firebase;
                
                showMessage('Signing in...', 'info');
                
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Fetch user data from Firestore
                const { db, doc, getDoc } = window.firebase;
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // Store user info in session
                    sessionStorage.setItem('userEmail', user.email);
                    sessionStorage.setItem('userId', user.uid);
                    sessionStorage.setItem('userFullName', userData.fullName || '');
                    sessionStorage.setItem('username', userData.username || '');
                } else {
                    // Fallback if user data doesn't exist in Firestore
                    sessionStorage.setItem('userEmail', user.email);
                    sessionStorage.setItem('userId', user.uid);
                    sessionStorage.setItem('userFullName', '');
                    sessionStorage.setItem('username', '');
                }
                
                showMessage('Login successful! Redirecting to home page...', 'success');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. Please try again.';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email address.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later.';
                        break;
                }
                
                showMessage(errorMessage, 'error');
            }
        });
    }
    
    // Register form handling with Firebase
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;
            
            // Basic validation
            if (!fullName || !email || !username || !password || !confirmPassword) {
                showMessage('Please fill in all required fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters long', 'error');
                return;
            }
            
            if (!terms) {
                showMessage('Please accept the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            try {
                await waitForFirebase();
                const { createUserWithEmailAndPassword, auth, db, doc, setDoc } = window.firebase;
                
                showMessage('Creating account...', 'info');
                
                // Create user with Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Store additional user data in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    fullName: fullName,
                    email: email,
                    username: username,
                    createdAt: new Date().toISOString(),
                    coursesCompleted: [],
                    quizScores: {},
                    quizAttempts: {},
                    courseProgress: {},
                    lastUpdated: new Date().toISOString()
                });
                
                // Store user info in session
                sessionStorage.setItem('userEmail', user.email);
                sessionStorage.setItem('userId', user.uid);
                sessionStorage.setItem('userFullName', fullName);
                sessionStorage.setItem('username', username);
                
                showMessage('Registration successful! Redirecting to home page...', 'success');
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
                
            } catch (error) {
                console.error('Registration error:', error);
                let errorMessage = 'Registration failed. Please try again.';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'An account with this email already exists.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak. Please choose a stronger password.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Email/password accounts are not enabled.';
                        break;
                }
                
                showMessage(errorMessage, 'error');
            }
        });
    }
    
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-input, .hero-search');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value;
                if (searchTerm.trim()) {
                    alert(`Searching for: "${searchTerm}"`);
                    // Here you would implement actual search functionality
                }
            }
        });
    });
    
    // Home page search functionality
    const homeSearchInput = document.getElementById('homeSearchInput');
    if (homeSearchInput) {
        homeSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim().toLowerCase();
                if (searchTerm) {
                    performHomeSearch(searchTerm);
                }
            }
        });
        
        // Also search on input for real-time filtering
        homeSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            if (searchTerm) {
                performHomeSearch(searchTerm);
            } else {
                // Show all courses if search is empty
                showAllCourses();
            }
        });
    }
    
    // Search button functionality
    const searchBtns = document.querySelectorAll('.search-btn, .hero-search-btn');
    searchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const searchInput = this.parentElement.querySelector('input');
            const searchTerm = searchInput.value;
            if (searchTerm.trim()) {
                alert(`Searching for: "${searchTerm}"`);
                // Here you would implement actual search functionality
            }
        });
    });
    
    // Feature buttons functionality
    const featureBtns = document.querySelectorAll('.feature-btn');
    featureBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const feature = this.textContent;
            alert(`Selected feature: ${feature}`);
            // Here you would implement navigation to specific features
        });
    });
    
    // Course cards functionality
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('click', function() {
            const courseTitle = this.querySelector('h3').textContent;
            alert(`Opening course: ${courseTitle}`);
            // Here you would implement navigation to course details
        });
    });
    
    // Navigation links functionality
    const navItems = document.querySelectorAll('.nav-item, .topic-link');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.textContent;
            alert(`Navigating to: ${section}`);
            // Here you would implement navigation to specific sections
        });
    });
    
    // Inject profile dropdown in headers (if present)
    try {
        const actions = document.querySelector('.simple-actions');
        if (actions) {
            const storedUser = sessionStorage.getItem('username');
            const storedFullName = sessionStorage.getItem('userFullName');
            const displayName = storedUser || 'Guest';
            const fullDisplayName = storedFullName || storedUser || 'Guest';
            actions.innerHTML = `
                <div class="profile-dropdown">
                    <button class="circle-btn profile-trigger" id="profileTrigger">
                        <span class="user-initial">${displayName.charAt(0).toUpperCase()}</span>
                        <span class="user-name">${fullDisplayName}</span>
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div class="profile-menu-panel" id="profileMenu" aria-hidden="true">
                        <a href="profile.html" class="profile-menu-item"><i class="fas fa-user"></i> Profile</a>
                        <a href="my-learning.html" class="profile-menu-item"><i class="fas fa-graduation-cap"></i> My Learning</a>
                        <button class="profile-menu-item as-button" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    </div>
                </div>`;

            const trigger = document.getElementById('profileTrigger');
            const menu = document.getElementById('profileMenu');
            const logoutBtn = document.getElementById('logoutBtn');

            const closeMenu = () => {
                if (!menu) return;
                menu.setAttribute('aria-hidden', 'true');
            };
            const openMenu = () => {
                if (!menu) return;
                menu.setAttribute('aria-hidden', 'false');
            };
            if (trigger && menu) {
                trigger.addEventListener('click', function(e){
                    e.stopPropagation();
                    const isHidden = menu.getAttribute('aria-hidden') !== 'false';
                    if (isHidden) openMenu(); else closeMenu();
                });
                document.addEventListener('click', function(){ closeMenu(); });
                menu.addEventListener('click', function(e){ e.stopPropagation(); });
            }
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(){ logout(); });
            }
        }
    } catch (e) {}

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Toggle between light and dark themes
            document.body.classList.toggle('dark-theme');
            const icon = this.querySelector('i');
            if (document.body.classList.contains('dark-theme')) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    }
    
    // Add some visual feedback for form interactions
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});

// Quiz scoring system
const quizAnswers = {
    'quiz1': {
        'q1': 'b', 'q2': 'c', 'q3': 'b', 'q4': 'c', 'q5': 'c',
        'q6': 'b', 'q7': 'b', 'q8': 'c', 'q9': 'b', 'q10': 'b',
        'q11': 'c', 'q12': 'b', 'q13': 'b', 'q14': 'c', 'q15': 'c'
    },
    'quiz2': {
        'q1': 'b', 'q2': 'b', 'q3': 'c', 'q4': 'b', 'q5': 'a',
        'q6': 'c', 'q7': 'b', 'q8': 'b', 'q9': 'c', 'q10': 'b',
        'q11': 'c', 'q12': 'a', 'q13': 'c', 'q14': 'b', 'q15': 'b'
    },
    'quiz3': {
        'q1': 'c', 'q2': 'b', 'q3': 'd', 'q4': 'c', 'q5': 'c',
        'q6': 'c', 'q7': 'c', 'q8': 'b', 'q9': 'b', 'q10': 'b',
        'q11': 'b', 'q12': 'b', 'q13': 'b', 'q14': 'b', 'q15': 'c'
    },
    'quiz4': {
        'q1': 'b', 'q2': 'b', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'b', 'q7': 'a', 'q8': 'a', 'q9': 'b', 'q10': 'c',
        'q11': 'c', 'q12': 'b', 'q13': 'a', 'q14': 'b', 'q15': 'c'
    },
    'quiz5': {
        'q1': 'b', 'q2': 'b', 'q3': 'a', 'q4': 'a', 'q5': 'c',
        'q6': 'a', 'q7': 'b', 'q8': 'a', 'q9': 'b', 'q10': 'b',
        'q11': 'b', 'q12': 'b', 'q13': 'b', 'q14': 'b', 'q15': 'b'
    },
    'quiz6': {
        'q1': 'b', 'q2': 'b', 'q3': 'b', 'q4': 'a', 'q5': 'b',
        'q6': 'b', 'q7': 'b', 'q8': 'b', 'q9': 'b', 'q10': 'b',
        'q11': 'b', 'q12': 'b', 'q13': 'c', 'q14': 'a', 'q15': 'b'
    },
    'quiz7': {
        'q1': 'b', 'q2': 'c', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'c', 'q7': 'b', 'q8': 'b', 'q9': 'b', 'q10': 'a',
        'q11': 'c', 'q12': 'b', 'q13': 'a', 'q14': 'b', 'q15': 'b'
    },
    'quiz8': {
        'q1': 'b', 'q2': 'c', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'b', 'q7': 'b', 'q8': 'b', 'q9': 'b', 'q10': 'b',
        'q11': 'b', 'q12': 'b', 'q13': 'a', 'q14': 'b', 'q15': 'b'
    },
    'quiz9': {
        'q1': 'b', 'q2': 'a', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'b', 'q7': 'b', 'q8': 'b', 'q9': 'b', 'q10': 'a',
        'q11': 'b', 'q12': 'b', 'q13': 'b', 'q14': 'b', 'q15': 'b'
    },
    'quiz10': {
        'q1': 'b', 'q2': 'a', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'b', 'q7': 'b', 'q8': 'b', 'q9': 'b', 'q10': 'b',
        'q11': 'c', 'q12': 'b', 'q13': 'a', 'q14': 'b', 'q15': 'b'
    },
    'quiz11': {
        'q1': 'c', 'q2': 'a', 'q3': 'b', 'q4': 'b', 'q5': 'b',
        'q6': 'a', 'q7': 'a', 'q8': 'b', 'q9': 'a', 'q10': 'b',
        'q11': 'a', 'q12': 'a', 'q13': 'b', 'q14': 'a', 'q15': 'a'
    },
    'quiz12': {
        'q1': 'a', 'q2': 'a', 'q3': 'a', 'q4': 'b', 'q5': 'a',
        'q6': 'a', 'q7': 'a', 'q8': 'b', 'q9': 'a', 'q10': 'a',
        'q11': 'b', 'q12': 'a', 'q13': 'b', 'q14': 'b', 'q15': 'b'
    }
};

// Quiz submission handler
function handleQuizSubmission(quizId) {
    const form = document.getElementById(quizId);
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const correctAnswers = quizAnswers[quizId];
        if (!correctAnswers) {
            alert('Quiz answers not configured yet.');
            return;
        }
        
        let score = 0;
        let totalQuestions = Object.keys(correctAnswers).length;
        let results = [];
        
        // Check each question
        Object.keys(correctAnswers).forEach(questionId => {
            const selectedAnswer = form.querySelector(`input[name="${questionId}"]:checked`);
            const correctAnswer = correctAnswers[questionId];
            const isCorrect = selectedAnswer && selectedAnswer.value === correctAnswer;
            
            if (isCorrect) {
                score++;
            }
            
            results.push({
                questionId: questionId,
                isCorrect: isCorrect,
                selectedAnswer: selectedAnswer ? selectedAnswer.value : null,
                correctAnswer: correctAnswer
            });
        });
        
        // Display results
        displayQuizResults(score, totalQuestions, results, quizId);
        
        // Track completion if quiz is passed (50% or higher)
        const percentage = Math.round((score/totalQuestions) * 100);
        const passed = percentage >= 50;
        
        console.log(`Quiz ${quizId} completed with ${percentage}% - Passed: ${passed}`); // Debug log
        console.log('Current user ID:', sessionStorage.getItem('userId')); // Debug log
        console.log('Firebase available:', !!window.firebase); // Debug log
        
        if (passed) {
            // Track the attempt
            const attemptInfo = await trackQuizAttempt(quizId, passed);
            
            // Mark quiz and course as completed
            console.log('Calling markQuizCompleted...'); // Debug log
            await markQuizCompleted(quizId, percentage);
            
            // Show success message for course completion
            showCourseCompletionMessage(quizId, percentage);
        } else {
            // Track the attempt
            const attemptInfo = await trackQuizAttempt(quizId, passed);
            
            // Show attempt count and warning
            showAttemptWarning(quizId, attemptInfo.count);
        }
    });
}

// Display quiz results with highlighting
function displayQuizResults(score, totalQuestions, results, quizId) {
    const form = document.getElementById(quizId);
    const quizContent = form.querySelector('.quiz-content, .content-placeholder');
    
    const percentage = Math.round((score/totalQuestions) * 100);
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'quiz-results';
    resultsContainer.innerHTML = `
        <div class="results-header">
            <h2>Quiz Results</h2>
            <div class="score-display">
                <div class="score-main">
                    <span class="score-number">${score}/${totalQuestions}</span>
                    ${percentage > 0 ? `<span class="score-percentage">${percentage}%</span>` : ''}
                </div>
            </div>
            <div class="performance-level">${getPerformanceLevel(score, totalQuestions)}</div>
        </div>
        <div class="results-summary">
            <p>You answered <strong>${score}</strong> out of <strong>${totalQuestions}</strong> questions correctly.</p>
            ${percentage > 0 ? `<p>Your score: <strong>${percentage}%</strong> out of 100%</p>` : ''}
        </div>
    `;
    
    // Insert results before the form
    form.parentNode.insertBefore(resultsContainer, form);
    
    // Highlight answers in the form
    results.forEach(result => {
        const questionElement = form.querySelector(`input[name="${result.questionId}"]:checked`);
        if (questionElement) {
            const label = questionElement.closest('label');
            if (result.isCorrect) {
                label.classList.add('correct-answer');
            } else {
                label.classList.add('incorrect-answer');
            }
        }
        
        // Also highlight the correct answer if user got it wrong
        if (!result.isCorrect) {
            const correctInput = form.querySelector(`input[name="${result.questionId}"][value="${result.correctAnswer}"]`);
            if (correctInput) {
                const correctLabel = correctInput.closest('label');
                correctLabel.classList.add('correct-answer-highlight');
            }
        }
    });
    
    // Disable all radio buttons to prevent selection changes
    const radioButtons = form.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.disabled = true;
        radio.style.pointerEvents = 'none';
    });
    
    // Disable form submission and add take again button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Quiz Completed';
        submitBtn.classList.add('completed');
        
        // Add Take Again button
        const takeAgainBtn = document.createElement('button');
        takeAgainBtn.textContent = 'Take Again';
        takeAgainBtn.className = 'next-step-btn take-again-btn';
        takeAgainBtn.onclick = function() {
            // Reset the quiz
            resetQuiz(quizId);
        };
        
        // Insert take again button after submit button
        submitBtn.parentNode.insertBefore(takeAgainBtn, submitBtn.nextSibling);
    }
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Get performance level based on score
function getPerformanceLevel(score, totalQuestions) {
    const percentage = (score / totalQuestions) * 100;
    
    if (percentage >= 87) {
        return '🌟 Excellent - You\'re a Cyber Safety Champion!';
    } else if (percentage >= 60) {
        return '👍 Good - You\'re aware but can improve.';
    } else if (percentage >= 33) {
        return '⚠️ Average - Review key topics again.';
    } else {
        return '❌ Needs Improvement - Take the course again.';
    }
}

// Reset quiz function
function resetQuiz(quizId) {
    const form = document.getElementById(quizId);
    if (!form) return;
    
    // Remove results container if it exists
    const resultsContainer = form.parentNode.querySelector('.quiz-results');
    if (resultsContainer) {
        resultsContainer.remove();
    }
    
    // Clear all radio button selections and re-enable them
    const radioButtons = form.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.checked = false;
        radio.disabled = false;
        radio.style.pointerEvents = 'auto';
    });
    
    // Remove highlighting classes
    const labels = form.querySelectorAll('label');
    labels.forEach(label => {
        label.classList.remove('correct-answer', 'incorrect-answer', 'correct-answer-highlight');
    });
    
    // Reset submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Quiz';
        submitBtn.classList.remove('completed');
    }
    
    // Remove take again button
    const takeAgainBtn = form.querySelector('.take-again-btn');
    if (takeAgainBtn) {
        takeAgainBtn.remove();
    }
    
    // Scroll to top of quiz
    form.scrollIntoView({ behavior: 'smooth' });
}

// Initialize quiz handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all quiz forms
    const quizForms = ['quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5', 'quiz6', 
                      'quiz7', 'quiz8', 'quiz9', 'quiz10', 'quiz11', 'quiz12'];
    
    quizForms.forEach(quizId => {
        handleQuizSubmission(quizId);
    });
});

// Message display function
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.firebase-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `firebase-message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to the top of the page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
    }
    
    // Auto-remove after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}


// Logout function with Firebase
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Sign out from Firebase if available
            if (window.firebase && window.firebase.signOut) {
                await window.firebase.signOut(window.firebase.auth);
            }
            
            // Clear session storage
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if Firebase logout fails
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}

// Course Progression System
const COURSE_PROGRESSION = {
    'course1': { next: 'course2', required: null },
    'course2': { next: 'course3', required: 'course1' },
    'course3': { next: 'course4', required: 'course2' },
    'course4': { next: 'course5', required: 'course3' },
    'course5': { next: 'course6', required: 'course4' },
    'course6': { next: 'course7', required: 'course5' },
    'course7': { next: 'course8', required: 'course6' },
    'course8': { next: 'course9', required: 'course7' },
    'course9': { next: 'course10', required: 'course8' },
    'course10': { next: 'course11', required: 'course9' },
    'course11': { next: 'course12', required: 'course10' },
    'course12': { next: null, required: 'course11' }
};

// Track quiz completion
async function markQuizCompleted(quizId, score = null) {
    try {
        // Update localStorage (for backward compatibility)
        const completedQuizzes = await getCompletedQuizzes();
        if (!completedQuizzes.includes(quizId)) {
            completedQuizzes.push(quizId);
            localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
        }
        
        // Update Firestore database
        const userId = sessionStorage.getItem('userId');
        if (userId && window.firebase) {
            const { db, doc, getDoc, setDoc } = window.firebase;
            const userRef = doc(db, 'users', userId);
            
            // Get current user data
            const userDoc = await getDoc(userRef);
            const currentData = userDoc.exists() ? userDoc.data() : {};
            
            // Update quiz scores
            const quizScores = currentData.quizScores || {};
            if (score !== null) {
                quizScores[quizId] = score;
            }
            
            // Update user document
            await setDoc(userRef, {
                ...currentData,
                quizScores: quizScores,
                lastUpdated: new Date().toISOString()
            });
        }
        
        // Mark the corresponding course as completed
        const courseId = quizId.replace('quiz', 'course');
        await markCourseCompleted(courseId);
        
        // Reset quiz attempts on successful completion
        await resetQuizAttempts(quizId);
    } catch (error) {
        console.error('Error updating quiz completion in database:', error);
    }
}

// Quiz Attempt Tracking System
const MAX_QUIZ_ATTEMPTS = 5;

// Track quiz attempt (user-specific)
async function trackQuizAttempt(quizId, passed) {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !window.firebase) {
        console.error('No user ID or Firebase not available');
        return { count: 0, passed: false };
    }

    try {
        const { db, doc, getDoc, setDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        
        // Get current user data
        const userDoc = await getDoc(userRef);
        const currentData = userDoc.exists() ? userDoc.data() : {};
        
        // Update quiz attempts
        const quizAttempts = currentData.quizAttempts || {};
        const currentAttempt = quizAttempts[quizId] || { count: 0, passed: false };
        
        currentAttempt.count++;
        currentAttempt.passed = passed;
        currentAttempt.lastAttempt = new Date().toISOString();
        
        quizAttempts[quizId] = currentAttempt;
        
        // Update user document
        await setDoc(userRef, {
            ...currentData,
            quizAttempts: quizAttempts,
            lastUpdated: new Date().toISOString()
        });
        
        return currentAttempt;
    } catch (error) {
        console.error('Error tracking quiz attempt:', error);
        return { count: 0, passed: false };
    }
}

// Get quiz attempts (user-specific)
async function getQuizAttempts() {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !window.firebase) {
        return {};
    }

    try {
        const { db, doc, getDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            return userDoc.data().quizAttempts || {};
        }
        return {};
    } catch (error) {
        console.error('Error getting quiz attempts:', error);
        return {};
    }
}

// Get attempts for specific quiz (user-specific)
async function getQuizAttemptCount(quizId) {
    const attempts = await getQuizAttempts();
    return attempts[quizId] ? attempts[quizId].count : 0;
}

// Check if quiz is locked due to too many attempts (user-specific)
async function isQuizLocked(quizId) {
    const attempts = await getQuizAttempts();
    const quizAttempts = attempts[quizId];
    
    if (!quizAttempts) return false;
    
    // If quiz is already passed, it's not locked
    if (quizAttempts.passed) return false;
    
    // If attempts >= 5 and not passed, quiz is locked
    return quizAttempts.count >= MAX_QUIZ_ATTEMPTS;
}

// Reset quiz attempts (user-specific)
async function resetQuizAttempts(quizId) {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !window.firebase) {
        return;
    }

    try {
        const { db, doc, getDoc, setDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        
        // Get current user data
        const userDoc = await getDoc(userRef);
        const currentData = userDoc.exists() ? userDoc.data() : {};
        
        // Remove quiz attempts for this quiz
        const quizAttempts = currentData.quizAttempts || {};
        if (quizAttempts[quizId]) {
            delete quizAttempts[quizId];
        }
        
        // Update user document
        await setDoc(userRef, {
            ...currentData,
            quizAttempts: quizAttempts,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error resetting quiz attempts:', error);
    }
}

// Check if course needs to be redone (user-specific)
async function isCourseRedoRequired(courseId) {
    const quizId = courseId.replace('course', 'quiz');
    return await isQuizLocked(quizId);
}

// Mark course as redone (reset quiz attempts) (user-specific)
async function markCourseRedone(courseId) {
    const quizId = courseId.replace('course', 'quiz');
    await resetQuizAttempts(quizId);
}

// Track course completion
async function markCourseCompleted(courseId) {
    try {
        console.log(`Marking course ${courseId} as completed`); // Debug log
        
        // Update localStorage (for backward compatibility)
        const completedCourses = await getCompletedCourses();
        if (!completedCourses.includes(courseId)) {
            completedCourses.push(courseId);
            localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
            console.log('Updated localStorage:', completedCourses); // Debug log
        }

        // Update Firestore database
        const userId = sessionStorage.getItem('userId');
        if (userId && window.firebase) {
            const { db, doc, getDoc, setDoc } = window.firebase;
            const userRef = doc(db, 'users', userId);
            
            // Get current user data
            const userDoc = await getDoc(userRef);
            const currentData = userDoc.exists() ? userDoc.data() : {};
            console.log('Current user data before update:', currentData); // Debug log
            
            // Update courses completed array
            const coursesCompleted = currentData.coursesCompleted || [];
            if (!coursesCompleted.includes(courseId)) {
                coursesCompleted.push(courseId);
                console.log('Updated courses completed array:', coursesCompleted); // Debug log
            }
            
            // Update user document
            const updatedData = {
                ...currentData,
                coursesCompleted: coursesCompleted,
                lastUpdated: new Date().toISOString()
            };
            
            await setDoc(userRef, updatedData);
            console.log('Successfully updated Firestore with:', updatedData); // Debug log
            
            // Check if user is now eligible for certificate
            if (coursesCompleted.length >= TOTAL_COURSES) {
                console.log('User has completed all courses, generating certificate...');
                await generateCertificate();
            }
        } else {
            console.log('No userId or Firebase not available'); // Debug log
        }
    } catch (error) {
        console.error('Error updating course completion in database:', error);
    }
}

// Get completed quizzes (user-specific)
async function getCompletedQuizzes() {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !window.firebase) {
        return [];
    }

    try {
        const { db, doc, getDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Extract quiz IDs from quiz scores
            return Object.keys(userData.quizScores || {});
        }
        return [];
    } catch (error) {
        console.error('Error getting completed quizzes:', error);
        return [];
    }
}

// Get completed courses (user-specific)
async function getCompletedCourses() {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !window.firebase) {
        return [];
    }

    try {
        const { db, doc, getDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            return userDoc.data().coursesCompleted || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting completed courses:', error);
        return [];
    }
}

// Check if a course is accessible (user-specific)
async function isCourseAccessible(courseId) {
    const completedCourses = await getCompletedCourses();
    const progression = COURSE_PROGRESSION[courseId];
    
    // First course is always accessible
    if (!progression.required) {
        return true;
    }
    
    // Check if required course is completed
    return completedCourses.includes(progression.required);
}

// Check if a quiz is accessible (user-specific)
async function isQuizAccessible(quizId) {
    const courseId = quizId.replace('quiz', 'course');
    return await isCourseAccessible(courseId);
}

// Lock course navigation (user-specific)
async function lockCourseNavigation() {
    // Skip course cards on home page - handled by updateCourseCards() in home.html
    const currentPage = window.location.pathname;
    if (currentPage.includes('home.html') || currentPage === '/' || currentPage.endsWith('/')) {
        // Only handle next course buttons on home page
        const nextCourseBtns = document.querySelectorAll('.next-step-btn[href*="course"]');
        
        for (const btn of nextCourseBtns) {
            const href = btn.getAttribute('href');
            if (href && href.startsWith('course')) {
                const courseId = href.replace('.html', '');
                const isAccessible = await isCourseAccessible(courseId);
                
                if (!isAccessible) {
                    btn.classList.add('locked-btn');
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.6';
                    btn.innerHTML = '🔒 Complete Previous Course';
                    btn.title = 'Complete the previous course to unlock this course';
                }
            }
        }
        return;
    }
    
    // Lock course cards on other pages (not home page)
    const courseCards = document.querySelectorAll('.course-card');
    
    for (const card of courseCards) {
        const href = card.getAttribute('href');
        if (href && href.startsWith('course')) {
            const courseId = href.replace('.html', '');
            const isAccessible = await isCourseAccessible(courseId);
            
            if (!isAccessible) {
                card.classList.add('locked-course');
                card.style.pointerEvents = 'none';
                card.style.opacity = '0.6';
                
                // Add lock icon
                const lockIcon = document.createElement('span');
                lockIcon.innerHTML = '🔒';
                lockIcon.style.marginLeft = '10px';
                card.appendChild(lockIcon);
                
                // Add tooltip
                card.title = 'Complete the previous course to unlock this course';
            }
        }
    }
    
    // Lock next course buttons
    const nextCourseBtns = document.querySelectorAll('.next-step-btn[href*="course"]');
    
    for (const btn of nextCourseBtns) {
        const href = btn.getAttribute('href');
        if (href && href.startsWith('course')) {
            const courseId = href.replace('.html', '');
            const isAccessible = await isCourseAccessible(courseId);
            
            if (!isAccessible) {
                btn.classList.add('locked-btn');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.6';
                btn.innerHTML = '🔒 Complete Previous Course';
                btn.title = 'Complete the previous course to unlock this course';
            }
        }
    }
}

// Quiz completion tracking is now integrated directly into handleQuizSubmission

// Test function to manually save course completion (for debugging)
async function testCourseCompletion() {
    try {
        console.log('Testing course completion save...');
        
        const userId = sessionStorage.getItem('userId');
        console.log('User ID:', userId);
        
        if (!userId) {
            console.error('No user ID found in session storage');
            return;
        }
        
        if (!window.firebase) {
            console.error('Firebase not available');
            return;
        }
        
        const { db, doc, setDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        
        // Test data
        const testData = {
            fullName: sessionStorage.getItem('userFullName') || 'Test User',
            email: sessionStorage.getItem('userEmail') || 'test@example.com',
            username: sessionStorage.getItem('username') || 'testuser',
            coursesCompleted: ['course1'],
            quizScores: { 'quiz1': 80 },
            testTimestamp: new Date().toISOString()
        };
        
        console.log('Saving test data:', testData);
        
        await setDoc(userRef, testData);
        console.log('Test data saved successfully!');
        
    } catch (error) {
        console.error('Error in test function:', error);
    }
}

// Make test function available globally
window.testCourseCompletion = testCourseCompletion;

// Debug function to check user data
async function debugUserData() {
    try {
        const userId = sessionStorage.getItem('userId');
        console.log('Current user ID:', userId);
        
        if (!userId || !window.firebase) {
            console.error('No user ID or Firebase not available');
            return;
        }
        
        const { db, doc, getDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Current user data:', userData);
            console.log('Courses completed:', userData.coursesCompleted || []);
            console.log('Quiz scores:', userData.quizScores || {});
        } else {
            console.log('No user document found');
        }
    } catch (error) {
        console.error('Error in debug function:', error);
    }
}

// Make debug function available globally
window.debugUserData = debugUserData;

// Home page search functionality
function performHomeSearch(searchTerm) {
    const courseCards = document.querySelectorAll('.course-card');
    let hasResults = false;
    
    courseCards.forEach(card => {
        const courseText = card.textContent.toLowerCase();
        if (courseText.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.opacity = '1';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide "No results" message
    let noResultsMsg = document.getElementById('noSearchResults');
    if (!hasResults) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'noSearchResults';
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <div class="no-results-content">
                    <h3>🔍 No courses found</h3>
                    <p>Try searching with different keywords or browse all courses.</p>
                </div>
            `;
            document.querySelector('.courses-grid').appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

function showAllCourses() {
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.style.display = 'block';
        card.style.opacity = '1';
    });
    
    // Clear the search input
    const homeSearchInput = document.getElementById('homeSearchInput');
    if (homeSearchInput) {
        homeSearchInput.value = '';
    }
    
    // Remove "No results" message if it exists
    const noResultsMsg = document.getElementById('noSearchResults');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Certificate System
const TOTAL_COURSES = 12;

// Check if user is eligible for certificate
async function isEligibleForCertificate() {
    try {
        const completedCourses = await getCompletedCourses();
        return completedCourses.length >= TOTAL_COURSES;
    } catch (error) {
        console.error('Error checking certificate eligibility:', error);
        return false;
    }
}

// Generate certificate for user
async function generateCertificate() {
    try {
        const userId = sessionStorage.getItem('userId');
        if (!userId || !window.firebase) {
            console.error('No user ID or Firebase not available');
            return false;
        }

        const { db, doc, getDoc, setDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        
        // Get current user data
        const userDoc = await getDoc(userRef);
        const currentData = userDoc.exists() ? userDoc.data() : {};
        
        // Check if certificate already exists
        if (currentData.certificateGenerated) {
            console.log('Certificate already generated for this user');
            return true;
        }
        
        // Check if user has completed all courses
        const completedCourses = currentData.coursesCompleted || [];
        if (completedCourses.length < TOTAL_COURSES) {
            console.log('User has not completed all courses yet');
            return false;
        }
        
        // Generate certificate data
        const certificateData = {
            certificateId: `CERT-${userId}-${Date.now()}`,
            userId: userId,
            userName: currentData.fullName || currentData.username || 'Student',
            userEmail: currentData.email || '',
            completionDate: new Date().toISOString(),
            coursesCompleted: completedCourses.length,
            totalCourses: TOTAL_COURSES,
            certificateGenerated: true,
            certificateGeneratedAt: new Date().toISOString()
        };
        
        // Update user document with certificate data
        await setDoc(userRef, {
            ...currentData,
            certificate: certificateData,
            certificateGenerated: true,
            certificateGeneratedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        console.log('Certificate generated successfully:', certificateData);
        return true;
        
    } catch (error) {
        console.error('Error generating certificate:', error);
        return false;
    }
}

// Get user certificate data
async function getUserCertificate() {
    try {
        const userId = sessionStorage.getItem('userId');
        if (!userId || !window.firebase) {
            return null;
        }

        const { db, doc, getDoc } = window.firebase;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.certificate || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting user certificate:', error);
        return null;
    }
}

// Format date for certificate display
function formatCertificateDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Calculate completion percentage
function calculateCompletionPercentage(completedCourses) {
    return Math.round((completedCourses / TOTAL_COURSES) * 100);
}

// Show course completion message
function showCourseCompletionMessage(quizId, score) {
    const courseId = quizId.replace('quiz', 'course');
    const courseNumber = courseId.replace('course', '');
    
    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'course-completion-message';
    successMessage.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">🎉</div>
            <div class="completion-text">
                <h3>Course ${courseNumber} Completed!</h3>
                <p>Congratulations! You scored ${score}% and completed this course.</p>
                <p>You can now access the next course in your learning journey.</p>
            </div>
            <div class="completion-actions">
                <a href="my-learning.html" class="btn-view-progress">View Progress</a>
                <button class="btn-close-completion" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(successMessage);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (successMessage.parentNode) {
            successMessage.remove();
        }
    }, 10000);
}

// Show attempt warning
function showAttemptWarning(quizId, attemptCount) {
    const remainingAttempts = MAX_QUIZ_ATTEMPTS - attemptCount;
    
    if (remainingAttempts > 0) {
        // Show warning about remaining attempts
        const warningDiv = document.createElement('div');
        warningDiv.className = 'attempt-warning';
        warningDiv.innerHTML = `
            <div class="warning-content">
                <h3>⚠️ Quiz Not Passed</h3>
                <p>You have <strong>${remainingAttempts}</strong> attempt(s) remaining.</p>
                <p>If you fail ${MAX_QUIZ_ATTEMPTS} times, you'll need to redo the course.</p>
            </div>
        `;
        
        // Insert warning before the quiz form
        const form = document.getElementById(quizId);
        if (form) {
            form.parentNode.insertBefore(warningDiv, form);
        }
    } else {
        // Show locked message
        const lockedDiv = document.createElement('div');
        lockedDiv.className = 'quiz-locked-message';
        lockedDiv.innerHTML = `
            <div class="locked-content">
                <h3>🔒 Quiz Locked</h3>
                <p>You have failed this quiz ${MAX_QUIZ_ATTEMPTS} times.</p>
                <p>Please redo the course to unlock the quiz again.</p>
                <a href="${quizId.replace('quiz', 'course')}.html" class="redo-course-btn">Redo Course</a>
            </div>
        `;
        
        // Replace quiz form with locked message
        const form = document.getElementById(quizId);
        if (form) {
            form.parentNode.replaceChild(lockedDiv, form);
        }
    }
}

// Check quiz access and show appropriate message (user-specific)
async function checkQuizAccess() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('quiz')) {
        const quizId = currentPage.replace('/course', '').replace('-quiz.html', '');
        
        // Check if quiz is locked
        const isLocked = await isQuizLocked(quizId);
        if (isLocked) {
            showQuizLockedMessage(quizId);
        } else {
            // Show attempt count if not first attempt
            const attemptCount = await getQuizAttemptCount(quizId);
            if (attemptCount > 0) {
                showAttemptCount(quizId, attemptCount);
            }
        }
    }
}

// Show quiz locked message
function showQuizLockedMessage(quizId) {
    const lockedDiv = document.createElement('div');
    lockedDiv.className = 'quiz-locked-message';
    lockedDiv.innerHTML = `
        <div class="locked-content">
            <h2>🔒 Quiz Locked</h2>
            <p>You have failed this quiz ${MAX_QUIZ_ATTEMPTS} times.</p>
            <p>Please redo the course to unlock the quiz again.</p>
            <div class="locked-actions">
                <a href="${quizId.replace('quiz', 'course')}.html" class="redo-course-btn">Redo Course</a>
                <a href="home.html" class="home-btn">Back to Home</a>
            </div>
        </div>
    `;
    
    // Replace the entire quiz content
    const mainContent = document.querySelector('.content-main');
    if (mainContent) {
        mainContent.innerHTML = '';
        mainContent.appendChild(lockedDiv);
    }
}

// Show attempt count
function showAttemptCount(quizId, attemptCount) {
    const remainingAttempts = MAX_QUIZ_ATTEMPTS - attemptCount;
    
    const attemptDiv = document.createElement('div');
    attemptDiv.className = 'attempt-counter';
    attemptDiv.innerHTML = `
        <div class="attempt-info">
            <h3>📊 Quiz Attempts</h3>
            <p>Attempt: <strong>${attemptCount}</strong> of ${MAX_QUIZ_ATTEMPTS}</p>
            <p>Remaining: <strong>${remainingAttempts}</strong> attempts</p>
            ${remainingAttempts <= 2 ? '<p class="warning-text">⚠️ Warning: Few attempts remaining!</p>' : ''}
        </div>
    `;
    
    // Insert before quiz form
    const form = document.getElementById(quizId);
    if (form) {
        form.parentNode.insertBefore(attemptDiv, form);
    }
}

// Initialize course progression system
document.addEventListener('DOMContentLoaded', async function() {
    // Lock navigation based on completion
    await lockCourseNavigation();
    
    // Add completion status to course pages
    await updateCourseProgress();
    
    // Check quiz access
    await checkQuizAccess();
});

// Update course progress display (user-specific)
async function updateCourseProgress() {
    const completedCourses = await getCompletedCourses();
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('course') && !currentPage.includes('quiz')) {
        const courseId = currentPage.replace('/course', '').replace('.html', '');
        
        // Update progress circle if it exists
        const progressCircle = document.querySelector('.progress-circle .progress-text');
        if (progressCircle) {
            if (completedCourses.includes(courseId)) {
                progressCircle.textContent = '100%';
                progressCircle.parentElement.style.background = 'conic-gradient(#4CAF50 360deg, #e0e0e0 0deg)';
            } else {
                progressCircle.textContent = '0%';
            }
        }
        
        // Check if course redo is required
        const isRedoRequired = await isCourseRedoRequired(courseId);
        if (isRedoRequired) {
            showCourseRedoMessage(courseId);
        }
    }
}

// Show course redo message
function showCourseRedoMessage(courseId) {
    const redoDiv = document.createElement('div');
    redoDiv.className = 'course-redo-required';
    redoDiv.innerHTML = `
        <div class="redo-required-content">
            <h3>🔄 Course Redo Required</h3>
            <p>You have failed the quiz 5 times. Please redo this course to unlock the quiz again.</p>
            <button onclick="handleCourseRedo('${courseId}')" class="redo-course-btn">Redo Course</button>
        </div>
    `;
    
    // Insert after course header
    const courseHeader = document.querySelector('.course-header');
    if (courseHeader) {
        courseHeader.insertAdjacentElement('afterend', redoDiv);
    }
}

// Reset all progress (for testing purposes)
function resetAllProgress() {
    localStorage.removeItem('completedQuizzes');
    localStorage.removeItem('completedCourses');
    localStorage.removeItem('quizAttempts');
    location.reload();
}

// Handle course redo (reset quiz attempts for specific course)
async function handleCourseRedo(courseId) {
    await markCourseRedone(courseId);
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'course-redo-success';
    successDiv.innerHTML = `
        <div class="success-content">
            <h3>✅ Course Redone Successfully</h3>
            <p>You can now attempt the quiz again.</p>
            <a href="${courseId}-quiz.html" class="quiz-btn">Take Quiz</a>
        </div>
    `;
    
    // Replace content
    const mainContent = document.querySelector('.content-main');
    if (mainContent) {
        mainContent.innerHTML = '';
        mainContent.appendChild(successDiv);
    }
}

// Add reset button for testing (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        // Add a reset button to the home page for testing
        if (window.location.pathname.includes('home.html') || window.location.pathname === '/') {
            const resetBtn = document.createElement('button');
            resetBtn.textContent = 'Reset Progress (Testing)';
            resetBtn.style.position = 'fixed';
            resetBtn.style.top = '10px';
            resetBtn.style.right = '10px';
            resetBtn.style.zIndex = '9999';
            resetBtn.style.background = '#ff4444';
            resetBtn.style.color = 'white';
            resetBtn.style.border = 'none';
            resetBtn.style.padding = '5px 10px';
            resetBtn.style.borderRadius = '5px';
            resetBtn.style.cursor = 'pointer';
            resetBtn.onclick = resetAllProgress;
            document.body.appendChild(resetBtn);
        }
    });
}
