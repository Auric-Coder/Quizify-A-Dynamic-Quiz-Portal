// Global Variables
let sections = {};
let currentSection = "EASY";
let correctAnswers = 0;
let attempts = 0;
let currentQuestionIndex = 0;
let questions = [];
let usedQuestions = new Set();
let maxQuestions = 0;
let currentQuiz = null;
let consecutiveCorrectAnswers = 0; // Counter for consecutive correct answers

// Debugging Tip: Use meaningful console messages to track variables and processes
console.log("Global variables initialized.");

// Utility Functions
function getAllQuizzes() {
    try {
        const quizzes = JSON.parse(localStorage.getItem('quizzes'));
        return quizzes ? quizzes : [];
    } catch (error) {
        console.error("Error retrieving quizzes:", error);
        return [];
    }
}

function saveQuiz(quiz) {
    const quizzes = getAllQuizzes();
    quizzes.push(quiz);
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    console.log("Quiz saved:", quiz);
}

function updateQuiz(quiz) {
    const quizzes = getAllQuizzes();
    const quizIndex = quizzes.findIndex(q => q.title === quiz.title);
    if (quizIndex !== -1) {
        quizzes[quizIndex] = quiz;
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        console.log(`Quiz updated: ${quiz.title}`);
    }
}

function deleteQuiz(quizTitle) {
    const quizzes = getAllQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.title !== quizTitle);
    localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    console.log(`Quiz deleted: ${quizTitle}`);
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Page-Specific Functions
function handleCreateQuizPage() {
    const createQuizForm = document.getElementById('create-quiz-form');
    if (!createQuizForm) {
        console.error("Create Quiz form not found.");
        return;
    }

    createQuizForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const quizTitle = document.getElementById('quiz-title').value.trim();
        const quizPassword = document.getElementById('quiz-password').value.trim();
        const numEasy = parseInt(document.getElementById("num-easy-questions").value);
        const numHard = parseInt(document.getElementById("num-hard-questions").value);
        const numExpert = parseInt(document.getElementById("num-expert-questions").value);
        attempts = parseInt(document.getElementById("num-attempts").value);

        if (!quizTitle || !quizPassword) {
            alert('Please enter a quiz title and set a password.');
            console.warn("Missing quiz title or password.");
            return;
        }

        maxQuestions = Math.max(numEasy, numHard, numExpert);
        attempts = Math.min(attempts, maxQuestions);

        sections = {
            "EASY": [],
            "HARD": [],
            "EXPERT": []
        };

        const currentQuiz = {
            title: quizTitle,
            password: quizPassword,
            sections: sections,
            attempts: attempts,
            numQuestions: {
                EASY: numEasy,
                HARD: numHard,
                EXPERT: numExpert
            }
        };
        sessionStorage.setItem('currentQuiz', JSON.stringify(currentQuiz));
        console.log("Quiz setup completed:", currentQuiz);
        window.location.href = 'add-questions.html';
    });
}

function handleAddQuestionsPage() {
    const addQuestionsForm = document.getElementById('add-questions-form');
    const questionsContainer = document.getElementById('questions-container');

    if (!addQuestionsForm || !questionsContainer) {
        console.error("Add Questions form or container not found.");
        return;
    }

    const currentQuiz = JSON.parse(sessionStorage.getItem('currentQuiz'));
    if (!currentQuiz) {
        alert('No quiz data found. Please create a quiz first.');
        console.warn("Current quiz data is missing.");
        window.location.href = 'create-quiz.html';
        return;
    }

    const { sections, numQuestions } = currentQuiz;
    let questionCount = 0;

    for (let section in numQuestions) {
        const count = numQuestions[section];
        for (let i = 1; i <= count; i++) {
            questionCount++;
            const questionDiv = createQuestionBlock(section, i);
            questionsContainer.appendChild(questionDiv);
        }
    }

    addQuestionsForm.addEventListener('submit', function (event) {
        event.preventDefault();
        for (let section in sections) {
            for (let i = 1; i <= numQuestions[section]; i++) {
                const questionData = getQuestionData(section, i);
                if (!questionData) return;

                sections[section].push({
                    questionText: questionData.questionText,
                    options: shuffleArray([questionData.correctAnswer, ...questionData.wrongAnswers])
                });
            }
        }

        saveQuiz({
            title: currentQuiz.title,
            password: currentQuiz.password,
            sections: sections,
            attempts: attempts
        });
        alert('Quiz saved successfully!');
        window.location.href = 'quizzes.html';
    });
}

// Helper to create question block
function createQuestionBlock(section, questionIndex) {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question-block');

    questionDiv.innerHTML = `
        <h3>${section} - Question ${questionIndex}</h3>
        <label for="question-${section}-${questionIndex}">Question Text:</label>
        <input type="text" id="question-${section}-${questionIndex}" required>
        <label for="correct-answer-${section}-${questionIndex}">Correct Answer:</label>
        <input type="text" id="correct-answer-${section}-${questionIndex}" required>
        <label for="wrong-answers-${section}-${questionIndex}">Wrong Answers (comma-separated):</label>
        <input type="text" id="wrong-answers-${section}-${questionIndex}" placeholder="e.g. Wrong1, Wrong2, Wrong3">
    `;
    return questionDiv;
}

// Helper to retrieve question data
function getQuestionData(section, questionIndex) {
    const questionText = document.getElementById(`question-${section}-${questionIndex}`).value.trim();
    const correctAnswer = document.getElementById(`correct-answer-${section}-${questionIndex}`).value.trim();
    const wrongAnswers = document.getElementById(`wrong-answers-${section}-${questionIndex}`).value.split(',').map(answer => answer.trim());

    if (!questionText || !correctAnswer || wrongAnswers.length < 3) {
        alert('Please fill in all fields correctly.');
        console.warn(`Incomplete data for ${section} - Question ${questionIndex}`);
        return null;
    }
    return { questionText, correctAnswer, wrongAnswers };
}

// Shuffle the answer options
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Quizzes page functionality
function handleQuizzesPage() {
    const quizzesList = document.getElementById('quizzes-list');
    const quizzes = getAllQuizzes();

    if (quizzes.length === 0) {
        quizzesList.innerHTML = '<p>No quizzes available.</p>';
        return;
    }

    quizzes.forEach((quiz, index) => {
        const quizDiv = document.createElement('div');
        quizDiv.classList.add('quiz');

        const title = document.createElement('h4');
        title.textContent = quiz.title;
        quizDiv.appendChild(title);

        const playButton = document.createElement('button');
        playButton.textContent = 'Play Quiz';
        playButton.onclick = function () {
            currentQuiz = quiz;
            currentQuestionIndex = 0;
            correctAnswers = 0;
            attempts = quiz.attempts;
            usedQuestions.clear();
            consecutiveCorrectAnswers = 0; // Reset counter for new quiz
            window.location.href = 'play-quiz.html';
        };
        quizDiv.appendChild(playButton);

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit Quiz';
        editButton.onclick = function () {
            const password = prompt("Enter the password to edit this quiz:");
            if (password === quiz.password) {
                window.location.href = `edit-quiz.html?title=${quiz.title}`;
            } else {
                alert('Incorrect password.');
            }
        };
        quizDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Quiz';
        deleteButton.onclick = function () {
            const password = prompt("Enter the password to delete this quiz:");
            if (password === quiz.password) {
                deleteQuiz(quiz.title);
                alert('Quiz deleted successfully.');
                window.location.reload();
            } else {
                alert('Incorrect password.');
            }
        };
        quizDiv.appendChild(deleteButton);

        quizzesList.appendChild(quizDiv);
    });
}

// Functionality to manage the display and logic for the quiz play page
function handlePlayQuizPage() {
    const quiz = currentQuiz;
    const quizTitleElement = document.getElementById('quiz-title');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const attemptsText = document.getElementById('attempts-text');
    const nextButton = document.getElementById('next-question-button');

    if (!quiz || !quizTitleElement || !questionText || !optionsContainer || !attemptsText || !nextButton) {
        console.error("Play Quiz page setup failed due to missing elements or quiz data.");
        return;
    }

    quizTitleElement.textContent = `Quiz: ${quiz.title}`;
    attemptsText.textContent = `Attempts left: ${attempts}`;

    displayQuestion();

    function displayQuestion() {
        if (currentQuestionIndex >= maxQuestions || attempts <= 0) {
            alert(`Quiz Over! Your score is: ${correctAnswers}`);
            window.location.href = 'quizzes.html';
            return;
        }

        const currentQuestion = getCurrentQuestion();
        if (!currentQuestion) return;

        questionText.textContent = currentQuestion.questionText;
        optionsContainer.innerHTML = '';

        currentQuestion.options.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.className = 'mcq-option';
            optionButton.textContent = option;
            optionButton.onclick = () => checkAnswer(option, currentQuestion.options[0]);
            optionsContainer.appendChild(optionButton);
        });
    }

    nextButton.onclick = () => {
        displayQuestion();
        nextButton.disabled = true;
    };
}

function getCurrentQuestion() {
    const sectionQuestions = currentQuiz.sections[currentSection];
    const question = sectionQuestions[currentQuestionIndex++];
    if (!question) {
        console.warn("Question not found in section:", currentSection);
        return null;
    }
    return question;
}

function checkAnswer(selectedOption) {
    const currentQuestion = sections[currentSection][usedQuestions.size - 1];
    const correctAnswer = currentQuestion.options[0];
    
    if (selectedOption === correctAnswer) {
        correctAnswers++;
        feedback.textContent = 'Correct!';
        consecutiveCorrectAnswers++;

        // Check if the user should be promoted to the next section
        if (currentSection === "EASY" && consecutiveCorrectAnswers === 3) {
            currentSection = "HARD";
            consecutiveCorrectAnswers = 0; // Reset for next section
            alert('Congratulations! Moving to HARD section.');
        } else if (currentSection === "HARD" && consecutiveCorrectAnswers === 3) {
            currentSection = "EXPERT";
            consecutiveCorrectAnswers = 0; // Reset for next section
            alert('Congratulations! Moving to EXPERT section.');
        }
    } else {
        feedback.textContent = `Incorrect. Correct answer: ${correctAnswer}`;
        consecutiveCorrectAnswers = 0; // Reset counter on incorrect answer
        
        // Demote to previous section if possible
        if (currentSection === "EXPERT") {
            currentSection = "HARD";
            alert('Demoted to HARD section.');
        } else if (currentSection === "HARD") {
            currentSection = "EASY";
            alert('Demoted to EASY section.');
        }
    }

    attempts--;
    attemptsText.textContent = `Attempts left: ${attempts}`;

    if (attempts > 0) {
        nextButton.disabled = false;
    } else {
        nextButton.disabled = true;
    }
}

// Edit Quiz Page Functionality
function handleEditQuizPage() {
    const quizTitle = getQueryParam('title'); // Use title as identifier for loading and saving quiz
    const quizzes = getAllQuizzes();
    const quiz = quizzes.find(q => q.title === quizTitle); // Find quiz by title

    if (!quiz) {
        alert('Quiz not found.');
        window.location.href = 'quizzes.html';
        return;
    }

    // Populate the quiz data into the form
    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer) {
        console.error("Questions container not found.");
        return;
    }
    
    const { sections } = quiz;

    // Loop through sections and create editable form elements for each question
    for (let section in sections) {
        sections[section].forEach((questionData, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-block');

            const sectionHeader = document.createElement('h3');
            sectionHeader.textContent = `${section} - Question ${index + 1}`;
            questionDiv.appendChild(sectionHeader);

            // Question Text Input
            const questionLabel = document.createElement('label');
            questionLabel.textContent = 'Question Text:';
            questionDiv.appendChild(questionLabel);

            const questionInput = document.createElement('input');
            questionInput.type = 'text';
            questionInput.value = questionData.questionText;
            questionInput.id = `question-${section}-${index + 1}`;
            questionDiv.appendChild(questionInput);

            // Correct Answer Input
            const correctAnswerLabel = document.createElement('label');
            correctAnswerLabel.textContent = 'Correct Answer:';
            questionDiv.appendChild(correctAnswerLabel);

            const correctAnswerInput = document.createElement('input');
            correctAnswerInput.type = 'text';
            correctAnswerInput.value = questionData.options[0];
            correctAnswerInput.id = `correct-answer-${section}-${index + 1}`;
            questionDiv.appendChild(correctAnswerInput);

            // Wrong Answers Input
            const wrongAnswersLabel = document.createElement('label');
            wrongAnswersLabel.textContent = 'Wrong Answers (comma-separated):';
            questionDiv.appendChild(wrongAnswersLabel);

            const wrongAnswersInput = document.createElement('input');
            wrongAnswersInput.type = 'text';
            wrongAnswersInput.value = questionData.options.slice(1).join(', ');
            wrongAnswersInput.id = `wrong-answers-${section}-${index + 1}`;
            questionDiv.appendChild(wrongAnswersInput);

            questionsContainer.appendChild(questionDiv);
        });
    }

    // Add event listener to save changes on form submission
    const editQuizForm = document.getElementById('edit-quiz-form');
    editQuizForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Save the updated questions and answers back to the quiz object
        for (let section in sections) {
            sections[section].forEach((_, index) => {
                const updatedQuestionText = document.getElementById(`question-${section}-${index + 1}`).value.trim();
                const updatedCorrectAnswer = document.getElementById(`correct-answer-${section}-${index + 1}`).value.trim();
                const updatedWrongAnswers = document.getElementById(`wrong-answers-${section}-${index + 1}`).value.split(',').map(answer => answer.trim());

                if (!updatedQuestionText || !updatedCorrectAnswer || updatedWrongAnswers.length < 3) {
                    alert('Please fill in all fields correctly.');
                    return;
                }

                // Update the question data
                sections[section][index].questionText = updatedQuestionText;
                sections[section][index].options = shuffleArray([updatedCorrectAnswer, ...updatedWrongAnswers]);
            });
        }

        // Update the quiz in localStorage
        updateQuiz(quiz);  // This calls the function to save updates
        alert('Quiz updated successfully!');
        window.location.href = 'quizzes.html';
    });
}


// Run appropriate page logic based on the current page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('create-quiz.html')) {
        console.log('Create Quiz Page detected');
        handleCreateQuizPage();
    } else if (window.location.pathname.endsWith('add-questions.html')) {
        console.log('Add Questions Page detected');
        handleAddQuestionsPage();
    } else if (window.location.pathname.endsWith('quizzes.html')) {
        console.log('Quizzes Page detected');
        handleQuizzesPage();
    } else if (window.location.pathname.endsWith('play-quiz.html')) {
        console.log('Play Quiz Page detected');
        handlePlayQuizPage();
    } else if (window.location.pathname.endsWith('edit-quiz.html')) {
        console.log('Edit Quiz Page detected');
        handleEditQuizPage();
    } else {
        console.warn('No matching page handler found for:', window.location.pathname);
    }
});





// Animated Stats Counter
const counters = document.querySelectorAll('.stat-number');
counters.forEach(counter => {
    counter.innerText = '0';

    const updateCounter = () => {
        const target = +counter.getAttribute('data-target');
        const currentValue = +counter.innerText;
        const increment = target / 200; // Adjust for animation speed

        if (currentValue < target) {
            counter.innerText = `${Math.ceil(currentValue + increment)}`;
            setTimeout(updateCounter, 10); // Speed of animation
        } else {
            counter.innerText = target;
        }
    };

    updateCounter();
});


// Testimonial Carousel
let currentSlide = 0;
const slides = document.querySelectorAll('.testimonial-slide');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.style.transform = `translateX(${(i - index) * 260}px)`; // Adjusted to match new gap
    });
}

setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}, 3000); // Change slides every 3 seconds


setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}, 3000); // Change slides every 3 seconds
