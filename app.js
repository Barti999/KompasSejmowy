// Ścieżka do pliku z pytaniami
const QUESTIONS_URL = 'data/questions.json';

// Tu będziemy trzymać pytania i odpowiedzi
let questions = [];
let userAnswers = {}; // np. { q1: "YES", q2: "cand1" }

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    const appEl = document.getElementById('app');
    appEl.textContent = 'Ładowanie pytań...';

    try {
        questions = await loadQuestions();
        renderQuestions(questions);
    } catch (error) {
        console.error('Błąd ładowania pytań:', error);
        appEl.textContent = 'Nie udało się załadować pytań. Sprawdź plik data/questions.json.';
    }
}

/**
 * Ładowanie pytań z pliku JSON
 * Oczekujemy struktury:
 * [
 *   {
 *     "id": "q1",
 *     "type": "ELECTRONIC",
 *     "title": "...",
 *     "description": "..."
 *   },
 *   {
 *     "id": "q2",
 *     "type": "ON_LIST",
 *     "title": "...",
 *     "description": "...",
 *     "options": [
 *        { "id": "cand1", "label": "Jan Kowalski" },
 *        { "id": "cand2", "label": "Anna Nowak" }
 *     ]
 *   }
 * ]
 */
async function loadQuestions() {
    const response = await fetch(QUESTIONS_URL);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Niepoprawny format questions.json – oczekiwana tablica.');
    }
    return data;
}

/**
 * Renderuje wszystkie pytania w #app
 */
function renderQuestions(questions) {
    const appEl = document.getElementById('app');
    appEl.innerHTML = ''; // wyczyszczenie

    if (questions.length === 0) {
        appEl.textContent = 'Brak pytań do wyświetlenia.';
        return;
    }

    questions.forEach((q, index) => {
        const block = document.createElement('div');
        block.className = 'question-block';

        const title = document.createElement('div');
        title.className = 'question-title';
        title.textContent = `${index + 1}. ${q.title || 'Pytanie bez tytułu'}`;
        block.appendChild(title);

        if (q.description) {
            const desc = document.createElement('p');
            desc.textContent = q.description;
            block.appendChild(desc);
        }

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options';

        // Render w zależności od typu pytania
        if (q.type === 'ELECTRONIC') {
            renderElectronicOptions(q, optionsContainer);
        } else if (q.type === 'ON_LIST') {
            renderOnListOptions(q, optionsContainer);
        } else {
            const info = document.createElement('p');
            info.textContent = `Nieznany typ pytania: ${q.type}`;
            optionsContainer.appendChild(info);
        }

        block.appendChild(optionsContainer);
        appEl.appendChild(block);
    });

    // Przycisk "Oblicz wyniki"
    const button = document.createElement('button');
    button.textContent = 'Oblicz zgodność (wersja testowa)';
    button.addEventListener('click', onCalculateClick);
    appEl.appendChild(button);
}

/**
 * Pytanie typu ELECTRONIC:
 * tworzymy 4 opcje:
 *  - YES (Za)
 *  - NO (Przeciw)
 *  - ABSTAIN (Wstrzymałbym się)
 *  - NOT_VOTED (Nie głosowałbym / trudno powiedzieć)
 */
function renderElectronicOptions(question, container) {
    const name = question.id;

    const options = [
        { value: 'YES', label: 'Za' },
        { value: 'NO', label: 'Przeciw' },
        { value: 'ABSTAIN', label: 'Wstrzymałbym się' },
        { value: 'NOT_VOTED', label: 'Nie głosowałbym / trudno powiedzieć' }
    ];

    options.forEach(opt => {
        const labelEl = document.createElement('label');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = opt.value;

        input.addEventListener('change', () => {
            userAnswers[question.id] = opt.value;
        });

        labelEl.appendChild(input);
        labelEl.appendChild(document.createTextNode(' ' + opt.label));
        container.appendChild(labelEl);
    });
}

/**
 * Pytanie typu ON_LIST:
 * oczekujemy w question.options tablicy:
 * [
 *   { id: "cand1", label: "Jan Kowalski" },
 *   { id: "cand2", label: "Anna Nowak" }
 * ]
 * Dodatkowo dodajemy opcję "NONE" (nie poparłbym nikogo).
 */
function renderOnListOptions(question, container) {
    const name = question.id;

    if (!Array.isArray(question.options) || question.options.length === 0) {
        const info = document.createElement('p');
        info.textContent = 'Brak zdefiniowanych opcji dla tego pytania (ON_LIST).';
        container.appendChild(info);
        return;
    }

    question.options.forEach(opt => {
        const labelEl = document.createElement('label');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = opt.id;

        input.addEventListener('change', () => {
            userAnswers[question.id] = opt.id;
        });

        labelEl.appendChild(input);
        labelEl.appendChild(document.createTextNode(' ' + opt.label));
        container.appendChild(labelEl);
    });

    // Dodatkowa opcja: nie poparłbym nikogo
    const noneLabel = document.createElement('label');
    const noneInput = document.createElement('input');
    noneInput.type = 'radio';
    noneInput.name = name;
    noneInput.value = 'NONE';

    noneInput.addEventListener('change', () => {
        userAnswers[question.id] = 'NONE';
    });

    noneLabel.appendChild(noneInput);
    noneLabel.appendChild(document.createTextNode(' Nie poparłbym nikogo'));
    container.appendChild(noneLabel);
}

/**
 * Obsługa kliknięcia "Oblicz zgodność"
 * Na razie wersja testowa:
 *  - sprawdza, czy wszystkie pytania mają odpowiedź
 *  - wyświetla podsumowanie odpowiedzi użytkownika
 *  W kolejnym etapie podmienimy to na realne liczenie zgodności z posłami.
 */
function onCalculateClick() {
    if (!questions || questions.length === 0) {
        alert('Brak pytań do analizy.');
        return;
    }

    // Sprawdzenie czy są brakujące odpowiedzi
    const unanswered = questions.filter(q => !userAnswers[q.id]);
    if (unanswered.length > 0) {
        const missingTitles = unanswered.map(q => q.title || q.id).join('\n - ');
        alert('Odpowiedz na wszystkie pytania, zanim obliczysz zgodność:\n\n - ' + missingTitles);
        return;
    }

    // Na razie: pokaż podsumowanie odpowiedzi
    displayTestResults();
}

/**
 * Tymczasowe wyświetlanie wyników:
 * - pokazujemy jakie odpowiedzi użytkownik zaznaczył
 * Później ten fragment zastąpimy obliczaniem zgodności z posłami.
 */
function displayTestResults() {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Twoje odpowiedzi (wersja testowa)';
    resultsEl.appendChild(heading);

    const list = document.createElement('ul');

    questions.forEach(q => {
        const li = document.createElement('li');
        const answer = userAnswers[q.id];

        li.textContent = `${q.title || q.id}: ${formatAnswerForDisplay(q, answer)}`;
        list.appendChild(li);
    });

    resultsEl.appendChild(list);
}

/**
 * Ładne wyświetlenie odpowiedzi w zależności od typu pytania
 */
function formatAnswerForDisplay(question, answer) {
    if (question.type === 'ELECTRONIC') {
        const map = {
            YES: 'Za',
            NO: 'Przeciw',
            ABSTAIN: 'Wstrzymałbym się',
            NOT_VOTED: 'Nie głosowałbym / trudno powiedzieć'
        };
        return map[answer] || answer;
    }

    if (question.type === 'ON_LIST') {
        if (answer === 'NONE') {
            return 'Nie poparłbym nikogo';
        }
        const opt = (question.options || []).find(o => o.id === answer);
        return opt ? opt.label : answer;
    }

    return answer;
}
