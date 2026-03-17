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
  
  // CORE FUNCTIONS
  
  // 1. init()
  function init() {
    loadState();
    startMatrixRain();
    
    // Type out hero text
    const eyebrow = document.getElementById('heroEyebrow');
    if(eyebrow) {
        eyebrow.innerHTML = '';
        setTimeout(() => typewriterEffect(eyebrow, "> INITIALIZING STUDY_BOT.py...", 40), 500);
    }
  
    // Pre-seed chat if empty
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && chatMessages.children.length === 0) {
      renderSeededConversation();
    }
  
    // Bind events
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleInputSubmit();
    });
    document.getElementById('sendBtn').addEventListener('click', handleInputSubmit);
    
    // Quick topics
    document.querySelectorAll('.topic-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const topic = chip.textContent;
        document.getElementById('chatInput').value = `/study ${topic}`;
        handleInputSubmit();
      });
    });
  
    updateStatsPanel();
    setTimeout(() => showToast("📚 Welcome! Try studying any topic", "info"), 1000);
  }
  
  function renderSeededConversation() {
      renderUserMessage("/study Machine Learning");
      
      const mlSummary = `📚 Machine Learning\n\nHere's your 3-point summary:\n\n• Machine learning is a field of study in artificial intelligence concerned with the development and study of statistical algorithms that can learn from data and generalize to unseen data, and thus perform tasks without explicit instructions.\n• Recently, generative artificial neural networks have surpassed many previous approaches in performance.\n• Machine learning approaches have been applied to large language models, computer vision, speech recognition, email filtering, agriculture, and medicine.\n\nReady for a quiz? Type /quiz Machine Learning 🎯`;
      renderBotMessage(mlSummary, false, false);
      
      renderUserMessage("/quiz Machine Learning");
      
      const quizQuestion = `🎯 Quiz Time!\n\nQ: Fill in the blank: 'Machine learning approaches have been applied to large language models, computer vision, speech recognition, email filtering, agriculture, and ___________.'\n\nChoose your answer:`;
      const quizData = {
          topic: "Machine Learning",
          question: quizQuestion,
          options: ["medicine", "Framework", "System", "Theory"],
          correct: 0
      };
      
      renderBotMessage(quizQuestion, true, false, quizData);
  }
  
  // 2. handleUserMessage(input)
  async function handleUserMessage(input) {
    if (!input.trim() || state.isTyping) return;
    state.isTyping = true;
    
    // Normalize input
    let cmd = "";
    let arg = "";
    
    if (input.startsWith("/")) {
        const parts = input.split(" ");
        cmd = parts[0].toLowerCase();
        arg = parts.slice(1).join(" ");
    } else {
        cmd = "/study";
        arg = input;
    }
    
    renderUserMessage(input);
    document.getElementById('chatInput').value = '';
    
    showTypingIndicator();
    
    // Simulate network delay
    setTimeout(async () => {
        removeTypingIndicator();
        
        switch(cmd) {
            case "/study":
                if(!arg) {
                    renderBotMessage("Please provide a topic!\nExample: /study Quantum Computing");
                } else {
                    const summary = await fetchWikipediaSummary(arg);
                    if(!summary) {
                        renderBotMessage(`❌ Could not find info on '${arg}'.\nTry a different search term.`);
                    } else {
                        const bullets = generateBulletPoints(summary, arg);
                        let response = `📚 *${arg}*\n\nHere's your 3-point summary:\n\n`;
                        bullets.forEach(b => response += `• ${b}\n\n`);
                        response += `Ready for a quiz? Type /quiz ${arg} 🎯`;
                        
                        // Add to history just for searching
                        addToHistory(arg, 0, null, true);
                        renderBotMessage(response);
                    }
                }
                break;
            case "/quiz":
                if(!arg) {
                    renderBotMessage("Please provide a topic!\nExample: /quiz Machine Learning");
                } else {
                    const summary = await fetchWikipediaSummary(arg);
                    if(!summary) {
                        renderBotMessage(`❌ Could not find info on '${arg}'.`);
                    } else {
                        const quizData = generateQuiz(summary, arg);
                        if(!quizData) {
                            renderBotMessage("❌ Could not generate quiz for this topic. Try another.");
                        } else {
                            renderBotMessage(`🎯 *Quiz: ${arg}*\n\nQ: ${quizData.question}\n\nChoose your answer:`, true, true, quizData);
                        }
                    }
                }
                break;
            case "/score":
                renderBotMessage(`📊 *Your Stats*\n\n🏆 Score: ${state.score} points\n📚 Topics studied: ${state.history.length}\n🔥 Streak: ${state.streak}\n\nKeep studying to increase your score!`);
                break;
            case "/history":
                if(state.history.length === 0) {
                     renderBotMessage("No topics studied yet!\nStart with: /study Machine Learning");
                } else {
                     let histText = "📖 *Your Study History*\n\n";
                     const recent = [...state.history].reverse().slice(0, 5);
                     recent.forEach((item, i) => {
                         histText += `${i+1}. ${item.topic}\n`;
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
      const input = document.getElementById('chatInput').value;
      handleUserMessage(input);
  }
  
  // 3. fetchWikipediaSummary(topic)
  async function fetchWikipediaSummary(topic) {
      try {
          const url = \`https://en.wikipedia.org/api/rest_v1/page/summary/\${encodeURIComponent(topic)}\`;
          const response = await fetch(url);
          if (response.ok) {
              const data = await response.json();
              return data.extract || null;
          }
          return null;
      } catch (e) {
          console.error(e);
          return null;
      }
  }
  
  // 4. generateBulletPoints(text, topic)
  function generateBulletPoints(text, topic) {
      const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 40);
      
      if (sentences.length >= 3) {
          return sentences.slice(0, 3);
      } else if (sentences.length === 2) {
          return [sentences[0], sentences[1], \`\${topic} has significant applications in modern technology and research.\`];
      } else {
          const shortText = text.length > 200 ? text.substring(0, 197) + "..." : text;
          return [shortText, \`\${topic} is an important concept in its field.\`, \`Learn more about \${topic} on Wikipedia.\`];
      }
  }
  
  // 5. generateQuiz(text, topic)
  function generateQuiz(text, topic) {
      const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 50);
      if(sentences.length === 0) return null;
      
      const baseSentence = sentences[Math.floor(Math.random() * Math.min(3, sentences.length))];
      const words = baseSentence.split(' ');
      
      const significant = words.filter(w => 
          w.length > 5 && 
          /^[A-Z]/.test(w) && 
          !['Which', 'These', 'Those', 'Their', 'There', 'Where', 'While', 'About', 'Through'].includes(w)
      );
      
      let answerWord = "";
      if (significant.length > 0) {
          answerWord = significant[Math.floor(Math.random() * significant.length)];
      } else {
          const longWords = words.filter(w => w.length > 6);
          if (longWords.length === 0) return null;
          answerWord = longWords[Math.floor(Math.random() * longWords.length)];
      }
      
      // Clean punctuation from answer
      answerWord = answerWord.replace(/[.,;!?"']/g, '');
      
      const questionText = baseSentence.replace(new RegExp(\`\\\\b\${answerWord}\\\\b\`), "_______");
      const question = \`Fill in the blank: '\${questionText}'\`;
      
      // Generate distractors
      const allWords = text.match(/\\b[A-Za-z]{5,}\\b/g) || [];
      let distractors = [...new Set(allWords)].filter(w => w !== answerWord);
      
      // Shuffle
      distractors.sort(() => 0.5 - Math.random());
      
      const fillers = ["Algorithm", "System", "Network", "Process", "Method", "Framework", "Structure", "Theory", "Model", "Protocol"];
      while(distractors.length < 3) {
          const f = fillers.pop();
          if(f && f !== answerWord) distractors.push(f);
      }
      
      distractors = distractors.slice(0, 3);
      const options = [...distractors, answerWord];
      options.sort(() => 0.5 - Math.random());
      
      const correctIndex = options.indexOf(answerWord);
      
      return { question, options, correct: correctIndex, topic };
  }
  
  // Formatter for markdown-like text
  function formatText(text) {
      return text.replace(/\\*(.*?)\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>');
  }
  
  // 6. renderUserMessage(text)
  function renderUserMessage(text) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg user';
      msgDiv.textContent = text;
      document.getElementById('chatMessages').appendChild(msgDiv);
      scrollChatToBottom();
  }
  
  // 7. renderBotMessage(text, hasQuiz)
  function renderBotMessage(text, hasQuiz = false, animate = true, quizData = null) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg bot mono';
      document.getElementById('chatMessages').appendChild(msgDiv);
      
      if (animate) {
          typewriterEffect(msgDiv, text, 15, () => {
              msgDiv.innerHTML = formatText(text);
              if(hasQuiz && quizData) {
                  renderQuizButtons(msgDiv, quizData);
              }
              scrollChatToBottom();
          });
      } else {
          msgDiv.innerHTML = formatText(text);
          if(hasQuiz && quizData) {
              renderQuizButtons(msgDiv, quizData);
          }
          scrollChatToBottom();
      }
  }
  
  // 8. renderQuizButtons(quizData)
  function renderQuizButtons(container, quizData) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'quiz-buttons';
      
      quizData.options.forEach((opt, index) => {
          const btn = document.createElement('button');
          btn.className = 'quiz-btn mono';
          btn.innerHTML = \`\${String.fromCharCode(65+index)}. \${opt}\`;
          
          btn.addEventListener('click', () => {
              if (btn.disabled) return;
              
              // Disable all buttons in this block
              const siblingBtns = btnContainer.querySelectorAll('.quiz-btn');
              siblingBtns.forEach(b => b.disabled = true);
              
              handleQuizAnswer(index, quizData.correct, siblingBtns, quizData.topic);
          });
          
          btnContainer.appendChild(btn);
      });
      
      container.appendChild(btnContainer);
  }
  
  // 9. handleQuizAnswer(selectedIndex, correctIndex)
  function handleQuizAnswer(selectedIndex, correctIndex, buttonsNodes, topic) {
      state.totalQuizzes++;
      
      if (selectedIndex === correctIndex) {
          buttonsNodes[selectedIndex].classList.add('correct');
          showToast("✅ Correct! +10 points", "success");
          
          // Animate score
          animateNumber(document.getElementById('scoreDisplay'), state.score, state.score + 10, 1000);
          state.score += 10;
          state.streak++;
          state.correctAnswers++;
          
          document.getElementById('scoreDisplay').classList.add('update-glow');
          setTimeout(() => document.getElementById('scoreDisplay').classList.remove('update-glow'), 1000);
          
          addToHistory(topic, 10, true);
          
          setTimeout(() => {
              renderBotMessage(\`✅ *Correct!* +10 points\\n\\nYour score: \${state.score} points 🎉\\nKeep going! /study \${topic}\`, false, false);
          }, 800);
          
      } else {
          buttonsNodes[selectedIndex].classList.add('wrong');
          buttonsNodes[correctIndex].classList.add('correct');
          showToast("❌ Incorrect.", "error");
          
          state.streak = 0;
          state.wrongAnswers++;
          addToHistory(topic, 0, false);
          
          setTimeout(() => {
              renderBotMessage(\`❌ *Wrong!*\\n\\nThe correct answer was: \${String.fromCharCode(65+correctIndex)}\\nDon't give up! Try: /quiz \${topic}\`, false, false);
          }, 800);
      }
      
      updateStatsPanel();
      saveState();
  }
  
  // 10. animateNumber(element, from, to, duration)
  function animateNumber(element, from, to, duration) {
      if(!element) return;
      const start = performance.now();
      
      function update(currentTime) {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          
          // easeOutQuad
          const easeProgress = progress * (2 - progress);
          const current = Math.floor(from + (to - from) * easeProgress);
          
          element.textContent = current;
          
          if (progress < 1) {
              requestAnimationFrame(update);
          } else {
              element.textContent = to;
          }
      }
      requestAnimationFrame(update);
  }
  
  // 11. updateStatsPanel()
  function updateStatsPanel() {
      // Score
      document.getElementById('scoreDisplay').textContent = state.score;
      
      // Progress Bar calculation (milestones: 50, 100, 250, 500)
      const milestones = [50, 100, 250, 500, 1000];
      let nextMilestone = milestones.find(m => m > state.score) || 1000;
      let prevMilestone = milestones.slice().reverse().find(m => m <= state.score) || 0;
      if (state.score === 0) prevMilestone = 0;
      
      const progressPercent = Math.min(100, ((state.score - prevMilestone) / (nextMilestone - prevMilestone)) * 100);
      const progressFill = document.querySelector('.progress-fill');
      if (progressFill) progressFill.style.width = \`\${progressPercent}%\`;
      
      const nextLvlDisplay = document.getElementById('nextLevelTarget');
      if (nextLvlDisplay) nextLvlDisplay.textContent = \`\${nextMilestone} pts\`;
      
      // Streak
      const streakCount = document.getElementById('streakCount');
      if (streakCount) streakCount.textContent = \`\${state.streak} day streak\`;
      
      const streakWrapper = document.querySelector('.streak-wrapper');
      if(streakWrapper) {
          if (state.streak > 0) streakWrapper.classList.add('active');
          else streakWrapper.classList.remove('active');
      }
      
      // Quiz stats
      const totalDisplay = document.getElementById('totalQuizzesDisplay');
      if(totalDisplay) totalDisplay.textContent = state.totalQuizzes;
      
      const correctDisplay = document.getElementById('correctDisplay');
      if(correctDisplay) correctDisplay.textContent = state.correctAnswers;
      
      const wrongDisplay = document.getElementById('wrongDisplay');
      if(wrongDisplay) wrongDisplay.textContent = state.wrongAnswers;
      
      const accuracy = state.totalQuizzes > 0 ? Math.round((state.correctAnswers / state.totalQuizzes) * 100) : 0;
      const accuracyDisplay = document.getElementById('accuracyDisplay');
      if(accuracyDisplay) {
          animateNumber(accuracyDisplay, parseInt(accuracyDisplay.textContent)||0, accuracy, 500);
          accuracyDisplay.textContent = accuracy + "%";
          
          if(accuracy >= 70) accuracyDisplay.style.color = 'var(--success)';
          else if(accuracy >= 40) accuracyDisplay.style.color = 'var(--warning)';
          else accuracyDisplay.style.color = 'var(--error)';
      }
      
      renderHistory();
  }
  
  // 12. renderHistory()
  function renderHistory() {
      const container = document.getElementById('historyList');
      if (!container) return;
      
      container.innerHTML = '';
      
      if (state.history.length === 0) {
          container.innerHTML = '<div class="text-muted" style="font-size:0.9rem">No topics studied yet.</div>';
          return;
      }
      
      const recent = [...state.history].reverse().slice(0, 8);
      
      recent.forEach(item => {
          const div = document.createElement('div');
          div.className = 'history-item';
          
          // Time ago
          const diffMs = Date.now() - item.time;
          const diffMins = Math.floor(diffMs / 60000);
          let timeStr = "Just now";
          if (diffMins > 0) {
              if (diffMins < 60) timeStr = \`\${diffMins}m ago\`;
              else if (diffMins < 1440) timeStr = \`\${Math.floor(diffMins/60)}h ago\`;
              else timeStr = \`\${Math.floor(diffMins/1440)}d ago\`;
          }
          
          // Result string
          let scoreStr = "";
          if (item.score > 0) {
              scoreStr = \`<span class="hist-score correct">✅ +\${item.score}</span>\`;
          } else if (item.correct === false) {
              scoreStr = \`<span class="hist-score wrong">❌ 0</span>\`;
          }
          
          div.innerHTML = \`
              <div>
                  <div class="hist-topic">\${item.topic}</div>
                  <div class="hist-time">\${timeStr}</div>
              </div>
              \${scoreStr}
          \`;
          
          div.addEventListener('click', () => {
              document.getElementById('chatInput').value = \`/study \${item.topic}\`;
              handleInputSubmit();
          });
          
          container.appendChild(div);
      });
  }
  
  // 13. addToHistory(topic, score, correct)
  function addToHistory(topic, score, correct, searchOnly = false) {
      // If just searching, don't duplicate if recently searched
      if (searchOnly) {
          const last = state.history[state.history.length - 1];
          if (last && last.topic.toLowerCase() === topic.toLowerCase()) return;
      }
      
      // Update existing or push new
      if (!searchOnly) {
           const existing = state.history.find(h => h.topic === topic && h.time > Date.now() - 300000); // 5 mins
           if (existing) {
               existing.score += score;
               existing.correct = correct;
               existing.time = Date.now();
           } else {
               state.history.push({ topic, time: Date.now(), score, correct });
           }
      } else {
          state.history.push({ topic, time: Date.now(), score: 0, correct: null });
      }
      
      saveState();
      renderHistory();
  }
  
  // 14. startMatrixRain()
  function startMatrixRain() {
      const canvas = document.getElementById('matrixCanvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const chars = "01アイウエオ📚🧠⚡";
      const fontSize = 14;
      const columns = canvas.width / fontSize;
      const drops = [];
      
      for (let x = 0; x < columns; x++) {
          drops[x] = Math.random() * -100;
      }
      
      function draw() {
          ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.fillStyle = '#00ff88';
          ctx.font = fontSize + 'px monospace';
          
          for (let i = 0; i < drops.length; i++) {
              const text = chars.charAt(Math.floor(Math.random() * chars.length));
              ctx.fillText(text, i * fontSize, drops[i] * fontSize);
              
              if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                  drops[i] = 0;
              }
              drops[i]++;
          }
      }
      
      // Extremely slow speed (80ms)
      setInterval(draw, 80);
      
      window.addEventListener('resize', () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      });
  }
  
  // 15. typewriterEffect(element, text, speed, callback)
  function typewriterEffect(element, text, speed, callback) {
      element.innerHTML = '<span class="type-cursor">|</span>';
      let i = 0;
      
      // Simple text splitting to not break HTML entities if any, though here it's mostly plain text
      const cursor = element.querySelector('.type-cursor');
      
      function type() {
          if (i < text.length) {
              const char = document.createTextNode(text.charAt(i));
              element.insertBefore(char, cursor);
              i++;
              scrollChatToBottom();
              setTimeout(type, speed);
          } else {
              if (cursor) cursor.remove();
              if (callback) callback();
          }
      }
      type();
  }
  
  // 16. showTypingIndicator()
  function showTypingIndicator() {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg bot typing-id';
      msgDiv.id = 'typingIndicator';
      msgDiv.innerHTML = \`<div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
      </div>\`;
      document.getElementById('chatMessages').appendChild(msgDiv);
      scrollChatToBottom();
  }
  
  function removeTypingIndicator() {
      const el = document.getElementById('typingIndicator');
      if (el) el.remove();
  }
  
  // 17. scrollChatToBottom()
  function scrollChatToBottom() {
      const chatMsgs = document.getElementById('chatMessages');
      if (chatMsgs) {
          chatMsgs.scrollTo({
              top: chatMsgs.scrollHeight,
              behavior: 'smooth'
          });
      }
  }
  
  // 18. showToast(message, type)
  function showToast(message, type = 'info') {
      let container = document.querySelector('.toast-container');
      if (!container) {
          container = document.createElement('div');
          container.className = 'toast-container';
          document.body.appendChild(container);
      }
      
      const toast = document.createElement('div');
      toast.className = \`toast \${type}\`;
      
      let icon = "ℹ️";
      if(type === 'success') icon = "✅";
      if(type === 'error') icon = "❌";
      if(type === 'warning') icon = "⚠️";
      
      toast.innerHTML = \`<div>\${icon}</div><div>\${message}</div>\`;
      
      container.appendChild(toast);
      
      setTimeout(() => {
          toast.style.animation = 'slideOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
          setTimeout(() => toast.remove(), 300);
      }, 3000);
  }
  
  // 19. saveState()
  function saveState() {
      localStorage.setItem('sbot_state', JSON.stringify(state));
  }
  
  // 20. loadState()
  function loadState() {
      const saved = localStorage.getItem('sbot_state');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              Object.assign(state, parsed);
          } catch(e) {
              console.error("Failed to load state", e);
          }
      }
  }
  
  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);
  
