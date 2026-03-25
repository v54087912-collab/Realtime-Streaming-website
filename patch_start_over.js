const fs = require('fs');

let js = fs.readFileSync('player.js', 'utf8');

const searchStr = `                    const handleStartOver = () => {
                        localStorage.removeItem('resumePos_' + videoId);
                        this.video.play();`;

const replaceStr = `                    const handleStartOver = () => {
                        localStorage.removeItem('resumePos_' + videoId);
                        this.video.currentTime = 0;
                        this.video.play();`;

js = js.replace(searchStr, replaceStr);

fs.writeFileSync('player.js', js);
