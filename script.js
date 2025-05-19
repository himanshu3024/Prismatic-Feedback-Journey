// Three.js Particle Background
const canvas = document.getElementById('bgCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 5;

const particles = new THREE.BufferGeometry();
const particleCount = 800;
const posArray = new Float32Array(particleCount * 3);
const colorsArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 8;
    posArray[i + 1] = (Math.random() - 0.5) * 8;
    posArray[i + 2] = (Math.random() - 0.5) * 8;
    // Prismatic colors (blue, pink, purple)
    colorsArray[i] = Math.random() * 0.5 + 0.5; // R
    colorsArray[i + 1] = Math.random() * 0.3 + 0.7; // G
    colorsArray[i + 2] = 1.0; // B
}
particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particles.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
const particleMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
});
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

function animate() {
    requestAnimationFrame(animate);
    particleSystem.rotation.y += 0.001;
    particleSystem.rotation.x += 0.0005;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// GSAP Entrance Animations
gsap.from('#feedbackForm', { opacity: 0, y: 80, duration: 1.2, ease: 'power3.out' });
gsap.from('h1', { scale: 0.6, opacity: 0, duration: 1, delay: 0.3, ease: 'elastic.out(1, 0.5)' });
gsap.from('.step-indicator', { opacity: 0, y: -20, stagger: 0.2, duration: 0.8, delay: 0.5 });

// Multi-Step Form Logic
let currentStep = 1;
const totalSteps = 3;
const steps = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const stepIndicators = document.querySelectorAll('.step-indicator span');

function updateStepIndicators() {
    stepIndicators.forEach((indicator, index) => {
        if (index + 1 === currentStep) {
            indicator.classList.add('bg-blue-600', 'text-white');
            indicator.classList.remove('bg-gray-200', 'text-gray-500');
        } else {
            indicator.classList.add('bg-gray-200', 'text-gray-500');
            indicator.classList.remove('bg-blue-600', 'text-white');
        }
    });
}

function showStep(stepNumber) {
    steps.forEach((step, index) => {
        step.classList.toggle('hidden', index + 1 !== stepNumber);
        if (index + 1 === stepNumber) {
            gsap.fromTo(step, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' });
        }
    });
    prevBtn.classList.toggle('hidden', stepNumber === 1);
    nextBtn.classList.toggle('hidden', stepNumber === totalSteps);
    submitBtn.classList.toggle('hidden', stepNumber !== totalSteps);
    updateStepIndicators();
}

function validateStep(stepNumber) {
    const inputs = steps[stepNumber - 1].querySelectorAll('input[required], select[required], textarea[required]');
    let valid = true;
    inputs.forEach(input => {
        if (!input.value) {
            valid = false;
            input.classList.add('border-red-500');
            gsap.to(input, { x: 10, duration: 0.1, repeat: 3, yoyo: true });
        } else {
            input.classList.remove('border-red-500');
        }
    });
    if (stepNumber === 2 && !document.querySelector('input[name="rating"]:checked')) {
        valid = false;
        document.querySelector('#rating').classList.add('border-red-500', 'border', 'p-2', 'rounded-lg');
    } else {
        document.querySelector('#rating').classList.remove('border-red-500', 'border', 'p-2', 'rounded-lg');
    }
    return valid;
}

function updateReview() {
    document.getElementById('reviewName').textContent = document.getElementById('name').value || 'N/A';
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value || 'N/A';
    document.getElementById('reviewFeedbackType').textContent = document.getElementById('feedbackType').value || 'N/A';
    document.getElementById('reviewRating').textContent = document.querySelector('input[name="rating"]:checked')?.value || 'N/A';
    document.getElementById('reviewComments').textContent = document.getElementById('comments').value || 'N/A';
}

nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
            currentStep++;
            if (currentStep === totalSteps) updateReview();
            showStep(currentStep);
        }
    }
});

prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
});

// Star Rating Interactions
const stars = document.querySelectorAll('#rating label');
stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => {
        gsap.to(stars, { color: '#9ca3af', duration: 0.2 });
        for (let i = 0; i <= index; i++) {
            gsap.to(stars[i], { color: '#3b82f6', scale: 1.3, duration: 0.2 });
        }
    });

    star.addEventListener('mouseout', () => {
        gsap.to(stars, { color: '#9ca3af', scale: 1, duration: 0.2 });
        const checkedStar = document.querySelector('#rating input:checked + label');
        if (checkedStar) {
            const checkedIndex = Array.from(stars).indexOf(checkedStar);
            for (let i = 0; i <= checkedIndex; i++) {
                gsap.to(stars[i], { color: '#3b82f6', scale: 1, duration: 0.2 });
            }
        }
    });

    star.addEventListener('click', () => {
        gsap.to(stars, { color: '#9ca3af', scale: 1, duration: 0.2 });
        for (let i = 0; i <= index; i++) {
            gsap.to(stars[i], { color: '#3b82f6', scale: 1, duration: 0.2 });
        }
    });
});

// Form Submission
document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const messageElement = document.getElementById('message');
    messageElement.classList.remove('success', 'error', 'hidden');

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        feedbackType: document.getElementById('feedbackType').value,
        rating: document.querySelector('input[name="rating"]:checked')?.value,
        comments: document.getElementById('comments').value,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/SubmitForm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (response.ok) {
            messageElement.textContent = 'Feedback Successfully Transmitted!';
            messageElement.classList.add('success');
            gsap.to('#feedbackForm', {
                opacity: 0,
                y: -50,
                duration: 0.5,
                onComplete: () => {
                    document.getElementById('feedbackForm').reset();
                    currentStep = 1;
                    showStep(currentStep);
                    gsap.to('#feedbackForm', { opacity: 1, y: 0, duration: 0.5 });
                }
            });
        } else {
            throw new Error(result.error || 'Submission Failed');
        }
    } catch (error) {
        messageElement.textContent = 'Error: Transmission Interrupted';
        messageElement.classList.add('error');
    }
});