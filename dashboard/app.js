// STATE MANAGEMENT
const state = {
  score: 30,
  streak: 2,
  totalQuizzes: 3,
  correctAnswers: 3,
  wrongAnswers: 0,
  history: [
    { topic: "Quantum Computing", time: Date.now() - 3600000, score: 10, correct: true },
    { topic: "DNA", time: Date.now() - 1800000, score: 10, correct: true },
    { topic: "Machine Learning", time: Date.now() - 600000, score: 10, correct: true }
  ],
  currentQuiz: null,
  isTyping: false
};

// ── 1. INIT ──────────────────────────────────────────────
function init() {
  loadState();
  startMatrixRain();

  // Typewriter on hero eyebrow
  const eyebrow = document.getElementById("heroEyebrow");
  if (eyebrow) {
    eyebrow.innerHTML = "";
    setTimeout(function () {
      typewriterEffect(eyebrow, "> INITIALIZING STUDY_BOT.py...", 40);
    }, 500);
  }

  // Pre-seed chat if empty
  var chatMessages = document.getElementById("chatMessages");
  if (chatMessages && chatMessages.children.length === 0) {
    renderSeededConversation();
  }

  // Bind events
  document.getElementById("chatInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") handleInputSubmit();
  });
  document.getElementById("sendBtn").addEventListener("click", handleInputSubmit);

  // Quick topics
  document.querySelectorAll(".topic-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var topic = chip.textContent;
      document.getElementById("chatInput").value = "/study " + topic;
      handleInputSubmit();
    });
  });

  // Copy button
  var copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var code = document.querySelector(".terminal-block pre code");
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 2000);
        });
      }
    });
  }

  updateStatsPanel();
  setTimeout(function () {
    showToast("📚 Welcome! Try studying any topic", "info");
  }, 1000);
}

// ── SEED CONVERSATION ────────────────────────────────────
function renderSeededConversation() {
  renderUserMessage("/study Machine Learning");

  var mlSummary = "📚 *Machine Learning*\n\nHere's your 3-point summary:\n\n" +
    "• Machine learning is a field of study in artificial intelligence concerned with the development and study of statistical algorithms that can learn from data and generalize to unseen data, and thus perform tasks without explicit instructions.\n\n" +
    "• Recently, generative artificial neural networks have surpassed many previous approaches in performance.\n\n" +
    "• Machine learning approaches have been applied to large language models, computer vision, speech recognition, email filtering, agriculture, and medicine.\n\n" +
    "Ready for a quiz? Type /quiz Machine Learning 🎯";
  renderBotMessage(mlSummary, false, false);

  renderUserMessage("/quiz Machine Learning");

  var quizQuestion = "🎯 Quiz Time!\n\nQ: Fill in the blank: 'Machine learning approaches have been applied to large language models, computer vision, speech recognition, email filtering, agriculture, and ___________.'\n\nChoose your answer:";
  var quizData = {
    topic: "Machine Learning",
    question: quizQuestion,
    options: ["medicine", "Framework", "System", "Theory"],
    correct: 0
  };

  renderBotMessage(quizQuestion, true, false, quizData);
}

// ── 2. HANDLE USER MESSAGE ───────────────────────────────
async function handleUserMessage(input) {
  if (!input.trim() || state.isTyping) return;
  state.isTyping = true;

  var cmd = "";
  var arg = "";

  if (input.startsWith("/")) {
    var parts = input.split(" ");
    cmd = parts[0].toLowerCase();
    arg = parts.slice(1).join(" ");
  } else {
    cmd = "/study";
    arg = input;
  }

  renderUserMessage(input);
  document.getElementById("chatInput").value = "";

  showTypingIndicator();

  setTimeout(async function () {
    removeTypingIndicator();

    switch (cmd) {
      case "/study":
        if (!arg) {
          renderBotMessage("Please provide a topic!\nExample: /study Quantum Computing");
        } else {
          var summary = await fetchWikipediaSummary(arg);
          if (!summary) {
            renderBotMessage("❌ Could not find info on '" + arg + "'.\nTry a different search term.");
          } else {
            var bullets = generateBulletPoints(summary, arg);
            var response = "📚 *" + arg + "*\n\nHere's your 3-point summary:\n\n";
            bullets.forEach(function (b) { response += "• " + b + "\n\n"; });
            response += "Ready for a quiz? Type /quiz " + arg + " 🎯";
            addToHistory(arg, 0, null, true);
            renderBotMessage(response);
          }
        }
        break;
      case "/quiz":
        if (!arg) {
          renderBotMessage("Please provide a topic!\nExample: /quiz Machine Learning");
        } else {
          var qSummary = await fetchWikipediaSummary(arg);
          if (!qSummary) {
            renderBotMessage("❌ Could not find info on '" + arg + "'.");
          } else {
            var qd = generateQuiz(qSummary, arg);
            if (!qd) {
              renderBotMessage("❌ Could not generate quiz for this topic. Try another.");
            } else {
              renderBotMessage("🎯 *Quiz: " + arg + "*\n\nQ: " + qd.question + "\n\nChoose your answer:", true, true, qd);
            }
          }
        }
        break;
      case "/score":
        renderBotMessage("📊 *Your Stats*\n\n🏆 Score: " + state.score + " points\n📚 Topics studied: " + state.history.length + "\n🔥 Streak: " + state.streak + "\n\nKeep studying to increase your score!");
        break;
      case "/history":
        if (state.history.length === 0) {
          renderBotMessage("No topics studied yet!\nStart with: /study Machine Learning");
        } else {
          var histText = "📖 *Your Study History*\n\n";
          var recent = state.history.slice().reverse().slice(0, 5);
          recent.forEach(function (item, i) {
            histText += (i + 1) + ". " + item.topic + "\n";
          });
          renderBotMessage(histText);
        }
        break;
      case "/help":
      case "/start":
        renderBotMessage("🤖 Welcome to StudyBot!\n\nCommands:\n/study [topic] — Get a 3-point summary\n/quiz [topic]  — Take a quiz\n/score         — Your stats\n/history       — Past topics\n/help          — All commands\n\nTry: /study Machine Learning");
        break;
      default:
        renderBotMessage("Unknown command. Type /help to see available commands.");
    }

    state.isTyping = false;
  }, 1500);
}

function handleInputSubmit() {
  var input = document.getElementById("chatInput").value;
  handleUserMessage(input);
}

// ── 3. FETCH WIKIPEDIA ───────────────────────────────────
async function fetchWikipediaSummary(topic) {
  try {
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(topic);
    var response = await fetch(url);
    if (response.ok) {
      var data = await response.json();
      return data.extract || null;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ── 4. GENERATE BULLET POINTS ────────────────────────────
function generateBulletPoints(text, topic) {
  var sentences = text.split(".").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 40; });

  if (sentences.length >= 3) {
    return sentences.slice(0, 3);
  } else if (sentences.length === 2) {
    return [sentences[0], sentences[1], topic + " has significant applications in modern technology and research."];
  } else {
    var shortText = text.length > 200 ? text.substring(0, 197) + "..." : text;
    return [shortText, topic + " is an important concept in its field.", "Learn more about " + topic + " on Wikipedia."];
  }
}

// ── 5. GENERATE QUIZ ─────────────────────────────────────
function generateQuiz(text, topic) {
  var sentences = text.split(".").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 50; });
  if (sentences.length === 0) return null;

  var baseSentence = sentences[Math.floor(Math.random() * Math.min(3, sentences.length))];
  var words = baseSentence.split(" ");

  var excludeWords = ["Which", "These", "Those", "Their", "There", "Where", "While", "About", "Through"];
  var significant = words.filter(function (w) {
    return w.length > 5 && /^[A-Z]/.test(w) && excludeWords.indexOf(w) === -1;
  });

  var answerWord = "";
  if (significant.length > 0) {
    answerWord = significant[Math.floor(Math.random() * significant.length)];
  } else {
    var longWords = words.filter(function (w) { return w.length > 6; });
    if (longWords.length === 0) return null;
    answerWord = longWords[Math.floor(Math.random() * longWords.length)];
  }

  // Clean punctuation
  answerWord = answerWord.replace(/[.,;!?"'()]/g, "");
  if (!answerWord) return null;

  var questionText = baseSentence.replace(answerWord, "_______");
  var question = "Fill in the blank: '" + questionText + "'";

  // Generate distractors
  var allWordsMatch = text.match(/\b[A-Za-z]{5,}\b/g) || [];
  var uniqueWords = [];
  allWordsMatch.forEach(function (w) {
    if (uniqueWords.indexOf(w) === -1 && w !== answerWord) uniqueWords.push(w);
  });

  // Shuffle
  uniqueWords.sort(function () { return 0.5 - Math.random(); });

  var fillers = ["Algorithm", "System", "Network", "Process", "Method", "Framework", "Structure", "Theory", "Model", "Protocol"];
  while (uniqueWords.length < 3) {
    var f = fillers.pop();
    if (f && f !== answerWord) uniqueWords.push(f);
  }

  var distractors = uniqueWords.slice(0, 3);
  var options = distractors.concat([answerWord]);
  options.sort(function () { return 0.5 - Math.random(); });

  var correctIndex = options.indexOf(answerWord);

  return { question: question, options: options, correct: correctIndex, topic: topic };
}

// ── FORMAT TEXT ───────────────────────────────────────────
function formatText(text) {
  // Bold: *text* → <strong>text</strong>
  var formatted = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  // Newlines
  formatted = formatted.replace(/\n/g, "<br>");
  return formatted;
}

// ── 6. RENDER USER MESSAGE ───────────────────────────────
function renderUserMessage(text) {
  var msgDiv = document.createElement("div");
  msgDiv.className = "msg user";
  msgDiv.textContent = text;
  document.getElementById("chatMessages").appendChild(msgDiv);
  scrollChatToBottom();
}

// ── 7. RENDER BOT MESSAGE ────────────────────────────────
function renderBotMessage(text, hasQuiz, animate, quizData) {
  if (hasQuiz === undefined) hasQuiz = false;
  if (animate === undefined) animate = true;
  if (quizData === undefined) quizData = null;

  var msgDiv = document.createElement("div");
  msgDiv.className = "msg bot";
  document.getElementById("chatMessages").appendChild(msgDiv);

  if (animate) {
    typewriterEffect(msgDiv, text, 15, function () {
      msgDiv.innerHTML = formatText(text);
      if (hasQuiz && quizData) {
        renderQuizButtons(msgDiv, quizData);
      }
      scrollChatToBottom();
    });
  } else {
    msgDiv.innerHTML = formatText(text);
    if (hasQuiz && quizData) {
      renderQuizButtons(msgDiv, quizData);
    }
    scrollChatToBottom();
  }
}

// ── 8. RENDER QUIZ BUTTONS ───────────────────────────────
function renderQuizButtons(container, quizData) {
  var btnContainer = document.createElement("div");
  btnContainer.className = "quiz-buttons";

  quizData.options.forEach(function (opt, index) {
    var btn = document.createElement("button");
    btn.className = "quiz-btn mono";
    btn.textContent = String.fromCharCode(65 + index) + ". " + opt;

    btn.addEventListener("click", function () {
      if (btn.disabled) return;

      var siblingBtns = btnContainer.querySelectorAll(".quiz-btn");
      siblingBtns.forEach(function (b) { b.disabled = true; });

      handleQuizAnswer(index, quizData.correct, siblingBtns, quizData.topic);
    });

    btnContainer.appendChild(btn);
  });

  container.appendChild(btnContainer);
}

// ── 9. HANDLE QUIZ ANSWER ────────────────────────────────
function handleQuizAnswer(selectedIndex, correctIndex, buttonsNodes, topic) {
  state.totalQuizzes++;

  if (selectedIndex === correctIndex) {
    buttonsNodes[selectedIndex].classList.add("correct");
    showToast("✅ Correct! +10 points", "success");

    animateNumber(document.getElementById("scoreDisplay"), state.score, state.score + 10, 1000);
    state.score += 10;
    state.streak++;
    state.correctAnswers++;

    addToHistory(topic, 10, true);

    setTimeout(function () {
      renderBotMessage("✅ *Correct!* +10 points\n\nYour score: " + state.score + " points 🎉\nKeep going! /study " + topic, false, false);
    }, 800);

  } else {
    buttonsNodes[selectedIndex].classList.add("wrong");
    buttonsNodes[correctIndex].classList.add("correct");
    showToast("❌ Incorrect.", "error");

    state.streak = 0;
    state.wrongAnswers++;
    addToHistory(topic, 0, false);

    setTimeout(function () {
      renderBotMessage("❌ *Wrong!*\n\nThe correct answer was: " + String.fromCharCode(65 + correctIndex) + "\nDon't give up! Try: /quiz " + topic, false, false);
    }, 800);
  }

  updateStatsPanel();
  saveState();
}

// ── 10. ANIMATE NUMBER ───────────────────────────────────
function animateNumber(element, from, to, duration) {
  if (!element) return;
  var start = performance.now();

  function update(currentTime) {
    var elapsed = currentTime - start;
    var progress = Math.min(elapsed / duration, 1);
    var easeProgress = progress * (2 - progress);
    var current = Math.floor(from + (to - from) * easeProgress);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = to;
    }
  }
  requestAnimationFrame(update);
}

// ── 11. UPDATE STATS PANEL ───────────────────────────────
function updateStatsPanel() {
  document.getElementById("scoreDisplay").textContent = state.score;

  var milestones = [50, 100, 250, 500, 1000];
  var nextMilestone = 1000;
  for (var i = 0; i < milestones.length; i++) {
    if (milestones[i] > state.score) { nextMilestone = milestones[i]; break; }
  }
  var prevMilestone = 0;
  for (var j = milestones.length - 1; j >= 0; j--) {
    if (milestones[j] <= state.score) { prevMilestone = milestones[j]; break; }
  }

  var progressPercent = Math.min(100, ((state.score - prevMilestone) / (nextMilestone - prevMilestone)) * 100);
  var progressFill = document.querySelector(".progress-fill");
  if (progressFill) progressFill.style.width = progressPercent + "%";

  var nextLvlDisplay = document.getElementById("nextLevelTarget");
  if (nextLvlDisplay) nextLvlDisplay.textContent = nextMilestone + " pts";

  var streakCount = document.getElementById("streakCount");
  if (streakCount) streakCount.textContent = state.streak + " day streak";

  var streakWrapper = document.querySelector(".streak-wrapper");
  if (streakWrapper) {
    if (state.streak > 0) streakWrapper.classList.add("active");
    else streakWrapper.classList.remove("active");
  }

  var totalDisplay = document.getElementById("totalQuizzesDisplay");
  if (totalDisplay) totalDisplay.textContent = state.totalQuizzes;

  var correctDisplay = document.getElementById("correctDisplay");
  if (correctDisplay) correctDisplay.textContent = state.correctAnswers;

  var wrongDisplay = document.getElementById("wrongDisplay");
  if (wrongDisplay) wrongDisplay.textContent = state.wrongAnswers;

  var accuracy = state.totalQuizzes > 0 ? Math.round((state.correctAnswers / state.totalQuizzes) * 100) : 0;
  var accuracyDisplay = document.getElementById("accuracyDisplay");
  if (accuracyDisplay) {
    accuracyDisplay.textContent = accuracy + "%";
    if (accuracy >= 70) accuracyDisplay.style.color = "var(--success)";
    else if (accuracy >= 40) accuracyDisplay.style.color = "var(--warning)";
    else accuracyDisplay.style.color = "var(--error)";
  }

  renderHistory();
}

// ── 12. RENDER HISTORY ───────────────────────────────────
function renderHistory() {
  var container = document.getElementById("historyList");
  if (!container) return;

  container.innerHTML = "";

  if (state.history.length === 0) {
    container.innerHTML = '<div style="font-size:0.9rem;color:var(--text-muted)">No topics studied yet.</div>';
    return;
  }

  var recent = state.history.slice().reverse().slice(0, 8);

  recent.forEach(function (item) {
    var div = document.createElement("div");
    div.className = "history-item";

    var diffMs = Date.now() - item.time;
    var diffMins = Math.floor(diffMs / 60000);
    var timeStr = "Just now";
    if (diffMins > 0) {
      if (diffMins < 60) timeStr = diffMins + "m ago";
      else if (diffMins < 1440) timeStr = Math.floor(diffMins / 60) + "h ago";
      else timeStr = Math.floor(diffMins / 1440) + "d ago";
    }

    var scoreStr = "";
    if (item.score > 0) {
      scoreStr = '<span class="hist-score" style="color:var(--success)">✅ +' + item.score + '</span>';
    } else if (item.correct === false) {
      scoreStr = '<span class="hist-score" style="color:var(--error)">❌ 0</span>';
    }

    div.innerHTML =
      '<div>' +
        '<div class="hist-topic">' + item.topic + '</div>' +
        '<div class="hist-time">' + timeStr + '</div>' +
      '</div>' +
      scoreStr;

    div.addEventListener("click", function () {
      document.getElementById("chatInput").value = "/study " + item.topic;
      handleInputSubmit();
    });

    container.appendChild(div);
  });
}

// ── 13. ADD TO HISTORY ───────────────────────────────────
function addToHistory(topic, score, correct, searchOnly) {
  if (searchOnly === undefined) searchOnly = false;

  if (searchOnly) {
    var last = state.history[state.history.length - 1];
    if (last && last.topic.toLowerCase() === topic.toLowerCase()) return;
    state.history.push({ topic: topic, time: Date.now(), score: 0, correct: null });
  } else {
    var existing = null;
    for (var i = 0; i < state.history.length; i++) {
      if (state.history[i].topic === topic && state.history[i].time > Date.now() - 300000) {
        existing = state.history[i];
        break;
      }
    }
    if (existing) {
      existing.score += score;
      existing.correct = correct;
      existing.time = Date.now();
    } else {
      state.history.push({ topic: topic, time: Date.now(), score: score, correct: correct });
    }
  }

  saveState();
  renderHistory();
}

// ── 14. MATRIX RAIN ──────────────────────────────────────
function startMatrixRain() {
  var canvas = document.getElementById("matrixCanvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var chars = "01ABCDEF";
  var fontSize = 14;
  var columns = Math.floor(canvas.width / fontSize);
  var drops = [];

  for (var x = 0; x < columns; x++) {
    drops[x] = Math.floor(Math.random() * -100);
  }

  function draw() {
    ctx.fillStyle = "rgba(10, 10, 12, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff88";
    ctx.font = fontSize + "px monospace";

    for (var i = 0; i < drops.length; i++) {
      var text = chars.charAt(Math.floor(Math.random() * chars.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 80);

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ── 15. TYPEWRITER EFFECT ────────────────────────────────
function typewriterEffect(element, text, speed, callback) {
  var cursorSpan = document.createElement("span");
  cursorSpan.className = "type-cursor";
  cursorSpan.textContent = "|";
  cursorSpan.style.animation = "pulse 1s step-end infinite";
  cursorSpan.style.color = "var(--primary)";
  element.innerHTML = "";
  element.appendChild(cursorSpan);

  var i = 0;

  function type() {
    if (i < text.length) {
      var char = document.createTextNode(text.charAt(i));
      element.insertBefore(char, cursorSpan);
      i++;
      scrollChatToBottom();
      setTimeout(type, speed);
    } else {
      if (cursorSpan.parentNode) cursorSpan.remove();
      if (callback) callback();
    }
  }
  type();
}

// ── 16. TYPING INDICATOR ─────────────────────────────────
function showTypingIndicator() {
  var msgDiv = document.createElement("div");
  msgDiv.className = "msg bot";
  msgDiv.id = "typingIndicator";
  msgDiv.innerHTML =
    '<div class="typing-indicator">' +
      '<div class="typing-dot"></div>' +
      '<div class="typing-dot"></div>' +
      '<div class="typing-dot"></div>' +
    '</div>';
  document.getElementById("chatMessages").appendChild(msgDiv);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  var el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ── 17. SCROLL CHAT ──────────────────────────────────────
function scrollChatToBottom() {
  var chatMsgs = document.getElementById("chatMessages");
  if (chatMsgs) {
    chatMsgs.scrollTo({ top: chatMsgs.scrollHeight, behavior: "smooth" });
  }
}

// ── 18. TOAST ────────────────────────────────────────────
function showToast(message, type) {
  if (!type) type = "info";

  var container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  var toast = document.createElement("div");
  toast.className = "toast " + type;

  var icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  toast.innerHTML = "<div>" + icon + "</div><div>" + message + "</div>";
  container.appendChild(toast);

  setTimeout(function () {
    toast.style.animation = "slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards";
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// ── 19. SAVE STATE ───────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem("sbot_state", JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

// ── 20. LOAD STATE ───────────────────────────────────────
function loadState() {
  try {
    var saved = localStorage.getItem("sbot_state");
    if (saved) {
      var parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

// ── INITIALIZE ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
