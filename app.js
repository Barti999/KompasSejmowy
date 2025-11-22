// Ścieżki do plików z danymi
const QUESTIONS_URL = 'data/questions.json';
const MPs_URL = 'data/MPs.json';
const CLUBS_URL = 'data/clubs.json';
const VOTING_DIR = 'data/voting';

// Dane w pamięci
let questions = [];
let userAnswers = {}; // np. { q1: "cand1", q2: "cand2" }
let mps = [];
let clubs = [];
const votingCache = {}; // cache na q1.json, q2.json itd.

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    const appEl = document.getElementById('app');
    appEl.textContent = 'Ładowanie danych...';

    try {
        const [qData, mpData, clubData] = await Promise.all([
            loadQuestions(),
            loadMPs(),
            loadClubs()
        ]);

        questions = qData;
        mps = mpData;
        clubs = clubData;

        renderQuestions(questions);
    } catch (error) {
        console.error('Błąd inicjalizacji aplikacji:', error);
        appEl.textContent = 'Nie udało się załadować danych. Sprawdź pliki JSON.';
    }
}

/* ==========================
   ŁADOWANIE DANYCH
   ========================== */

async function loadQuestions() {
    const response = await fetch(QUESTIONS_URL);
    if (!response.ok) {
        throw new Error(`Błąd ładowania questions.json: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Niepoprawny format questions.json – oczekiwana tablica.');
    }
    return data;
}

async function loadMPs() {
    const response = await fetch(MPs_URL);
    if (!response.ok) {
        throw new Error(`Błąd ładowania MPs.json: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Niepoprawny format MPs.json – oczekiwana tablica.');
    }
    return data;
}

async function loadClubs() {
    const response = await fetch(CLUBS_URL);
    if (!response.ok) {
        throw new Error(`Błąd ładowania clubs.json: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Niepoprawny format clubs.json – oczekiwana tablica.');
    }
    return data;
}

async function loadVotingForQuestion(questionId) {
    if (votingCache[questionId]) {
        return votingCache[questionId];
    }
    const response = await fetch(`${VOTING_DIR}/${questionId}.json`);
    if (!response.ok) {
        throw new Error(`Błąd ładowania głosowania dla ${questionId}: ${response.status}`);
    }
    const data = await response.json();
    votingCache[questionId] = data;
    return data;
}

/* ==========================
   RENDER PYTAŃ
   ========================== */

function renderQuestions(questions) {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '';

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

    const button = document.createElement('button');
    button.textContent = 'Oblicz zgodność';
    button.addEventListener('click', onCalculateClick);
    appEl.appendChild(button);
}

/* ==========================
   OPCJE PYTAŃ
   ========================== */

function renderElectronicOptions(question, container) {
    const name = question.id;

    const options = [
        { value: 'YES',       label: 'Za' },
        { value: 'NO',        label: 'Przeciw' },
        { value: 'ABSTAIN',   label: 'Wstrzymałbym się' },
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

/* ==========================
   OBSŁUGA OBLICZANIA
   ========================== */

async function onCalculateClick() {
    if (!questions || questions.length === 0) {
        alert('Brak pytań do analizy.');
        return;
    }

    const unanswered = questions.filter(q => !userAnswers[q.id]);
    if (unanswered.length > 0) {
        const missingTitles = unanswered.map(q => q.title || q.id).join('\n - ');
        alert('Odpowiedz na wszystkie pytania, zanim obliczysz zgodność:\n\n - ' + missingTitles);
        return;
    }

    try {
        await calculateAndDisplayCompatibility();
    } catch (err) {
        console.error('Błąd podczas liczenia zgodności:', err);
        alert('Wystąpił błąd podczas liczenia zgodności. Szczegóły są w konsoli (F12).');
    }
}

/**
 * Główna funkcja licząca zgodność i renderująca wyniki
 */
async function calculateAndDisplayCompatibility() {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';

    // 1. Podsumowanie odpowiedzi użytkownika
    const answersSection = buildAnswersSummarySection();
    resultsEl.appendChild(answersSection);

    // 2. Punkty dla posłów
    const { mpScores, mpMaxScores } = await calculateMpScores();

    const mpResults = mps.map(mp => {
        const score = mpScores[mp.id] || 0;
        const max = mpMaxScores[mp.id] || 0;
        const percent = max > 0 ? (score / max) * 100 : 0;
        return {
            id: mp.id,
            firstName: mp.firstName,
            lastName: mp.lastName,
            club: mp.club,
            score,
            max,
            percent
        };
    }).sort((a, b) => b.percent - a.percent);

    // 3. Agregacja po klubach
    const clubMap = {};
    mpResults.forEach(r => {
        if (!r.max) return;
        if (!clubMap[r.club]) {
            clubMap[r.club] = { club: r.club, totalPercent: 0, count: 0 };
        }
        clubMap[r.club].totalPercent += r.percent;
        clubMap[r.club].count += 1;
    });

    const clubResults = Object.values(clubMap).map(c => {
        const avg = c.count > 0 ? c.totalPercent / c.count : 0;
        return { club: c.club, avgPercent: avg };
    }).sort((a, b) => b.avgPercent - a.avgPercent);

    // 4. Render wyników posłów
    const mpSection = document.createElement('section');
    const mpHeading = document.createElement('h2');
    mpHeading.textContent = 'Zgodność z posłami';
    mpSection.appendChild(mpHeading);

    if (mpResults.length === 0) {
        const info = document.createElement('p');
        info.textContent = 'Brak danych do obliczenia zgodności z posłami.';
        mpSection.appendChild(info);
    } else {
        const list = document.createElement('div');
        mpResults.slice(0, 10).forEach(r => {
            const item = document.createElement('div');
            item.className = 'result-item';
            const name = `${r.firstName} ${r.lastName}`;
            item.textContent = `${name} (${r.club}) – zgodność: ${r.percent.toFixed(0)}% (na podstawie ${r.max} pytań)`;
            list.appendChild(item);
        });
        mpSection.appendChild(list);
    }

    resultsEl.appendChild(mpSection);

    // 5. Render wyników klubów
    const clubSection = document.createElement('section');
    const clubHeading = document.createElement('h2');
    clubHeading.textContent = 'Zgodność z klubami';
    clubSection.appendChild(clubHeading);

    if (clubResults.length === 0) {
        const info = document.createElement('p');
        info.textContent = 'Brak danych do obliczenia zgodności z klubami.';
        clubSection.appendChild(info);
    } else {
        const list = document.createElement('div');
        clubResults.forEach(c => {
            const clubName = getClubName(c.club);
            const item = document.createElement('div');
            item.className = 'result-item';
            item.textContent = `${clubName} (${c.club}) – średnia zgodność: ${c.avgPercent.toFixed(0)}%`;
            list.appendChild(item);
        });
        clubSection.appendChild(list);
    }

    resultsEl.appendChild(clubSection);
}

/* ==========================
   POMOCNICZE: LICZENIE PUNKTÓW
   ========================== */

async function calculateMpScores() {
    const mpScores = {};
    const mpMaxScores = {};

    for (const q of questions) {
        const voting = await loadVotingForQuestion(q.id);
        const votes = Array.isArray(voting.votes) ? voting.votes : [];

        for (const mp of mps) {
            const userAnswer = userAnswers[q.id];
            if (!userAnswer) continue;

            const mpVoteEntry = votes.find(v => String(v.MP) === String(mp.id));
            const mpVote = mpVoteEntry ? mpVoteEntry.vote : null;

            const [points, maxPoints] = scoreSingleQuestion(q.type, userAnswer, mpVote);
            if (maxPoints === 0) continue;

            mpScores[mp.id] = (mpScores[mp.id] || 0) + points;
            mpMaxScores[mp.id] = (mpMaxScores[mp.id] || 0) + maxPoints;
        }
    }

    return { mpScores, mpMaxScores };
}

/**
 * Zwraca [punkty, maksymalne punkty] dla jednego pytania
 */
function scoreSingleQuestion(type, userAnswer, mpVote) {
    if (!userAnswer) return [0, 0];

    if (type === 'ELECTRONIC') {
        const validVotes = ['YES', 'NO', 'ABSTAIN'];

        if (userAnswer === 'NOT_VOTED') {
            const mpNotVoted = !mpVote || !validVotes.includes(mpVote);
            return [mpNotVoted ? 1 : 0, 1];
        }

        if (!validVotes.includes(userAnswer)) {
            return [0, 0];
        }

        if (!mpVote || !validVotes.includes(mpVote)) {
            return [0, 1];
        }

        return [userAnswer === mpVote ? 1 : 0, 1];
    }

    if (type === 'ON_LIST') {
        if (userAnswer === 'NONE') {
            const mpNone = !mpVote;
            return [mpNone ? 1 : 0, 1];
        }

        if (!mpVote) {
            return [0, 1];
        }

        return [userAnswer === mpVote ? 1 : 0, 1];
    }

    return [0, 0];
}

/* ==========================
   POMOCNICZE: WYNIKI I FORMATOWANIE
   ========================== */

function buildAnswersSummarySection() {
    const section = document.createElement('section');

    const heading = document.createElement('h2');
    heading.textContent = 'Twoje odpowiedzi';
    section.appendChild(heading);

    const list = document.createElement('ul');

    questions.forEach(q => {
        const li = document.createElement('li');
        const answer = userAnswers[q.id];
        li.textContent = `${q.title || q.id}: ${formatAnswerForDisplay(q, answer)}`;
        list.appendChild(li);
    });

    section.appendChild(list);
    return section;
}

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

function getClubName(clubId) {
    const club = clubs.find(c => c.id === clubId);
    return club ? club.name : clubId;
}
