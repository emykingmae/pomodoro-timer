class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.currentMode = 'work';
        this.sessionCount = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartLeft = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.startPauseControl = document.getElementById('start-pause-control');
        this.startPauseSlider = document.getElementById('start-pause-slider');
        this.startPauseHandle = document.getElementById('start-pause-handle');
        this.resetBtn = document.getElementById('reset-btn');
        this.sessionCountDisplay = document.getElementById('session-count');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.dragSound = document.getElementById('drag-sound');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
    }

    bindEvents() {
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Add drag functionality
        this.startPauseHandle.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // Add click functionality to automatically slide to opposite side
        this.startPauseHandle.addEventListener('click', (e) => this.toggleSliderPosition(e));
        
        // Add dark mode toggle functionality
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target));
        });
        
        // Initialize dark mode from localStorage
        this.initializeDarkMode();
    }

    toggleStartPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startPauseControl.classList.add('active');
        this.startPauseHandle.classList.add('active');
        this.timeDisplay.classList.add('active');
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startPauseControl.classList.remove('active');
        this.startPauseHandle.classList.remove('active');
        this.timeDisplay.classList.remove('active');
        
        clearInterval(this.interval);
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }

    switchMode(button) {
        // Simplified for the minimal design
        this.reset();
    }

    complete() {
        this.pause();
        this.timeLeft = 0;
        this.updateDisplay();
        
        // Add completion animation
        const timerDisplay = document.querySelector('.timer-display');
        timerDisplay.classList.add('timer-complete');
        setTimeout(() => {
            timerDisplay.classList.remove('timer-complete');
        }, 500);
        
        // Show notification
        this.showNotification();
    }

    autoSwitchMode() {
        // Simplified for the minimal design
        this.reset();
    }

    showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const messages = {
                'work': 'Work session completed! Time for a break.',
                'short-break': 'Short break completed! Back to work.',
                'long-break': 'Long break completed! Ready for the next session.'
            };
            new Notification('Pomodoro Timer', {
                body: messages[this.currentMode],
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification();
                }
            });
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartLeft = this.startPauseHandle.offsetLeft;
    }

    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const deltaX = e.clientX - this.dragStartX;
        const sliderWidth = this.startPauseSlider.offsetWidth;
        const handleWidth = this.startPauseHandle.offsetWidth;
        const maxLeft = sliderWidth - handleWidth;
        
        let newLeft = this.dragStartLeft + deltaX;
        newLeft = Math.max(0, Math.min(maxLeft, newLeft));
        
        this.startPauseHandle.style.left = newLeft + 'px';
        
        // Play dragging sound with throttling
        if (!this.lastSoundTime || Date.now() - this.lastSoundTime > 100) {
            this.playDragSound();
            this.lastSoundTime = Date.now();
        }
        
        // Determine if timer should be running based on handle position
        const isRunning = newLeft > maxLeft / 2;
        
        // Update handle color based on position
        if (isRunning) {
            this.startPauseHandle.classList.add('active');
        } else {
            this.startPauseHandle.classList.remove('active');
        }
        
        // Only start/pause timer when crossing the midpoint
        if (isRunning !== this.isRunning) {
            if (isRunning) {
                this.start();
            } else {
                this.pause();
            }
        }
    }

    stopDrag() {
        this.isDragging = false;
    }

    playDragSound() {
        if (this.dragSound) {
            this.dragSound.currentTime = 0;
            this.dragSound.volume = 0.3;
            this.dragSound.play().catch(e => {
                // Silently handle audio play errors (user interaction required)
            });
        }
    }

    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        this.darkModeToggle.classList.toggle('active', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
        
        if (isDarkMode) {
            this.startShootingStars();
        } else {
            this.stopShootingStars();
        }
    }

    initializeDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            this.darkModeToggle.classList.add('active');
            this.startShootingStars();
        }
    }

    startShootingStars() {
        if (!this.shootingStarInterval) {
            this.shootingStarInterval = setInterval(() => {
                this.createShootingStar();
            }, 20000); // Every 20 seconds
        }
    }

    stopShootingStars() {
        if (this.shootingStarInterval) {
            clearInterval(this.shootingStarInterval);
            this.shootingStarInterval = null;
        }
    }

    createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * (window.innerHeight * 0.3); // Top 30% of screen
        const endX = startX + 300 + Math.random() * 200;
        const endY = startY + 200 + Math.random() * 100;
        
        shootingStar.style.cssText = `
            position: fixed;
            top: ${startY}px;
            left: ${startX}px;
            width: 2px;
            height: 2px;
            background: linear-gradient(45deg, transparent, #ffffff, transparent);
            border-radius: 50%;
            z-index: -1;
            animation: shooting-star-trail 2s linear forwards;
        `;
        
        // Add trail effect
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            transform: rotate(45deg);
            transform-origin: left center;
        `;
        shootingStar.appendChild(trail);
        
        document.body.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
        }, 2000);
    }

    toggleSliderPosition(e) {
        // Prevent this from triggering during drag operations
        if (this.isDragging) return;
        
        const sliderWidth = this.startPauseSlider.offsetWidth;
        const handleWidth = this.startPauseHandle.offsetWidth;
        const maxLeft = sliderWidth - handleWidth;
        const currentLeft = this.startPauseHandle.offsetLeft;
        
        // Determine current position and target position
        const isCurrentlyRunning = currentLeft > maxLeft / 2;
        const targetLeft = isCurrentlyRunning ? 0 : maxLeft;
        
        // Animate the handle to the target position
        this.startPauseHandle.style.transition = 'left 0.3s ease';
        this.startPauseHandle.style.left = targetLeft + 'px';
        
        // Update timer state based on new position
        if (isCurrentlyRunning) {
            this.pause();
        } else {
            this.start();
        }
        
        // Remove transition after animation completes
        setTimeout(() => {
            this.startPauseHandle.style.transition = '';
        }, 300);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        // Don't request immediately, wait for user interaction
        document.addEventListener('click', () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }, { once: true });
    }
}); 