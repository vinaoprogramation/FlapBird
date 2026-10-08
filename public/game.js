// ==========================================
// 1. SINTETIZADOR DE ÁUDIO (Web Audio API)
// ==========================================
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playJump() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playScore() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
}

const sfx = new SoundFX();

// ==========================================
// 2. GERENCIADOR DO GUARDA-ROUPA (Skins)
// ==========================================
const DEFAULT_SKIN = {
    id: 'default_skin',
    name: 'Flappy Clássico',
    dataUrl: null
};

class WardrobeManager {
    constructor() {
        this.skins = [];
        this.activeSkinId = 'default_skin';
        this.activeImage = null;
        this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('flappy_wardrobe_skins');
        const storedActive = localStorage.getItem('flappy_active_skin_id');

        if (stored) {
            try { this.skins = JSON.parse(stored); } catch (e) { this.skins = []; }
        }

        // Sempre garante que a skin padrão exista
        if (!this.skins.some(s => s.id === 'default_skin')) {
            this.skins.unshift(DEFAULT_SKIN);
        }

        if (storedActive) {
            this.selectSkin(storedActive);
        } else {
            this.selectSkin('default_skin');
        }
    }

    saveToStorage() {
        localStorage.setItem('flappy_wardrobe_skins', JSON.stringify(this.skins));
        localStorage.setItem('flappy_active_skin_id', this.activeSkinId);
    }

    addSkin(name, dataUrl) {
        const newSkin = {
            id: 'skin_' + Date.now(),
            name: name,
            dataUrl: dataUrl
        };
        this.skins.push(newSkin);
        this.saveToStorage();
        this.selectSkin(newSkin.id);
        this.renderGrid();
    }

    deleteSkin(id) {
        if (id === 'default_skin') return;
        this.skins = this.skins.filter(s => s.id !== id);
        if (this.activeSkinId === id) {
            this.selectSkin('default_skin');
        }
        this.saveToStorage();
        this.renderGrid();
    }

    selectSkin(id) {
        const skin = this.skins.find(s => s.id === id) || DEFAULT_SKIN;
        this.activeSkinId = skin.id;

        if (skin.dataUrl) {
            const img = new Image();
            img.onload = () => { this.activeImage = img; };
            img.src = skin.dataUrl;
        } else {
            this.activeImage = null;
        }
        this.saveToStorage();
        this.renderGrid();
    }

    getActiveSkin() {
        return this.skins.find(s => s.id === this.activeSkinId) || DEFAULT_SKIN;
    }

    renderGrid() {
        const container = document.getElementById('skinsGrid');
        if (!container) return;
        container.innerHTML = '';

        this.skins.forEach(skin => {
            const card = document.createElement('div');
            card.className = `skin-card ${skin.id === this.activeSkinId ? 'active' : ''}`;

            const avatar = document.createElement('img');
            avatar.className = 'skin-avatar';
            avatar.src = skin.dataUrl || createDefaultBirdCanvasDataUrl();

            const nameEl = document.createElement('div');
            nameEl.className = 'skin-name';
            nameEl.textContent = skin.name;

            const btns = document.createElement('div');
            btns.className = 'skin-card-btns';

            const btnSelect = document.createElement('button');
            btnSelect.className = 'btn-select';
            btnSelect.textContent = skin.id === this.activeSkinId ? 'Em Uso' : 'Usar';
            btnSelect.onclick = () => this.selectSkin(skin.id);

            btns.appendChild(btnSelect);

            if (skin.id !== 'default_skin') {
                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn-delete';
                btnDelete.textContent = 'X';
                btnDelete.onclick = () => this.deleteSkin(skin.id);
                btns.appendChild(btnDelete);
            }

            card.appendChild(avatar);
            card.appendChild(nameEl);
            card.appendChild(btns);
            container.appendChild(card);
        });
    }
}

// Gera um DataURL da skin clássica para a lista
function createDefaultBirdCanvasDataUrl() {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 40;
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(20, 20, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#f7c736';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    return c.toDataURL();
}

const wardrobe = new WardrobeManager();

// ==========================================
// 3. MOTOR DO JOGO (FLAPPY BIRD)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const STATE = { START: 0, PLAYING: 1, GAMEOVER: 2 };
let currentState = STATE.START;
let score = 0;
let highScore = localStorage.getItem('flappy_highscore') || 0;

// Sistema de Partículas
let particles = [];
function addParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 3 + 2,
            alpha: 1,
            color: '#ffffff'
        });
    }
}

// Chão & Cenário
const ground = {
    height: 90,
    x: 0,
    speed: 2,
    update() {
        if (currentState === STATE.PLAYING) {
            this.x = (this.x - this.speed) % 20;
        }
    },
    draw() {
        const y = canvas.height - this.height;

        // Grama Superior
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(0, y, canvas.width, 14);
        ctx.fillStyle = '#53a028';
        ctx.fillRect(0, y + 14, canvas.width, 4);

        // Terra
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, y + 18, canvas.width, this.height - 18);

        // Detalhes diagonais do chão
        ctx.strokeStyle = '#c5be75';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = this.x - 20; i < canvas.width + 20; i += 20) {
            ctx.moveTo(i, y + 18);
            ctx.lineTo(i - 10, y + this.height);
        }
        ctx.stroke();

        // Borda superior
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
};

// Pássaro
const bird = {
    x: 70,
    y: 240,
    radius: 18,
    gravity: 0.38,
    jumpStrength: -6.2,
    velocity: 0,
    rotation: 0,
    wingFrame: 0,

    reset() {
        this.y = 240;
        this.velocity = 0;
        this.rotation = 0;
    },

    jump() {
        this.velocity = this.jumpStrength;
        this.rotation = -0.4;
        sfx.playJump();
        addParticles(this.x, this.y + this.radius);
    },

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Rotação fluida estilo original
        if (this.velocity < 0) {
            this.rotation = -0.35;
        } else {
            this.rotation += 0.04;
            if (this.rotation > Math.PI / 2) this.rotation = Math.PI / 2;
        }

        // Colisão Chão
        const groundY = canvas.height - ground.height;
        if (this.y + this.radius >= groundY) {
            this.y = groundY - this.radius;
            triggerGameOver();
        }

        // Teto
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }

        this.wingFrame += 0.15;
    },

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (wardrobe.activeImage) {
            // Skin Customizada com Recorte Circular
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(
                wardrobe.activeImage,
                -this.radius,
                -this.radius,
                this.radius * 2,
                this.radius * 2
            );

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

        } else {
            // Skin Flappy Bird Original
            // Corpo
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f7c736';
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Olho
            ctx.beginPath();
            ctx.arc(8, -6, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(10, -6, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            // Bico
            ctx.beginPath();
            ctx.fillStyle = '#e06010';
            ctx.roundRect(4, 2, 16, 10, 4);
            ctx.fill();
            ctx.stroke();

            // Asa
            const wingOffset = Math.sin(this.wingFrame) * 4;
            ctx.beginPath();
            ctx.ellipse(-6, wingOffset, 8, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
};

// Canos (Pipes)
const pipes = {
    items: [],
    width: 58,
    gap: 125,
    speed: 2,
    spawnTimer: 0,

    reset() {
        this.items = [];
        this.spawnTimer = 0;
    },

    update() {
        this.spawnTimer++;
        if (this.spawnTimer % 105 === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - ground.height - this.gap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

            this.items.push({ x: canvas.width, topHeight, passed: false });
        }

        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= this.speed;

            // Incremento de Pontuação
            if (!p.passed && p.x + this.width < bird.x) {
                p.passed = true;
                score++;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('flappy_highscore', highScore);
                }
                sfx.playScore();
            }

            // Colisão Hitbox Precisa
            const inX = bird.x + bird.radius - 3 > p.x && bird.x - bird.radius + 3 < p.x + this.width;
            const inTopY = bird.y - bird.radius + 3 < p.topHeight;
            const inBottomY = bird.y + bird.radius - 3 > p.topHeight + this.gap;

            if (inX && (inTopY || inBottomY)) {
                sfx.playHit();
                triggerGameOver();
            }
        }

        if (this.items.length > 0 && this.items[0].x < -this.width) {
            this.items.shift();
        }
    },

    draw() {
        for (let p of this.items) {
            // Cano Superior
            this.drawSinglePipe(p.x, 0, this.width, p.topHeight, true);
            // Cano Inferior
            const bottomY = p.topHeight + this.gap;
            const bottomH = canvas.height - ground.height - bottomY;
            this.drawSinglePipe(p.x, bottomY, this.width, bottomH, false);
        }
    },

    drawSinglePipe(x, y, w, h, isTop) {
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(x, y, w, h);

        // Gradiente / Brilho do Cano
        ctx.fillStyle = '#9ce659';
        ctx.fillRect(x + 4, y, 6, h);
        ctx.fillStyle = '#529b1c';
        ctx.fillRect(x + w - 10, y, 6, h);

        // Borda Escura
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Borda/Capitular do Cano
        const capHeight = 22;
        const capY = isTop ? y + h - capHeight : y;
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(x - 3, capY, w + 6, capHeight);
        ctx.fillStyle = '#9ce659';
        ctx.fillRect(x, capY, 6, capHeight);
        ctx.strokeRect(x - 3, capY, w + 6, capHeight);
    }
};

function triggerGameOver() {
    currentState = STATE.GAMEOVER;
    document.getElementById('certScore').textContent = score;
    document.getElementById('certHighScore').textContent = highScore;
}

function resetGame() {
    score = 0;
    bird.reset();
    pipes.reset();
    particles = [];
    currentState = STATE.PLAYING;
}

// Renderização de UI no Canvas
function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';

    if (currentState === STATE.START) {
        ctx.font = '20px "Press Start 2P"';
        ctx.strokeText('PRONTO?', canvas.width / 2, 180);
        ctx.fillText('PRONTO?', canvas.width / 2, 180);

        ctx.font = '12px "Poppins"';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Toque ou pressione ESPAÇO para começar', canvas.width / 2, 220);

    } else if (currentState === STATE.PLAYING) {
        ctx.font = '32px "Press Start 2P"';
        ctx.strokeText(score, canvas.width / 2, 70);
        ctx.fillText(score, canvas.width / 2, 70);

    } else if (currentState === STATE.GAMEOVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '22px "Press Start 2P"';
        ctx.fillStyle = '#e06010';
        ctx.strokeText('FIM DE JOGO', canvas.width / 2, 180);
        ctx.fillText('FIM DE JOGO', canvas.width / 2, 180);

        // Placar
        ctx.fillStyle = '#ded895';
        ctx.fillRect(canvas.width / 2 - 100, 210, 200, 110);
        ctx.strokeRect(canvas.width / 2 - 100, 210, 200, 110);

        ctx.fillStyle = '#000000';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`PONTOS: ${score}`, canvas.width / 2 - 80, 245);
        ctx.fillText(`RECORDE: ${highScore}`, canvas.width / 2 - 80, 280);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Poppins"';
        ctx.fillText('Clique para Jogar Novamente', canvas.width / 2, 350);
    }
}

// Loop Principal
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentState === STATE.PLAYING) {
        bird.update();
        pipes.update();
    }
    ground.update();

    pipes.draw();
    ground.draw();
    bird.draw();

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawUI();
    requestAnimationFrame(loop);
}

function handleAction() {
    sfx.init();
    if (currentState === STATE.START) {
        currentState = STATE.PLAYING;
    } else if (currentState === STATE.PLAYING) {
        bird.jump();
    } else if (currentState === STATE.GAMEOVER) {
        resetGame();
    }
}

// Controles
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
    }
});

canvas.addEventListener('click', handleAction);

// ==========================================
// 4. LÓGICA DAS MODAIS & CERTIFICADO
// ==========================================
const wardrobeModal = document.getElementById('wardrobeModal');
const certModal = document.getElementById('certificateModal');

document.getElementById('btnWardrobe').onclick = () => {
    wardrobe.renderGrid();
    wardrobeModal.classList.remove('hidden');
};
document.getElementById('closeWardrobe').onclick = () => wardrobeModal.classList.add('hidden');

document.getElementById('btnCertificate').onclick = () => {
    document.getElementById('certScore').textContent = score;
    document.getElementById('certHighScore').textContent = highScore;
    certModal.classList.remove('hidden');
};
document.getElementById('closeCert').onclick = () => certModal.classList.add('hidden');

// Mute
document.getElementById('btnMute').onclick = (e) => {
    sfx.muted = !sfx.muted;
    e.target.textContent = sfx.muted ? '🔇' : '🔊';
};

// Upload de Skin
// ==========================================
// PREVIEW DA SKIN
// ==========================================

const skinFileInput = document.getElementById('skinFileInput');
const skinPreviewImg = document.getElementById('skinPreviewImg');

skinFileInput.addEventListener('change', () => {
    const file = skinFileInput.files[0];

    if (!file) {
        skinPreviewImg.src = '';
        skinPreviewImg.classList.add('hidden');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Por favor, escolha uma imagem válida.');
        skinFileInput.value = '';
        skinPreviewImg.src = '';
        skinPreviewImg.classList.add('hidden');
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        skinPreviewImg.src = event.target.result;
        skinPreviewImg.classList.remove('hidden');
    };

    reader.readAsDataURL(file);
});


// ==========================================
// UPLOAD DA SKIN
// ==========================================

document.getElementById('uploadSkinForm').onsubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById('skinNameInput').value.trim();
    const file = skinFileInput.files[0];

    if (!name) {
        alert('Digite um nome para a skin.');
        return;
    }

    if (!file) {
        alert('Escolha uma imagem.');
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        wardrobe.addSkin(name, event.target.result);

        document.getElementById('uploadSkinForm').reset();

        skinPreviewImg.src = '';
        skinPreviewImg.classList.add('hidden');
    };

    reader.readAsDataURL(file);
};


// ==========================================
// ENVIO DO CERTIFICADO POR E-MAIL
// ==========================================

document.getElementById('emailCertForm').onsubmit = async (e) => {
    // código do envio...
};

// Envio de Certificado por E-mail
document.getElementById('emailCertForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('certEmailInput').value;
    const playerName = document.getElementById('playerNameInput').value;
    const btn = document.getElementById('btnSendEmail');
    const statusMsg = document.getElementById('certStatusMsg');

    btn.disabled = true;
    btn.textContent = 'Enviando...';
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';

    try {
        const res = await fetch('/api/send-certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                playerName,
                score,
                highScore,
                skinName: wardrobe.getActiveSkin().name
            })
        });

        const data = await res.json();

        if (data.success) {
            statusMsg.textContent = '✅ Certificado enviado com sucesso para o e-mail!';
            statusMsg.classList.add('success');
            if (data.previewUrl) {
                console.log('🔗 Link de pré-visualização (Ethereal Email):', data.previewUrl);
            }
        } else {
            statusMsg.textContent = '❌ ' + (data.error || 'Erro ao enviar.');
            statusMsg.classList.add('error');
        }
    } catch (err) {
        statusMsg.textContent = '❌ Falha de conexão com o servidor.';
        statusMsg.classList.add('error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar E-mail';
    }
};

// Inicializa o jogo
loop();