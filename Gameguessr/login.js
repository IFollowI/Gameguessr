document.addEventListener('DOMContentLoaded', function () {
    const USERS_DB_KEY = 'gameguessrUsers';

    const activeUser = sessionStorage.getItem('currentUser');
    if (activeUser) {
        window.location.href = '/Gameguessr/index1.html';
        return;
    }

    const form = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const emailErrorSpan = document.getElementById('emailError');
    const passwordErrorSpan = document.getElementById('passwordError');
    const feedbackDiv = document.getElementById('formFeedback');

    function showFeedbackError(message) {
        if (!feedbackDiv) {
            return;
        }
        feedbackDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
    }

    function clearFieldErrors() {
        emailErrorSpan.innerHTML = '';
        passwordErrorSpan.innerHTML = '';
        if (feedbackDiv) {
            feedbackDiv.innerHTML = '';
        }

        if (emailInput) emailInput.classList.remove('error-border');
        if (passwordInput) passwordInput.classList.remove('error-border');
    }

    function setFieldError(field, message) {
        if (field === 'email' && emailErrorSpan) {
            emailErrorSpan.innerHTML = message ? `<i class="fas fa-exclamation-circle"></i> ${message}` : '';
            if (emailInput) emailInput.classList.toggle('error-border', !!message);
        } else if (field === 'password' && passwordErrorSpan) {
            passwordErrorSpan.innerHTML = message ? `<i class="fas fa-exclamation-circle"></i> ${message}` : '';
            if (passwordInput) passwordInput.classList.toggle('error-border', !!message);
        }
    }

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (email === '') {
            setFieldError('email', 'Email address is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setFieldError('email', 'Enter a valid email (e.g., name@domain.com)');
            return false;
        }
        setFieldError('email', '');
        return true;
    }

    function validatePassword() {
        const password = passwordInput.value;
        if (password === '') {
            setFieldError('password', 'Password cannot be empty');
            return false;
        }
        if (password.length < 6) {
            setFieldError('password', 'Password must be at least 6 characters');
            return false;
        }
        setFieldError('password', '');
        return true;
    }

    function validateAllFields() {
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        return isEmailValid && isPasswordValid;
    }

    function setupRealtimeValidation() {
        emailInput.addEventListener('input', () => { validateEmail(); });
        passwordInput.addEventListener('input', () => { validatePassword(); });
        emailInput.addEventListener('blur', validateEmail);
        passwordInput.addEventListener('blur', validatePassword);
    }

    function showSuccessMessage(message) {
        if (!feedbackDiv) {
            return;
        }
        feedbackDiv.innerHTML = `<div class="form-success"><i class="fas fa-check-circle"></i> ${message}</div>`;
        setTimeout(() => {
            if (feedbackDiv.firstChild) {
                feedbackDiv.firstChild.style.opacity = '0';
                setTimeout(() => {
                    if (feedbackDiv.innerHTML.includes(message)) feedbackDiv.innerHTML = '';
                }, 300);
            }
        }, 2800);
    }

    function getUsers() {
        const rawUsers = localStorage.getItem(USERS_DB_KEY);
        if (!rawUsers) {
            return [];
        }
        try {
            const parsedUsers = JSON.parse(rawUsers);
            return Array.isArray(parsedUsers) ? parsedUsers : [];
        } catch (error) {
            return [];
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        clearFieldErrors();

        const isValid = validateAllFields();
        if (isValid) {
            const userEmail = emailInput.value.trim();
            const password = passwordInput.value;
            const users = getUsers();
            const existingUser = users.find(
                user =>
                    user.email.toLowerCase() === userEmail.toLowerCase() &&
                    user.password === password
            );

            if (!existingUser) {
                showFeedbackError('Invalid email or password');
                setFieldError('password', 'Check your password and try again');
                return;
            }

            sessionStorage.setItem('currentUser', JSON.stringify(existingUser));
            showSuccessMessage(`✨ Welcome back, ${existingUser.name || 'player'}!`);
            setTimeout(() => {
                window.location.href = '/Gameguessr/index1.html';
            }, 500);
        } else {
            const firstErrorField = document.querySelector('.error-message:not(:empty)');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function initPasswordToggle() {
        const toggleButton = document.querySelector('.toggle-password');
        if (toggleButton) {
            toggleButton.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-target');
                const inputField = document.getElementById(targetId);
                if (inputField) {
                    const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
                    inputField.setAttribute('type', type);
                    const icon = this.querySelector('i');
                    if (icon) {
                        if (type === 'text') {
                            icon.classList.remove('fa-eye-slash');
                            icon.classList.add('fa-eye');
                        } else {
                            icon.classList.remove('fa-eye');
                            icon.classList.add('fa-eye-slash');
                        }
                    }
                }
            });
        }
    }

    function initTermsLink() {
        const termsLink = document.getElementById('termsLink');
        if (termsLink) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                alert("📜 Terms of Service:\n\nBy using this service, you agree to our friendly. This is very useless page.\n\n✔️ Be respectful!\n✔️ Have fun play!");
            });
        }
    }

    function fixLabelConflict() {
        const termsLabel = document.querySelector('label[for="termsCheckbox"]');
        if (termsLabel) {
            const linkInside = termsLabel.querySelector('#termsLink');
            if (linkInside) {
                linkInside.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }
    }

    function init() {
        setupRealtimeValidation();
        initPasswordToggle();
        initTermsLink();
        fixLabelConflict();
        form.addEventListener('submit', handleLogin);
        clearFieldErrors();
    }

    init();
});
