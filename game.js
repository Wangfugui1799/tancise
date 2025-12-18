// 贪吃蛇游戏主逻辑
// Author: Cat Uncle's Dev Studio
// Version: 1.0

class Game {
    constructor() {
        // Canvas 设置
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 每个格子大小
        this.gridCount = 30; // 每行/列格子数量

        // 游戏状态
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;

        // 游戏数据
        this.snake = [];
        this.direction = { x: 1, y: 0 }; // 默认向右移动
        this.nextDirection = { x: 1, y: 0 };
        this.food = {};
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.speed = 150; // 初始速度（ms）
        this.baseSpeed = 150;

        // 游戏循环
        this.gameLoop = null;
        this.lastUpdateTime = 0;

        // DOM 元素
        this.elements = {
            currentScore: document.getElementById('currentScore'),
            highScore: document.getElementById('highScore'),
            statusMessage: document.getElementById('statusMessage'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            restartBtn: document.getElementById('restartBtn')
        };

        this.init();
    }

    init() {
        // 画布尺寸适配
        this.canvas.width = this.gridSize * this.gridCount;
        this.canvas.height = this.gridSize * this.gridCount;

        // 更新显示
        this.elements.highScore.textContent = this.highScore;

        // 绑定事件
        this.bindEvents();

        // 初始化绘制（准备界面）
        this.draw();
        this.showMessage('准备开始', 'normal');
    }

    bindEvents() {
        // 按钮事件
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 防止方向键滚动页面
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    handleKeyPress(e) {
        if (e.code === 'Space') {
            if (this.isPlaying && !this.isGameOver) {
                this.togglePause();
            } else if (!this.isPlaying && this.isGameOver) {
                this.restartGame();
            }
            return;
        }

        if (e.code === 'KeyR') {
            if (this.isGameOver || this.isPlaying) {
                this.restartGame();
            }
            return;
        }

        if (!this.isPlaying || this.isPaused || this.isGameOver) return;

        // 方向控制
        const newDirection = { ...this.nextDirection };

        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.direction.y === 0) {
                    newDirection.x = 0;
                    newDirection.y = -1;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.direction.y === 0) {
                    newDirection.x = 0;
                    newDirection.y = 1;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.direction.x === 0) {
                    newDirection.x = -1;
                    newDirection.y = 0;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.direction.x === 0) {
                    newDirection.x = 1;
                    newDirection.y = 0;
                }
                break;
        }

        this.nextDirection = newDirection;
    }

    startGame() {
        if (this.isPlaying) return;

        // 初始化蛇 - 从中间开始，长度为3
        const startX = Math.floor(this.gridCount / 2);
        const startY = Math.floor(this.gridCount / 2);

        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.speed = this.baseSpeed;
        this.isGameOver = false;
        this.isPaused = false;
        this.isPlaying = true;

        this.spawnFood();
        this.updateScore(0);
        this.showMessage('游戏中', 'normal');
        this.updateButtons();

        // 启动游戏循环
        this.lastUpdateTime = Date.now();
        this.gameLoop = requestAnimationFrame(() => this.loop());
    }

    loop() {
        if (!this.isPlaying) return;

        if (this.isPaused) {
            this.draw();
            this.gameLoop = requestAnimationFrame(() => this.loop());
            return;
        }

        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;

        if (deltaTime >= this.speed) {
            this.update();
            this.lastUpdateTime = now;
        }

        this.draw();
        this.gameLoop = requestAnimationFrame(() => this.loop());
    }

    update() {
        // 更新方向
        this.direction = { ...this.nextDirection };

        // 计算新头部位置
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // 检查碰撞（墙）
        if (head.x < 0 || head.x >= this.gridCount || head.y < 0 || head.y >= this.gridCount) {
            this.gameOver('撞墙了！');
            return;
        }

        // 检查碰撞（自身）
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver('撞到自己了！');
                return;
            }
        }

        // 移动蛇
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 吃到食物，得分增加
            this.score += 10;
            this.updateScore(this.score);
            this.spawnFood();
            this.increaseSpeed();
            this.playSound('eat');
        } else {
            // 没吃到食物，移除尾部
            this.snake.pop();
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0f1419';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格（可选，增强视觉效果）
        this.drawGrid();

        // 绘制食物
        this.drawFood();

        // 绘制蛇
        this.drawSnake();

        // 如果暂停，绘制遮罩
        if (this.isPaused) {
            this.drawPauseOverlay();
        }

        // 如果游戏结束，绘制结束信息
        if (this.isGameOver) {
            this.drawGameOverOverlay();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        // 蛇身体颜色
        const headColor = '#4ade80';
        const bodyColor = '#22c55e';

        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            // 绘制圆角矩形
            this.ctx.fillStyle = index === 0 ? headColor : bodyColor;
            this.roundRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 4);

            // 头部特殊处理 - 绘制眼睛
            if (index === 0) {
                this.ctx.fillStyle = '#fff';
                const eyeSize = 2;
                const eyeOffset = 5;

                // 根据方向绘制眼睛位置
                if (this.direction.x === 1) { // 向右
                    this.ctx.fillRect(x + this.gridSize - eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // 向左
                    this.ctx.fillRect(x + eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + eyeOffset - eyeSize, y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // 向上
                    this.ctx.fillRect(x + eyeOffset, y + eyeOffset - eyeSize, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.direction.y === 1) { // 向下
                    this.ctx.fillRect(x + eyeOffset, y + this.gridSize - eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + this.gridSize - eyeOffset, eyeSize, eyeSize);
                }
            }
        });
    }

    drawFood() {
        if (!this.food) return;

        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;

        // 食物闪烁效果
        const time = Date.now();
        const alpha = 0.5 + 0.5 * Math.sin(time / 200);

        this.ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        this.roundRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4, 6);

        // 食物中心点
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize / 2, y + this.gridSize / 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '20px sans-serif';
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText('按空格键继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 56px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.font = '24px sans-serif';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        if (this.score === this.highScore && this.score > 0) {
            this.ctx.font = '20px sans-serif';
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.fillText('🎉 新纪录!', this.canvas.width / 2, this.canvas.height / 2 + 45);
        }

        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('按 R 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    // 辅助方法：绘制圆角矩形
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    spawnFood() {
        let newFood;
        let validPosition = false;

        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.gridCount),
                y: Math.floor(Math.random() * this.gridCount)
            };

            // 确保食物不生成在蛇身上
            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    validPosition = false;
                    break;
                }
            }
        }

        this.food = newFood;
    }

    increaseSpeed() {
        // 每50分增加一次速度
        const level = Math.floor(this.score / 50);
        const newSpeed = this.baseSpeed - (level * 10);
        this.speed = Math.max(50, newSpeed); // 最小速度50ms
    }

    updateScore(score) {
        this.elements.currentScore.textContent = score;

        // 动画效果
        this.elements.currentScore.classList.add('animate');
        setTimeout(() => {
            this.elements.currentScore.classList.remove('animate');
        }, 300);

        // 检查最高分
        if (score > this.highScore) {
            this.highScore = score;
            this.elements.highScore.textContent = this.highScore;
            this.saveHighScore();
        }
    }

    togglePause() {
        if (!this.isPlaying || this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.showMessage('已暂停', 'pause');
            this.elements.pauseBtn.textContent = '继续';
            this.elements.pauseBtn.style.display = 'block';
            this.elements.startBtn.style.display = 'none';
        } else {
            this.showMessage('游戏中', 'normal');
            this.elements.pauseBtn.textContent = '暂停';
        }

        this.updateButtons();
    }

    restartGame() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.snake = [];
        this.food = {};
        this.score = 0;
        this.speed = this.baseSpeed;

        this.updateScore(0);
        this.updateButtons();
        this.showMessage('准备开始', 'normal');
        this.draw();
    }

    gameOver(message) {
        this.isGameOver = true;
        this.isPlaying = false;
        this.playSound('crash');
        this.showMessage(message, 'error');
        this.updateButtons();
        this.draw(); // 显示游戏结束画面
    }

    showMessage(text, type = 'normal') {
        this.elements.statusMessage.textContent = text;
        this.elements.statusMessage.className = 'status-text';

        if (type === 'error') {
            this.elements.statusMessage.classList.add('error');
        } else if (type === 'pause') {
            this.elements.statusMessage.classList.add('pause');
        }
    }

    updateButtons() {
        if (!this.isPlaying && !this.isGameOver) {
            // 还没开始
            this.elements.startBtn.style.display = 'block';
            this.elements.pauseBtn.style.display = 'none';
            this.elements.restartBtn.style.display = 'none';
        } else if (this.isPlaying && !this.isPaused && !this.isGameOver) {
            // 游戏进行中
            this.elements.startBtn.style.display = 'none';
            this.elements.pauseBtn.textContent = '暂停';
            this.elements.pauseBtn.style.display = 'block';
            this.elements.restartBtn.style.display = 'none';
        } else if (this.isPlaying && this.isPaused) {
            // 暂停中
            this.elements.startBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'block';
            this.elements.restartBtn.style.display = 'none';
        } else if (this.isGameOver) {
            // 游戏结束
            this.elements.startBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'none';
            this.elements.restartBtn.style.display = 'block';
        }
    }

    // 本地存储
    saveHighScore() {
        try {
            localStorage.setItem('snake_high_score', this.highScore.toString());
        } catch (e) {
            console.warn('无法保存最高分到本地存储:', e);
        }
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('snake_high_score');
            return saved ? parseInt(saved) : 0;
        } catch (e) {
            console.warn('无法从本地存储加载最高分:', e);
            return 0;
        }
    }

    playSound(type) {
        // 简单的音效提示（使用Web Audio API的简单振荡器）
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'eat') {
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
        } else if (type === 'crash') {
            oscillator.frequency.value = 150;
            oscillator.type = 'sawtooth';
            gainNode.gain.value = 0.15;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});