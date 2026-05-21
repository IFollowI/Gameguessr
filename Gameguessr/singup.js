document.addEventListener('DOMContentLoaded', function () {
    const USERS_DB_KEY = 'gameguessrUsers';

    const form = document.getElementById('registerForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeatPassword');
    const termsCheckbox = document.getElementById('termsCheckbox');

    const nameErrorSpan = document.getElementById('nameError');
    const emailErrorSpan = document.getElementById('emailError');
    const passwordErrorSpan = document.getElementById('passwordError');
    const repeatErrorSpan = document.getElementById('repeatError');
    const termsErrorSpan = document.getElementById('termsError');
    const feedbackDiv = document.getElementById('formFeedback');

    function clearFieldErrors() {
        nameErrorSpan.innerHTML = '';
        emailErrorSpan.innerHTML = '';
        passwordErrorSpan.innerHTML = '';
        repeatErrorSpan.innerHTML = '';
        termsErrorSpan.innerHTML = '';
        feedbackDiv.innerHTML = '';

        document.querySelectorAll('.input-wrapper input').forEach(inp => {
            inp.classList.remove('error-border');
        });
    }

    function setFieldError(field, message) {
        const errorMap = {
            name: nameErrorSpan,
            email: emailErrorSpan,
            password: passwordErrorSpan,
            repeat: repeatErrorSpan,
            terms: termsErrorSpan
        };
        if (errorMap[field]) {
            errorMap[field].innerHTML = message ? `<i class="fas fa-exclamation-circle"></i> ${message}` : '';
        }
        if (field === 'name' && fullNameInput) fullNameInput.classList.toggle('error-border', !!message);
        if (field === 'email' && emailInput) emailInput.classList.toggle('error-border', !!message);
        if (field === 'password' && passwordInput) passwordInput.classList.toggle('error-border', !!message);
        if (field === 'repeat' && repeatPasswordInput) repeatPasswordInput.classList.toggle('error-border', !!message);
    }

    function validateName() {
        const name = fullNameInput.value.trim();
        if (name === '') {
            setFieldError('name', 'Full name is required');
            return false;
        }
        if (name.length < 2) {
            setFieldError('name', 'Name must be at least 2 characters');
            return false;
        }
        setFieldError('name', '');
        return true;
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

    function validateRepeatPassword() {
        const password = passwordInput.value;
        const repeat = repeatPasswordInput.value;
        if (repeat === '') {
            setFieldError('repeat', 'Please repeat your password');
            return false;
        }
        if (password !== repeat) {
            setFieldError('repeat', 'Passwords do not match');
            return false;
        }
        setFieldError('repeat', '');
        return true;
    }

    function validateTerms() {
        const isChecked = termsCheckbox.checked;
        if (!isChecked) {
            setFieldError('terms', 'You must agree to the Terms of service');
            return false;
        }
        setFieldError('terms', '');
        return true;
    }

    function validateAllFields() {
        const isNameValid = validateName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isRepeatValid = validateRepeatPassword();
        const isTermsValid = validateTerms();

        return isNameValid && isEmailValid && isPasswordValid && isRepeatValid && isTermsValid;
    }

    function setupRealtimeValidation() {
        fullNameInput.addEventListener('input', () => { validateName(); });
        emailInput.addEventListener('input', () => { validateEmail(); });
        passwordInput.addEventListener('input', () => {
            validatePassword();
            if (repeatPasswordInput.value.length > 0) validateRepeatPassword();
        });
        repeatPasswordInput.addEventListener('input', () => { validateRepeatPassword(); });
        termsCheckbox.addEventListener('change', () => { validateTerms(); });
        fullNameInput.addEventListener('blur', validateName);
        emailInput.addEventListener('blur', validateEmail);
        passwordInput.addEventListener('blur', validatePassword);
        repeatPasswordInput.addEventListener('blur', validateRepeatPassword);
    }

    function showSuccessMessage(message) {
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

    function saveUsers(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }

    function isEmailTaken(email) {
        const users = getUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    function handleRegister(e) {
        e.preventDefault();
        clearFieldErrors();

        const isValid = validateAllFields();
        if (isValid) {
            const userEmail = emailInput.value.trim();
            const userName = fullNameInput.value.trim();

            if (isEmailTaken(userEmail)) {
                setFieldError('email', 'This email is already registered');
                return;
            }

            const users = getUsers();
            users.push({
                name: userName,
                email: userEmail,
                password: passwordInput.value,
                createdAt: new Date().toISOString()
            });
            saveUsers(users);

            showSuccessMessage(`✨ Welcome ${userName}! Your registration was successful.`);
            sessionStorage.setItem('registeredUser', userName);
            sessionStorage.setItem(
                'currentUser',
                JSON.stringify({
                    name: userName,
                    email: userEmail
                })
            );
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

    function initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
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
        });
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
        initPasswordToggles();
        initTermsLink();
        fixLabelConflict();
        if (form) {
            form.addEventListener('submit', handleRegister);
        }

        clearFieldErrors();
    }

    init();

});
